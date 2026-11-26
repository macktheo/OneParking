# Verifikasi struktur UI

Tanggal pemeriksaan: 26 November 2026 (WIB). Seluruh hasil di bawah berasal dari lingkungan lokal, bukan hasil CI GitHub.

| Pemeriksaan           | Hasil                                                                             |
| --------------------- | --------------------------------------------------------------------------------- |
| Vite production build | PASS                                                                              |
| npm audit             | PASS — 0 kerentanan dilaporkan saat instalasi/update lockfile                     |
| Vue runtime           | PASS — tidak ada pageerror pada alur pemeriksaan                                  |
| Login demo            | PASS — redirect route terlindungi, gagal, sukses, kembali ke route tujuan, logout |
| Route                 | PASS — login + 9 halaman admin + display + 403 + 404                              |
| Kartu                 | PASS — tambah, pencarian, modal batal/Escape/konfirmasi blokir dan aktifkan       |
| Pemilik               | PASS — edit identitas dan pembaruan daftar                                        |
| Top-up                | PASS — tinjau/konfirmasi sekali, saldo contoh dan riwayat berubah                 |
| Transaksi             | PASS — riwayat top-up dan filter tanggal kosong/reset                             |
| Sesi parkir           | PASS — filter aktif/selesai                                                       |
| Perangkat/pengaturan  | PASS — mode dan nilai pengaturan contoh tersimpan dalam RAM                       |
| Audit                 | PASS — halaman dan filter penolakan                                               |
| State admin           | PASS — loading, kosong, gagal, offline, kembali normal                            |
| Display               | PASS — seluruh 12 skenario, saldo/biaya relevan dan auto-clear 5 detik            |
| Privasi display       | PASS — konten display tidak berisi UID/NIM/nama fixture lengkap                   |
| Desktop/HP            | PASS — screenshot 1440px dan 390px, tidak ada overflow halaman admin/display      |
| Navigasi browser      | PASS — back/forward serta route langsung                                          |
| Reload                | PASS — data contoh dan sesi kembali ke awal                                       |
| Isolasi               | PASS — tidak ada request `/api/` atau backend port8000 pada alur pemeriksaan      |

Pemeriksaan browser menggunakan Playwright Core dengan Edge headless. Suite pemeriksaan ini dijalankan lokal dan bukan dependency/test runner yang dipasang pada proyek.

## Screenshot acuan

- [Login](screenshots/login.png)
- [Dashboard](screenshots/dashboard.png)
- [Kartu](screenshots/cards.png)
- [Digital Gate Display](screenshots/display.png)
- [Admin pada HP](screenshots/mobile-admin.png)
- [Display pada HP](screenshots/mobile-display.png)

Screenshot mencerminkan data/skenario contoh ketika alur review dijalankan, bukan isi database atau bukti transaksi nyata.

## Belum dibuktikan oleh UI ini

Autentikasi/otorisasi server, CSRF, database, ledger server, idempotensi pembayaran, keamanan token, integrasi RFID/servo, validasi TLS ESP, polling realtime, sinkronisasi antartab, deployment produksi serta keselamatan palang fisik. Fullscreen mempunyai tombol dan penanganan kegagalan browser; penggunaan fullscreen interaktif perlu dicek pada browser/perangkat demo aktual.

Untuk review manual berikutnya, jalankan perintah README dan ikuti alur pada UI_SITEMAP. Saat deployment statis, uji fallback history route ke index.html.
