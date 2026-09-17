# Cara berkontribusi

## Aturan yang tidak dapat ditawar

1. **Jangan pernah menyunting berkas terbangkit.** Berkas di bawah
   `packages/engine/src/formulas/generated/`, `packages/engine/src/variables/generated/` dan
   `packages/engine/test/golden/` ditulis oleh `packages/codegen`. Bila sebuah rumus keliru,
   perbaiki `spec/metrika.spec.json` lalu jalankan `pnpm codegen`. CI menjalankan `pnpm verify`
   yang membandingkan isi repositori dengan hasil pembangkitan segar dan gagal bila berbeda.

2. **Tulis uji sebelum implementasi untuk apa pun yang bersifat numerik.** Contoh terselesaikan di
   dalam spesifikasi adalah fikstur uji. Tegaskan dahulu, saksikan gagal, baru implementasikan.

3. **Kerjakan fase secara berurutan.** Fase P03, P05 dan P06 adalah gerbang keras. Tidak ada
   pekerjaan hilir yang boleh dimulai sebelum definisi selesainya terpenuhi.

4. **Laporkan penyimpangan secara eksplisit.** Bila sebuah anggaran tidak dapat dipenuhi, sebutkan
   angka hasil pengukuran, jangan melonggarkan anggaran di dalam spesifikasi. Catat setiap
   penyimpangan di `DEVIATIONS.md`.

5. **Jangan menambah kebergantungan tanpa menyatakan alasannya.** Modul grafik ditulis tangan
   dengan sengaja. Jangan menggantinya dengan pustaka.

6. **Doktrin antarmuka tidak dapat ditawar dengan alasan estetika.** Bila sebuah komponen terlihat
   lawas, itulah hasil yang dimaksud.

## Pesan komit

Satu komit per tugas bila memungkinkan. Pesan komit menyebut kode fase di awal baris pertama:

```
P03: emit 76 relation modules from the specification
```

## Daftar kata terlarang

Kata berikut tidak boleh muncul di dalam katalog teks mana pun: `powerful`, `advanced`,
`revolutionary`, `seamless`, `effortless`, `intuitive`, `canggih`, `revolusioner`, `mudah sekali`,
`tanpa usaha`. Langkah CI memeriksa hal ini dan menggagalkan pembangunan bila ditemukan.

Tanda pisah em dan en tidak dipakai di seluruh keluaran. Gunakan titik dua, koma, tanda hubung,
atau kata sambung.
