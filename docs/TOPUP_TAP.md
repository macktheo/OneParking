# Top-up otomatis dengan tap kartu

1. Refresh dashboard dengan **Ctrl+F5**, lalu buka **Top-up Saldo**.
2. Pilih nominal cepat atau isi nominal rupiah bulat sesuai batas pengaturan.
3. Klik **Mulai top-up**. Nominal dikunci untuk transaksi ini.
4. Tunggu popup **Tempelkan kartu**, lalu tap satu kartu dan lepaskan.
5. Saldo otomatis bertambah; popup **Top-up berhasil** menampilkan saldo akhir. Daftar kartu dan transaksi ikut diperbarui.

UID harus sudah terdaftar dan kartu harus aktif. UID asing ditolak dengan petunjuk mendaftar melalui menu Kartu RFID; kartu diblokir tidak bisa menerima saldo. Tidak ada pembuatan kartu otomatis saat top-up.

Setiap pembukaan popup hanya memproses satu top-up dari scan baru. Scan lama tidak digunakan. Klik Batal/Escape untuk berhenti sebelum pemrosesan. Setelah berhasil, tutup popup; mulai lagi hanya jika memang ingin transaksi tambahan.

Jika respons server terputus, popup menampilkan hasil belum terkonfirmasi. Klik **Coba lagi** untuk memeriksa transaksi yang sama. Referensi request, claim dan nominal disimpan dalam sesi browser; retry tidak membuat kredit baru. Setelah halaman dimuat ulang, transaksi lama diperiksa sebelum membuat transaksi baru.

Tidak diperlukan upload firmware ulang. Server tetap memverifikasi UID, status kartu, mode, masa berlaku scan, nominal, serta request transaksi.
