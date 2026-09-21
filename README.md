# MetriKa

MetriKa: Perangkat Analisis Kuantitatif Pemasaran

Tujuh puluh enam rumus, satu ruang kerja, tanpa sambungan internet.

## Apa ini

MetriKa menghitung 76 rumus pemasaran kuantitatif dari angka yang dimasukkan pengguna. Mesinnya
bekerja sebagai graf kendala: setiap rumus dapat diselesaikan ke arah maju maupun mundur, sehingga
nilai yang tidak dimasukkan diturunkan selama masukannya cukup. Perangkat ini berjalan tanpa
sambungan jaringan pada web maupun desktop dan menyimpan seluruh data pada perangkat pengguna.

## What this is

MetriKa computes 76 quantitative marketing formulas from the numbers a user enters. The engine is a
constraint graph: each formula solves forward and backward, so values that were not entered are
derived whenever the inputs allow it. It runs with the network disabled on web and on desktop, and
keeps all data on the user's own device.

## Struktur repositori

| Jalur              | Isi                                                     |
| ------------------ | ------------------------------------------------------- |
| `spec/`            | Sumber kebenaran tunggal: `metrika.spec.json`           |
| `packages/codegen` | Pembaca spesifikasi yang memancarkan sumber TypeScript  |
| `packages/engine`  | Mesin perhitungan murni, tanpa impor antarmuka          |
| `packages/ui`      | Kit widget lawas: bevel, kendali, dan chrome jendela    |
| `packages/app`     | Aplikasi: ragam bahasa, keadaan, penyimpanan, dan layar |
| `packages/desktop` | Cangkang Tauri: jendela, izin, dan penyimpanan portabel |

Seluruh berkas di bawah `src/**/generated/` dan `test/golden/` dihasilkan oleh codegen. Berkas
tersebut tidak boleh disunting dengan tangan. Bila sebuah rumus keliru, perbaiki
`spec/metrika.spec.json` lalu jalankan codegen ulang.

## Perintah

```sh
pnpm install
pnpm codegen      # membaca spec, menulis sumber terbangkit
pnpm verify       # memeriksa bahwa sumber terbangkit sama dengan hasil pembangkitan segar
pnpm typecheck
pnpm test
pnpm lint
pnpm build        # membangun aplikasi web ke docs/
pnpm --filter @metrika/app run dev   # galeri komponen ada pada #gallery
pnpm --filter @metrika/app exec playwright test   # uji luring dan keamanan
pnpm audit --audit-level low
```

## Tiga cara menjalankan

| Cara           | Berkas                                    | Untuk siapa                                                                          |
| -------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Situs web      | `docs/index.html`, disajikan oleh peladen | Pemakaian biasa. Berfungsi luring setelah satu kunjungan                             |
| Berkas tunggal | `docs/metrika-offline.html`               | Mesin yang melarang pemasangan dan tidak memiliki peladen. Klik ganda, tanpa peladen |
| Desktop        | Pemasang NSIS, atau berkas portabel       | Pemakaian yang perlu menyimpan pekerjaan di samping berkas jalankannya               |

Bangunan web biasa tidak dapat dibuka langsung dari cakram: peramban menolak memuat skrip modul
melalui `file://`. Berkas tunggal dibuat justru untuk keadaan itu, dengan skrip dan gaya disisipkan
di dalamnya. Lihat `DEVIATIONS.md`, D-21.

## Luring dan keamanan

Perangkat ini tidak melakukan permintaan jaringan apa pun, dan hal itu diukur, bukan dijanjikan.
Berkas `packages/app/e2e/offline.spec.ts` menjalankan bangunan produksi di dalam peramban
sungguhan, mencatat setiap permintaan yang dikeluarkan halaman, lalu menegaskan bahwa jumlah
permintaan ke asal lain adalah nol. Uji lain memuat halaman satu kali, mematikan jaringan, memuat
ulang, dan menghitung dua rumus beserta penurunannya.

Ringkasan langkah pengamanan:

| Langkah                                                      | Tempat                                    |
| ------------------------------------------------------------ | ----------------------------------------- |
| `connect-src 'none'` pada desktop, `'self'` pada web         | `tauri.conf.json`, `index.html`           |
| Tidak ada plugin http, tidak ada pembaru otomatis            | `Cargo.toml`, `capabilities/default.json` |
| Tidak ada `eval` dan tidak ada konstruktor `Function`        | aturan lint, dan uji pada peramban        |
| Tidak ada `fetch` dan `XMLHttpRequest` pada sumber antarmuka | aturan lint                               |
| Service worker menolak permintaan lintas asal                | `public/sw.js`                            |
| Pemeriksaan nasihat kebergantungan                           | `pnpm audit` pada CI                      |
| Seluruh data tersimpan pada perangkat pengguna               | IndexedDB pada web, SQLite pada desktop   |

## Angka terukur

Nilai berikut diisi dengan hasil pengukuran, bukan dengan perkiraan. Baris yang belum diukur
dinyatakan sebagai belum diukur, bukan dikosongkan.

| Ukuran                          | Ambang spesifikasi | Terukur                           |
| ------------------------------- | ------------------ | --------------------------------- |
| Jumlah rumus dalam registri     | tepat 76           | 76                                |
| Jumlah variabel kanonik         | minimal 150        | 161                               |
| Kasus uji emas                  | minimal 304        | 376                               |
| Jangkauan propagasi AC-04       | minimal 12         | 4, belum terpenuhi                |
| Kunci katalog teks              | dua bahasa penuh   | 1199, 801 tanpa nilai Inggris     |
| Permintaan ke asal lain         | nol                | nol, diukur di Chromium           |
| Nasihat keamanan kebergantungan | nol                | nol                               |
| Bundel web JavaScript           | belum ditetapkan   | 659 KB, 147 KB setelah gzip       |
| Bundel web CSS                  | belum ditetapkan   | 13 KB                             |
| Berkas tunggal luring           | belum ditetapkan   | 680 KB                            |
| Berkas portabel Windows         | di bawah 30 MB     | 4,48 MB                           |
| Bangunan desktop tiga sistem    | berhasil           | berhasil, ketiganya               |
| Waktu mulai dingin              | di bawah 2 detik   | belum diukur, perlu mesin Windows |

## Penerbitan web

Aplikasi web diterbitkan melalui GitHub Pages oleh alur kerja `.github/workflows/pages.yml`.
Sebelum penerbitan pertama, Pages harus dinyalakan sekali secara manual pada Settings, Pages,
Source: GitHub Actions. Token alur kerja tidak dapat menyalakannya sendiri. Selama sakelar itu
belum dinyalakan, pekerjaan Pages gagal pada langkah `configure-pages`, sedangkan seluruh langkah
sebelumnya, termasuk pembangunan, tetap berhasil.

## Lisensi

MIT. Lihat `LICENSE`.
