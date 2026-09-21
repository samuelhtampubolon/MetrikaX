/**
 * P13 tests for SCR-SENSITIVITY.
 *
 * The definition of done for this phase is one sentence: the plot and the table agree exactly,
 * verified by a test. That is the first block below, and it compares the text the browser actually
 * rendered inside the SVG against the text in the table cells, rather than comparing two arrays
 * that a helper produced. A discrepancy between a chart and its table is a build-blocking bug in
 * design_system.chart_rules, so this file is where that rule is enforced.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react';

import { App } from '../src/App.tsx';
import { useCalculator } from '../src/state/calculator.ts';
import { SENSITIVE_RELATIONS, readPerturbation, useSensitivity } from '../src/state/sensitivity.ts';

/** clv_simple: ARPU times margin over churn. Two numerator factors and one denominator. */
const CLV_INPUTS = { arpu: '185000', gross_margin: '0,6', churn_rate: '0,04' };

function resetStores(): void {
  useCalculator.setState({
    locale: 'id',
    selectedId: 'ctr',
    inputs: {},
    outcome: { kind: 'idle' },
  });
  useSensitivity.setState({
    selectedId: 'clv_simple',
    inputs: {},
    perturbation: '10',
    outcome: { kind: 'idle' },
  });
}

beforeEach(resetStores);

/** Render the shell and switch to the sensitivity tab, as a person would with the mouse. */
function openScreen(): HTMLElement {
  const view = render(<App />);
  fireEvent.click(screen.getByRole('tab', { name: 'Sensitivitas' }));
  return view.container as HTMLElement;
}

/** Every text node inside the plot, in document order: the caption, then a label and a value per bar. */
function plotTexts(container: HTMLElement): string[] {
  const svg = container.querySelector('svg.mk-plot');
  if (svg === null) return [];
  return [...svg.querySelectorAll('text')].map((node) => node.textContent ?? '');
}

/** Every table row as its cell text, or an empty list when the screen drew no table. */
function tableRows(container: HTMLElement): string[][] {
  const body = container.querySelector('.mk-sens__table tbody');
  if (body === null) return [];
  return [...body.querySelectorAll('tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? ''),
  );
}

describe('AC-15: the plot and the table carry the same numbers', () => {
  it('prints the same factor label and the same swing in the SVG as in the cell', () => {
    const container = openScreen();
    useSensitivity.setState({ inputs: CLV_INPUTS });
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));

    const rows = tableRows(container);
    expect(rows).toHaveLength(3);

    // The caption comes first, then a label and a value for each bar, in bar order.
    const texts = plotTexts(container);
    expect(texts).toHaveLength(1 + rows.length * 2);

    rows.forEach((row, index) => {
      const label = texts[1 + index * 2];
      const value = texts[2 + index * 2];
      expect(label, `bar ${index} label`).toBe(row[0]);
      expect(value, `bar ${index} swing`).toBe(row[3]);
    });
  });

  it('draws the bars in the order the table lists them, widest first', () => {
    const container = openScreen();
    useSensitivity.setState({ inputs: CLV_INPUTS });
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));

    const widths = [...container.querySelectorAll('rect.mk-plot__bar')].map((bar) =>
      Number(bar.getAttribute('width')),
    );
    expect(widths).toHaveLength(3);
    expect(widths).toEqual([...widths].sort((a, b) => b - a));
  });

  it('puts a bar that lowers the result on the left of the axis and one that raises it on the right', () => {
    const container = openScreen();
    useSensitivity.setState({ inputs: CLV_INPUTS });
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));

    const bars = [...container.querySelectorAll('rect.mk-plot__bar')];
    const axis = container.querySelector('line.mk-plot__axis');
    const zero = Number(axis?.getAttribute('x1'));

    // Churn rate is the widest factor and its swing is negative: raising churn lowers the value.
    const churn = bars[0] as SVGRectElement;
    expect(Number(churn.getAttribute('x')) + Number(churn.getAttribute('width'))).toBeCloseTo(
      zero,
      6,
    );

    const arpu = bars[1] as SVGRectElement;
    expect(Number(arpu.getAttribute('x'))).toBeCloseTo(zero, 6);
  });

  it('labels the axis with the quantity and its unit, as chart_rules requires', () => {
    const container = openScreen();
    useSensitivity.setState({ inputs: CLV_INPUTS });
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));

    const caption = plotTexts(container)[0] ?? '';
    expect(caption).toContain('Ayunan');
    expect(caption).toContain('CLV');
    expect(caption).toContain('Rp');
  });

  it('agrees on every formula the screen offers, not only on the one in the other tests', () => {
    // The worked example of each relation is a complete input set by construction, so this walks
    // every offered relation and checks the same two columns on each. A relation whose inputs are
    // all vectors ranks nothing, and that is a pass: it prints the sentence saying so, and there
    // is no plot to disagree with.
    const ranksNothing: string[] = [];

    for (const relation of SENSITIVE_RELATIONS) {
      useSensitivity.setState({
        selectedId: relation.formulaId,
        inputs: {},
        perturbation: '10',
        outcome: { kind: 'idle' },
      });
      const container = openScreen();
      fireEvent.click(screen.getByRole('button', { name: 'Contoh' }));
      fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));

      const rows = tableRows(container);
      const texts = plotTexts(container);

      if (rows.length === 0) {
        ranksNothing.push(relation.formulaId);
        expect(texts, `${relation.formulaId} drew a plot with no table`).toHaveLength(0);
        cleanup();
        continue;
      }

      expect(texts, `${relation.formulaId} plot and table lengths`).toHaveLength(
        1 + rows.length * 2,
      );
      rows.forEach((row, index) => {
        expect(texts[1 + index * 2], `${relation.formulaId} bar ${index} label`).toBe(row[0]);
        expect(texts[2 + index * 2], `${relation.formulaId} bar ${index} swing`).toBe(row[3]);
      });
      cleanup();
    }

    // Named rather than counted: these three take vectors only, so there is no scalar to move ten
    // percent. If a later change gives one of them a scalar input, this list forces the record to
    // be updated rather than letting the coverage drift quietly.
    expect(ranksNothing.sort()).toEqual(['conjoint_utility', 'ev', 'weighted_screening']);
  });
});

describe('what the screen shows when there is no ranking', () => {
  it('says it has not been run rather than showing an empty table', () => {
    const container = openScreen();
    expect(container.querySelector('svg.mk-plot')).toBeNull();
    expect(screen.getByText(/Belum dijalankan/)).toBeTruthy();
  });

  it('names the fields that are empty instead of assuming a value for them', () => {
    const container = openScreen();
    useSensitivity.setState({ inputs: { arpu: '185000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));

    expect(container.querySelector('svg.mk-plot')).toBeNull();
    const outcome = useSensitivity.getState().outcome;
    expect(outcome.kind).toBe('incomplete');
  });

  it('shows the refusal sentence when the base result cannot be computed', () => {
    openScreen();
    useSensitivity.setState({ inputs: { ...CLV_INPUTS, churn_rate: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));

    expect(useSensitivity.getState().outcome.kind).toBe('refused');
    expect(screen.getByText(/tidak dapat dihitung/)).toBeTruthy();
  });

  it('refuses a perturbation that is not a positive percentage below one hundred', () => {
    for (const raw of ['', 'sepuluh', '0', '-5', '100', '250']) {
      expect(readPerturbation(raw, 'id'), raw).toBeNull();
    }
    expect(readPerturbation('10', 'id')).toBeCloseTo(0.1, 12);
    expect(readPerturbation('12,5', 'id')).toBeCloseTo(0.125, 12);
  });

  it('reports the unreadable perturbation on screen rather than falling back to ten percent', () => {
    openScreen();
    useSensitivity.setState({ inputs: CLV_INPUTS, perturbation: '0' });
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));

    expect(screen.getByText(/Pergeseran harus berupa angka/)).toBeTruthy();
  });
});

describe('the ranking itself', () => {
  it('names the dominant factor in a sentence and tells the reader what to do about it', () => {
    openScreen();
    useSensitivity.setState({ inputs: CLV_INPUTS });
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));

    const sentence = screen.getByText(/Faktor dengan ayunan terbesar/);
    expect(sentence.textContent).toContain('Perbaiki estimasi faktor itu terlebih dahulu');
  });

  it('offers only the structural classes the specification says to perturb', () => {
    const container = openScreen();
    const combo = within(container).getByLabelText('Pilih rumus yang akan diuji');
    const options = [...(combo as HTMLSelectElement).options];
    expect(options).toHaveLength(SENSITIVE_RELATIONS.length);

    // Twenty-five formulas carry one of the five classes. One of them, the QFD relation, returns a
    // vector rather than a number, and a structure has no swing, so twenty-four are offered.
    expect(options.length).toBe(24);
    expect(
      SENSITIVE_RELATIONS.map((relation) => relation.formulaId),
      'a composite result cannot be ranked',
    ).not.toContain('qfd_technical_importance');
  });

  it('carries the honesty clause beside the ranking', () => {
    openScreen();
    useSensitivity.setState({ inputs: CLV_INPUTS });
    fireEvent.click(screen.getByRole('button', { name: 'Jalankan' }));
    expect(screen.getByText(/tidak diverifikasi oleh lembaga mana pun/)).toBeTruthy();
  });
});
