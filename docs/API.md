> Pembaruan terbaru: registrasi **UID kartu saja**, tanpa nama/NIM/nomor kendaraan. Ikuti `docs/REGISTRASI_UID.md`; firmware sekarang memiliki log WiFi/NTP/HTTP/TLS/UID dan perintah Serial `STATUS`.

# Kontrak API CampusPay v1 — implementasi terintegrasi

HTTPS origin sama. Vue disajikan Laravel, cookie session Laravel + CSRF controller Sanctum. Prefix bisnis `/api/v1`. Semua JSON request menggunakan Accept/Content-Type application/json. Token perangkat hanya pada Authorization header, tidak pada URL/log/bundle frontend.

## Login/admin

`GET /sanctum/csrf-cookie` → cookie XSRF-TOKEN; URL-decode nilainya untuk `X-XSRF-TOKEN` pada request mutasi. `POST /login` memakai `email,password`. `POST /logout` membatalkan sesi. `GET /api/v1/auth/user` mengembalikan id/name/email/role tanpa password/hash.

Guest mendapat401 dan viewer403 pada admin, sebelum pemeriksaan CSRF. Administrator terautentikasi tanpa CSRF valid mendapat419. Login salah422, rate limit429. Akun inactive tidak bisa login.

| Method | Path `/api/v1/admin` | Fungsi |
|---|---|---|
| GET | /live | polling ringkasan/perangkat/scan dalam satu request |
| GET | /dashboard | counts/pendapatan/penolakan/grafik jam WIB dari DB |
| GET/POST | /holders | daftar / tambah name,student_number,vehicle_plate |
| PATCH | /holders/{id} | edit identitas tanpa saldo |
| GET/POST | /cards | daftar / registrasi claim_id + holder_id atau identitas baru |
| PATCH | /cards/{id}/status | ACTIVE/BLOCKED, tidak menghapus sesi |
| GET | /scans/latest | scan terbaru untuk admin |
| POST | /scan-claims | body{}, klaim scan REGISTER/TOPUP60 detik |
| POST | /topup | claim_id,request_id UUID,amount integer JSON positif dalam batas |
| GET | /requests/{id} | hasil idempotent top-up milik admin tersebut |
| GET | /parking | filter status/card_id/from/to, maksimal500 sesi |
| GET | /transactions | filter card_id/type/status/from/to/query/page,25 baris per halaman |
| GET | /transactions/export | CSV sesuai filter, tanpa token/identitas penuh; proteksi formula CSV |
| GET | /devices | mode/version, heartbeat/RSSI/reader_ready, commanded position dan command ACK |
| PATCH | /devices/{id}/mode | REGISTER/TOPUP/ENTRY/EXIT; menaikkan mode_version |
| GET/PATCH | /settings | rate,topup_min,topup_max,duration_ms |
| GET | /audit-logs | maksimal500 log terakhir, aktor/tindakan/hasil/requestID/metadata aman |

Claim terikat **user dan hash sesi login**, satu scan dikonsumsi sekali lintas claim, mode/versi/expiry harus sesuai. Logout/login baru tidak dapat memakai claim lama. Request ID top-up terikat aktor dan payload yang dikanonisasi; retry sama mengembalikan hasil semula, payload beda409. Rekonsiliasi GET dapat mengembalikan hasil commit meski claim sudah dikonsumsi/kedaluwarsa.

Riwayat mencakup TOPUP/PARKING_PAYMENT berhasil (SUCCESS) dan SCAN_REJECTED (REJECTED) dengan alasan penolakan. Tidak ada endpoint edit saldo atau ledger. Rupiah harus integer JSON, bukan pecahan/string/boolean.

## Perangkat

Prefix `/api/v1/device`. `Authorization: Bearer <token lokal>`. Server menyimpan SHA256 token acak; disabled/wrong token401. Perangkat tidak dapat mengakses endpoint admin.

| Method | Path | Kontrak |
|---|---|---|
| GET | /config | mode,mode_version,server_epoch |
| POST | /heartbeat | gate_state COMMANDED_OPEN/COMMANDED_CLOSED/UNKNOWN; optional mode_version,rssi,sent_at,reader_ready,boot |
| POST | /scan | request_id UUID,uid hex4/7/10byte,mode_version,scanned_at ISO UTC |
| GET | /requests/{UUID} | hasil milik perangkat;404 jika belum tercatat |
| POST | /commands/{UUID}/ack | status OPEN_COMMANDED/CLOSED_COMMANDED/EXPIRED; EXECUTED kiriman lama diterima sebagai OPEN_COMMANDED |

Heartbeat juga menerima commanded_position OPEN/CLOSED/UNKNOWN untuk kompatibilitas versi lama. Responsnya mengembalikan mode/version terbaru. sent_at baru diperiksa freshness±30 detik. Status fisik tidak diklaim tanpa sensor.

UID dinormalisasi uppercase dengan leading zero. Scan baru diperiksa freshness±30 detik dan versi mode server. Retry ID/payload sama mendapat hasil terdahulu tanpa debit kedua; command expiry tidak diperpanjang.

```json
{"success":true,"code":"EXIT_SUCCESS","fee":2000,"balance_after":18000,"gate_command":{"id":"UUID","action":"OPEN","duration_ms":3000,"expires_at":"ISO UTC","expires_epoch":1795669210}}
```

Command dibuat setelah transaksi commit dan berlaku10 detik. Firmware harus memeriksa expiry epoch, success, kode ENTRY/EXIT, action dan durasi. REGISTER_SCAN/TOPUP_SCAN sukses tanpa command. Penolakan bisnis successfalse/gate_commandnull; STALE_MODE/STALE_SCAN409, invalid422, credential401, payload conflict409, server error5xx. Jangan mengubah requestID saat timeout.

ACK terminal CLOSED_COMMANDED/EXPIRED tidak dapat dihidupkan kembali oleh ACK lama. ACK EXECUTED yang terlambat diklasifikasikan EXPIRED. ACK bukan sensor posisi.

## Display

`GET /api/v1/display/status`, read-only,120 request/menit/IP dan dibatasi CIDR jaringan demo melalui DISPLAY_ALLOWED_CIDRS. Respons hanya mode,online,code,fee,balance_after,rate,gate,server_time. Tidak ada UID/nama/NIM/token.

Polling1 detik. Hasil dibersihkan setelah5 detik; heartbeat>15 detik atau request gagal menghasilkan OFFLINE. PROCESSING/hasil final dipublikasikan oleh server. TOPUP_SCAN memberi petunjuk menunggu konfirmasi admin. Saldo/biaya hanya tampil sementara bila relevan.

## Integritas

MySQL8.4/InnoDB: satu lock settings menserialisasi mutasi untuk MVP satu reader, lalu kartu/sesi; unique UID, active_card_id dan generated active_card_guard, unique debit session_id, scope+requestID, command per scan. CHECK melindungi saldo/state sesi/ledger. Trigger menolak UPDATE/DELETE ledger. Tarif historis tersimpan parking_rates; sesi memakai fee_snapshot. Audit penolakan/exception disimpan setelah rollback tanpa kredensial.

Semua timestamp server UTC, UI WIB. Backend satu-satunya otoritas saldo/tarif/sesi/izin palang. Tidak ada klaim kapasitas multi-gate atau autentikasi kriptografis UID.
