## Fitur lengkap pada branch ALLFeatureOneParking

- Registrasi UID melalui popup tap RFID, tanpa nama, NIM, atau nomor kendaraan.
- Top-up otomatis setelah memilih nominal, dengan penolakan UID asing/kartu diblokir dan pemulihan retry tanpa kredit ganda.
- Mode AUTO masuk/keluar untuk satu reader, pilihan ENTRY/EXIT manual, serta pemulihan mode setelah popup ditutup.
- Hapus kartu dengan konfirmasi; sesi aktif dilindungi dan saldo/riwayat tetap tersimpan untuk registrasi ulang.
- Backend Docker Apache/PHP dengan OPcache, MySQL, phpMyAdmin, HTTPS terverifikasi, ledger, audit, dan perlindungan request ganda.
- Firmware Arduino `.ino` v1.2 dengan log Serial Monitor dan panduan wiring.

Dokumen Word: [Teknologi dan pengamanan OneParking](docs/OneParking_Teknologi_dan_Pengamanan.docx).
Panduan operasi terbaru: [registrasi](docs/REGISTRASI_UID.md), [top-up](docs/TOPUP_TAP.md), [hapus kartu](docs/HAPUS_KARTU.md), [runtime Docker dan mode AUTO](docs/OPTIMASI_RUNTIME.md).

Validasi terakhir sebelum publikasi: 37 test backend dengan 212 assertion, 17 pemeriksaan API/TLS/transaksi paralel, alur browser pada image Docker, dan kompilasi firmware lulus. Uji perangkat fisik dilakukan terpisah.

Konfigurasi privat, database operasional, sertifikat/kunci lokal, dependency instalasi dan cache runtime tidak disertakan. Jalankan setup untuk membuat konfigurasi lokal sendiri; gunakan `secrets.example.h` sebagai acuan firmware.

> Runtime terbaru: backend Apache/PHP di Docker + OPcache. Gunakan mode AUTO untuk satu reader masuk/keluar. Lihat [panduan optimasi dan rebuild](docs/OPTIMASI_RUNTIME.md).

> Pembaruan terbaru: registrasi **UID kartu saja**, tanpa nama/NIM/nomor kendaraan. Ikuti `docs/REGISTRASI_UID.md`; firmware sekarang memiliki log WiFi/NTP/HTTP/TLS/UID dan perintah Serial `STATUS`.

# OneParking / CampusPay — MVP terintegrasi

Proyek aktif di `D:\OneParking`. Website menggunakan desain **branch `UI/UX`, commit `6863b33`**, dari folder `campuspay-ui`. Desain CampusPay ungu, logo, sidebar, login dan grafik dipertahankan; aksi dummy diganti dengan Vue + Laravel API dan data MySQL. Source acuan disimpan di `ui-reference/campuspay-ui`, tidak dijalankan sebagai aplikasi utama.

## Buka aplikasi

| Layanan | Alamat |
|---|---|
| Web admin lokal | https://127.0.0.1:8443/login |
| Web admin di LAN saat setup ini | https://192.168.1.25:8443/login |
| Digital Gate Display | https://127.0.0.1:8443/display |
| phpMyAdmin, hanya laptop ini | http://127.0.0.1:8086 |
| MySQL 8.4.7, hanya loopback | 127.0.0.1:13307 |

IP LAN bisa berubah. Jalankan `python scripts/init_local.py` untuk memperbarui sertifikat dan URL firmware sesuai IP sekarang, lalu restart layanan HTTPS dan build/upload firmware lagi. Script mempertahankan WiFi/password yang sudah ada pada `secrets.h` dan CA lokal yang sudah dibuat.

## Login admin

Email awal: `admin@oneparking.test`. Password awal privat berada dalam `backend/.env`; tidak ditampilkan di README atau log. Untuk memilih password sendiri:

```powershell
cd D:\OneParking\backend
php artisan parking:admin-password
```

Command meminta password secara tersembunyi dan mencabut sesi lama. Minimal 12 karakter. Akun `viewer@oneparking.test` hanya untuk uji penolakan role, bukan portal mahasiswa; password privatnya ada pada `backend/.env`.

## HTTPS browser

ESP sudah memakai CA lokal di `firmware/OneParking/secrets.h`. Agar browser Windows juga mempercayai sertifikat, impor **sertifikat publik CA lokal milik proyek ini** ke akun Windows Anda:

```powershell
certutil -user -addstore Root D:\OneParking\infra\certs\root-ca.pem
```

Ini langkah manual yang mengubah trust store akun Windows. Periksa bahwa file berasal dari proyek lokal ini. Jangan membagikan `root-ca-key.pem` atau `server-key.pem`. Client pengujian API memverifikasi CA/hostname secara eksplisit; tidak memakai `setInsecure` atau menonaktifkan verifikasi TLS.

## Start / setup

Prasyarat: PHP8.2+, Composer, Node22+, Python3.11+, Docker Desktop aktif. Komponen tersedia pada laptop saat implementasi.

```powershell
cd D:\OneParking
powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1
```

Untuk reproduksi dependency, konfigurasi privat, migration, seed dan frontend build:

```powershell
cd D:\OneParking
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1 -ResetAdminPassword
```

Setup memakai Docker project **oneparking**, MySQL port13307 dan phpMyAdmin8086, tidak memakai port3307 proyek lain. Data MySQL berada dalam volume Docker; jangan menjalankan `down -v` jika ingin menyimpan data.

Untuk phpMyAdmin, login sebagai **oneparking**, gunakan nilai `MYSQL_PASSWORD` dari `infra/.env` lokal. Database aplikasi adalah **oneparking**. Database `oneparking_test` dan `oneparking_http_test` khusus QA. Jangan mengedit saldo, ledger atau sesi secara manual; UI admin dan layanan transaksi adalah jalur operasional.

## Firmware dan pin final

Buka `firmware/OneParking/OneParking.ino` pada Arduino IDE. Board **NodeMCU 1.0 (ESP-12E Module)**, core ESP8266 **3.1.0**, library **MFRC5221.4.12**, **ArduinoJson7.0.4**; Servo/SPI/WiFi dari core ESP8266.

| Fungsi | GPIO | NodeMCU |
|---|---:|---|
| RC522 SS/SDA | 4 | D2 |
| RC522 RST | 0 | D3 |
| RC522 SCK | 14 | D5 |
| RC522 MOSI | 13 | D7 |
| RC522 MISO | 12 | D6 |
| Servo signal | 5 | D1 |

Servo **OPEN40° / CLOSED180°**, sesuai konfirmasi mekanik pengguna. RC5223,3V; servo memakai catu sesuai spesifikasi dan ground bersama. Baca `docs/WIRING.md` sebelum memasang daya.

File privat **`firmware/OneParking/secrets.h`** sudah dibuat dengan token yang cocok dengan server, URL LAN dan CA valid. **Password WiFi kiriman masih placeholder: isi langsung pada file ini sebelum upload.** Jangan mengirim nilainya melalui chat atau commit. `secrets.example.h` adalah template tanpa rahasia.

```powershell
arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 D:\OneParking\firmware\OneParking
arduino-cli board list
# Ganti COM5 setelah port tersedia:
arduino-cli upload --fqbn esp8266:esp8266:nodemcuv2 --port COM5 D:\OneParking\firmware\OneParking
arduino-cli monitor --port COM5 --config baudrate=115200
```

Untuk akses ESP di WiFi2,4GHz/LAN yang sama, pastikan IP laptop benar. Jika firewall memblokir, jalankan `scripts/allow-lan.ps1` pada PowerShell Administrator; rule hanya mengizinkan HTTPS8443 untuk subnet lokal pada profil Private. MySQL/phpMyAdmin tetap tidak dibuka ke LAN.

## Uji fitur tanpa hardware

Website ini sudah terhubung database, tidak memakai data dummy. Untuk mengetes alur dengan scan software:

1. Login admin, buka Kartu RFID → Registrasi Kartu → pilih REGISTER.
2. Dari root proyek jalankan `python scripts/simulate_scan.py 0012ABCD`.
3. Ambil scan terbaru di UI, isi/ pilih pemilik, konfirmasi registrasi. Saldo awal Rp0.
4. Top-up Saldo → pilih TOPUP, jalankan simulator UID yang sama lagi, ambil scan terbaru, tinjau Rp20.000 dan konfirmasi.
5. Perangkat → pilih ENTRY, jalankan simulator. Backend membuat sesi dan otorisasi command, tetapi simulator tidak menggerakkan servo.
6. Pilih EXIT dan scan software lagi. Saldo menjadi Rp18.000 untuk tarif default2.000; sesi selesai dan debit tepat sekali.
7. Lihat Transaksi, Audit Keamanan, display dan phpMyAdmin. Uji kartu asing, blokir, saldo kurang, ubah tarif setelah ENTRY, serta retry.

Mode tidak berubah otomatis setelah tap. Claim scan berlaku60 detik, terikat user dan sesi login, sekali konsumsi. REGISTER/TOPUP tidak membuka palang. Gagal/timeout tidak dianggap pembayaran sukses; rekonsiliasi memakai ID request yang sama.

## Pengujian otomatis

```powershell
cd D:\OneParking
python -X utf8 scripts/qa/run_all.py
```

Runner memakai database QA terpisah, menjalankan test backend, request paralel MySQL, validasi TLS, API dan browser. `migrate:fresh` hanya dijalankan terhadap **oneparking_http_test**; tidak mereset database aplikasi. Browser test memakai Edge headless yang terpasang. Hasil/pengaturan QA privat ada di `work/qa`, screenshot di `docs/evidence`.

```powershell
cd D:\OneParking\backend
php artisan test --compact                 # SQLite in-memory, cepat
powershell -ExecutionPolicy Bypass -File ..\scripts\test-mysql.ps1
php artisan parking:reconcile              # DB aplikasi: saldo vs ledger
npm.cmd run build
```

## Struktur utama

```text
backend/           Laravel12 + Vue3 + Tailwind4; aplikasi terintegrasi
  resources/js/    pages, components, layouts, router, stores, services
  app/             domain transaksi, auth/perangkat, controller dan command
  database/        migration, constraint, generated active guard, seeder
firmware/OneParking/  sketch .ino dan secrets.h lokal
infra/             Docker MySQL/phpMyAdmin, CA/server TLS privat
scripts/           setup/start/simulator/QA
docs/              wiring, kontrak API, hasil dan traceability PRD
ui-reference/      source desain UI/UX yang diambil dari GitHub
admin-web/         prototype frontend lama; bukan aplikasi operasional
```

## Hasil dan batas verifikasi

32 test/169 assertion lulus di SQLite dan MySQL8.4.7. Sebanyak17 pemeriksaan API/TLS/parallel serta alur UI live lulus. Firmware berhasil dikompilasi. Tidak ada debit/kredit ganda pada10 request paralel dan retry yang diuji. Lihat `docs/TESTING.md` untuk rincian dan `docs/PRD_TRACEABILITY.md` untuk pemetaan requirement.

**Port COM belum tersedia**, sehingga upload, pembacaan/penulisan kartu fisik, gerak servo, putus WiFi ESP, TLS gagal di ESP dan reboot fisik belum diuji. Definition of Done hardware/evidence video/PPT/LMS tidak dinyatakan selesai. Prototype untuk kartu uji dan saldo simulasi; UID bukan autentikasi kriptografis.
