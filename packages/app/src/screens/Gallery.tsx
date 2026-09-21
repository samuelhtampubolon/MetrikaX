/**
 * P08: the component gallery.
 *
 * Development only. It is reached at #gallery and is stripped from a production build by the
 * `import.meta.env.DEV` guard in main.tsx, so it costs the shipped bundle nothing. It exists so the
 * fifteen controls can be looked at side by side, at 100 and at 150 percent zoom, against the
 * metrics in design_system.tokens.
 */

import { useState, type ReactNode } from 'react';
import {
  Chart,
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
  SearchField,
  StatusBar,
  TabPanel,
  TabStrip,
  TitleBar,
  TreeView,
  cumulative,
} from '@metrika/ui';

const SAMPLE = [
  { x: 0, y: 4 },
  { x: 1, y: 9 },
  { x: 2, y: 6 },
  { x: 3, y: 12 },
  { x: 4, y: 8 },
  { x: 5, y: 14 },
];

export function Gallery(): ReactNode {
  const [value, setValue] = useState('1.250');
  const [search, setSearch] = useState('');
  const [combo, setCombo] = useState('stratum');
  const [tab, setTab] = useState('a');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ padding: 8, display: 'grid', gap: 'var(--group-gap)', maxWidth: 1100 }}>
      <TitleBar title="Galeri komponen" closeLabel="Tutup" onClose={() => {}} />

      <MenuBar
        label="Menu galeri"
        onCommand={() => {}}
        menus={[
          {
            id: 'file',
            label: 'Berkas',
            mnemonicIndex: 0,
            items: [{ id: 'new', label: 'Baru', shortcut: 'Ctrl+N' }],
          },
          {
            id: 'edit',
            label: 'Sunting',
            mnemonicIndex: 0,
            items: [{ id: 'copy', label: 'Salin' }],
          },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--group-gap)' }}>
        <GroupBox legend="Kolom masukan">
          <NumericField label="Total Klik" suffix="" value={value} onChange={setValue} />
          <NumericField label="Total Tayangan" suffix="Rp" value="100.000" onChange={() => {}} />
          <NumericField label="Dinonaktifkan" value="0" onChange={() => {}} disabled />
          <SearchField label="Cari" value={search} onChange={setSearch} />
          <div style={{ marginTop: 'var(--control-gap)' }}>
            <ComboBox
              label="Pengelompokan"
              value={combo}
              onChange={setCombo}
              options={[
                { value: 'stratum', label: 'Menurut strata' },
                { value: 'phase', label: 'Menurut fase' },
              ]}
            />
          </div>
          <div
            style={{ display: 'flex', gap: 'var(--control-gap)', marginTop: 'var(--group-gap)' }}
          >
            <PushButton isDefault>Hitung</PushButton>
            <PushButton onClick={() => setModalOpen(true)}>Dialog</PushButton>
            <PushButton disabled>Nonaktif</PushButton>
          </div>
        </GroupBox>

        <GroupBox legend="Keluaran">
          <ResultField label="Hasil" value="125.000" unit="Rp" />
          <div style={{ height: 'var(--control-gap)' }} />
          <ResultField label="Hasil ditolak" value="Penyebut bernilai nol." refused />
          <div style={{ height: 'var(--group-gap)' }} />
          <ProgressBar label="Kemajuan modul" value={7} max={12} />
          <div style={{ height: 'var(--group-gap)' }} />
          <DerivationPane
            label="Penurunan"
            emptyMessage=""
            lines={['aov = revenue / orders', '    = 185.000.000 / 1.480', '    = 125.000']}
          />
        </GroupBox>

        <GroupBox legend="Pohon">
          <TreeView
            label="Daftar rumus"
            expandLabel="Buka kelompok"
            collapseLabel="Tutup kelompok"
            selectedId="ctr"
            onSelect={() => {}}
            nodes={[
              {
                kind: 'branch',
                id: 'I',
                label: 'I  (2)',
                children: [
                  { kind: 'leaf', id: 'ctr', label: 'CTR  Tingkat Klik Tayang' },
                  { kind: 'leaf', id: 'cpm', label: 'CPM  Biaya per Seribu Tayangan' },
                ],
              },
              {
                kind: 'branch',
                id: 'II',
                label: 'II  (1)',
                children: [{ kind: 'leaf', id: 'clv', label: 'CLV' }],
              },
            ]}
          />
        </GroupBox>

        <GroupBox legend="Daftar">
          <ListView
            label="Nilai turunan"
            sortLabel="Urutkan"
            rowKey={(row) => row.id}
            rows={[
              { id: 'aov', name: 'AOV', value: '125.000', via: 'aov' },
              { id: 'arpu', name: 'ARPU', value: '20.556', via: 'arpu' },
            ]}
            columns={[
              {
                id: 'name',
                label: 'Variabel',
                render: (row) => row.name,
                sortKey: (row) => row.name,
              },
              { id: 'value', label: 'Nilai', numeric: true, render: (row) => row.value },
              { id: 'via', label: 'Melalui', render: (row) => row.via },
            ]}
          />
        </GroupBox>
      </div>

      <div>
        <TabStrip
          label="Contoh tab"
          activeId={tab}
          onSelect={setTab}
          tabs={[
            { id: 'a', label: 'Kalkulator' },
            { id: 'b', label: 'Ruang kerja' },
          ]}
        />
        <TabPanel id={tab}>
          <PlotCanvas
            label="Plot tornado"
            formatValue={(entry) => entry.toFixed(1)}
            bars={[
              { id: 'margin', label: 'Marjin kotor', value: 18.4 },
              { id: 'retention', label: 'Tingkat retensi', value: -11.2 },
              { id: 'aov', label: 'Nilai pesanan rata rata', value: 6.1 },
            ]}
          />
        </TabPanel>
      </div>

      {/* P14: the chart vocabulary, every shape at the size it is used at. */}
      <GroupBox legend="Grafik">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--group-gap)' }}>
          <Chart
            label="Contoh garis dan langkah"
            xAxisLabel="Periode"
            yAxisLabel="Jumlah (unit)"
            formatX={(value) => String(value)}
            formatY={(value) => String(value)}
            series={[
              { id: 'line', label: 'Garis', points: SAMPLE },
              {
                id: 'step',
                label: 'Langkah',
                points: SAMPLE.map((p) => ({ ...p, y: p.y * 0.6 })),
                shape: 'step',
              },
            ]}
          />
          <Chart
            label="Contoh sebar dan batang"
            xAxisLabel="Periode"
            yAxisLabel="Jumlah (unit)"
            formatX={(value) => String(value)}
            formatY={(value) => String(value)}
            series={[{ id: 'bar', label: 'Batang', points: SAMPLE, shape: 'bar' }]}
          />
          <Chart
            label="Contoh kurva kumulatif dengan bagian proyeksi"
            xAxisLabel="Periode"
            yAxisLabel="Kumulatif (unit)"
            formatX={(value) => String(value)}
            formatY={(value) => String(value)}
            series={[
              { id: 'cum', label: 'Kumulatif', points: cumulative(SAMPLE), extrapolatedFrom: 4 },
            ]}
            marks={[{ id: 'target', x: 4, y: 22, label: '22' }]}
          />
          <Chart
            label="Contoh sebar"
            xAxisLabel="Harga (Rp)"
            yAxisLabel="Kuantitas (unit)"
            formatX={(value) => String(value)}
            formatY={(value) => String(value)}
            series={[{ id: 'scatter', label: 'Sebar', points: SAMPLE, shape: 'scatter' }]}
          />
        </div>
      </GroupBox>

      <StatusBar
        message="Siap."
        state="Menunggu masukan"
        workspace="Belum disimpan"
        messageLabel="Pesan"
        stateLabel="Keadaan perhitungan"
        workspaceLabel="Nama ruang kerja"
      />

      {modalOpen ? (
        <ModalDialog
          title="Contoh dialog"
          confirmLabel="Oke"
          cancelLabel="Batal"
          onConfirm={() => setModalOpen(false)}
          onCancel={() => setModalOpen(false)}
        >
          <p>
            Dialog memiliki bilah judul, tombol Oke dan tombol Batal, serta menghalangi jendela di
            belakangnya.
          </p>
        </ModalDialog>
      ) : null}
    </div>
  );
}
