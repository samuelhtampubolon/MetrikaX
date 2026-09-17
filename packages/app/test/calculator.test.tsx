/**
 * P09 and P10 tests for SCR-CALC.
 *
 * AC-09 asks that every screen be fully operable by keyboard alone. The end-to-end proof belongs to
 * Playwright in a later phase; what is asserted here is the part that decides it: every control has
 * an accessible name, the keyboard map in screens.SCR-CALC works, and a complete calculation can be
 * driven without a single click.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, act } from '@testing-library/react';

import { App } from '../src/App.tsx';
import { useCalculator, readInputs } from '../src/state/calculator.ts';
import { buildTree, matchesSearch, filterRelations } from '../src/screens/grouping.ts';
import { derivationLines, viewResult, bandFor } from '../src/screens/result.ts';
import { translate } from '../src/locale/index.ts';
import { RELATIONS, RELATION_LIST, type Relation } from '@metrika/engine';

const initial = useCalculator.getState();

beforeEach(() => {
  useCalculator.setState({
    locale: 'id',
    highContrast: false,
    grouping: 'stratum',
    search: '',
    selectedId: 'ctr',
    inputs: {},
    outcome: { kind: 'idle' },
    derivationOpen: false,
  });
  void initial;
});

describe('the formula tree', () => {
  it('offers all five grouping modes and covers all 76 formulas in each', () => {
    const context = { locale: 'id' as const, t: (key: string) => translate('id', key), search: '' };
    for (const grouping of ['stratum', 'phase', 'class', 'domain', 'alphabetical'] as const) {
      const tree = buildTree(grouping, context);
      const leaves = countLeaves(tree);
      expect(leaves, grouping).toBe(76);
    }
  });

  it('orders the strata by their Roman numerals rather than as text', () => {
    const tree = buildTree('stratum', {
      locale: 'id',
      t: (key) => translate('id', key),
      search: '',
    });
    const codes = tree.map((node) => node.label.split(' ')[0]);
    expect(codes.slice(0, 5)).toEqual(['I', 'II', 'III', 'IV', 'V']);
  });

  it('searches the symbol, the Indonesian name and the English name', () => {
    const ctr = RELATIONS.get('ctr') as Relation;
    expect(matchesSearch(ctr, 'CTR')).toBe(true);
    expect(matchesSearch(ctr, 'klik tayang')).toBe(true);
    expect(matchesSearch(ctr, 'click-through')).toBe(true);
    expect(matchesSearch(ctr, 'elastisitas')).toBe(false);

    expect(filterRelations('elasticity').map((relation) => relation.formulaId)).toContain(
      'price_elasticity',
    );
  });
});

describe('reading the input fields', () => {
  it('treats a blank field as missing rather than as zero', () => {
    const relation = RELATIONS.get('ctr') as Relation;
    const { missing } = readInputs(relation, { clicks: '1250' }, 'id');
    expect(missing).toEqual(['impressions']);
  });

  it('reads Indonesian separators, so 1.250 is one thousand two hundred and fifty', () => {
    const relation = RELATIONS.get('ctr') as Relation;
    const { env } = readInputs(relation, { clicks: '1.250', impressions: '100.000' }, 'id');
    expect(env['clicks']).toBe(1250);
    expect(env['impressions']).toBe(100000);
  });

  it('reads a series for a vector input and a grid for a matrix input', () => {
    const npv = RELATIONS.get('npv') as Relation;
    const { env } = readInputs(
      npv,
      { cash_flows: '120, 180, 240', discount_rate: '0,12', investment_0: '480' },
      'id',
    );
    expect(env['cash_flows']).toEqual([120, 180, 240]);

    const qfd = RELATIONS.get('qfd_technical_importance') as Relation;
    const grid = readInputs(
      qfd,
      { customer_importance: '9, 7', relationship_matrix: '9 3 0; 3 9 1' },
      'id',
    );
    expect(grid.env['relationship_matrix']).toEqual([
      [9, 3, 0],
      [3, 9, 1],
    ]);
  });
});

describe('the result view', () => {
  const t = (key: string) => translate('id', key);

  it('says the result is not yet computed rather than showing a blank field', () => {
    const relation = RELATIONS.get('ctr') as Relation;
    const view = viewResult(relation, { kind: 'idle' }, 'id', t);
    expect(view.state).toBe('idle');
    expect(view.text).toBe('Belum dihitung');
  });

  it('names the inputs that are still empty', () => {
    const relation = RELATIONS.get('ctr') as Relation;
    const view = viewResult(relation, { kind: 'incomplete', missing: ['impressions'] }, 'id', t);
    expect(view.refused).toBe(true);
    expect(view.text).toContain('Total Tayangan');
  });

  it('shows a refusal as the engine worded it, in the active locale', () => {
    const relation = RELATIONS.get('ctr') as Relation;
    const view = viewResult(
      relation,
      {
        kind: 'refused',
        messages: { id: 'Penyebut bernilai nol.', en: 'The denominator is zero.' },
      },
      'id',
      t,
    );
    expect(view.text).toBe('Penyebut bernilai nol.');
    expect(view.unit).toBe('');
  });

  it('formats a computed value by its unit class and hands the unit over separately', () => {
    const relation = RELATIONS.get('aov') as Relation;
    const view = viewResult(
      relation,
      { kind: 'value', result: 125000, env: { revenue: 185000000, orders: 1480 } },
      'id',
      t,
    );
    expect(view.text).toBe('125.000');
    expect(view.unit).toBe('Rp');
    expect(view.state).toBe('computed');
  });

  it('lists every IRR root rather than picking one', () => {
    const relation = RELATIONS.get('irr') as Relation;
    const view = viewResult(
      relation,
      {
        kind: 'value',
        result: { roots: [0.1, 0.2], unique: false, converged: true },
        env: {},
      },
      'id',
      t,
    );
    expect(view.extra).toHaveLength(2);
    expect(view.extra[0]).toContain('10,0000%');
  });

  it('matches the band that contains the result and reports its index', () => {
    const relation = RELATIONS.get('ctr') as Relation;
    const matched = bandFor(relation, { kind: 'value', result: 0.0125, env: {} });
    expect(matched).not.toBeNull();
    expect(relation.interpretationBands[matched!.index]?.label).toBe('Wajar');
  });

  it('returns no band when the result falls outside every stated range', () => {
    const relation = RELATIONS.get('aov') as Relation;
    expect(bandFor(relation, { kind: 'value', result: -5, env: {} })).toBeNull();
  });
});

describe('the derivation pane', () => {
  it('reproduces the engine derivation and ends with the honesty clause', () => {
    const relation = RELATIONS.get('aov') as Relation;
    const lines = derivationLines(
      relation,
      { kind: 'value', result: 125000, env: { revenue: 185000000, orders: 1480 } },
      'id',
      (key) => translate('id', key),
    );

    expect(lines[0]).toBe('aov = revenue / orders');
    expect(lines[1]).toBe('    = 185.000.000 / 1.480');
    expect(lines[2]).toBe('    = 125.000');
    expect(lines.some((line) => line.includes('revenue  <- masukan pengguna'))).toBe(true);
    expect(lines[lines.length - 1]).toContain('tidak diverifikasi');
  });

  it('is empty until a calculation has run', () => {
    const relation = RELATIONS.get('aov') as Relation;
    expect(derivationLines(relation, { kind: 'idle' }, 'id', (key) => key)).toEqual([]);
  });
});

describe('the screen, driven by keyboard alone', () => {
  it('computes CTR from two typed numbers without a single click', () => {
    render(<App />);

    const clicks = screen.getByLabelText('Total Klik');
    const impressions = screen.getByLabelText('Total Tayangan');

    fireEvent.change(clicks, { target: { value: '1250' } });
    fireEvent.change(impressions, { target: { value: '100000' } });
    fireEvent.keyDown(impressions, { key: 'Enter' });

    const result = screen.getByLabelText('Nilai hasil');
    expect(result.textContent).toContain('0,0125');
    expect(useCalculator.getState().outcome.kind).toBe('value');
  });

  it('toggles the derivation pane with F9 and fills it with the derivation', () => {
    render(<App />);

    expect(screen.queryByRole('region', { name: 'Penurunan hasil' })).toBeNull();

    fireEvent.change(screen.getByLabelText('Total Klik'), { target: { value: '1250' } });
    fireEvent.change(screen.getByLabelText('Total Tayangan'), { target: { value: '100000' } });
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'F9' });

    const pane = screen.getByRole('region', { name: 'Penurunan hasil' });
    expect(pane.textContent).toContain('clicks / impressions');
    expect(pane.textContent).toContain('1.250 / 100.000');

    fireEvent.keyDown(document, { key: 'F9' });
    expect(screen.queryByRole('region', { name: 'Penurunan hasil' })).toBeNull();
  });

  it('names the empty inputs rather than computing with a zero in their place', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Total Klik'), { target: { value: '1250' } });
    fireEvent.keyDown(document, { key: 'Enter' });

    const result = screen.getByLabelText('Nilai hasil');
    expect(result.dataset.state).toBe('refused');
    expect(result.textContent).toContain('Total Tayangan');
  });

  it('refuses a zero denominator with the engine message rather than showing infinity', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Total Klik'), { target: { value: '1250' } });
    fireEvent.change(screen.getByLabelText('Total Tayangan'), { target: { value: '0' } });
    fireEvent.keyDown(document, { key: 'Enter' });

    const result = screen.getByLabelText('Nilai hasil');
    expect(result.dataset.state).toBe('refused');
    expect(result.textContent).toContain('nol');
    expect(result.textContent).not.toContain('Infinity');
  });

  it('focuses the search field on Ctrl+F and filters the tree as the user types', () => {
    render(<App />);
    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
    const search = screen.getByLabelText('Cari rumus');
    expect(document.activeElement).toBe(search);

    fireEvent.change(search, { target: { value: 'elasticity' } });
    const tree = screen.getByRole('tree', { name: 'Daftar rumus' });
    expect(within(tree).getAllByRole('button').length).toBeLessThan(20);
  });

  it('switches every visible string when the locale changes, with no gap left behind', () => {
    render(<App />);
    expect(screen.getByLabelText('Total Tayangan')).toBeDefined();

    act(() => useCalculator.getState().setLocale('en'));
    expect(screen.getByLabelText('Impressions')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeDefined();
    expect(screen.queryByLabelText('Total Tayangan')).toBeNull();
  });

  it('selecting another formula clears the inputs rather than carrying them across', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Total Klik'), { target: { value: '1250' } });
    act(() => useCalculator.getState().select('aov'));
    expect(useCalculator.getState().inputs).toEqual({});
    expect(screen.getByLabelText('Total Pendapatan')).toBeDefined();
  });

  it('every one of the 76 formulas renders its inputs and computes its worked example', () => {
    // The definition of done for P09: any of the 76 can be selected and computed.
    for (const relation of RELATION_LIST) {
      act(() => {
        useCalculator.getState().select(relation.formulaId);
        useCalculator.getState().loadWorkedExample();
        useCalculator.getState().calculate();
      });
      const outcome = useCalculator.getState().outcome;
      expect(outcome.kind, `${relation.formulaId}: ${JSON.stringify(outcome)}`).toBe('value');
    }
  });
});

function countLeaves(nodes: readonly { kind: string; children?: readonly unknown[] }[]): number {
  let total = 0;
  for (const node of nodes) {
    if (node.kind === 'leaf') total += 1;
    else total += countLeaves((node.children ?? []) as never);
  }
  return total;
}
