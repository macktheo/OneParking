# Handoff UI untuk tim

## Mulai bekerja

Checkout `UI-Struktur-OneParking`, install dari lockfile dengan `npm ci`, jalankan `npm run dev` di `admin-web`. Buka login dengan akun contoh yang tercantum di README. Tidak perlu PHP/database/ESP. Jangan memasukkan `.env`, token, password nyata atau config hardware ke branch ini.

## Pembagian file yang konkret

| Fokus                | File utama                                                    | Tugas lanjutan                                                                       |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Layout/aksesibilitas | `components/*`, `layouts/AdminLayout.vue`, `styles/base.css`  | Rapikan responsif, keyboard, fokus, kontras dan konsistensi                          |
| Login                | `pages/auth/LoginPage.vue`, `stores/session.js`               | State gagal/loading, label dan alur demo; autentikasi nyata tugas integrasi terpisah |
| Pemilik/kartu        | `pages/admin/OwnersPage.vue`, `CardsPage.vue`                 | Form, pencarian, registrasi dan konfirmasi status                                    |
| Top-up/riwayat       | `TopupPage.vue`, `TransactionsPage.vue`                       | Tinjauan nominal, pesan hasil, filter dan saldo awal/akhir                           |
| Parkir               | `ParkingPage.vue`                                             | Sesi aktif/selesai, timestamp dan biaya snapshot                                     |
| Perangkat/pengaturan | `DevicesPage.vue`, `SettingsPage.vue`                         | Mode eksplisit, status unknown, batas nominal/durasi                                 |
| Keamanan             | `SecurityLogsPage.vue`, `pages/system/ForbiddenPage.vue`      | Presentasi audit dan penolakan, tanpa menampilkan rahasia                            |
| Gate display         | `pages/display/GateDisplayPage.vue`, `mocks/displayStates.js` | Seluruh state PRD, auto-clear, fullscreen dan privasi                                |
| Integrasi UI         | `router/index.js`, `stores/demoStore.js`, `mocks/data.js`     | Konsistensi state, review antarhalaman dan pemetaan API kelak                        |

Komponen/page yang sudah ada adalah implementasi acuan, bukan folder kosong. File halaman mengakses store contoh melalui `useDemoStore()`; logika saldo contoh terpusat pada `stores/demoStore.js`, bukan diduplikasi di setiap page. Fixture utama berada di `mocks/data.js`.

## Batas dan keputusan

- Semua interaksi berada di RAM; reload mereset sesi/data. Login dan router guard hanyalah contoh navigasi, bukan keamanan.
- Aksi tidak memanggil API atau mengubah database. Jangan mengganti simulasi menjadi request nyata tanpa kesepakatan integrasi.
- Pemilik sementara diturunkan dari data kartu satu pemilik/satu kartu. Entitas holder terpisah dan relasi satu-ke-banyak perlu adapter backend nanti.
- Daftar sesi parkir adalah fixture read-only; tidak mensimulasikan transaksi gerbang server. Pemilihan mode tidak menggerakkan servo.
- Display pada tab baru tidak tersinkron dengan tab admin. Gunakan kontrol skenario untuk review.
- UI bahasa Indonesia, mata uang rupiah integer, waktu transaksi contoh WIB, tanggal fixture 26 November 2026.
- Biarkan label pratinjau dan data contoh terlihat agar tim tidak mengira transaksi sudah terintegrasi.
- Jangan menyatukan semua page ke `App.vue`. Root hanya provider dan RouterView; masing-masing PIC mengerjakan page miliknya.

## Saran alur Git

```bash
git fetch origin
git switch UI-Struktur-OneParking
git pull --ff-only
git switch -c feature/ui-nama-bagian
# kerjakan file page/komponen milik Anda
cd admin-web
npm ci
npm run build
cd ..
git add admin-web docs
git commit -m "Rapikan UI nama bagian"
git push -u origin feature/ui-nama-bagian
```

Buat PR ke `UI-Struktur-OneParking` atau target yang disepakati tim. Perubahan komponen bersama/router/store perlu dikoordinasikan agar tidak konflik dengan PIC lain.

## Kontrak integrasi berikutnya

1. Backend menyediakan sesi/CSRF/role, data holder-card, saldo dan ledger, sesi parkir, konfigurasi device, audit, serta status display tersanitasi.
2. Tim menyepakati schema request/response dan kode error lebih dahulu.
3. Tambahkan adapter API terpisah, ganti store mock bertahap; jangan menghitung debit/tarif sebagai otoritas di browser.
4. Saat integrasi, server menentukan saldo, validasi, biaya snapshot, idempotensi dan izin membuka palang. Halaman display hanya menampilkan status.
5. Mekanisme login demo dan kontrol skenario tidak dipakai pada produksi.

## Checklist penyerahan

- Route langsung, back/forward dan refresh bekerja sesuai sesi demo.
- Tidak ada error console, request API atau rahasia pada bundle.
- Form bisa digunakan dengan keyboard; dialog bisa batal dengan Escape.
- State kosong/loading/error/offline dan validasi mudah dipahami.
- HP/laptop terbaca tanpa overflow halaman; tabel punya scroll sendiri.
- Top-up contoh hanya berubah setelah konfirmasi dan membatalkan ringkasan bila nominal/kartu diubah.
- Display tidak memuat identitas lengkap dan menghapus hasil sementara.
- `npm run build` lulus; perubahan source dan docs jelas di PR.
