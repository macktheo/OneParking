export class ApiError extends Error {
    constructor(message, status = 0, data = {}) {
        super(message);
        this.status = status;
        this.data = data;
    }
}
export async function api(path, method = "GET", body) {
    const csrf = document.cookie
        .split("; ")
        .find((c) => c.startsWith("XSRF-TOKEN="))
        ?.slice("XSRF-TOKEN=".length);
    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };
    if (csrf) headers["X-XSRF-TOKEN"] = decodeURIComponent(csrf);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const response = await fetch(path, {
            method,
            headers,
            credentials: "same-origin",
            signal: controller.signal,
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        const data =
            response.status === 204
                ? null
                : await response.json().catch(() => ({}));
        if (!response.ok) {
            const text = data.errors
                ? Object.values(data.errors).flat().join(" ")
                : data.message || data.code || `HTTP ${response.status}`;
            const friendly={NO_RECENT_SCAN:'Belum ada tap kartu yang diterima server. Pastikan ESP Online, pilih REGISTER, tap dan lepaskan kartu, lalu ambil scan terbaru.',SCAN_ALREADY_USED:'Scan sudah dipakai. Lepaskan lalu tap ulang kartu.',CARD_EXISTS:'UID kartu ini sudah terdaftar.',INVALID_SCAN_CLAIM:'Referensi scan tidak valid atau sudah kedaluwarsa. Tap ulang lalu ambil scan terbaru.'};
            throw new ApiError(friendly[text]||text, response.status, data);
        }
        return data;
    } catch (e) {
        if (e instanceof ApiError) throw e;
        throw new ApiError(
            "Koneksi terputus atau timeout. Hasil transaksi belum diketahui. Jangan membuat transaksi baru.",
            0,
        );
    } finally {
        clearTimeout(timer);
    }
}
export const business = (path) => "/api/v1/admin/" + path;
