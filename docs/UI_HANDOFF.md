# Panduan melanjutkan UI admin

## Batas pengerjaan

Kerjakan di `admin-web/`. Data contoh berada di `src/data.js`. Jangan menambahkan database, migration, koneksi backend, password/token asli, atau kendali hardware pada tahap UI ini.

Pratinjau tidak mempunyai login atau otorisasi nyata. Label **Pratinjau UI** dan keterangan data contoh harus tetap terlihat agar hasil simulasi tidak disalahartikan sebagai transaksi nyata.

## Peta file saat ini

| File            | Yang bisa diubah                                                                |
| --------------- | ------------------------------------------------------------------------------- |
| `src/App.vue`   | Urutan menu, isi halaman, form, tabel, pesan, validasi dan interaksi lokal      |
| `src/style.css` | Warna hijau, tipografi, spacing, sidebar, kartu statistik, tabel dan breakpoint |
| `src/data.js`   | Daftar contoh pemilik/kartu, sesi dan transaksi                                 |
| `src/main.js`   | Bootstrap aplikasi Vue                                                          |

Saat ini semua halaman sengaja berada di satu `App.vue` agar mudah dibaca pada tahap awal. Folder komponen dan halaman terpisah belum dibuat.

## Alur yang harus dipertahankan

1. **Kartu:** cari pemilik, filter status, tambah kartu dengan UID valid dan unik. Saldo awal kartu contoh Rp0. Pemilik diblokir tidak bisa dipilih untuk top-up yang berhasil.
2. **Top-up:** pilih kartu aktif, masukkan rupiah bulat dalam batas pengaturan, klik Tinjau, cek ringkasan, lalu Konfirmasi simulasi. Saldo dan riwayat berubah di memori browser. Mengubah kartu/nominal membatalkan ringkasan lama.
3. **Parkir:** tampilkan sesi aktif/selesai dan tarif sesi contoh; belum ada gerakan palang.
4. **Transaksi:** tampilkan nominal dan saldo sebelum/sesudah; pencarian/filter yang tidak cocok mempunyai empty state.
5. **Perangkat:** mode REGISTER, TOPUP, ENTRY, EXIT hanya pilihan lokal pada pratinjau.
6. **Pengaturan:** tarif positif, batas top-up konsisten, durasi buka 0,5–5 detik. Simpan hanya untuk sesi halaman ini.
7. Reload halaman mengembalikan seluruh data awal.

## Saran pembagian pekerjaan

Ini saran untuk tahap berikutnya, bukan struktur yang sudah diimplementasikan:

| Fokus              | Pekerjaan                                                             |
| ------------------ | --------------------------------------------------------------------- |
| Layout             | Pecah sidebar/header ke komponen, rapikan responsif dan aksesibilitas |
| Kartu & pemilik    | Rapikan form, pencarian dan badge status                              |
| Top-up & transaksi | Rapikan ringkasan konfirmasi, tabel dan pesan hasil                   |
| Parkir & perangkat | Rapikan sesi, mode dan tampilan status contoh                         |
| Integrasi UI       | Review konsistensi, empty/error state dan uji desktop/HP              |

Contoh arah refactor yang dapat disepakati bersama:

```text
src/
  components/    # Sidebar, Header, StatCard, StatusBadge
  pages/         # Dashboard, Cards, Topup, Parking, Transactions, Devices, Settings
  data/          # Mock data
  App.vue
  main.js
  style.css
```

Gunakan props/events antar komponen. Jangan menghubungkan API sebelum kontrak backend dan tugas integrasi disepakati.

## Alur Git untuk teman satu tim

```bash
git switch codex/admin-ui-reference
git pull --ff-only
git switch -c feature/ui-nama-bagian
# edit file
cd admin-web
npm ci
npm run build
cd ..
git add admin-web
git commit -m "Rapikan UI nama bagian"
git push -u origin feature/ui-nama-bagian
```

Buat pull request ke branch acuan yang disepakati tim. Hindari mengerjakan bagian `App.vue` yang sama secara bersamaan; sepakati pemecahan komponen terlebih dahulu untuk mengurangi konflik.

## Checklist sebelum menyerahkan perubahan

- Semua menu dapat dibuka dan form dapat dipakai dengan keyboard.
- Layout tetap terbaca pada laptop dan layar HP.
- Filter, empty state, batal konfirmasi dan pesan validasi bekerja.
- Data contoh tetap diberi label dan reload mereset data.
- Tidak ada API request, rahasia, `node_modules`, atau `dist` yang masuk commit.
- `npm run build` berhasil dan tidak ada error di console browser.
