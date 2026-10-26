# Kebijakan keamanan

Hak Cipta © 2026 Samuel Hasudungan Tampubolon

## Melaporkan kerentanan

Jangan membuka isu publik untuk kerentanan. Gunakan **Security, Report a vulnerability** pada halaman
repositori ini di GitHub, yang membuat laporan pribadi hanya terlihat oleh pemilik repositori.

Sertakan versi yang dipakai, langkah untuk mengulanginya, dan dampak yang Anda amati.

## Apa yang dijanjikan perangkat ini

Janji berikut diuji, bukan hanya dinyatakan. Bila salah satunya terbukti tidak berlaku, itu adalah
kerentanan dan layak dilaporkan.

- **Tidak ada permintaan jaringan.** Bangunan web hanya berbicara dengan asalnya sendiri, dan
  bangunan desktop dan berkas tunggal tidak berbicara dengan siapa pun. Diuji pada Chromium
  sungguhan pada setiap dorongan ke cabang utama (`packages/app/e2e/offline.spec.ts`).
- **Tidak ada `eval` dan tidak ada konstruktor `Function`.** Ekspresi dikompilasi pada saat
  pembangkitan (ADR-003). Aturan lint dan uji peramban menegakkannya.
- **Seluruh data tetap pada perangkat pengguna.** Satu satunya jalan keluar adalah berkas yang
  dinamai pengguna sendiri, dan halaman yang mereka minta dicetak.
- **Tidak ada akun, telemetri, atau pembaru otomatis.**

## Batas yang perlu diketahui

- Pada GitHub Pages dan Hugging Face Spaces tidak ada header HTTP buatan sendiri. Kebijakan keamanan
  isi diberikan melalui tag meta, dan arahan `frame-ancestors` tidak berlaku pada tag meta, sehingga
  halaman dapat dibenamkan pada situs lain. Ia tidak memuat sesi, kredensial, atau data yang dapat
  dicuri, tetapi batas ini ada. Pada Vercel, Netlify, Cloudflare Pages, dan Firebase Hosting header
  sungguhan dikirim dan pembenaman ditolak (lihat `deploy/README.md`).
- Hasil perhitungan dihasilkan secara lokal dan tidak diverifikasi oleh lembaga mana pun.
- Berkas jalankan Windows tidak ditandatangani dengan sertifikat penerbit. Windows SmartScreen dapat
  memperingatkan pada pemakaian pertama. Periksa checksum pada halaman rilis sebelum menjalankannya.

## Kebergantungan

`pnpm audit --audit-level low` dijalankan pada setiap dorongan dan menggagalkan pembangunan bila ada
satu saja nasihat. Dependabot memeriksa npm, Cargo, dan GitHub Actions setiap pekan.
