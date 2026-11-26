# Hasil pengujian aktual — 26 November 2026 WIB

| Pemeriksaan | Hasil |
|---|---|
| Test backend SQLite in-memory | PASS —30 test/155 assertion |
| Test backend MySQL8.4.7/InnoDB | PASS —30 test/155 assertion |
| API/TLS/parallel suite | PASS —17 pemeriksaan |
| Browser UI live desain UI/UX | PASS —login,9 halaman admin, pemilik/kartu, top-up, filter, mode, display, HP, logout |
| Paralel top-up |10 process/koneksi MySQL bersamaan +retry →1 kredit |
| Paralel ENTRY |10 request identik →1 sesi dan1 command |
| Paralel EXIT |10 request bersamaan +10 retry →1 debit; snapshot tarif tetap |
| Rollback |PASS —fault injection setelah INSERT sebelum COMMIT; saldo/ledger/sesi rollback |
| Isolasi scan claim |PASS —user berbeda dan sesi berbeda untuk admin sama ditolak |
| HTTPS |PASS —CA/hostname valid diterima; CA/hostname salah ditolak oleh client software |
| Privasi display |PASS —tanpa UID/NIM/nama lengkap/token; auto-clear5 detik |
| Ledger |PASS —CHECK/unique/generated guard; UPDATE/DELETE ditolak; rekonsiliasi sesuai |
| phpMyAdmin |PASS —interface tersedia dan login user database OneParking berhasil |
| Build frontend |PASS |
| Firmware Arduino .ino |PASS —RAM32384/80192(40%), flash389664/1048576(37%) |
| npm/composer advisories |PASS —npm0; composer tanpa advisories/abandoned packages |
| Hardware aktual |NOT RUN —COM belum tersedia |

## Latensi terukur

20 sampel scan HTTPS software terhadap runtime lokal dan MySQL: **p95=235.0ms, mean=221.1ms**. Ini bukan latensi RFID fisik atau hasil WiFi ESP. Target end-to-end reader tetap memerlukan pengukuran hardware.

## Reproduksi

```powershell
cd D:\OneParking
python -X utf8 scripts/qa/run_all.py
```

Runner mereset hanya database `oneparking_http_test`, memakai `oneparking_test` untuk test backend, dan menutup runtime QA setelah selesai. Database aplikasi `oneparking` tidak direset. Hasil JSON/log dan kredensial QA privat di `work/qa`. Test browser memakai Edge headless; koneksi browser review di-pin ke SPKI sertifikat lokal, sedangkan API suite memverifikasi chain CA+hostname secara normal dan menguji penolakan sertifikat salah. Trust store Windows tidak diubah otomatis.

Source pengujian: `backend/tests/Feature/ParkingTest.php`, `PrdIntegrationTest.php`, `backend/tests/Browser/live-prd.cjs`, `scripts/qa/test_api.py`, dan worker paralel yang menolak database tanpa suffix `_test`.

Screenshot UI live berada di `docs/evidence`. Screenshot memakai database QA, bukan data operasional. Bukti phpMyAdmin tersedia pada output penyerahan; login user oneparking dan struktur tabel database aplikasi telah diperiksa. Tidak ada bukti fisik yang direkayasa.

## Batas hasil

TC20 menguji endpoint rekonsiliasi dan replay hasil committed tanpa debit kedua; pemutusan WiFi/response-loss pada ESP aktual tetap harus diuji. TC27 client software lulus, tetapi verifikasi kegagalan TLS pada board belum dilaksanakan. TC28 logika expiry/ACK diuji di server dan firmware dikompilasi; reboot fisik belum diuji. Lihat HARDWARE_TESTING.md.

## Catatan uji display

Rangkaian uji final membuka display sebelum event scan, seperti penggunaan sebenarnya. Total waktu sejak mulai request scan hingga heading sukses terlihat pada satu pengukuran lokal sekitar2086ms; ini mencakup waktu request/commit, bukan pengukuran terpisah sejak event server. Polling admin telah digabung menjadi satu endpoint live agar antrean request lebih kecil. Target p95 reader→display pada hardware aktual tetap belum dinyatakan lulus.
