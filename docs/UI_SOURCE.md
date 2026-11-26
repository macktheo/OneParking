# Sumber UI yang digunakan

Repository https://github.com/macktheo/OneParking, branch **UI/UX**, commit **6863b33** (`UI Campuspay Sementara`), folder `campuspay-ui`.

Yang diambil: tema Tailwind ungu, logo SVG CampusPay, layout sidebar/header, komposisi login, bentuk card/stat/table/badge, pola dashboard/grafik dan tampilan gerbang.

Yang diubah untuk integrasi PRD: template dirakit sebagai komponen Vue, login dan seluruh mutasi memakai Laravel API/CSRF/session; tidak ada handler transaksi dummy. Angka/dashboard/grafik berasal MySQL. Status reader/servo/online tidak disimulasikan sebagai berhasil; reader_ready berasal heartbeat dan posisi mekanik selalu tidak terverifikasi. Display tidak memiliki tombol simulasi hasil pada aplikasi operasional.

Source branch asli tersedia di `ui-reference/campuspay-ui` untuk pembandingan. Aplikasi live ada di `backend/resources/js`, styling di `backend/resources/css/app.css`. Ikon dibuat inline agar aplikasi tidak bergantung pada CDN lucide@latest; font memakai fallback lokal. Branch sumber tidak diubah dan tidak ada push baru dari konfigurasi privat ini.
