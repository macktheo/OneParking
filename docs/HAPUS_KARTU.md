# Menghapus kartu terdaftar

Buka **Kartu RFID**, klik **Hapus** pada baris UID, lalu periksa konfirmasi dan klik **Ya, hapus kartu**. Batal/Escape tidak mengubah data.

Kartu hilang dari daftar dan jumlah kartu aktif diperbarui. UID tidak dapat dipakai untuk masuk/keluar atau top-up sampai didaftarkan ulang. Saldo dan riwayat keuangan tetap disimpan; data transaksi dan sesi lama tidak ikut dihapus. Registrasi ulang melalui tap RFID mengaktifkan UID yang sama dengan saldo lama, tanpa menciptakan kartu atau saldo baru.

Jika kartu masih memiliki sesi parkir aktif, penghapusan ditolak. Selesaikan keluar kendaraan terlebih dahulu. Popup menampilkan pesan kesalahan dan bisa ditutup untuk melanjutkan proses keluar.

API: DELETE /api/v1/admin/cards/{id}, khusus admin dengan CSRF. Penghapusan ulang ID yang sama aman dan tidak menggandakan audit. Kartu yang diarsipkan tidak dapat diaktifkan melalui tombol status biasa; harus registrasi ulang dari scan baru.

Implementasi memakai deleted_at agar relasi transaksi/sesi dan perhitungan ledger tetap utuh.
