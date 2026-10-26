# Panduan penyebaran

Hak Cipta © 2026 Samuel Hasudungan Tampubolon. Lisensi MIT.

MetriKa adalah aplikasi statis: satu folder berisi HTML, JavaScript, gaya, dan dua berkas kecil.
Tidak ada peladen aplikasi, tidak ada basis data peladen, dan tidak ada permintaan jaringan saat
dipakai. Karena itu menyajikannya di mana pun cukup dengan menyajikan folder `docs/` hasil
pembangunan, dan tidak ada yang perlu dihubungkan ke layanan lain.

## Satu perintah pembangunan untuk semua tempat

```sh
pnpm install --frozen-lockfile
pnpm --filter @metrika/app run build      # menulis docs/
```

Berkas hasil codegen sudah ada di repositori dan diperiksa oleh CI, sehingga tidak perlu menjalankan
`pnpm codegen` pada tempat penyebaran. Jalur aset bersifat relatif, jadi folder itu dapat disajikan
dari akar domain maupun dari subfolder.

## Peta platform

| Platform                      | Berkas konfigurasi                                 | Header keamanan nyata | Biaya        |
| ----------------------------- | -------------------------------------------------- | --------------------- | ------------ |
| GitHub Pages (sudah berjalan) | `.github/workflows/pages.yml`                      | Tidak                 | Gratis       |
| Vercel                        | `vercel.json`                                      | Ya                    | Paket gratis |
| Netlify                       | `netlify.toml` dan `packages/app/public/_headers`  | Ya                    | Paket gratis |
| Cloudflare Pages              | `wrangler.toml` dan `packages/app/public/_headers` | Ya                    | Paket gratis |
| Firebase Hosting (Spark)      | `firebase.json`                                    | Ya                    | Paket Spark  |
| Hugging Face Spaces (statis)  | `deploy/huggingface/README.md`                     | Tidak                 | Gratis       |

Kolom "Header keamanan nyata" penting. Kebijakan keamanan isi yang diberikan melalui tag `<meta>`
tidak dapat memuat `frame-ancestors`, sehingga pada GitHub Pages dan Hugging Face halaman ini dapat
dibenamkan pada situs lain. Pada empat platform yang membaca berkas konfigurasi di atas, header
sungguhan dikirim dan pembenaman ditolak. Isi kebijakannya sama persis di semuanya, dan sebuah uji
(`packages/app/test/deploy.test.ts`) menjamin hal itu.

## Langkah per platform

### Vercel

1. Impor repositori pada vercel.com. Biarkan Framework Preset "Other".
2. Pengaturan pembangunan sudah dibaca dari `vercel.json`. Tekan Deploy.

### Netlify

1. Add new site, Import an existing project, pilih repositori.
2. Pengaturan dibaca dari `netlify.toml`. Header dibaca dari `_headers`.

### Cloudflare Pages

1. Workers & Pages, Create, Pages, Connect to Git, pilih repositori.
2. Build command: `pnpm install --frozen-lockfile && pnpm --filter @metrika/app run build`.
3. Build output directory: `docs`. Variabel lingkungan: `NODE_VERSION` = `22`.

Alternatif dari baris perintah: `pnpm --filter @metrika/app run build`, lalu
`npx wrangler pages deploy docs --project-name metrika`.

### Firebase Hosting (paket Spark)

1. `npm install -g firebase-tools`, lalu `firebase login`.
2. `firebase init hosting` dan pilih proyek Anda. Bila ditanya, jangan menimpa `firebase.json`.
3. `firebase deploy --only hosting`. Langkah `predeploy` membangun aplikasi lebih dulu.

### Hugging Face Spaces

Gunakan Space bertipe **Static**. Space ini tidak menjalankan kode apa pun; ia hanya menyajikan berkas.

1. Buat Space baru, SDK "Static", lisensi MIT.
2. Bangun aplikasi: `pnpm --filter @metrika/app run build`.
3. Salin isi `docs/` ke akar repositori Space, dan salin `deploy/huggingface/README.md` sebagai
   `README.md` di akar itu (berkas ini memuat metadata yang dibaca Hugging Face).
4. Komit dan dorong ke Space.

### Glitch

Tidak dimasukkan. Menurut yang saya ketahui, Glitch menghentikan layanan hosting proyeknya pada
pertengahan 2025, sehingga tidak ada tempat untuk menyebarkan. Periksa status terbaru pada situs
Glitch sebelum memutuskan; bila layanan itu kembali, folder `docs/` dapat disajikan di sana seperti
di tempat lain.

## Yang tidak disambungkan, dan mengapa

Supabase, Firestore pada Firebase, serta D1, R2, dan KV pada Cloudflare adalah tempat menyimpan
data di peladen. **Tidak satu pun disambungkan, dengan sengaja.** Menyambungkannya bukan sekadar
menambah berkas konfigurasi; itu mengubah apa yang dijanjikan aplikasi ini.

- **Kebijakan keamanan isi harus dilonggarkan.** Aplikasi memakai `connect-src 'self'` pada web dan
  `connect-src 'none'` pada desktop. Sambungan ke Supabase atau Firebase menuntut membuka asal
  tertentu, dan uji "nol permintaan ke asal lain" harus diubah.
- **Data pengguna meninggalkan perangkatnya.** README, SECURITY.md, dan dialog Tentang menyatakan
  bahwa seluruh data tinggal di perangkat pengguna. Penyimpanan di peladen membuat pernyataan itu
  tidak benar kecuali pengguna memilihnya sendiri.
- **Muncul akun, kunci, dan aturan akses.** Setiap layanan di atas memerlukan kredensial dan aturan
  siapa boleh membaca apa. Itu adalah permukaan serangan baru yang saat ini tidak ada, dan
  kesalahan satu aturan membuka data semua orang.
- **Tidak dapat diuji dari lingkungan pembangunan.** Layanan itu memerlukan akun dan kunci milik
  Anda, jadi sambungan apa pun yang saya tulis tidak dapat saya buktikan benar.

Pintu masuknya sudah disiapkan. Penyimpanan berada di balik satu antarmuka (`Storage` pada
`packages/app/src/storage/types.ts`) dengan tiga penyesuai. Penyesuai keempat, misalnya ke Supabase,
cukup mengimplementasikan antarmuka yang sama dan dipilih oleh pengguna, tidak dinyalakan secara
baku. Itu pekerjaan yang jelas bentuknya, tetapi keputusannya ada pada Anda: **apakah Anda
menghendaki penyimpanan peladen yang dipilih pengguna, dan layanan mana?** Katakan, dan pekerjaan
itu dimulai dengan menulis ulang janji pada README dan SECURITY.md terlebih dahulu.

## Berkas jalankan desktop

Berkas `.exe` portabel tidak disebarkan melalui platform di atas. Ia diunduh dari halaman rilis
GitHub. Pada Windows 10 yang lama, komponen WebView2 mungkin belum terpasang; Windows 11 dan
Windows 10 yang diperbarui sudah memilikinya. Bila belum, berkas jalankan menampilkan pesan dengan
tautan pemasangan resmi dari Microsoft. Pemasang (`..._x64-setup.exe`) tidak mengubah hal ini.
