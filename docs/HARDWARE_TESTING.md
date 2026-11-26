# Pengujian hardware dan bukti yang masih diperlukan

Status saat penyerahan: COM belum tersedia; tidak ada upload atau gerakan hardware yang diklaim. Firmware sudah compile dengan definisi pin pengguna dan sudut40/180. Password WiFi di secrets.h masih harus diisi langsung.

## Persiapan

- Hubungkan USB data, pastikan driver/COM muncul, wiring sesuai WIRING.md.
- ESP/laptop pada jaringan2,4GHz yang sama. URL firmware saat ini `https://192.168.1.25:8443/api/v1`; sesuaikan bila IP berubah dengan init_local.py.
- CA/token harus cocok. Jangan setInsecure. NTP harus berhasil.
- Lepas palang mekanik bila perlu saat pemeriksaan awal. Catu servo memadai dan common ground.

## Matriks manual

| TC | Cara uji | Expected | Status |
|---|---|---|---|
|01|Upload, tap kartu uji|UID terbaca; request terautentikasi|NOT RUN|
|02|Enable read/write, TEST_RW, tap Classic uji|WRITE_VERIFY_OK block4, tanpa menulis saldo|NOT RUN|
|03|REGISTER → tap → claim UI → daftar|Event DB dan display terbarui|NOT RUN fisik; software PASS|
|13/16|ENTRY lalu EXIT kartu bersaldo|Buka40°, tutup180° sesuai durasi; debit sekali|NOT RUN fisik; software PASS|
|23|Putus WiFi sebelum otorisasi|Tidak membuka, display offline setelah heartbeat basi|NOT RUN|
|24|Ganti mode saat scan sedang diproses|Versi usang ditolak, tidak buka|NOT RUN fisik; software PASS|
|25|Tap REGISTER/TOPUP|Servo tidak bergerak|NOT RUN fisik; respons software tanpa command PASS|
|27|Uji CA salah/host salah/jam tidak valid di ESP|TLS ditolak; tidak buka|NOT RUN ESP; client software PASS|
|28|Reboot setelah transaksi, command kadaluwarsa/duplikat|Boot180°, tidak membuka dari cache lama|NOT RUN fisik|
|NFR01|Minimal20 tap aktual reader→server|p95≤2 detik pada LAN|NOT RUN end-to-end; software p95 tersedia|
|NFR02|Ukur scan→display|Hasil tampil≤2 detik|NOT RUN fisik; polling UI live PASS|

Untuk setiap uji catat expected, actual, PASS/FAIL, waktu WIB, board/reader/kartu, versi source, nama bukti foto/video/serial. Jangan merekam secrets.h, password, token, key CA atau kredensial phpMyAdmin.

Jika respons hilang setelah commit, cek request yang sama/riwayat admin, jangan membuat debit baru atau bypass palang. Kartu diblokir yang masih punya sesi aktif harus diperiksa admin dan dibuka blokir melalui prosedur normal bila sah; tidak ada edit saldo bebas.

Definition of Done lengkap baru dapat dicentang setelah matriks hardware ini dan bukti tim/PPT/video selesai. Temuan gagal harus dicatat, bukan ditandai lulus berdasarkan source code saja.
