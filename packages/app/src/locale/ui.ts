/**
 * The interface chrome catalogue.
 *
 * These strings are not in the specification, because the specification names the screens and their
 * controls without writing their labels. They are authored here, in both locales, and they are the
 * only user-visible strings the application adds to what the specification supplies.
 *
 * Two rules from locale.register_rules_id govern every line below. The register is formal
 * throughout, with no casual address. No em dash and no en dash appears anywhere: a colon, a comma,
 * a hyphen or a conjunction does the work instead. An error message states what is missing and what
 * to do about it, and never blames the reader.
 *
 * The humility paradox rule also applies: no label describes the tool. There is no adjective here
 * at all, and no sentence anywhere tells the reader that the application is capable.
 */

export const uiCatalogue = {
  'app.name': { id: 'MetriKa', en: 'MetriKa' },
  'app.window.title': {
    id: 'MetriKa: Perangkat Analisis Kuantitatif Pemasaran',
    en: 'MetriKa: Quantitative Marketing Analysis Workbench',
  },
  'app.titlebar.minimise': { id: 'Kecilkan jendela', en: 'Minimise window' },
  'app.titlebar.close': { id: 'Tutup jendela', en: 'Close window' },

  /* Menu bar. The mnemonic letter of each is underlined and opens the menu on Alt. */
  'menu.bar.label': { id: 'Menu utama', en: 'Main menu' },
  'menu.file': { id: 'Berkas', en: 'File' },
  'menu.file.new': { id: 'Ruang kerja baru', en: 'New workspace' },
  'menu.file.open': { id: 'Buka', en: 'Open' },
  'menu.file.save': { id: 'Simpan', en: 'Save' },
  'menu.file.print': { id: 'Cetak', en: 'Print' },
  'menu.edit': { id: 'Sunting', en: 'Edit' },
  'menu.edit.copy_result': { id: 'Salin hasil', en: 'Copy result' },
  'menu.edit.clear_inputs': { id: 'Kosongkan masukan', en: 'Clear inputs' },
  'menu.analysis': { id: 'Analisis', en: 'Analysis' },
  'menu.analysis.calculate': { id: 'Hitung', en: 'Calculate' },
  'menu.analysis.derivation': { id: 'Panel penurunan', en: 'Derivation pane' },
  'menu.analysis.sensitivity': { id: 'Analisis sensitivitas', en: 'Sensitivity analysis' },
  'menu.analysis.send_to_solver': { id: 'Kirim ke ruang kerja', en: 'Send to the workbench' },
  'menu.learn': { id: 'Pelajari', en: 'Learn' },
  'menu.learn.modules': { id: 'Modul', en: 'Modules' },
  'menu.tools': { id: 'Alat', en: 'Tools' },
  'menu.tools.locale': { id: 'Ganti bahasa', en: 'Switch language' },
  'menu.tools.contrast': { id: 'Kontras tinggi', en: 'High contrast' },
  'menu.window': { id: 'Jendela', en: 'Window' },
  'menu.window.calculator': { id: 'Kalkulator', en: 'Calculator' },
  'menu.window.sensitivity': { id: 'Sensitivitas', en: 'Sensitivity' },
  'menu.help': { id: 'Bantuan', en: 'Help' },
  'menu.help.formula': { id: 'Bantuan rumus terpilih', en: 'Help for the selected formula' },
  'menu.help.about': { id: 'Tentang', en: 'About' },

  /* Toolbar. */
  'toolbar.label': { id: 'Bilah alat', en: 'Toolbar' },
  'toolbar.grouping': { id: 'Pengelompokan', en: 'Grouping' },
  'toolbar.locale': { id: 'Bahasa', en: 'Language' },

  /* Grouping modes for the formula tree. */
  'grouping.stratum': { id: 'Menurut strata', en: 'By stratum' },
  'grouping.phase': { id: 'Menurut fase', en: 'By phase' },
  'grouping.class': { id: 'Menurut kelas struktur', en: 'By structural class' },
  'grouping.domain': { id: 'Menurut ranah keputusan', en: 'By decision domain' },
  'grouping.alphabetical': { id: 'Menurut abjad', en: 'Alphabetical' },

  /* Calculator screen. */
  'calc.tree.label': { id: 'Daftar rumus', en: 'Formula list' },
  'calc.tree.expand': { id: 'Buka kelompok', en: 'Expand group' },
  'calc.tree.collapse': { id: 'Tutup kelompok', en: 'Collapse group' },
  'calc.search.label': { id: 'Cari rumus', en: 'Search formulas' },
  'calc.search.empty': {
    id: 'Tidak ada rumus yang cocok dengan pencarian itu.',
    en: 'No formula matches that search.',
  },
  'calc.inputs.legend': { id: 'Masukan', en: 'Inputs' },
  'calc.calculate': { id: 'Hitung', en: 'Calculate' },
  'calc.result.legend': { id: 'Hasil', en: 'Result' },
  'calc.result.label': { id: 'Nilai hasil', en: 'Result value' },
  'calc.result.empty': { id: 'Belum dihitung', en: 'Not yet computed' },
  'calc.band.legend': { id: 'Penafsiran', en: 'Interpretation' },
  'calc.band.none': {
    id: 'Rumus ini tidak memiliki pita penafsiran.',
    en: 'This formula has no interpretation band.',
  },
  'calc.band.outside': {
    id: 'Hasil berada di luar seluruh pita yang ditetapkan.',
    en: 'The result lies outside every stated band.',
  },
  'calc.pitfalls.legend': { id: 'Kekeliruan yang lazim', en: 'Common pitfalls' },
  'calc.derivation.legend': { id: 'Penurunan', en: 'Derivation' },
  'calc.derivation.label': { id: 'Penurunan hasil', en: 'Result derivation' },
  'calc.derivation.empty': {
    id: 'Panel ini terisi setelah perhitungan dijalankan. Tekan F9 untuk menutupnya.',
    en: 'This pane fills once a calculation has run. Press F9 to close it.',
  },
  'calc.derivation.show': { id: 'Tampilkan penurunan', en: 'Show derivation' },
  'calc.derivation.hide': { id: 'Sembunyikan penurunan', en: 'Hide derivation' },
  'calc.formula.expression': { id: 'Ungkapan', en: 'Expression' },
  'calc.formula.taxonomy': { id: 'Koordinat taksonomi', en: 'Taxonomy coordinates' },

  /* Messages for the status bar. */
  'status.label.message': { id: 'Pesan', en: 'Message' },
  'status.label.state': { id: 'Keadaan perhitungan', en: 'Computation state' },
  'status.label.workspace': { id: 'Nama ruang kerja', en: 'Workspace name' },
  'status.ready': { id: 'Siap.', en: 'Ready.' },
  'status.state.idle': { id: 'Menunggu masukan', en: 'Awaiting input' },
  'status.state.computed': { id: 'Terhitung', en: 'Computed' },
  'status.state.refused': { id: 'Ditolak', en: 'Refused' },
  'status.workspace.unsaved': { id: 'Belum disimpan', en: 'Not saved' },
  'status.selected': { id: 'Rumus terpilih:', en: 'Selected formula:' },
  'status.missing_inputs': {
    id: 'Masukan berikut masih kosong:',
    en: 'The following inputs are still empty:',
  },
  'status.computed': { id: 'Perhitungan selesai.', en: 'The calculation is complete.' },

  /* Composite results, which are not a single number. */
  'calc.result.composite.irr': {
    id: 'Akar yang ditemukan:',
    en: 'Roots found:',
  },
  'calc.result.composite.irr_multiple': {
    id: 'Deret ini memiliki lebih dari satu tingkat pengembalian internal. Seluruhnya ditampilkan.',
    en: 'This series has more than one internal rate of return. All of them are shown.',
  },
  'calc.result.composite.vw': {
    id: 'Empat titik harga Van Westendorp:',
    en: 'The four Van Westendorp price points:',
  },
  'calc.result.composite.vector': {
    id: 'Hasil berupa satu nilai per karakteristik teknis:',
    en: 'The result is one value per technical characteristic:',
  },

  /* Dialogs. */
  'dialog.ok': { id: 'Oke', en: 'OK' },
  'dialog.cancel': { id: 'Batal', en: 'Cancel' },
  'dialog.about.title': { id: 'Tentang MetriKa', en: 'About MetriKa' },
  'dialog.about.version': { id: 'Versi', en: 'Version' },
  'dialog.about.statement': {
    id:
      'MetriKa menghitung 76 rumus pemasaran kuantitatif dari angka yang dimasukkan pengguna. ' +
      'Mesinnya menyelesaikan setiap rumus ke arah maju maupun mundur, sehingga nilai yang tidak ' +
      'dimasukkan diturunkan selama masukannya cukup.',
    en:
      'MetriKa computes 76 quantitative marketing formulas from the numbers a user enters. The ' +
      'engine solves each formula forwards and backwards, so values that were not entered are ' +
      'derived whenever the inputs allow it.',
  },
  'dialog.about.taxonomy': {
    id: 'Taksonomi empat sumbu berasal dari spesifikasi proyek, versi',
    en: 'The four-axis taxonomy comes from the project specification, version',
  },
  'dialog.about.offline': {
    id: 'Tidak ada data yang meninggalkan mesin ini. Perangkat ini tidak melakukan permintaan jaringan.',
    en: 'No data leaves this machine. The application makes no network request.',
  },
  'dialog.about.licence': { id: 'Lisensi: MIT.', en: 'Licence: MIT.' },

  /* Storage. The status bar states where the work went, and says so plainly when it went nowhere. */
  'storage.indexeddb': { id: 'Tersimpan di peramban', en: 'Saved in the browser' },
  'storage.sqlite': { id: 'Tersimpan di berkas', en: 'Saved to a file' },
  'storage.memory': {
    id: 'Tidak tersimpan: kemajuan akan hilang saat jendela ditutup.',
    en: 'Not saved: progress will be lost when this window closes.',
  },
  'file.export': { id: 'Ekspor ruang kerja', en: 'Export workspace' },
  'file.import': { id: 'Impor ruang kerja', en: 'Import workspace' },
  'file.import.failed': { id: 'Impor gagal', en: 'The import failed' },
  'file.exported': { id: 'Ruang kerja diekspor.', en: 'The workspace was exported.' },
  'file.imported': { id: 'Ruang kerja diimpor.', en: 'The workspace was imported.' },

  /* SCR-SOLVER, the workbench. */
  'menu.window.workbench': { id: 'Ruang kerja', en: 'Workbench' },
  'solver.header.legend': { id: 'Ruang kerja', en: 'Workspace' },
  'solver.header.name': { id: 'Nama ruang kerja', en: 'Workspace name' },
  'solver.header.period': { id: 'Periode dasar', en: 'Base period' },
  'solver.header.currency': { id: 'Mata uang', en: 'Currency' },
  'solver.known.legend': { id: 'Nilai yang dimasukkan', en: 'Values entered' },
  'solver.known.label': { id: 'Daftar nilai yang dimasukkan', en: 'List of entered values' },
  'solver.derived.legend': { id: 'Nilai turunan', en: 'Derived values' },
  'solver.derived.label': { id: 'Daftar nilai turunan', en: 'List of derived values' },
  'solver.add.variable': { id: 'Pilih variabel', en: 'Choose a variable' },
  'solver.add.value': { id: 'Nilai', en: 'Value' },
  'solver.add.button': { id: 'Tambah', en: 'Add' },
  'solver.remove': { id: 'Hapus', en: 'Remove' },
  'solver.derive': { id: 'Turunkan', en: 'Derive' },
  'solver.column.variable': { id: 'Variabel', en: 'Variable' },
  'solver.column.value': { id: 'Nilai', en: 'Value' },
  'solver.column.unit': { id: 'Satuan', en: 'Unit' },
  'solver.column.origin': { id: 'Asal', en: 'Origin' },
  'solver.column.note': { id: 'Catatan', en: 'Note' },
  'solver.column.via': { id: 'Melalui rumus', en: 'Via formula' },
  'solver.column.generation': { id: 'Generasi', en: 'Generation' },
  'solver.column.confidence': { id: 'Keyakinan', en: 'Confidence' },
  'solver.origin.user': { id: 'Masukan', en: 'Entered' },
  'solver.origin.derived': { id: 'Turunan', en: 'Derived' },
  'solver.origin.assumed': { id: 'Asumsi', en: 'Assumed' },
  'solver.origin.scenario': { id: 'Skenario', en: 'Scenario' },
  'solver.confidence.exact': { id: 'Tepat', en: 'Exact' },
  'solver.confidence.estimated': { id: 'Perkiraan', en: 'Estimated' },
  'solver.confidence.assumed': { id: 'Asumsi', en: 'Assumed' },
  'solver.counter': { id: 'dimasukkan', en: 'entered' },
  'solver.counter.derived': { id: 'diturunkan', en: 'derived' },
  'solver.counter.blocked': { id: 'terhalang', en: 'blocked' },
  'solver.blocked.legend': { id: 'Rumus yang terhalang', en: 'Blocked relations' },
  'solver.blocked.none': {
    id: 'Tidak ada rumus yang terhalang.',
    en: 'No relation is blocked.',
  },
  'solver.empty.known': {
    id: 'Belum ada nilai yang dimasukkan. Tambahkan satu nilai untuk memulai.',
    en: 'No value has been entered yet. Add one to begin.',
  },
  'solver.empty.derived': {
    id: 'Belum ada nilai turunan. Tekan Turunkan setelah memasukkan beberapa nilai.',
    en: 'Nothing has been derived yet. Press Derive once a few values are entered.',
  },
  'solver.missing.button': { id: 'Apa yang kurang', en: 'What is missing' },
  'solver.missing.legend': { id: 'Yang masih kurang', en: 'What is still missing' },
  'solver.missing.target': { id: 'Variabel yang dicari', en: 'Target variable' },
  'solver.conflict.legend': { id: 'Nilai yang bertentangan', en: 'Values that disagree' },
  'solver.conflict.resolve': { id: 'Selesaikan', en: 'Resolve' },
  'solver.conflict.keep_mine': { id: 'Pakai nilai saya', en: 'Keep mine' },
  'solver.conflict.use_derived': { id: 'Pakai nilai turunan', en: 'Use the derived value' },
  'solver.conflict.marker': {
    id: 'Tanda bintang menandai nilai yang bertentangan dengan hasil perhitungan.',
    en: 'An asterisk marks a value that disagrees with what the relations compute.',
  },

  /* Sensitivity screen, SCR-SENSITIVITY. */
  'sensitivity.formula.legend': { id: 'Rumus', en: 'Formula' },
  'sensitivity.formula.label': {
    id: 'Pilih rumus yang akan diuji',
    en: 'Choose the formula to test',
  },
  'sensitivity.scope': {
    id: 'Hanya rumus dari kelas struktur C4, C5, C6, C7 dan C9 yang diuji di sini, yaitu kelas yang hasilnya berlipat ketika setiap faktor sedikit terlalu optimistis.',
    en: 'Only the formulas in structural classes C4, C5, C6, C7 and C9 are tested here: the classes whose result compounds when each factor is a little too optimistic.',
  },
  'sensitivity.perturbation.label': { id: 'Pergeseran, persen', en: 'Perturbation, percent' },
  'sensitivity.perturbation.invalid': {
    id: 'Pergeseran harus berupa angka yang lebih besar dari nol dan kurang dari seratus persen.',
    en: 'The perturbation must be a number greater than zero and less than one hundred percent.',
  },
  'sensitivity.run': { id: 'Jalankan', en: 'Run' },
  'sensitivity.idle': {
    id: 'Belum dijalankan. Isi masukan lalu tekan Jalankan.',
    en: 'Not yet run. Enter the inputs, then press Run.',
  },
  'sensitivity.base.legend': { id: 'Hasil dasar', en: 'Base result' },
  'sensitivity.base.label': { id: 'Nilai hasil dasar', en: 'Base result value' },
  'sensitivity.plot.legend': { id: 'Plot tornado', en: 'Tornado plot' },
  'sensitivity.plot.label': {
    id: 'Plot tornado, satu batang untuk setiap faktor, diurutkan menurut lebar ayunan',
    en: 'Tornado plot, one bar per factor, ordered by the width of the swing',
  },
  'sensitivity.axis.swing': { id: 'Ayunan', en: 'Swing of' },
  'sensitivity.table.legend': { id: 'Peringkat faktor', en: 'Ranked factors' },
  'sensitivity.table.label': {
    id: 'Tabel peringkat faktor dengan angka yang sama seperti pada plot',
    en: 'Table of ranked factors carrying the same numbers as the plot',
  },
  'sensitivity.column.factor': { id: 'Faktor', en: 'Factor' },
  'sensitivity.column.low': { id: 'Hasil rendah', en: 'Low result' },
  'sensitivity.column.high': { id: 'Hasil tinggi', en: 'High result' },
  'sensitivity.column.swing': { id: 'Ayunan', en: 'Swing' },
  'sensitivity.column.share': { id: 'Ayunan terhadap dasar', en: 'Swing over base' },
  'sensitivity.column.note': { id: 'Catatan', en: 'Note' },
  'sensitivity.share.undefined': {
    id: 'tidak terdefinisi, hasil dasar nol',
    en: 'not defined, the base result is zero',
  },
  'sensitivity.partial': {
    id: 'Satu sisi ditolak: rentang ini sepihak.',
    en: 'One side was refused: this range is one sided.',
  },
  'sensitivity.partial.legend': { id: 'Rentang sepihak', en: 'One sided ranges' },
  'sensitivity.sentence.legend': { id: 'Faktor paling menentukan', en: 'The deciding factor' },
  'sensitivity.empty': {
    id: 'Tidak ada faktor yang dapat digeser pada rumus ini.',
    en: 'No factor on this formula can be moved.',
  },
  'sensitivity.sort': { id: 'Urutkan kolom', en: 'Sort the column' },
  'sensitivity.counter.factors': { id: 'faktor diperingkat', en: 'factors ranked' },

  /* The honesty clause. It appears wherever a result could be mistaken for a credential. */
  'honesty.not_verified': {
    id: 'Hasil ini dihasilkan secara lokal oleh perangkat ini dan tidak diverifikasi oleh lembaga mana pun.',
    en: 'This result was produced locally by this application and is not verified by any institution.',
  },
} as const;

export type UiKey = keyof typeof uiCatalogue;
