# Penyimpangan dan keputusan yang perlu ditinjau pemilik proyek

Aturan operasi pada spesifikasi menyatakan: bila dokumen ini dan preferensi pelaksana berbeda,
ikuti dokumen dan sampaikan ketidaksepakatan itu secara terbuka. Berkas ini adalah tempat
penyampaian tersebut. Setiap butir menyebut apa yang ditemukan, apa yang dikerjakan, dan apa yang
perlu diputuskan pemilik proyek.

Dua butir di bawah ini mengubah `spec/metrika.spec.json` sendiri, dan keduanya dicatat pada
`spec/CHANGELOG-spec.md` sebagai versi 1.0.1. Sisanya adalah keputusan pada lapisan kode.

---

## D-01. Enam puluh rumus tidak menyebut variabel keluarannya

**Temuan.** Pada 60 dari 76 rumus, `output.canonical_variable_id` bernilai null dengan catatan bahwa
keluarannya tidak menjadi masukan rumus lain. Namun ekspresi balikan rumus rumus tersebut tetap
menyebut hasilnya dengan nama `result`, dan mesin propagasi memerlukan sebuah variabel untuk
ditulisi. Tanpa variabel itu, 60 rumus tidak dapat ikut serta dalam graf sama sekali, dan AC-04
tidak mungkin terpenuhi.

**Yang dikerjakan.** Codegen membangkitkan satu variabel hasil untuk setiap rumus semacam itu,
secara deterministik dari spesifikasi: 57 variabel, yaitu 60 dikurangi 3 rumus yang hasilnya bukan
satu angka tunggal (lihat D-02). Identifiernya adalah id rumus itu sendiri bila belum terpakai.
Setiap entri bertanda `synthesised: true` dan menyebut rumus yang menghasilkannya, sehingga dapat
dibedakan dari 161 variabel kanonik pada spesifikasi.

**Yang perlu diputuskan.** Apakah 57 variabel ini sebaiknya dipindahkan ke dalam spesifikasi sebagai
variabel kanonik, lengkap dengan label dan kelas satuan yang ditetapkan pemilik proyek, atau tetap
dibangkitkan.

---

## D-02. Tiga rumus tidak menghasilkan satu angka

**Temuan.** `irr` mengembalikan seluruh akar yang ditemukan beserta penanda ketunggalan,
`van_westendorp` mengembalikan empat titik harga beserta empat kurvanya, dan
`qfd_technical_importance` mengembalikan satu skor per karakteristik teknis. Ketiganya tidak dapat
disimpan sebagai satu nilai skalar pada graf variabel.

**Yang dikerjakan.** Ketiganya ditandai `resultShape: 'composite'`, tidak menerbitkan apa pun ke
graf, dan uji emasnya memeriksa struktur hasil, bukan satu angka. Ini sejalan dengan
`publishes_to_graph: false` pada spesifikasi.

**Catatan tambahan.** Tanda tangan `vw_intersection` pada `engine.helper_functions` menerima satu
himpunan jawaban, sedangkan rumus `van_westendorp` memanggilnya dengan empat angka tunggal.
Implementasi menerima keduanya: satu angka dibaca sebagai satu responden.

---

## D-03. Contoh terselesaikan tidak menyebut hasil yang diharapkan

**Temuan.** Setiap rumus memiliki `worked_example.inputs` dan penanda
`must_be_verified_by_test: true`, tetapi tidak ada nilai keluaran yang diharapkan.

**Yang dikerjakan.** Codegen menghitung keluaran dari relasi yang baru saja dipancarkannya, lalu
menuliskannya ke dalam uji emas sebagai literal. Ini mengunci perilaku: perubahan pada rumus atau
pada fungsi pembantu akan muncul sebagai uji yang gagal, bukan sebagai angka yang berubah diam
diam. Pemeriksaan yang sepenuhnya mandiri terhadap kebenaran angka tetap datang dari tiga kasus
lain pada setiap berkas: kasus batas, kasus penolakan, dan perjalanan pulang pergi melalui setiap
arah balikan.

**Yang perlu diputuskan.** Apakah pemilik proyek ingin menambahkan nilai keluaran yang diharapkan ke
dalam spesifikasi, sehingga angka pada uji berasal dari sumber yang terpisah dari implementasi.

---

## D-04. Ekspresi QFD tidak sesuai dengan rumus matematisnya (spesifikasi 1.0.1)

**Temuan.** Notasi matematis rumus `qfd_technical_importance` berbunyi
`TI_j = sum_i CustomerImportance_i x Relationship_ij`, yaitu penjumlahan menurut baris kebutuhan
pelanggan, menghasilkan satu nilai per karakteristik teknis. Ekspresi JavaScript-nya berbunyi
`matvec(relationship_matrix, customer_importance)`, yang menjumlahkan menurut kolom. Pada contoh
terselesaikan, matriks berukuran 4 baris kali 3 kolom sedangkan vektornya berpanjang 4, sehingga
perhitungan gagal karena bentuknya tidak cocok.

**Yang dikerjakan.** Ekspresi diperbaiki di dalam spesifikasi menjadi
`matvec(transpose(relationship_matrix), customer_importance)`, dan fungsi pembantu `transpose`
ditambahkan. Hasilnya adalah vektor berpanjang 3, satu nilai per karakteristik teknis, sesuai
notasi matematisnya.

---

## D-05. Elastisitas harga: ekspresi balikan tidak membalikkan ekspresi majunya (spesifikasi 1.0.1)

**Temuan.** Elastisitas busur dihitung dengan titik tengah:
`E = ((q2 - q1) / ((q1 + q2) / 2)) / D`. Bila `k = E * D`, penyelesaian untuk `q2` adalah
`q2 = q1 * (1 + k/2) / (1 - k/2)`. Ekspresi balikan pada spesifikasi berbunyi
`q1 * (1 + k) / (1 - k/2)`, yaitu kehilangan faktor setengah pada pembilang. Dengan contoh
terselesaikan, ekspresi itu memulihkan 1575 dari nilai sebenarnya 1450, meleset 8,6 persen.

**Yang dikerjakan.** Pembilang diperbaiki di dalam spesifikasi menjadi `1 + 0.5 * k`. Perjalanan
pulang pergi kini memulihkan 1450 tepat.

---

## D-06. Tanda koefisien harga tidak dapat dipulihkan pada rumus WTP

**Temuan.** `wtp = delta_u / Math.abs(beta_price)`. Nilai mutlak menghapus tanda `beta_price`,
sehingga arah balikan `beta_price = delta_u / result` hanya dapat memulihkan besarannya.

**Yang dikerjakan.** Ini sifat rumusnya, bukan cacat. Uji emas untuk arah tersebut menegaskan
pemulihan besaran dan menyebutkan alasannya pada komentar, alih alih menuntut pemulihan yang tidak
mungkin dilakukan aritmetikanya.

---

## D-07. CSAT tergolong C1 namun hasilnya berskala persen

**Temuan.** `csat` ditandai kelas struktur C1, yang menurut tanda tangan strukturalnya menuntut
hasil pada rentang nol sampai satu. Ekspresinya sendiri mengalikan dengan 100, sehingga hasil
contoh terselesaikan adalah 81,43.

**Yang dikerjakan.** Batas rentang dinyatakan pada satuan yang benar benar dihasilkan ekspresi.
Setiap relasi membawa `resultBounds`, dan untuk C1 batasnya adalah nol sampai satu, kecuali bila
kelas satuan keluarannya persen, yang batasnya nol sampai seratus. Hanya `csat` yang termasuk
kekecualian itu di seluruh korpus.

**Yang perlu diputuskan.** Apakah `csat` sebaiknya menyimpan proporsi pada rentang nol sampai satu
dan menyerahkan penskalaan ke lapisan tampilan, seperti seluruh rumus C1 lainnya.

---

## D-08. Pemeriksaan kata terlarang memakai pencocokan kata utuh

**Temuan.** Spesifikasi meminta langkah CI yang mencari sepuluh kata terlarang dan menggagalkan
pembangunan pada setiap kemunculan. Salah satu kata itu adalah `canggih`. Sumbu A pada spesifikasi
sendiri bernama "tangga kecanggihan", dan kata itu muncul pada definisi ke-76 rumus. Pencarian
substring akan menggagalkan pembangunan pada seluruh definisi tersebut.

**Yang dikerjakan.** `scripts/content-lint.mjs` mencocokkan kata utuh, bukan substring, dan
melewati bagian spesifikasi yang menuliskan kata kata terlarang justru untuk melarangnya.
Penggunaan `canggih` sebagai kata sifat bagi perangkat lunak ini tetap tertangkap. Hasil terukur
saat ini: nol kemunculan.

**Yang perlu diputuskan.** Apakah frasa "tangga kecanggihan" sebaiknya diganti, misalnya menjadi
"tangga penguasaan", sehingga pencocokan substring dapat dipakai tanpa kekecualian.

---

## D-09. Kelas satuan variabel hasil yang dibangkitkan

**Temuan.** Spesifikasi tidak menyatakan kelas satuan bagi hasil sebuah rumus. Kelas satuan
menentukan pemformatan dan ambang toleransi konflik, sehingga 57 variabel hasil pada D-01
memerlukannya.

**Yang dikerjakan.** Kelas satuan disimpulkan dari analisis dimensi atas ekspresinya: setiap
masukan disumbangkan sebagai pangkat atas dua basis, uang dan cacah, lalu hasilnya dipetakan
kembali. Penjumlahan dan pengurangan mensyaratkan kedua sisi berdimensi sama, dan bila tidak,
penyimpulan menyatakan dirinya gagal alih alih menebak. Sembilan belas rumus yang hasil
penyimpulannya tidak tepat secara makna, misalnya kuantitas titik impas yang secara aljabar
nirdimensi namun secara makna adalah cacah unit, dicantumkan pada tabel pengecualian di
`packages/codegen/src/outputs.ts` beserta alasannya masing masing.

**Yang perlu diputuskan.** Peninjauan tabel pengecualian tersebut oleh pemilik proyek.

---

## D-11. AC-04 tidak terpenuhi oleh korpus: jangkauan terukur adalah empat, bukan dua belas

**Temuan.** AC-04 menyatakan bahwa memasukkan tayangan, klik, belanja, pengunjung dan konversi
menurunkan sekurang kurangnya dua belas variabel lain. Angka terukur adalah empat: `ctr_out`,
`conversion_rate`, `cpm` dan `cpc`.

Penyebabnya ada pada korpus, bukan pada mesin. Hanya 18 dari 76 rumus menyatakan keterkaitan pada
`cross_references`, dan hanya 30 dari 155 variabel masukan dipakai oleh lebih dari satu rumus.
Rumus yang seharusnya memperpanjang rantai ini membaca variabel yang tidak disediakan kelima
masukan tersebut: `cpa` membaca `acquisitions` sedangkan yang tersedia adalah `conversions`, dan
`cpl` membaca `leads`. Keduanya hanya kurang satu variabel.

Mesin propagasinya sendiri bekerja dua arah dan berantai: dari
`revenue, orders, users, unique_customers, cogs, retention_rate, discount_rate, horizon_t`
mesin menurunkan `clv` melalui `aov`, `purchase_frequency` dan `gross_margin`, tidak satu pun di
antaranya dimasukkan pengguna.

**Yang dikerjakan.** Uji propagasi menegaskan angka empat secara persis, bukan sebagai batas bawah,
disertai komentar yang menyebut AC-04 belum terpenuhi. Bila korpus diperbaiki sehingga
jangkauannya naik, uji itu gagal dan catatan ini wajib diperbarui. Anggaran tidak dilonggarkan dan
angka terukur tidak disembunyikan.

**Yang perlu diputuskan.** Dua jalan keluar, dan keduanya milik pemilik proyek:

1. Menyatakan kesamaan identitas antar variabel, misalnya bahwa `conversions` dan `acquisitions`
   adalah besaran yang sama pada konteks kampanye tertentu. Ini keputusan pemodelan, bukan
   keputusan teknis, karena sebuah konversi tidak selalu berarti akuisisi pelanggan baru.
2. Menambahkan rumus penghubung ke dalam spesifikasi sehingga rantainya menyambung.

Sebelum salah satu dipilih, AC-04 tetap dicatat sebagai belum terpenuhi.

---

## D-12. Contoh render pada modul penjelasan tidak konsisten dengan dirinya sendiri

**Temuan.** Definisi selesainya fase P07 berbunyi: contoh render pada `engine.explain_module`
direproduksi persis. Contoh itu tidak dapat direproduksi persis karena tidak konsisten secara
internal. Baris substitusinya menuliskan frekuensi pembelian sebesar 2,40, sedangkan baris
provenans di bawahnya pada contoh yang sama menurunkan 1.480 dibagi 620 sama dengan 2,3871 untuk
variabel yang sama. Kedua angka tidak dapat benar bersamaan.

**Yang dikerjakan.** Bentuk barisnya direproduksi persis: tiga baris untuk setiap langkah, penanda
`<-` pada baris provenans, tanda silang untuk perkalian, penanda asal dan nomor generasi dalam
kurung siku, serta pemformatan angka sesuai kelas satuan dan ragam bahasa. Angka yang dipakai pada
uji adalah angka yang saling menutup. Mata uang ditampilkan tanpa awalan di dalam baris turunan,
sebagaimana pada contoh spesifikasi.

**Yang perlu diputuskan.** Mana yang benar pada contoh tersebut, 2,40 atau 2,3871, agar contoh pada
spesifikasi dapat diperbaiki.

---

## D-10. Butir pada spesifikasi yang belum dijawab

Spesifikasi sendiri mencantumkan lima pertanyaan terbuka pada
`claude_code_instructions.known_ambiguities_to_resolve_with_the_owner`. Semuanya masih terbuka dan
belum memengaruhi kode yang ada. Yang paling mendesak bagi fase berikutnya adalah ragam bahasa untuk
umpan balik latihan, karena fase P16 sampai P18 akan menulis banyak teks.
