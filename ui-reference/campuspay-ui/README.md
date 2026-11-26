# CampusPay — Frontend UI (Tailwind CSS)

Prototipe antarmuka CampusPay berdasarkan PRD v1.0. Dibuat menggunakan Vite, Tailwind CSS v4, dan JavaScript.

## Persyaratan
- Node.js 20.19+ atau 22.12+
- npm

## Menjalankan di VS Code

1. Ekstrak folder `campuspay-vscode`.
2. Buka folder tersebut di Visual Studio Code.
3. Buka Terminal → New Terminal.
4. Jalankan:

```bash
npm install
npm run dev
```

5. Buka alamat lokal yang muncul di terminal (biasanya http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Halaman yang tersedia

| Halaman | Route |
|---|---|
| Login Admin (rancangan) | `/login` |
| Dashboard | `#/dashboard` |
| Pemilik Kartu | `#/users` |
| Kartu RFID | `#/cards` |
| Top-up Saldo | `#/topup` |
| Sesi Parkir | `#/parking` |
| Transaksi | `#/transactions` |
| Perangkat | `#/devices` |
| Audit Keamanan | `#/audit` |
| Pengaturan | `#/settings` |
| Digital Gate Display | `#/display` |

## Catatan penting
- Seluruh data saat ini adalah data dummy di sisi frontend.
- Simulasi scan, top-up, registrasi, pergantian mode, dan Digital Gate Display hanya untuk demonstrasi UI.
- Belum terhubung ke Laravel API, MySQL, ESP8266, RFID reader, atau servo fisik.
- Pada implementasi sebenarnya, backend harus menjadi sumber utama saldo, tarif, sesi parkir, transaksi, autentikasi, dan otorisasi perintah servo.
- UID ditampilkan secara tersamarkan pada tabel dan Digital Gate Display.
- Saldo tidak disimpan sebagai data finansial pada kartu RFID.

## Struktur folder

```text
campuspay-vscode/
├── index.html
├── package.json
├── README.md
└── src/
    ├── main.js
    └── style.css
```
