/**
 * P14 tests for the chart module and the two plots the specification names.
 *
 * The definition of done asks that both special plots render correctly and pass visual regression.
 * A pixel comparison is not the right instrument for that here: the same markup renders to
 * different pixels on the three platforms this application is built for, so a pixel baseline would
 * fail for reasons that have nothing to do with the chart. What is compared instead is the
 * geometry: the path commands, the coordinates and the marker shapes the component produced,
 * rounded to three decimals and therefore stable. A curve drawn wrongly changes those strings. See
 * DEVIATIONS.md, D-24.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { App } from '../src/App.tsx';
import { useCalculator } from '../src/state/calculator.ts';
import { useSensitivity } from '../src/state/sensitivity.ts';

function resetStores(): void {
  useCalculator.setState({
    locale: 'id',
    selectedId: 'ctr',
    inputs: {},
    outcome: { kind: 'idle' },
    derivationOpen: false,
  });
  useSensitivity.setState({ selectedId: 'clv_simple', inputs: {}, outcome: { kind: 'idle' } });
}

beforeEach(resetStores);

/** Open the calculator on a formula, fill it from the worked example and compute. */
function computeFormula(formulaId: string): HTMLElement {
  useCalculator.setState({ selectedId: formulaId, inputs: {}, outcome: { kind: 'idle' } });
  const view = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Contoh' }));
  fireEvent.click(screen.getByRole('button', { name: /^Hitung$/ }));
  return view.container as HTMLElement;
}

function chart(container: HTMLElement): SVGElement {
  const svg = container.querySelector('svg.mk-chart');
  expect(svg, 'the screen rendered no chart').not.toBeNull();
  return svg as SVGElement;
}

function figureRows(container: HTMLElement): string[][] {
  const body = container.querySelector('.mk-calc__figure tbody');
  expect(body, 'the screen rendered no table beside the chart').not.toBeNull();
  return [...(body as HTMLElement).querySelectorAll('tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? ''),
  );
}

/** Every drawn coordinate, as one stable string: the regression baseline. */
function geometry(svg: SVGElement): string {
  const parts: string[] = [];
  for (const node of svg.querySelectorAll('path, rect, line')) {
    const attributes = [
      'd',
      'x',
      'y',
      'width',
      'height',
      'x1',
      'y1',
      'x2',
      'y2',
      'stroke-dasharray',
    ]
      .map((name) => (node.hasAttribute(name) ? `${name}=${node.getAttribute(name)}` : null))
      .filter((entry): entry is string => entry !== null);
    parts.push(`${node.tagName}[${node.getAttribute('class') ?? ''}] ${attributes.join(' ')}`);
  }
  return parts.join('\n');
}

describe('the Bass diffusion curve', () => {
  it('draws one curve and lists the same periods in the table beside it', () => {
    const container = computeFormula('bass_f');
    const svg = chart(container);
    const rows = figureRows(container);

    // The worked example enters period six, so the grid runs to twice that, zero included.
    expect(rows).toHaveLength(13);
    expect(rows[0]?.[0]).toBe('0');
    expect(rows[12]?.[0]).toBe('12');
    expect(svg.querySelectorAll('g.mk-chart__series')).toHaveLength(1);
  });

  it('hatches everything past the period that was entered, and says so under the table', () => {
    const container = computeFormula('bass_f');
    const svg = chart(container);

    const hatched = svg.querySelector('rect.mk-chart__extrapolated');
    expect(hatched, 'the projection is not hatched').not.toBeNull();
    expect(Number(hatched?.getAttribute('width'))).toBeGreaterThan(0);
    expect(hatched?.getAttribute('fill')).toBe('url(#mk-chart-hatch)');

    // The observed half and the projected half are drawn as two strokes, not one.
    expect(svg.querySelectorAll('path.mk-chart__line--projected')).toHaveLength(1);

    expect(screen.getByText(/Bagian yang diarsir terletak setelah periode/)).toBeTruthy();
  });

  it('marks the entered period with the same number the table prints for it', () => {
    const container = computeFormula('bass_f');
    const svg = chart(container);
    const rows = figureRows(container);

    const markText = svg.querySelector('g.mk-chart__mark text')?.textContent ?? '';
    const sixth = rows.find((row) => row[0] === '6');
    expect(markText).toBe(sixth?.[1]);
  });

  it('separates the reading from the projection in the table as well as in the plot', () => {
    const container = computeFormula('bass_f');
    const rows = figureRows(container);

    for (const row of rows) {
      const period = Number(row[0]);
      expect(row[2], `period ${row[0]}`).toBe(
        period <= 6 ? 'Sampai periode yang dimasukkan' : 'Proyeksi',
      );
    }
  });

  it('renders the same geometry it rendered when this baseline was recorded', () => {
    expect(geometry(chart(computeFormula('bass_f')))).toMatchSnapshot();
  });
});

describe('the Van Westendorp four-curve plot', () => {
  it('draws four curves and names each in the legend', () => {
    const container = computeFormula('van_westendorp');
    const svg = chart(container);

    expect(svg.querySelectorAll('g.mk-chart__series')).toHaveLength(4);
    for (const label of ['Terlalu murah', 'Murah', 'Mahal', 'Terlalu mahal']) {
      expect(
        [...svg.querySelectorAll('g.mk-chart__legend text')].map((n) => n.textContent),
      ).toContain(label);
    }
  });

  it('marks the four crossings with the prices the table prints', () => {
    const container = computeFormula('van_westendorp');
    const svg = chart(container);
    const rows = figureRows(container);

    expect(rows).toHaveLength(4);
    const marks = [...svg.querySelectorAll('g.mk-chart__mark text')].map(
      (n) => n.textContent ?? '',
    );
    expect(marks).toHaveLength(4);

    rows.forEach((row, index) => {
      // The mark carries the code and the price; the price is the table's own string.
      expect(marks[index], `${row[0]} mark`).toContain(row[1] as string);
    });
  });

  it('draws the curves as steps, since one response cannot slope between two prices', () => {
    const container = computeFormula('van_westendorp');
    const svg = chart(container);
    const first = svg.querySelector('g.mk-chart__series path.mk-chart__line');
    const commands = (first?.getAttribute('d') ?? '').split('L').length;
    // A step doubles the number of segments compared with a straight join.
    expect(commands).toBeGreaterThan(4);
  });

  it('renders the same geometry it rendered when this baseline was recorded', () => {
    expect(geometry(chart(computeFormula('van_westendorp')))).toMatchSnapshot();
  });
});

describe('the chart rules', () => {
  it('labels both axes with the quantity and the unit', () => {
    const container = computeFormula('van_westendorp');
    const labels = [...chart(container).querySelectorAll('text.mk-chart__axislabel')].map(
      (node) => node.textContent ?? '',
    );
    expect(labels).toHaveLength(2);
    expect(labels).toContain('Harga (Rp)');
    expect(labels).toContain('Bagian responden (persen)');
  });

  it('names no colour anywhere in the markup', () => {
    const container = computeFormula('bass_f');
    const markup = (chart(container).outerHTML ?? '').toLowerCase();

    // The only fill in the whole figure is the hatch pattern, and the one literal colour is the
    // black stroke of the hatch line itself.
    expect(markup).not.toMatch(/fill="(?!none|url\(#mk-chart-hatch\))[^"]+"/);
    expect(markup).not.toContain('style=');
    expect(markup).not.toMatch(/stroke="(?!#000000)[^"]+"/);
  });

  it('draws gridlines as their own class, so the dotted quarter opacity is set in one place', () => {
    const container = computeFormula('bass_f');
    expect(chart(container).querySelectorAll('line.mk-chart__grid').length).toBeGreaterThan(4);
  });

  it('shows no chart at all for a formula whose answer is one number', () => {
    const container = computeFormula('ctr');
    expect(container.querySelector('svg.mk-chart')).toBeNull();
  });

  it('shows no chart before the formula has been computed', () => {
    useCalculator.setState({ selectedId: 'bass_f' });
    const view = render(<App />);
    expect((view.container as HTMLElement).querySelector('svg.mk-chart')).toBeNull();
  });
});
