export const displayStates = {
    STANDBY: {
        title: "Tempelkan kartu Anda",
        description: "Silakan tap kartu uji pada reader.",
        tone: "ready",
    },
    PROCESSING: {
        title: "Kartu sedang diproses",
        description: "Tunggu keputusan transaksi.",
        tone: "processing",
    },
    ENTRY_SUCCESS: {
        title: "Selamat datang!",
        description: "Akses masuk disetujui. Silakan lanjut.",
        tone: "success",
    },
    EXIT_SUCCESS: {
        title: "Terima kasih!",
        description: "Pembayaran parkir berhasil.",
        tone: "success",
    },
    REGISTER_SCAN: {
        title: "Kartu siap didaftarkan",
        description: "Administrator akan mengonfirmasi registrasi.",
        tone: "ready",
    },
    TOPUP_SUCCESS: {
        title: "Top-up berhasil",
        description: "Saldo simulasi telah ditambahkan.",
        tone: "success",
    },
    UNKNOWN_CARD: {
        title: "Kartu belum terdaftar",
        description: "Hubungi administrator untuk registrasi.",
        tone: "error",
    },
    BLOCKED_CARD: {
        title: "Kartu tidak aktif",
        description: "Hubungi administrator untuk bantuan.",
        tone: "error",
    },
    INSUFFICIENT_BALANCE: {
        title: "Saldo tidak cukup",
        description: "Isi saldo melalui administrator sebelum keluar.",
        tone: "error",
    },
    INVALID_SESSION: {
        title: "Sesi parkir tidak ditemukan",
        description: "Hubungi administrator untuk pemeriksaan sesi.",
        tone: "error",
    },
    ERROR: {
        title: "Transaksi belum berhasil",
        description: "Tunggu petunjuk administrator. Akses belum disetujui.",
        tone: "error",
    },
    OFFLINE: {
        title: "Perangkat sedang offline",
        description: "Koneksi terputus. Tunggu hingga perangkat terhubung.",
        tone: "offline",
    },
};
