> Firmware diagnostik terbaru: Serial115200 menampilkan WiFi, NTP, HTTP/TLS, mode dan UID. Kirim STATUS dengan Newline. Wajib upload ulang untuk memakai log baru. Pin dan sudut40/180 tetap.

# Firmware Arduino IDE — CampusPay / OneParking

Buka `OneParking/OneParking.ino`. Board NodeMCU1.0 ESP-12E, core ESP8266 **3.1.0**; MFRC522 **1.4.12**, ArduinoJson **7.0.4**. Servo, SPI dan WiFi berasal dari core. PlatformIO tidak diperlukan.

Pin final: SS_GPIO4/D2, RST_GPIO0/D3, servo_GPIO5/D1; SPI SCK14/MOSI13/MISO12. Sudut buka40°, tutup180° sesuai konfirmasi mekanik pengguna. Wiring lengkap: `../docs/WIRING.md`.

## Konfigurasi

`OneParking/secrets.h` adalah file privat lokal, diabaikan Git. Sudah dipersiapkan dari konfigurasi pengguna dengan URL LAN/CA/token yang cocok dengan server. Password WiFi masih perlu diisi langsung. Jika belum ada, salin `secrets.example.h`, isi nilainya, atau jalankan setup lokal. Jangan membagikan secrets.h atau key CA/server.

API_BASE_URL harus berakhir `/api/v1`, contoh `https://IP_LAPTOP:8443/api/v1`. Firmware menambahkan `/device/...` sendiri. CA adalah isi **root-ca.pem**, bukan private key. NTP harus tersedia sebelum verifikasi TLS; tidak ada `setInsecure`.

## Build/upload

```powershell
arduino-cli lib install "MFRC522@1.4.12"
# ArduinoJson7.0.4 sudah tersedia saat implementasi; pilih versi yang sama di Library Manager.
arduino-cli compile --fqbn esp8266:esp8266:nodemcuv2 D:\OneParking\firmware\OneParking
arduino-cli board list
arduino-cli upload --fqbn esp8266:esp8266:nodemcuv2 --port COM5 D:\OneParking\firmware\OneParking
arduino-cli monitor --port COM5 --config baudrate=115200
```

Ganti COM5 dengan port sebenarnya. Arduino IDE: Preferences menambahkan `https://arduino.esp8266.com/stable/package_esp8266com_index.json`, install board ESP8266 Community3.1.0, pilih NodeMCU, Verify lalu Upload.

## Perilaku keamanan dan jaringan

- Boot tertutup180°, tanpa memulihkan command lama.
- WiFi/NTP tidak memblokir setup tanpa batas; reader/timer tetap dapat diproses.
- Heartbeat5 detik, config2 detik saat tidak ada pending scan. Heartbeat melaporkan posisi yang diperintahkan, RSSI, reader_ready dan mode_version, bukan posisi mekanik.
- Satu tap = UUID acak SDK dan payload tetap. Lepas kartu700ms sebelum tap berikutnya.
- Pending scan dicek `/requests/{id}`; 404 mengirim payload semula. Timeout/5xx retry ID sama. Tidak membuat debit baru karena timeout.
- Hanya success ENTRY_SUCCESS/EXIT_SUCCESS + OPEN + ID baru + expiry epoch valid + durasi500–5000ms menggerakkan servo.
- Tidak ada HTTP/TLS selama palang diperintahkan terbuka; timer tutup dieksekusi lebih dahulu. ACK CLOSED_COMMANDED dikirim setelah tutup dan di-retry bila gagal.
- REGISTER/TOPUP/penolakan tidak membuka palang. Command tanpa expiry, salah action, duplikat atau kedaluwarsa tidak dieksekusi.
- Setelah reboot hasil lama tidak dibuka otomatis; admin meninjau sesi dan ledger. Tidak ada pembayaran offline.
- TEST_RW opt-in dan kartu uji saja, menulis block4 nonfinansial lalu verifikasi. Tidak mengubah UID atau saldo kartu.

Build terakhir: PASS; RAM35148/80192 (43%), flash396868/1048576 (37%). Upload, pembacaan/penulisan kartu serta gerak fisik masih NOT RUN karena COM belum tersedia.
