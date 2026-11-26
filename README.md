# OneParking — Acuan UI Admin

Frontend sederhana untuk sistem parkir kampus CampusPay. Repositori ini menjadi acuan tampilan dan struktur kerja UI untuk tim.

**Status:** pratinjau frontend dengan data contoh. Belum terhubung ke backend, database, RFID, atau servo. Perubahan data hanya berlaku dalam memori browser dan kembali ke awal saat reload.

## Menjalankan proyek

Prasyarat: Git dan Node.js yang didukung Vite 6 (Node 22 LTS atau lebih baru disarankan).

```bash
git clone https://github.com/macktheo/OneParking.git
cd OneParking
git switch codex/admin-ui-reference
cd admin-web
npm ci
npm run dev
```

Di Windows PowerShell, gunakan `npm.cmd` jika `npm.ps1` diblokir. Buka alamat lokal yang ditampilkan Vite, biasanya http://127.0.0.1:5173. Tidak perlu menjalankan Laravel atau database.

```bash
npm run build
npm run preview
```

## Struktur

```text
OneParking/
├── README.md
├── docs/
│   └── UI_HANDOFF.md       # peta UI dan panduan melanjutkan pekerjaan
└── admin-web/
    ├── README.md
    ├── package.json
    ├── package-lock.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.js        # entry Vue
        ├── App.vue        # halaman, navigasi, form dan interaksi contoh
        ├── style.css      # layout responsif dan tampilan
        └── data.js        # kartu, transaksi dan sesi contoh
```

## Halaman yang tersedia

| Halaman         | Isi                                                      |
| --------------- | -------------------------------------------------------- |
| Ringkasan       | Statistik, aktivitas terbaru, mode reader                |
| Kartu & pemilik | Cari/filter, tambah kartu contoh, blokir/aktifkan        |
| Top-up saldo    | Pemilihan kartu, nominal, tinjau dan konfirmasi simulasi |
| Sesi parkir     | Daftar sesi aktif/selesai dan filter                     |
| Transaksi       | Saldo sebelum/sesudah serta pencarian/filter jenis       |
| Perangkat       | Data perangkat contoh dan pemilihan mode reader          |
| Pengaturan      | Tarif, batas top-up dan durasi buka contoh               |

Mulai dari [panduan handoff UI](docs/UI_HANDOFF.md) untuk melanjutkan pekerjaan. Semua perubahan di tahap ini berfokus pada frontend.

## Verifikasi acuan

- Production build berhasil.
- Interaksi utama telah diperiksa di browser: navigasi, pencarian/filter, tambah/blokir kartu, tinjau/konfirmasi top-up, riwayat transaksi, mode dan pengaturan.
- Tampilan desktop dan HP diperiksa, termasuk overflow halaman.
- Tidak ada request API/backend dari UI ini.

Pengujian di atas adalah pemeriksaan lokal pada versi acuan, bukan CI otomatis. Login admin, integrasi transaksi nyata dan pengujian hardware belum termasuk dalam frontend ini.
