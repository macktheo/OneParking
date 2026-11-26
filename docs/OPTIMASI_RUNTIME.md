# Optimasi runtime dan mode parkir OneParking

Backend aktif sekarang berjalan sebagai Apache/PHP di Docker (8 worker maksimum, OPcache, cache konfigurasi/routes/views). Source dan vendor disalin ke image agar request tidak membaca ribuan file dari bind mount Windows. Database tetap memakai volume MySQL yang sama. MySQL memakai buffer pool 256 MB, maksimum 80 koneksi, batas RAM 1 GB; app 512 MB; phpMyAdmin 256 MB. Ketahanan transaksi/ledger tidak dikurangi.

## Hasil ukur

16 request HTTPS terverifikasi CA ke `/api/v1/device/config`, 4 request bersamaan:

| Runtime | Berhasil | Median | Maksimum |
|---|---:|---:|---:|
| PHP development server Windows | 16/16 | 763,15 ms | 1097,3 ms |
| Apache/PHP Docker | 16/16 | 40,85 ms | 57,8 ms |

Ini waktu API lokal, bukan pengukuran penuh tap RFID/gerak servo melalui WiFi. Benchmark tidak membuat scan atau menggerakkan palang. Jalankan ulang: `python scripts/qa/benchmark_runtime.py`.

Popup registrasi/top-up sekarang memakai endpoint reader-state yang lebih ringan dan menghentikan polling dashboard yang berulang selama popup aktif. Dashboard diperbarui setelah penyimpanan.

## Masuk dan keluar

Pada menu Perangkat, pilih **AUTO — Masuk / keluar otomatis**. Perangkat sudah diatur AUTO saat perubahan ini diterapkan. Tunggu mode AUTO tersinkron pada Serial Monitor.

- Kartu terdaftar tanpa sesi aktif: tap untuk MASUK.
- Kartu dengan sesi aktif: lepas dan tap lagi untuk KELUAR; saldo harus mencukupi tarif sesi.
- Kartu asing/diblokir tetap ditolak. Retry request yang sama tidak membuat sesi atau potongan saldo ganda.
- REGISTER dan TOPUP hanya sementara. Tutup popup setelah selesai/batal untuk kembali ke mode parkir sebelumnya (AUTO/ENTRY/EXIT). Jika mode sebelumnya belum mode parkir, kembali ke AUTO.
- Pemulihan mode memakai expected_version agar pilihan operator pada tab lain tidak tertimpa.

Mode ENTRY dan EXIT manual tetap tersedia untuk gerbang terpisah. AUTO ditujukan untuk satu reader uji: setiap tap baru bisa berganti masuk/keluar sesuai sesi di server.

## Firmware v1.2

`D:\OneParking\firmware\OneParking\OneParking.ino` sudah diperbarui dan dikompilasi. Upload ulang melalui Arduino IDE untuk memakai optimasi ESP: heartbeat 2 detik, config cadangan 10 detik, TLS session reuse, scan pertama langsung POST (rekonsiliasi GET hanya untuk retry), dan prioritas scan dibanding polling periodik. Pin tetap D2 SS, D3 RST, D1 servo; buka 40°, tutup 180°. Server AUTO juga kompatibel dengan firmware sebelumnya.

Serial Monitor 115200 baud. Jangan menonaktifkan pemeriksaan CA/TLS. Posisi fisik palang tetap belum memiliki sensor verifikasi.

## Menjalankan dan memperbarui kode

Dashboard: https://127.0.0.1:8443/login
phpMyAdmin: http://127.0.0.1:8086

Jalankan `powershell -ExecutionPolicy Bypass -File D:\OneParking\scripts\start.ps1`. HTTPS lokal tetap ditangani proxy Python; app/MySQL/phpMyAdmin di Docker. Layanan sudah dinyalakan di background untuk sesi ini.

Setelah mengubah kode backend/frontend, bangun ulang image karena source tidak memakai bind mount:

```powershell
cd D:\OneParking\backend
npm.cmd run build
cd D:\OneParking
docker compose --project-name oneparking --env-file infra/.env -f infra/compose.yaml build app
docker compose --project-name oneparking --env-file infra/.env -f infra/compose.yaml up -d --wait
```

Refresh browser Ctrl+F5. Data MySQL tidak memerlukan reset.

Uji image Docker dengan database QA terpisah: `python scripts/qa/run_docker_checks.py` (membuat ulang database QA saja; tidak menghapus database operasional).

## Validasi

34 test backend / 181 assertion lulus di SQLite dan MySQL; 17 pemeriksaan API/TLS/paralel lulus memakai image Docker; uji browser registrasi/top-up otomatis, UID asing, pemulihan respons terputus tanpa kredit ganda, pemulihan mode, ENTRY/EXIT, display dan mobile juga lulus. Firmware v1.2 berhasil dikompilasi. Upload dan uji gerak mekanik firmware baru tetap perlu dilakukan pada perangkat pengguna.
