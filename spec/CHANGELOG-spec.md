# Riwayat perubahan spesifikasi

Berkas ini mencatat setiap perubahan pada `spec/metrika.spec.json`. Spesifikasi adalah sumber
kebenaran tunggal, sehingga setiap perubahan padanya mengubah kode terbangkit.

## 1.0.0

Versi awal sebagaimana diterima dari pemilik proyek. Dikomit tanpa perubahan apa pun.

- 76 rumus
- 161 variabel kanonik
- 9 modul kurikulum
- 30 fase pembangunan

## 1.0.1

Dua perbaikan pada rumus. Keduanya ditemukan ketika uji emas dibangkitkan dari contoh
terselesaikan, dan keduanya diuraikan pada `DEVIATIONS.md`.

- `qfd_technical_importance`: ekspresi diubah dari
  `matvec(relationship_matrix, customer_importance)` menjadi
  `matvec(transpose(relationship_matrix), customer_importance)`. Ekspresi sebelumnya menjumlahkan
  menurut kolom, sedangkan notasi matematisnya menjumlahkan menurut baris, dan pada contoh
  terselesaikan bentuk matriks serta vektornya tidak cocok sehingga perhitungan gagal. Lihat D-04.
- `price_elasticity`: ekspresi balikan untuk `q2` kehilangan faktor setengah pada pembilangnya,
  sehingga memulihkan 1575 dari nilai sebenarnya 1450. Pembilang diperbaiki menjadi
  `1 + 0.5 * result * ...`. Lihat D-05.

Tidak ada perubahan lain. Jumlah rumus tetap 76 dan jumlah variabel kanonik tetap 161.
