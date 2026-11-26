> Pembaruan terbaru: registrasi **UID kartu saja**, tanpa nama/NIM/nomor kendaraan. Ikuti `docs/REGISTRASI_UID.md`; firmware sekarang memiliki log WiFi/NTP/HTTP/TLS/UID dan perintah Serial `STATUS`.

# Status implementasi terkini

Seluruh lapisan software MVP terintegrasi dalam backend Laravel dengan UI desain branch UI/UX. UI operasional bukan `admin-web` prototype lama dan bukan JavaScript dummy pada `ui-reference`.

Tersedia: admin session/CSRF/role/throttle, pemilik/kartu/claim, top-up, ENTRY/EXIT/snapshot, ledger atomik dan immutable, generated active guard, audit, pengaturan, perangkat/version/auth/heartbeat/ACK, rekonsiliasi, dashboard/grafik, riwayat penolakan/filter/pagination/CSV, display polling tersanitasi, MySQL8.4.7, phpMyAdmin, HTTPS/CA lokal, firmware .ino pin4/0/5 dan sudut40/180, setup/QA/wiring.

32 test/169 assertion lulus di dua engine,17 pemeriksaan API/TLS/paralel dan alur browser live lulus. Firmware compile PASS. Database aplikasi tetap terpisah dari database QA. Tidak ada upload/gerak hardware yang diklaim.

Masih dibutuhkan: port COM/board, password WiFi sebenarnya pada secrets.h, kartu uji kompatibel, pengujian read/write, servo, outage WiFi, TLS gagal ESP dan reboot. Model servo/reader aktual tetap perlu dicatat pada bukti. Setelah itu lengkapi PPT/video dan bukti tim sesuai PRD; penyerahan LMS dilakukan anggota tim.

Batas prototipe: satu reader, lock settings menserialisasi mutasi, maksimal500 sesi/log pada layar, ledger/history25 per halaman, tanpa sensor fisik, UID dapat dikloning, saldo simulasi, tanpa pembayaran offline/payment gateway/portal mahasiswa. phpMyAdmin hanya loopback; pengguna yang memegang kredensial DB adalah operator tepercaya, bukan jalur transaksi harian.
