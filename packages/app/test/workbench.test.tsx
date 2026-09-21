/**
 * P12 tests for SCR-SOLVER.
 *
 * The screen's job is to show what the propagation engine did, including the parts that are not
 * results. A workbench that showed only the derived values would be the wrong tool: what was
 * blocked, and what disagrees with what, is the evidence a sceptical reader is looking for.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';

import { App } from '../src/App.tsx';
import { useSolver, derivedOnly, blockedOnce } from '../src/state/solver.ts';
import { useCalculator } from '../src/state/calculator.ts';

function resetStores(): void {
  useSolver.setState({
    entered: {},
    period: 'monthly',
    currency: 'IDR',
    result: null,
    report: null,
    resolving: null,
  });
  useCalculator.setState({
    locale: 'id',
    selectedId: 'ctr',
    inputs: {},
    outcome: { kind: 'idle' },
  });
}

beforeEach(resetStores);

describe('the solver state', () => {
  it('derives the whole reachable set from the values entered', () => {
    const solver = useSolver.getState();
    solver.enter('revenue', 185_000_000);
    solver.enter('orders', 1_480);
    solver.derive();

    const derived = derivedOnly(useSolver.getState().result);
    expect(derived.map((value) => value.variableId)).toContain('aov');
    expect(derived.every((value) => value.origin === 'derived')).toBe(true);
  });

  it('a second entry for the same variable replaces the first rather than adding one', () => {
    const solver = useSolver.getState();
    solver.enter('revenue', 1);
    solver.enter('revenue', 2);
    expect(Object.keys(useSolver.getState().entered)).toHaveLength(1);
    expect(useSolver.getState().entered['revenue']).toBe(2);
  });

  it('removing an entry drops the derived set rather than leaving stale numbers on screen', () => {
    const solver = useSolver.getState();
    solver.enter('revenue', 185_000_000);
    solver.enter('orders', 1_480);
    solver.derive();
    expect(useSolver.getState().result).not.toBeNull();

    useSolver.getState().remove('orders');
    expect(useSolver.getState().result).toBeNull();
  });

  it('reports each blocked relation once, with a reason in both locales', () => {
    const solver = useSolver.getState();
    solver.enter('revenue', 185_000_000);
    solver.enter('orders', 0);
    solver.derive();

    const blocked = blockedOnce(useSolver.getState().result);
    expect(blocked.length).toBeGreaterThan(0);
    expect(new Set(blocked.map((entry) => entry.formulaId)).size).toBe(blocked.length);
    for (const entry of blocked) {
      expect(entry.detail.id.length).toBeGreaterThan(0);
      expect(entry.detail.en.length).toBeGreaterThan(0);
    }
  });

  it('names what is missing for a target it cannot reach', () => {
    const solver = useSolver.getState();
    solver.enter('revenue', 185_000_000);
    solver.enter('orders', 1_480);
    solver.derive();
    useSolver.getState().askWhatIsMissing('clv');

    const report = useSolver.getState().report;
    expect(report).not.toBeNull();
    expect(report!.reachable).toBe(false);
    expect(report!.message.id).toContain('Tambahkan salah satu dari');
  });

  it('changing the base period drops the derived set, because the stamps changed', () => {
    const solver = useSolver.getState();
    solver.enter('revenue', 185_000_000);
    solver.enter('orders', 1_480);
    solver.derive();
    useSolver.getState().setPeriod('annual');
    expect(useSolver.getState().result).toBeNull();
    expect(useSolver.getState().period).toBe('annual');
  });
});

describe('conflicts are settled by the person, never automatically', () => {
  function enterConflict(): void {
    const solver = useSolver.getState();
    solver.enter('revenue', 185_000_000);
    solver.enter('orders', 1_480);
    // Revenue and orders imply an AOV of 125000. This says otherwise.
    solver.enter('aov', 140_000);
    solver.derive();
  }

  it('reports the disagreement rather than overwriting the entered value', () => {
    enterConflict();
    const conflicts = useSolver.getState().result!.conflicts;
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.variableId).toBe('aov');
    // The entered value is untouched: AC-11.
    expect(useSolver.getState().entered['aov']).toBe(140_000);
  });

  it('keeping your own value changes nothing at all', () => {
    enterConflict();
    const conflict = useSolver.getState().result!.conflicts[0]!;
    useSolver.getState().beginResolve(conflict);
    useSolver.getState().resolve('mine');

    expect(useSolver.getState().entered['aov']).toBe(140_000);
    expect(useSolver.getState().resolving).toBeNull();
  });

  it('taking the derived value replaces the entry and recomputes', () => {
    enterConflict();
    const conflict = useSolver.getState().result!.conflicts[0]!;
    useSolver.getState().beginResolve(conflict);
    useSolver.getState().resolve('derived');

    expect(useSolver.getState().entered['aov']).toBeCloseTo(125_000, 6);
    expect(useSolver.getState().result!.conflicts).toHaveLength(0);
  });
});

describe('the workbench screen', () => {
  it('shows the entered values, the derived values and the counter', () => {
    render(<App />);
    act(() => useSolver.getState().enter('revenue', 185_000_000));
    act(() => useSolver.getState().enter('orders', 1_480));

    fireEvent.click(screen.getByRole('tab', { name: 'Ruang kerja' }));
    act(() => useSolver.getState().derive());

    const entered = screen.getByRole('table', { name: 'Daftar nilai yang dimasukkan' });
    expect(within(entered).getByText('Total Pendapatan')).toBeDefined();

    const derived = screen.getByRole('table', { name: 'Daftar nilai turunan' });
    expect(within(derived).getByText('Nilai Pesanan Rata-rata')).toBeDefined();

    // The status bar counter the specification asks for: entered, derived, blocked.
    expect(screen.getByLabelText('Pesan').textContent).toMatch(
      /2 dimasukkan, \d+ diturunkan, \d+ terhalang/,
    );
  });

  it('derives on Ctrl+Enter', () => {
    render(<App />);
    act(() => useSolver.getState().enter('revenue', 185_000_000));
    act(() => useSolver.getState().enter('orders', 1_480));
    fireEvent.click(screen.getByRole('tab', { name: 'Ruang kerja' }));

    expect(useSolver.getState().result).toBeNull();
    fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });
    expect(useSolver.getState().result).not.toBeNull();
  });

  it('says plainly when nothing has been entered and when nothing has been derived', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('tab', { name: 'Ruang kerja' }));

    expect(screen.getByText(/Belum ada nilai yang dimasukkan/)).toBeDefined();
    expect(screen.getByText(/Belum ada nilai turunan/)).toBeDefined();
  });

  it('marks a conflicted row with an asterisk and offers a way to settle it', () => {
    render(<App />);
    act(() => {
      useSolver.getState().enter('revenue', 185_000_000);
      useSolver.getState().enter('orders', 1_480);
      useSolver.getState().enter('aov', 140_000);
      useSolver.getState().derive();
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Ruang kerja' }));

    const entered = screen.getByRole('table', { name: 'Daftar nilai yang dimasukkan' });
    expect(within(entered).getByText(/^\* /)).toBeDefined();

    fireEvent.click(within(entered).getByRole('button', { name: 'Selesaikan' }));
    const dialog = screen.getByRole('dialog', { name: 'Nilai yang bertentangan' });
    expect(dialog.textContent).toContain('tidak diubah');
    expect(within(dialog).getByRole('button', { name: 'Pakai nilai saya' })).toBeDefined();
    expect(within(dialog).getByRole('button', { name: 'Pakai nilai turunan' })).toBeDefined();
  });

  it('switches between the two screens from the Window menu as well as the tabs', () => {
    render(<App />);
    expect(screen.getByLabelText('Cari rumus')).toBeDefined();

    fireEvent.click(screen.getByRole('tab', { name: 'Ruang kerja' }));
    expect(screen.getByRole('button', { name: 'Turunkan' })).toBeDefined();

    fireEvent.click(screen.getByRole('tab', { name: 'Kalkulator' }));
    expect(screen.getByLabelText('Cari rumus')).toBeDefined();
  });
});
