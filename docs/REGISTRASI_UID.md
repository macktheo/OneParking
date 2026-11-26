# Registrasi UID saja + diagnosis ESP Offline

Perubahan sesuai permintaan: registrasi hanya UID kartu, tanpa nama, NIM atau nomor kendaraan. Menu pemilik tidak dipakai. Identitas pada kartu, sesi parkir dan transaksi memakai UID; data pemilik lama tidak dihapus.

## Setelah kode .ino diperbarui

1. Tutup/buka ulang `D:\OneParking\firmware\OneParking\OneParking.ino` agar Arduino IDE memuat perubahan dari disk.
2. Pastikan `secrets.h` berisi WiFi2,4GHz, URL server LAN, token dan CA yang benar. Nilai rahasia tidak diubah oleh pembaruan ini.
3. Upload ulang ke port ESP yang tersedia (terakhir COM3).
4. Buka Serial Monitor **115200 baud**, lalu tekan RST pada board. Boot ROM mungkin mencetak karakter pada baud lain sebelum banner aplikasi115200; baca log setelah banner CampusPay.
5. Untuk ringkasan kapan pun, kirim **STATUS** dan pilih line ending **Newline**. `HELP` menampilkan perintah.

## Log yang diharapkan

```text
[WIFI] CONNECTED
[WIFI] Terhubung. IP ESP=... | gateway=... | RSSI=...
[NTP] Sinkron UTC=...; verifikasi TLS siap
[CONFIG] HTTP200 mode=REGISTER version=...
[HEARTBEAT] HTTP200 terkirim ... dashboard seharusnya Online
[RFID] UID=0012ABCD | mode=REGISTER version=...
[SCAN] Server HTTP200 -> REGISTER_SCAN | success=true
```

Contoh di atas menunjukkan format, bukan klaim pembacaan hardware aktual. Password WiFi dan token tidak pernah dicetak. UID kartu uji dicetak untuk pemeriksaan lokal.

## Alur registrasi otomatis (popup)

1. Refresh dashboard dengan **Ctrl+F5**, lalu buka **Kartu RFID**.
2. Klik **+ Tambah kartu**. Popup akan mengatur REGISTER dan menunggu konfirmasi mode dari heartbeat ESP.
3. Tunggu judul **Tempelkan kartu**, lalu tap satu kartu dan lepaskan.
4. UID disimpan otomatis. Popup **Kartu berhasil terdaftar** baru muncul setelah penyimpanan dan pembaruan daftar berhasil.
5. Tutup popup; UID muncul di daftar kartu dan jumlah kartu pada ringkasan ikut diperbarui. Tidak ada konfirmasi atau form identitas tambahan.

Scan sebelum popup dibuka tidak digunakan. **Batal/Escape** menghentikan penantian; selama penyimpanan berlangsung tombol tutup dinonaktifkan agar hasil tidak ambigu. Penantian dibatasi 60 detik.

Jika gagal, popup menjelaskan penyebab dan langkah berikutnya: Offline, reader belum siap, STALE_MODE, waktu scan basi, UID duplikat, perubahan mode dari tab lain, atau error server. Lepaskan kartu, klik **Coba lagi**, tunggu instruksi Tempelkan kartu, lalu tap kembali. Jika respons penyimpanan terputus, aplikasi memeriksa UID pada server; jika hasil belum pasti, periksa daftar sebelum mendaftarkan ulang.

Log **REGISTER_SCAN** berarti scan tersedia untuk registrasi, bukan kartu sudah tersimpan. **STALE_MODE** berarti scan ditolak karena versi mode berbeda. Kartu baru dihitung setelah proses simpan berhasil.

Tidak diperlukan upload firmware baru untuk alur popup ini. Firmware diagnostik sebelumnya sudah mengirim versi mode pada heartbeat. Saldo/tarif tetap mengikuti PRD; top-up diperlukan untuk EXIT berbayar. REGISTER tidak membuka servo.

## Mengapa masih Offline?

Dashboard baru Online setelah server menerima heartbeat yang sah. Tap saat ESP tidak terhubung dapat terbaca lokal di Serial Monitor, tetapi belum bisa menjadi referensi registrasi pada dashboard.

| Log | Arti / langkah |
|---|---|
| SSID_NOT_FOUND | WiFi tidak ditemukan; cocokkan SSID dan jaringan2,4GHz |
| WRONG_PASSWORD / CONNECT_FAILED | Periksa password/koneksi pada secrets.h, upload ulang |
| WiFi connected tetapi NTP belum valid | Waktu belum tersinkron; periksa akses NTP/internet |
| HTTP negatif / connection failed | Periksa IP laptop, server aktif, port8443, jaringan sama dan firewall |
| TLS error | Periksa CA, hostname/IP sertifikat dan waktu UTC; jangan menonaktifkan validasi TLS |
| HTTP401/403 | Token tidak cocok atau perangkat disabled; nilai token tidak dicetak |
| HTTP409 | Versi mode berubah atau timestamp basi; tunggu config baru, lepas lalu tap kembali |
| HTTP422 | Kontrak/payload ditolak; lihat kode pada Serial Monitor |
| HEARTBEAT HTTP200 | Server menerima heartbeat; dashboard seharusnya online dalam pembaruan berikutnya |

Status saat perubahan dibuat: server belum pernah menerima heartbeat ESP. Penyebab di sisi board baru dapat dipastikan dari log WiFi/NTP/HTTP/TLS setelah firmware diagnostik di-upload ulang. Kirim log tersebut untuk pemeriksaan, bukan isi secrets.h.
