/**
 * P22 tests for SCR-REPORT.
 *
 * The screen definition calls the report a print preview showing the exact A4 output, so what is
 * checked here is that the document says what the workbench did: the same derivations, in the same
 * order, with the substituted expressions the engine produced, and the honesty clause at the foot
 * of every copy including the one that leaves as Markdown.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { App } from '../src/App.tsx';
import { useCalculator } from '../src/state/calculator.ts';
import { useSolver } from '../src/state/solver.ts';
import { useSensitivity } from '../src/state/sensitivity.ts';
import { buildReport, reportDate, reportMarkdown } from '../src/screens/report.ts';
import { translate } from '../src/locale/index.ts';

const t = (key: string): string => translate('id', key);

function resetStores(): void {
  useCalculator.setState({
    locale: 'id',
    selectedId: 'ctr',
    inputs: {},
    outcome: { kind: 'idle' },
  });
  useSensitivity.setState({ selectedId: 'clv_simple', inputs: {}, outcome: { kind: 'idle' } });
  useSolver.setState({ entered: {}, result: null, report: null, resolving: null });
}

beforeEach(resetStores);

/** Fill the workbench the way a person would, then open the report tab. */
function openReport(): HTMLElement {
  const view = render(<App />);
  fireEvent.click(screen.getByRole('tab', { name: 'Laporan' }));
  return view.container as HTMLElement;
}

function withWorkbench(): void {
  const solver = useSolver.getState();
  solver.enter('revenue', 185_000_000);
  solver.enter('orders', 1_480);
  solver.derive();
}

describe('the report as a document', () => {
  it('carries the header the screen definition asks for', () => {
    withWorkbench();
    openReport();

    expect(screen.getByText(/Laporan Perhitungan/)).toBeTruthy();
    expect(screen.getByText(/Ruang kerja:/)).toBeTruthy();
    expect(screen.getByText(/Tanggal:/)).toBeTruthy();
    expect(screen.getByText(/Versi:/)).toBeTruthy();
  });

  it('prints one section per derived value, with both expressions and the result', () => {
    withWorkbench();
    const container = openReport();

    const derivations = [...container.querySelectorAll('.mk-paper__derivation')];
    expect(derivations.length).toBeGreaterThan(0);

    const aov = derivations.find((node) => (node.textContent ?? '').startsWith('aov'));
    expect(aov, 'the report has no section for the derived average order value').toBeTruthy();

    const lines = (aov?.textContent ?? '').split('\n');
    expect(lines).toHaveLength(3);
    // The expression in names, then the same expression with the numbers put in, then the result.
    expect(lines[0]).toContain('revenue');
    expect(lines[0]).toContain('orders');
    expect(lines[1]).toContain('185');
    expect(lines[2]).toContain('125');
  });

  it('reports the same derivations the workbench produced, in the same order', () => {
    withWorkbench();
    const container = openReport();

    const trail = useSolver.getState().result?.trail ?? [];
    const first = new Set<string>();
    const expected = trail.filter((step) => !first.has(step.target) && first.add(step.target));

    const printed = [...container.querySelectorAll('.mk-paper__derivation')].map(
      (node) => (node.textContent ?? '').split(' ')[0],
    );
    expect(printed).toEqual(expected.map((step) => step.target));
  });

  it('states plainly that no assumption was applied, rather than leaving the section empty', () => {
    withWorkbench();
    openReport();
    expect(screen.getByText(/Tidak ada asumsi yang diterapkan/)).toBeTruthy();
  });

  it('carries the honesty clause at the foot', () => {
    withWorkbench();
    const container = openReport();
    const footer = container.querySelector('.mk-paper__footer');
    expect(footer?.textContent).toContain('tidak diverifikasi oleh lembaga mana pun');
  });

  it('says there is nothing to report rather than printing an empty shell', () => {
    const container = openReport();
    expect(screen.getByText(/Belum ada yang dapat dilaporkan/)).toBeTruthy();
    expect(container.querySelectorAll('.mk-paper__derivation')).toHaveLength(0);
  });
});

describe('the exports', () => {
  it('offers the four the screen definition names', () => {
    openReport();
    for (const label of [
      'Cetak',
      'Simpan sebagai PDF',
      'Simpan ruang kerja (JSON)',
      'Salin sebagai Markdown',
    ]) {
      expect(screen.getByRole('button', { name: label }), label).toBeTruthy();
    }
  });

  it('shows the Markdown on the page when the browser refuses the clipboard', () => {
    // jsdom exposes no clipboard, which is the same situation as a page opened from a disk.
    withWorkbench();
    openReport();
    fireEvent.click(screen.getByRole('button', { name: 'Salin sebagai Markdown' }));

    expect(screen.getByText(/Penyalinan ditolak peramban/)).toBeTruthy();
    const area = screen.getByLabelText('Teks Markdown laporan') as HTMLTextAreaElement;
    expect(area.value).toContain('# MetriKa: Laporan Perhitungan');
    expect(area.value).toContain('tidak diverifikasi oleh lembaga mana pun');
  });

  it('says how Save as PDF actually works instead of implying it writes a file itself', () => {
    openReport();
    expect(screen.getByText(/kotak cetak peramban/)).toBeTruthy();
  });

  it('says where page numbers come from, rather than printing none and leaving it unexplained', () => {
    // Chromium does not implement the page margin boxes that would let a stylesheet number the
    // pages, so the browser's own footer is the honest answer. See DEVIATIONS.md, D-25.
    openReport();
    expect(screen.getByText(/Nomor halaman dicetak oleh peramban/)).toBeTruthy();
  });
});

describe('the report model', () => {
  it('writes the date out in words, in the active locale', () => {
    const date = new Date(2026, 8, 21);
    expect(reportDate(date, 'id')).toBe('21 September 2026');
    expect(reportDate(date, 'en')).toBe('21 September 2026');
    expect(reportDate(new Date(2026, 4, 3), 'id')).toBe('3 Mei 2026');
    expect(reportDate(new Date(2026, 4, 3), 'en')).toBe('3 May 2026');
  });

  it('is empty only when nothing has been entered and nothing derived', () => {
    const empty = buildReport({
      workspace: 'Uji',
      entered: {},
      result: null,
      locale: 'id',
      version: '0.1.0',
      now: new Date(),
      t,
    });
    expect(empty.empty).toBe(true);

    withWorkbench();
    const filled = buildReport({
      workspace: 'Uji',
      entered: useSolver.getState().entered,
      result: useSolver.getState().result,
      locale: 'id',
      version: '0.1.0',
      now: new Date(),
      t,
    });
    expect(filled.empty).toBe(false);
    expect(filled.entered).toHaveLength(2);
  });

  it('puts every part of the page into the Markdown, the footer included', () => {
    withWorkbench();
    const report = buildReport({
      workspace: 'Uji',
      entered: useSolver.getState().entered,
      result: useSolver.getState().result,
      locale: 'id',
      version: '0.1.0',
      now: new Date(2026, 8, 21),
      t,
    });
    const markdown = reportMarkdown(report, t);

    expect(markdown).toContain('# MetriKa: Laporan Perhitungan');
    expect(markdown).toContain('- Tanggal: 21 September 2026');
    expect(markdown).toContain('## Nilai yang dimasukkan');
    expect(markdown).toContain('## Nilai yang diturunkan');
    expect(markdown).toContain('## Asumsi');
    expect(markdown.trimEnd().endsWith(report.footer)).toBe(true);
    for (const section of report.sections) {
      expect(markdown).toContain(section.substituted);
    }
  });

  it('carries no em dash and no en dash, in either locale', () => {
    withWorkbench();
    for (const locale of ['id', 'en'] as const) {
      const report = buildReport({
        workspace: 'Uji',
        entered: useSolver.getState().entered,
        result: useSolver.getState().result,
        locale,
        version: '0.1.0',
        now: new Date(),
        t: (key) => translate(locale, key),
      });
      expect(reportMarkdown(report, (key) => translate(locale, key))).not.toMatch(/[–—]/);
    }
  });
});
