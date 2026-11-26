# Wiring final — mengikuti firmware pengguna

Basis pin: `D:/CampusPay_Firmware.ino`, dengan koreksi kalibrasi yang dikonfirmasi pengguna: buka40°, tutup180°. Reader diasumsikan RC522 SPI; gunakan kartu uji kompatibel milik sendiri.

| RC522 | NodeMCU | GPIO |
|---|---|---:|
| SDA / SS | D2 | 4 |
| RST | D3 | 0 |
| SCK | D5 | 14 |
| MOSI | D7 | 13 |
| MISO | D6 | 12 |
| VCC | 3V3 | — |
| GND | GND | — |
| IRQ | Tidak disambung | — |

SDA pada RC522 di sini adalah **SPI chip-select**, bukan I2C. **RST sekarang D3, bukan D0 pada rancangan PRD awal.** D3/GPIO0 adalah pin boot strap; jangan ditahan LOW ketika board boot. Bila upload gagal, coba upload dengan periferal dilepas terlebih dahulu.

| Servo | Sambungan |
|---|---|
| Signal (warna aktual perlu dicocokkan) | D1 / GPIO5 |
| VCC | Catu eksternal sesuai datasheet servo, umumnya5V |
| GND | Negatif catu eksternal |
| Negatif catu eksternal | GND NodeMCU dan GND RC522 |

```text
Laptop USB ─── NodeMCU
                 3V3 ─── RC522 VCC
                  D2 ─── RC522 SDA/SS
                  D3 ─── RC522 RST
                  D5 ─── RC522 SCK
                  D7 ─── RC522 MOSI
                  D6 ─── RC522 MISO
                  D1 ─── Servo SIGNAL
                 GND ─┬─ RC522 GND
Catu servo (+) ────────┼──────── Servo VCC
Catu servo (−) ────────┴──────── Servo GND
```

RC522 tidak diberi5V. Servo tidak mengambil daya dari3V3. Saat NodeMCU memakai USB, satukan ground dengan catu servo; jangan paralelkan jalur positif catu dengan USB/VIN tanpa rancangan daya yang tepat.

## Urutan uji

1. Putus semua daya sebelum memasang jumper. Cek polaritas dan kecukupan arus catu servo.
2. Upload sketch setelah COM tersedia; bila perlu lakukan tanpa periferal dahulu.
3. Nyalakan rangkaian miniatur. Boot memberi CLOSED_COMMANDED180°. Jangan menganggap laporan ini sebagai posisi fisik sensor.
4. Pastikan Serial115200 menunjukkan reader VersionReg dan WiFi/NTP/HTTPS siap. `secrets.h` harus berisi password WiFi sebenarnya, IP/CA/token yang cocok.
5. REGISTER dan TOPUP tidak bergerak. ENTRY/EXIT sukses memberi OPEN_COMMANDED40° lalu kembali180° setelah durasi server, default3 detik.
6. Kartu harus dilepas minimal700ms sebelum tap baru. Saat request belum diketahui hasilnya, firmware mempertahankan ID/payload semula dan tidak membuka berdasarkan cache lama.
7. Uji WiFi putus, sertifikat salah, command kedaluwarsa dan reboot sesuai `docs/HARDWARE_TESTING.md`.

## Read/write nonfinansial

Hanya pada kartu MIFARE Classic1K/4K uji dengan key default yang diketahui. Aktifkan `ENABLE_CARD_WRITE_TEST=true` dalam `secrets.h`, build/upload ulang, kirim **TEST_RW** dengan newline pada Serial Monitor, lalu tap dalam5 detik.

Firmware memeriksa tipe, autentikasi sector1, menulis **16 byte `CAMPUSPAY_TEST01` pada block4**, membaca balik dan membandingkan. Target bukti `WRITE_VERIFY_OK`. Block0/manufacturer dan sector trailer/key/access bits tidak ditulis. Uji ini menimpa block4; jangan memakai kartu bank, akses produksi, transportasi atau kartu yang format/pemiliknya tidak diketahui. Kembalikan flag ke false setelah uji.

## Troubleshooting

| Gejala | Pemeriksaan |
|---|---|
| COM tidak muncul | USB data, driver CH340/CP210x, Device Manager; port belum tersedia saat implementasi |
| Boot/upload gagal | GPIO0/D3 tidak boleh tertahan LOW; lepas RC522/periferal, cek kabel dan mode boot |
| Reader tidak siap | VCC3,3V, common GND, urutan SPI, RST D3; kartu13,56MHz kompatibel |
| Restart saat servo bergerak | Catu terpisah yang cukup arus, common ground, konektor/tegangan |
| HTTPS gagal | IP server aktual, port8443, CA lengkap, jam NTP, firewall private, jaringan2,4GHz |
| STALE_MODE | Tunggu config/heartbeat tersinkron, lepas dan tap lagi |
| Expired command | Tidak membuka; periksa riwayat/reconcile, jangan membuat debit baru |

Tanpa sensor lintasan/halangan/posisi, sistem hanya untuk miniatur dan tidak memenuhi kebutuhan keselamatan palang kendaraan nyata.
