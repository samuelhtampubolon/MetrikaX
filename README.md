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

| Jalur              | Isi                                                    |
| ------------------ | ------------------------------------------------------ |
| `spec/`            | Sumber kebenaran tunggal: `metrika.spec.json`          |
| `packages/codegen` | Pembaca spesifikasi yang memancarkan sumber TypeScript |
| `packages/engine`  | Mesin perhitungan murni, tanpa impor antarmuka         |

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
```

## Angka terukur

Nilai berikut diisi dengan hasil pengukuran, bukan dengan perkiraan. Baris yang belum diukur
dinyatakan sebagai belum diukur, bukan dikosongkan.

| Ukuran                      | Ambang spesifikasi | Terukur            |
| --------------------------- | ------------------ | ------------------ |
| Jumlah rumus dalam registri | tepat 76           | 76                 |
| Jumlah variabel kanonik     | minimal 150        | 161                |
| Kasus uji emas              | minimal 304        | 376                |
| Ukuran pasang Windows       | di bawah 30 MB     | belum diukur       |
| Waktu mulai dingin          | di bawah 2 detik   | belum diukur       |
| Jangkauan propagasi AC-04   | minimal 12         | 4, belum terpenuhi |

## Lisensi

MIT. Lihat `LICENSE`.
