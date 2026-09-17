/**
 * P08 widget kit tests.
 *
 * These assert the parts of the doctrine that are checkable without a screenshot: the bevel a
 * control wears, the metrics it is given, the accessible name it carries, and the keyboard
 * behaviour the specification names. Pixel-level bevel rendering at 100 and 150 percent zoom is a
 * visual regression check and belongs to the Playwright suite in a later phase; see DEVIATIONS.md,
 * D-14.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import {
  ComboBox,
  DerivationPane,
  GroupBox,
  ListView,
  MenuBar,
  ModalDialog,
  NumericField,
  PlotCanvas,
  ProgressBar,
  PushButton,
  ResultField,
  StatusBar,
  TabStrip,
  TitleBar,
  TreeView,
  bevelClass,
} from '../src/index.ts';

describe('bevel recipes', () => {
  it('names the three treatments and nothing else', () => {
    expect(bevelClass('raised')).toBe('mk-raised');
    expect(bevelClass('sunken')).toBe('mk-sunken');
    expect(bevelClass('groupbox')).toBe('mk-groupbox-bevel');
    expect(bevelClass('none', 'mk-extra')).toBe('mk-extra');
  });
});

describe('TitleBar', () => {
  it('renders its glyphs as text characters and names its buttons in the active locale', () => {
    const onClose = vi.fn();
    render(<TitleBar title="MetriKa" closeLabel="Tutup jendela" onClose={onClose} />);
    const close = screen.getByRole('button', { name: 'Tutup jendela' });
    expect(close.textContent).toBe('x');
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('GroupBox', () => {
  it('uses a fieldset and a legend, so the grouping is announced not merely drawn', () => {
    const { container } = render(
      <GroupBox legend="Masukan">
        <span>isi</span>
      </GroupBox>,
    );
    const fieldset = container.querySelector('fieldset');
    expect(fieldset?.className).toContain('mk-groupbox-bevel');
    expect(container.querySelector('legend')?.textContent).toBe('Masukan');
  });
});

describe('NumericField', () => {
  it('is sunken, right aligned and monospace, with the unit outside the field', () => {
    const { container } = render(
      <NumericField label="Total Tayangan" suffix="Rp" value="1.000" onChange={() => {}} />,
    );
    const input = screen.getByLabelText('Total Tayangan');
    expect(input.className).toContain('mk-sunken');
    expect(input.className).toContain('mk-numeric');
    expect((input as HTMLInputElement).value).toBe('1.000');
    // The suffix is a sibling of the field, never inside it.
    expect(container.querySelector('.mk-field-row__suffix')?.textContent).toBe('Rp');
  });

  it('rejects a non-numeric key rather than accepting it and complaining afterwards', () => {
    render(<NumericField label="Klik" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Klik');

    const letter = fireEvent.keyDown(input, { key: 'q' });
    expect(letter).toBe(false); // preventDefault was called

    expect(fireEvent.keyDown(input, { key: '7' })).toBe(true);
    expect(fireEvent.keyDown(input, { key: ',' })).toBe(true);
    expect(fireEvent.keyDown(input, { key: 'Backspace' })).toBe(true);
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(true);
  });

  it('reports what the user typed without reformatting it mid-edit', () => {
    const onChange = vi.fn();
    render(<NumericField label="Klik" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Klik'), { target: { value: '1250' } });
    expect(onChange).toHaveBeenCalledWith('1250');
  });
});

describe('ComboBox and PushButton', () => {
  it('gives the combo a sunken field and a raised drop button with a caret glyph', () => {
    const { container } = render(
      <ComboBox
        label="Pengelompokan"
        value="a"
        options={[
          { value: 'a', label: 'Menurut strata' },
          { value: 'b', label: 'Menurut fase' },
        ]}
        onChange={() => {}}
      />,
    );
    expect(container.querySelector('.mk-combo')?.className).toContain('mk-sunken');
    const drop = container.querySelector('.mk-combo__button');
    expect(drop?.className).toContain('mk-raised');
    expect(drop?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByLabelText('Pengelompokan')).toBeDefined();
  });

  it('marks the default action so Enter has a visible owner', () => {
    render(<PushButton isDefault>Hitung</PushButton>);
    expect(screen.getByRole('button', { name: 'Hitung' }).dataset.default).toBe('true');
  });
});

describe('TreeView', () => {
  it('draws plus and minus toggles and collapses a branch', () => {
    render(
      <TreeView
        label="Daftar rumus"
        expandLabel="Buka kelompok"
        collapseLabel="Tutup kelompok"
        selectedId="ctr"
        onSelect={() => {}}
        nodes={[
          {
            kind: 'branch',
            id: 'group:I',
            label: 'I (2)',
            children: [
              { kind: 'leaf', id: 'ctr', label: 'CTR' },
              { kind: 'leaf', id: 'cpm', label: 'CPM' },
            ],
          },
        ]}
      />,
    );

    const toggle = screen.getByRole('button', { name: 'Tutup kelompok: I (2)' });
    expect(toggle.textContent).toBe('-');
    expect(screen.getByRole('button', { name: 'CTR' })).toBeDefined();

    fireEvent.click(toggle);
    expect(screen.queryByRole('button', { name: 'CTR' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Buka kelompok: I (2)' }).textContent).toBe('+');
  });

  it('marks the selected leaf so the current formula is announced', () => {
    render(
      <TreeView
        label="Daftar rumus"
        expandLabel="Buka"
        collapseLabel="Tutup"
        selectedId="cpm"
        onSelect={() => {}}
        nodes={[
          { kind: 'leaf', id: 'ctr', label: 'CTR' },
          { kind: 'leaf', id: 'cpm', label: 'CPM' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'CPM' }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('button', { name: 'CTR' }).getAttribute('aria-current')).toBe('false');
  });
});

describe('ListView', () => {
  const rows = [
    { id: 'a', name: 'Beta', value: 2 },
    { id: 'b', name: 'Alfa', value: 10 },
  ];
  const columns = [
    {
      id: 'name',
      label: 'Nama',
      render: (row: (typeof rows)[number]) => row.name,
      sortKey: (row: (typeof rows)[number]) => row.name,
    },
    {
      id: 'value',
      label: 'Nilai',
      numeric: true,
      render: (row: (typeof rows)[number]) => row.value,
    },
  ];

  it('draws sortable headers as raised buttons and sorts on click', () => {
    render(
      <ListView
        label="Nilai"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        sortLabel="Urutkan"
      />,
    );
    const header = screen.getByRole('button', { name: 'Urutkan: Nama' });
    expect(header.className).toContain('mk-raised');

    const before = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.textContent);
    expect(before[0]).toContain('Beta');

    fireEvent.click(header);
    const after = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.textContent);
    expect(after[0]).toContain('Alfa');
  });

  it('gives a numeric column tabular figures so the column does not shift', () => {
    const { container } = render(
      <ListView
        label="Nilai"
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        sortLabel="Urutkan"
      />,
    );
    expect(container.querySelector('.mk-listview__numeric')).not.toBeNull();
  });
});

describe('ResultField and DerivationPane', () => {
  it('shows the unit beside the number and keeps the text selectable', () => {
    render(<ResultField label="Nilai hasil" value="125.000" unit="Rp" />);
    const output = screen.getByLabelText('Nilai hasil');
    expect(output.textContent).toContain('125.000');
    expect(output.textContent).toContain('Rp');
    expect(output.dataset.state).toBe('ok');
  });

  it('renders a refusal as a sentence, left aligned, with no unit', () => {
    render(<ResultField label="Nilai hasil" value="Penyebut bernilai nol." unit="Rp" refused />);
    const output = screen.getByLabelText('Nilai hasil');
    expect(output.dataset.state).toBe('refused');
    expect(output.textContent).toBe('Penyebut bernilai nol.');
  });

  it('states that the derivation pane is empty rather than showing a blank box', () => {
    render(
      <DerivationPane
        label="Penurunan"
        lines={[]}
        emptyMessage="Panel ini terisi setelah perhitungan."
      />,
    );
    expect(screen.getByRole('region', { name: 'Penurunan' }).textContent).toBe(
      'Panel ini terisi setelah perhitungan.',
    );
  });

  it('joins derivation lines with newlines and preserves them', () => {
    render(
      <DerivationPane
        label="Penurunan"
        lines={['a = b / c', '  = 4 / 2', '  = 2']}
        emptyMessage=""
      />,
    );
    expect(screen.getByRole('region', { name: 'Penurunan' }).textContent).toBe(
      'a = b / c\n  = 4 / 2\n  = 2',
    );
  });
});

describe('StatusBar and ProgressBar', () => {
  it('gives the status bar three named panes', () => {
    render(
      <StatusBar
        message="Siap."
        state="Menunggu masukan"
        workspace="Belum disimpan"
        messageLabel="Pesan"
        stateLabel="Keadaan perhitungan"
        workspaceLabel="Nama ruang kerja"
      />,
    );
    expect(screen.getByLabelText('Pesan').textContent).toBe('Siap.');
    expect(screen.getByLabelText('Keadaan perhitungan').textContent).toBe('Menunggu masukan');
    expect(screen.getByLabelText('Nama ruang kerja').textContent).toBe('Belum disimpan');
  });

  it('draws progress as discrete blocks rather than a continuous fill', () => {
    const { container } = render(<ProgressBar label="Kemajuan" value={5} max={10} blocks={10} />);
    const blocks = container.querySelectorAll('.mk-progress__block');
    expect(blocks).toHaveLength(10);
    expect(container.querySelectorAll('[data-filled="true"]')).toHaveLength(5);
    expect(
      screen.getByRole('progressbar', { name: 'Kemajuan' }).getAttribute('aria-valuenow'),
    ).toBe('5');
  });
});

describe('MenuBar', () => {
  it('underlines the mnemonic letter and opens that menu on Alt', () => {
    const onCommand = vi.fn();
    const { container } = render(
      <MenuBar
        label="Menu utama"
        onCommand={onCommand}
        menus={[
          {
            id: 'file',
            label: 'Berkas',
            mnemonicIndex: 0,
            items: [{ id: 'new', label: 'Ruang kerja baru' }],
          },
        ]}
      />,
    );
    expect(container.querySelector('.mk-menubar__mnemonic')?.textContent).toBe('B');

    fireEvent.keyDown(document, { key: 'b', altKey: true });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ruang kerja baru' }));
    expect(onCommand).toHaveBeenCalledWith('file', 'new');
  });

  it('closes the open menu on Escape rather than trapping focus in it', () => {
    render(
      <MenuBar
        label="Menu utama"
        onCommand={() => {}}
        menus={[
          { id: 'file', label: 'Berkas', mnemonicIndex: 0, items: [{ id: 'new', label: 'Baru' }] },
        ]}
      />,
    );
    fireEvent.keyDown(document, { key: 'b', altKey: true });
    expect(screen.getByRole('menuitem', { name: 'Baru' })).toBeDefined();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menuitem', { name: 'Baru' })).toBeNull();
  });
});

describe('TabStrip', () => {
  it('moves between tabs with the arrow keys', () => {
    const onSelect = vi.fn();
    render(
      <TabStrip
        label="Layar"
        activeId="a"
        onSelect={onSelect}
        tabs={[
          { id: 'a', label: 'Kalkulator' },
          { id: 'b', label: 'Ruang kerja' },
        ]}
      />,
    );
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Kalkulator' }), { key: 'ArrowRight' });
    expect(onSelect).toHaveBeenCalledWith('b');
  });
});

describe('ModalDialog', () => {
  it('blocks, confirms on Enter and cancels on Escape', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ModalDialog
        title="Tentang MetriKa"
        confirmLabel="Oke"
        cancelLabel="Batal"
        onConfirm={onConfirm}
        onCancel={onCancel}
      >
        <p>isi</p>
      </ModalDialog>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Tentang MetriKa' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledOnce();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('puts OK before Cancel and both to the right', () => {
    render(
      <ModalDialog
        title="T"
        confirmLabel="Oke"
        cancelLabel="Batal"
        onConfirm={() => {}}
        onCancel={() => {}}
      >
        <p>isi</p>
      </ModalDialog>,
    );
    const buttons = screen.getAllByRole('button').map((button) => button.textContent);
    expect(buttons).toEqual(['Oke', 'Batal']);
  });
});

describe('PlotCanvas', () => {
  it('draws hatch fills rather than solid ones, and no colour at all', () => {
    const { container } = render(
      <PlotCanvas
        label="Plot tornado"
        bars={[
          { id: 'a', label: 'Marjin', value: 12 },
          { id: 'b', label: 'Retensi', value: -8 },
        ]}
        formatValue={(value) => String(value)}
      />,
    );
    expect(container.querySelector('pattern#mk-hatch')).not.toBeNull();
    const bars = container.querySelectorAll('.mk-plot__bar');
    expect(bars).toHaveLength(2);
    for (const bar of bars) expect(bar.getAttribute('fill')).toBe('url(#mk-hatch)');
    expect(screen.getByRole('img', { name: 'Plot tornado' })).toBeDefined();
  });
});
