# OneParking web UI

Frontend Vue 3 + Vue Router + Vite, berisi login demo, sembilan halaman admin, Digital Gate Display, serta 403/404. Semua data contoh; tidak membutuhkan database atau backend.

```bash
cd admin-web
npm ci
npm run dev
```

Akun contoh: `admin@oneparking.test` / `demo12345`. Bukan akun nyata. Reload mereset sesi dan data RAM.

Build: `npm run build`. Preview: `npm run preview`. Pada Windows PowerShell boleh memakai `npm.cmd`.

Peta file dan instruksi tim ada di [README utama](../README.md), [UI_SITEMAP](../docs/UI_SITEMAP.md), dan [UI_HANDOFF](../docs/UI_HANDOFF.md).

Halaman utama: `src/pages/`; shell: `src/layouts/`; komponen: `src/components/`; route: `src/router/`; logika contoh: `src/stores/`; data: `src/mocks/`; gaya: `src/styles/`.

Gunakan fallback SPA ke `index.html` saat hosting. Frontend ini tidak menjalankan polling, sesi server, otorisasi produksi, pembayaran nyata, ataupun kendali hardware.
