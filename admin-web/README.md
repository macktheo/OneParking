> Prototype UI lama. Untuk aplikasi PRD terintegrasi, jalankan scripts/start.ps1 dari root dan buka HTTPS8443. UI terbaru mengikuti branch UI/UX di backend/resources.

# OneParking — Admin web sederhana

Frontend mandiri untuk mengerjakan UI admin. Tidak memerlukan Laravel, PHP, login server, database, migration atau ESP.

```powershell
cd D:\OneParking\admin-web
npm.cmd ci
npm.cmd run dev
```

Buka URL lokal yang ditampilkan Vite, biasanya `http://127.0.0.1:5173`.

## Halaman

- Ringkasan: statistik, aktivitas terbaru, mode reader.
- Kartu & pemilik: cari/filter, tambah kartu contoh, blokir/aktifkan.
- Top-up: pilih kartu, nominal, tinjau dan konfirmasi simulasi.
- Sesi parkir: daftar sesi aktif/selesai dan filter status.
- Transaksi: riwayat beserta saldo sebelum/sesudah, cari/filter jenis.
- Perangkat: tampilan perangkat dan pilihan mode contoh.
- Pengaturan: tarif, batas top-up, durasi buka untuk simulasi.

Semua data ada di memori browser dan kembali ke awal saat reload. Tidak ada fetch, API request, localStorage, autentikasi nyata, atau kendali hardware. Label pratinjau menjelaskan bahwa semua data contoh. Backend/database yang sudah ada tetap terpisah.

## File yang dikerjakan

| File | Kegunaan |
|---|---|
| `src/App.vue` | Halaman, form, navigasi, dan interaksi contoh |
| `src/style.css` | Tampilan sederhana, layout laptop dan HP |
| `src/data.js` | Data kartu, sesi dan transaksi contoh |
| `src/main.js` | Entry Vue |

Untuk mengubah isi data, edit `src/data.js`. Untuk mengubah warna/jarak/layout, edit `src/style.css`. Untuk mengubah form dan halaman, edit `src/App.vue`.

```powershell
npm.cmd run build
npm.cmd run preview
```

Folder `dist/` dihasilkan oleh build dan bisa disajikan sebagai website statis. Tidak perlu menjalankan perintah artisan, mengisi backend/.env, atau menyalakan database untuk mengerjakan UI ini.
