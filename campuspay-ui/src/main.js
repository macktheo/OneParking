import './style.css';

const nav = [
    ['dashboard', 'Dashboard', 'layout-dashboard'],
    ['users', 'Pemilik Kartu', 'users'],
    ['cards', 'Kartu RFID', 'contactless'],
    ['topup', 'Top-up Saldo', 'wallet'],
    ['parking', 'Sesi Parkir', 'car-front'],
    ['transactions', 'Transaksi', 'arrow-left-right'],
    ['devices', 'Perangkat', 'cpu'],
    ['audit', 'Audit Keamanan', 'shield-check'],
    ['settings', 'Pengaturan', 'settings']
];

const pageMeta = {
    dashboard: ['Dashboard', 'Ringkasan aktivitas parkir kampus hari ini.'],
    users: ['Manajemen Pemilik Kartu', 'Kelola identitas mahasiswa dan pemilik kartu RFID.'],
    cards: ['Manajemen Kartu RFID', 'Registrasi, pemantauan, dan pengelolaan kartu RFID kampus.'],
    topup: ['Top-up Saldo', 'Tambah saldo kartu RFID melalui transaksi yang terautentikasi.'],
    parking: ['Sesi Parkir', 'Pantau aktivitas kendaraan masuk dan keluar area kampus.'],
    transactions: ['Riwayat Transaksi', 'Pantau seluruh aktivitas transaksi saldo simulasi kartu RFID.'],
    devices: ['Manajemen Perangkat', 'Pantau konektivitas dan kendali perangkat RFID Smart Parking.'],
    audit: ['Audit Keamanan', 'Pantau aktivitas administrator, perangkat, dan penolakan transaksi.'],
    settings: ['Pengaturan Sistem', 'Konfigurasi tarif parkir dan parameter operasional CampusPay.']
};

const state = {
    page: location.hash.replace('#/', '') || 'dashboard',
    sidebar: false,
    modal: null,
    toast: null,
    mode: 'ENTRY',
    modeVersion: 4,
    scannedUid: 'A38F2109',
    selectedCard: 'A38F2109',
    search: '',
    filter: 'Semua',
    displayState: 'STANDBY',
    displayTimer: null,

    cards: [
        { name: 'Andi Pratama', nim: '224443071', plate: 'D 1234 ABC', uid: 'A38F2109', balance: 18000, status: 'Aktif', date: '12 Nov 2026' },
        { name: 'Siti Rahma', nim: '224443082', plate: 'D 5678 DEF', uid: '08D4E5F6', balance: 45000, status: 'Aktif', date: '13 Nov 2026' },
        { name: 'Rizky Maulana', nim: '224443095', plate: 'D 9012 GHI', uid: 'B72C109A', balance: 0, status: 'Diblokir', date: '14 Nov 2026' },
        { name: 'Nadia Putri', nim: '224443103', plate: 'D 3344 JKL', uid: 'C19A02EF', balance: 12000, status: 'Aktif', date: '16 Nov 2026' }
    ],

    sessions: [
        { id: 'SES-2026-1042', name: 'Andi Pratama', uid: 'A38F21••', entry: '26 Nov 2026, 08:12', duration: '2j 18m', rate: 2000, status: 'Aktif' },
        { id: 'SES-2026-1041', name: 'Siti Rahma', uid: '08D4E5••', entry: '26 Nov 2026, 08:25', duration: '2j 05m', rate: 2000, status: 'Aktif' },
        { id: 'SES-2026-1039', name: 'Dimas Saputra', uid: '9F12A0••', entry: '26 Nov 2026, 07:40', duration: '1j 32m', rate: 2000, status: 'Selesai' }
    ],

    transactions: [
        { id: 'TRX-20261126-001', time: '10:41:32', name: 'Andi Pratama', uid: 'A38F21••', type: 'PARKING_PAYMENT', amount: 2000, before: 20000, after: 18000, status: 'Berhasil' },
        { id: 'TRX-20261126-002', time: '10:38:09', name: 'Siti Rahma', uid: '08D4E5••', type: 'TOPUP', amount: 20000, before: 25000, after: 45000, status: 'Berhasil' },
        { id: 'TRX-20261126-003', time: '10:35:14', name: 'Tidak dikenal', uid: '—', type: 'ENTRY', amount: 0, before: 0, after: 0, status: 'Ditolak' },
        { id: 'TRX-20261126-004', time: '09:52:02', name: 'Nadia Putri', uid: 'C19A02••', type: 'TOPUP', amount: 10000, before: 2000, after: 12000, status: 'Berhasil' }
    ],

    logs: [
        { time: '10:41:32', actor: 'Admin', action: 'Pembayaran parkir EXIT', result: 'Berhasil', id: 'REQ-84F2' },
        { time: '10:38:09', actor: 'Admin', action: 'Top-up saldo Rp20.000', result: 'Berhasil', id: 'REQ-81A1' },
        { time: '10:35:14', actor: 'ESP8266', action: 'Kartu tidak dikenal pada mode ENTRY', result: 'Ditolak', id: 'REQ-7D03' },
        { time: '09:22:45', actor: 'Admin', action: 'Mode reader diubah ke ENTRY', result: 'Berhasil', id: 'REQ-6A20' }
    ]
};

const rupiah = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const mask = uid => uid ? uid.slice(0, 4) + '••' : '—';

const icon = (name, size = 18) =>
    `<i data-lucide="${name}" style="width:${size}px;height:${size}px;stroke-width:1.8"></i>`;

const badge = (text, type = 'gray') =>
    `<span class="badge badge-${type}">${text}</span>`;

const btn = (text, action, kind = 'primary', ico = '') =>
    `<button class="btn-${kind}" data-action="${action}">${ico ? icon(ico, 16) : ''}${text}</button>`;

const stat = (label, value, ico, change = '', tone = 'purple') =>
    `<div class="card p-4">
        <div class="flex items-start justify-between">
            <div>
                <p class="text-xs font-semibold text-slate-500">${label}</p>
                <p class="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">${value}</p>
                ${change ? `<p class="mt-1 text-xs font-semibold text-emerald-600">${change}</p>` : ''}
            </div>
            <div class="icon-box">${icon(ico, 21)}</div>
        </div>
    </div>`;

const table = (headers, rows, empty = 'Belum ada data') =>
    `<div class="table-wrap">
        <table class="data-table">
            <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${rows.length ? rows.join('') : `<tr><td colspan="${headers.length}" class="py-10 text-center text-slate-400">${empty}</td></tr>`}
            </tbody>
        </table>
    </div>`;

const field = (label, name, placeholder = '', type = 'text', value = '') =>
    `<label class="block">
        <span class="mb-1.5 block text-xs font-bold text-slate-600">${label}</span>
        <input class="input" name="${name}" type="${type}" placeholder="${placeholder}" value="${value}" />
    </label>`;

const selectField = (label, name, opts) =>
    `<label class="block">
        <span class="mb-1.5 block text-xs font-bold text-slate-600">${label}</span>
        <select class="input" name="${name}">${opts.map(x => `<option>${x}</option>`).join('')}</select>
    </label>`;

function shell() {
    const active = state.page;

    return `<div class="min-h-screen">
        <div id="sidebar-backdrop" class="fixed inset-0 z-30 hidden bg-slate-950/40" onclick="toggleSidebar()"></div>

        <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-violet-100 bg-white px-4 py-5 lg:translate-x-0">
            <div class="mb-8 flex items-center gap-3 px-2">
                <div class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-600 shadow-lg shadow-violet-200">
                    <img src="/assets/campuspay-mark.svg" alt="CampusPay" class="h-full w-full object-cover" />
                </div>
                <div>
                    <div class="text-lg font-extrabold tracking-tight text-slate-900">CampusPay</div>
                    <div class="text-[10px] font-semibold tracking-wide text-slate-400">SMART CAMPUS PARKING</div>
                </div>
            </div>

            <div class="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">Menu Utama</div>

            <nav class="space-y-1">
                ${nav.map(([id, label, ico]) =>
                    `<button class="sidebar-link ${active === id ? 'active' : ''}" data-page="${id}">
                        ${icon(ico, 18)}
                        <span>${label}</span>
                        ${id === 'audit' ? '<span class="ml-auto h-2 w-2 rounded-full bg-rose-400"></span>' : ''}
                    </button>`
                ).join('')}
            </nav>

            <div class="mt-auto rounded-2xl bg-brand-50 p-3">
                <div class="flex items-center gap-2">
                    <div class="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand-600">
                        ${icon('user-round', 18)}
                    </div>
                    <div class="min-w-0">
                        <p class="truncate text-xs font-bold text-slate-800">Administrator</p>
                        <p class="text-[10px] text-slate-500">Admin CampusPay</p>
                    </div>
                    <button class="ml-auto text-slate-400" data-action="logout">${icon('log-out', 16)}</button>
                </div>
            </div>
        </aside>

        <main class="min-h-screen lg:pl-[258px]">
            <header class="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur md:px-8">
                <div class="flex items-center gap-3">
                    <button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onclick="toggleSidebar()">
                        ${icon('menu', 21)}
                    </button>
                    <div>
                        <p class="text-sm font-extrabold text-slate-900">${pageMeta[active]?.[0] || 'CampusPay'}</p>
                        <p class="text-[11px] text-slate-400">Admin / ${pageMeta[active]?.[0] || 'Dashboard'}</p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <span class="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 sm:flex">
                        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Sistem Aktif
                    </span>
                    <button class="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100" data-action="notifications">
                        ${icon('bell', 19)}
                        <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500"></span>
                    </button>
                    <div class="h-8 w-px bg-slate-200"></div>
                    <div class="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-brand-700">
                        ${icon('user-round', 18)}
                    </div>
                    <div class="hidden sm:block">
                        <p class="text-xs font-bold">Administrator</p>
                        <p class="text-[10px] text-slate-400">Super Admin</p>
                    </div>
                </div>
            </header>

            <section class="mx-auto max-w-[1600px] p-5 md:p-8">
                <div class="mb-6">
                    <h1 class="page-title">${pageMeta[active]?.[0] || 'Dashboard'}</h1>
                    <p class="page-subtitle">${pageMeta[active]?.[1] || ''}</p>
                </div>
                <div id="page-content">${renderPage()}</div>
            </section>
        </main>
    </div>

    <div id="modal-root"></div>
    <div id="toast-root" class="fixed bottom-5 right-5 z-[100]"></div>`;
}

function dashboard() {
    const rows = state.transactions.slice(0, 4).map(t =>
        `<tr>
            <td class="font-semibold">${t.time}</td>
            <td>
                <div class="font-bold text-slate-800">${t.name}</div>
                <div class="text-[11px] text-slate-400">UID: ${t.uid}</div>
            </td>
            <td>
                ${t.type === 'TOPUP'
                    ? badge('Top-up Saldo', 'purple')
                    : t.type === 'ENTRY'
                        ? badge('ENTRY (Masuk)', 'gray')
                        : badge('Pembayaran Parkir (EXIT)', 'gray')}
            </td>
            <td>${badge(t.status, t.status === 'Berhasil' ? 'green' : 'red')}</td>
            <td class="font-bold">${t.amount ? rupiah(t.amount) : '—'}</td>
        </tr>`
    );

    return `<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
            <p class="text-lg font-extrabold">Selamat datang, Admin 👋</p>
            <p class="text-xs text-slate-500">Berikut ringkasan operasional CampusPay hari ini.</p>
        </div>
        <div class="text-xs text-slate-500">${icon('calendar-days', 14)} Kamis, 26 November 2026</div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${stat('Kartu Aktif', '1.248', 'credit-card', '↑ 8,2% dari bulan lalu')}
        ${stat('Sesi Parkir Aktif', '36', 'car-front', '12 sesi masuk hari ini')}
        ${stat('Pendapatan Parkir', rupiah(1284000), 'wallet', '↑ 12,5% dari kemarin')}
        ${stat('Transaksi Ditolak', '7', 'shield-alert', '3 kartu tidak dikenal', 'purple')}
    </div>

    <div class="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div class="card p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 class="font-extrabold">Aktivitas Parkir</h3>
                    <p class="mt-1 text-xs text-slate-400">Jumlah transaksi berdasarkan waktu</p>
                </div>
                <select class="input !w-auto !py-2 text-xs" id="chart-range">
                    <option>Hari Ini</option>
                    <option>7 Hari</option>
                    <option>30 Hari</option>
                </select>
            </div>
            <div class="activity-chart-wrap"><div id="activity-chart" class="activity-chart" role="img" aria-label="Grafik aktivitas parkir berdasarkan waktu"></div></div>
        </div>

        <div class="card p-5">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="font-extrabold">Status Perangkat</h3>
                ${badge('Semua Normal', 'green')}
            </div>
            <div class="space-y-4">
                ${deviceRow('cpu', 'ESP8266', 'NodeMCU utama', 'Online', 'green')}
                ${deviceRow('contactless', 'RFID Reader', 'Reader RC522', 'Terhubung', 'green')}
                ${deviceRow('settings', 'Servo Motor', 'Perintah terakhir', 'Tertutup', 'gray')}
                ${deviceRow('activity', 'Heartbeat Terakhir', 'Pembaruan perangkat', '10:42:18', 'purple')}
            </div>
            <button class="mt-5 w-full btn-secondary" data-page="devices">
                Lihat Detail Perangkat ${icon('arrow-right', 15)}
            </button>
        </div>
    </div>

    <div class="card mt-5">
        <div class="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
                <h3 class="font-extrabold">Aktivitas Terbaru</h3>
                <p class="mt-1 text-xs text-slate-400">Transaksi dan aktivitas sistem terkini</p>
            </div>
            <button class="text-xs font-bold text-brand-600" data-page="transactions">Lihat Semua</button>
        </div>
        ${table(['Waktu', 'Pemilik Kartu', 'Aktivitas', 'Status', 'Nominal'], rows)}
    </div>`;
}

function deviceRow(ico, title, sub, status, type) {
    return `<div class="flex items-center gap-3">
        <div class="icon-box !h-10 !w-10">${icon(ico, 19)}</div>
        <div class="min-w-0 flex-1">
            <p class="text-sm font-bold">${title}</p>
            <p class="text-[11px] text-slate-400">${sub}</p>
        </div>
        ${badge(status, type)}
    </div>`;
}function usersPage() {
    const rows = state.cards
        .filter(c => (c.name + c.nim + c.plate).toLowerCase().includes(state.search.toLowerCase()))
        .map((c, i) => `<tr>
            <td>${i + 1}</td>
            <td>
                <div class="font-bold text-slate-800">${c.name}</div>
                <div class="text-[11px] text-slate-400">${c.nim}</div>
            </td>
            <td>${c.plate}</td>
            <td>${mask(c.uid)}</td>
            <td>${badge(c.status, c.status === 'Aktif' ? 'green' : 'red')}</td>
            <td>
                <button class="text-xs font-bold text-brand-600" data-action="edit-user" data-uid="${c.uid}">
                    Lihat / Edit
                </button>
            </td>
        </tr>`);

    return `<div class="grid gap-4 sm:grid-cols-3">
        ${stat('Total Pemilik', '1.310', 'users')}
        ${stat('Pemilik Terdaftar', '1.248', 'user-check')}
        ${stat('Memiliki Kartu Aktif', '1.248', 'credit-card')}
    </div>

    <div class="card mt-5">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
                <h3 class="font-extrabold">Daftar Pemilik Kartu</h3>
                <p class="mt-1 text-xs text-slate-400">Data identitas pemilik kartu RFID</p>
            </div>
            ${btn('Tambah Pemilik', 'add-user', 'primary', 'plus')}
        </div>

        <div class="p-4">
            <input class="input max-w-sm" placeholder="Cari nama, NIM, atau kendaraan..." value="${state.search}" data-search />
        </div>

        ${table(['No.', 'Nama / NIM', 'Nomor Kendaraan', 'UID Kartu', 'Status', 'Aksi'], rows)}
    </div>`;
}

function cardsPage() {
    const rows = state.cards.map(c => `<tr>
        <td>
            <div class="font-bold text-slate-800">${c.name}</div>
            <div class="text-[11px] text-slate-400">${c.nim}</div>
        </td>
        <td class="font-mono">${mask(c.uid)}</td>
        <td class="font-bold">${rupiah(c.balance)}</td>
        <td>${c.date}</td>
        <td>${badge(c.status, c.status === 'Aktif' ? 'green' : 'red')}</td>
        <td>
            <button class="text-xs font-bold text-brand-600" data-action="card-detail" data-uid="${c.uid}">Detail</button>
            <button class="ml-3 text-xs font-bold ${c.status === 'Aktif' ? 'text-rose-600' : 'text-emerald-600'}" data-action="toggle-card" data-uid="${c.uid}">
                ${c.status === 'Aktif' ? 'Blokir' : 'Aktifkan'}
            </button>
        </td>
    </tr>`);

    return `<div class="grid gap-4 sm:grid-cols-4">
        ${stat('Total Kartu', '1.310', 'contactless')}
        ${stat('Kartu Aktif', '1.248', 'credit-card')}
        ${stat('Kartu Diblokir', '12', 'ban')}
        ${stat('Scan Tidak Terdaftar', '5', 'scan-line')}
    </div>

    <div class="mt-5 grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <div class="card p-5">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="font-extrabold">Registrasi Kartu RFID</h3>
                ${badge('Mode REGISTER', 'purple')}
            </div>

            <div class="rounded-2xl border border-dashed border-brand-200 bg-brand-50/70 p-6 text-center">
                <div class="gate-pulse mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm">
                    ${icon('contactless', 32)}
                </div>

                <p class="mt-4 font-extrabold">Tempelkan Kartu RFID</p>
                <p class="mt-1 text-xs text-slate-500">Pastikan reader dalam kondisi terhubung.</p>

                <div class="mt-5 rounded-xl bg-white p-3 text-left">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">UID Terakhir Terdeteksi</p>
                    <p class="mt-1 font-mono text-lg font-extrabold tracking-widest">${state.scannedUid}</p>
                    <p class="mt-1 text-[11px] text-emerald-600">● Scan simulasi berhasil · 10:42:18</p>
                </div>

                <button class="btn-primary mt-4 w-full" data-action="simulate-scan">
                    ${icon('scan-line', 16)} Simulasikan Scan Kartu
                </button>
            </div>

            <button class="btn-secondary mt-3 w-full" data-action="register-card">Konfirmasi Registrasi</button>
            <p class="mt-3 text-[11px] leading-5 text-slate-400">
                Kartu baru akan memiliki saldo awal Rp0. Registrasi tidak menggerakkan palang.
            </p>
        </div>

        <div class="card p-5">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="font-extrabold">Informasi Reader</h3>
                ${badge('Terhubung', 'green')}
            </div>

            <div class="space-y-3">
                ${deviceRow('cpu', 'ESP8266', 'Perangkat utama', 'Online', 'green')}
                ${deviceRow('contactless', 'RFID Reader', 'Mode pembacaan', 'REGISTER', 'purple')}
            </div>

            <div class="mt-5 rounded-xl bg-slate-50 p-4">
                <p class="text-xs font-bold">Pengujian Read / Write</p>
                <p class="mt-1 text-xs leading-5 text-slate-500">
                    Pengujian hanya untuk data nonfinansial pada kartu uji yang kompatibel. Saldo tidak disimpan pada kartu.
                </p>
                <button class="btn-secondary mt-3" data-action="readwrite">Uji Baca / Tulis Kartu</button>
            </div>
        </div>
    </div>

    <div class="card mt-5">
        <div class="border-b border-slate-100 p-5">
            <h3 class="font-extrabold">Daftar Kartu RFID</h3>
        </div>
        ${table(['Pemilik Kartu', 'UID', 'Saldo', 'Tanggal Registrasi', 'Status', 'Aksi'], rows)}
    </div>`;
}

function topupPage() {
    const card = state.cards.find(c => c.uid === state.selectedCard) || state.cards[0];

    return `<div class="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div class="card p-5">
            <div class="mb-4 flex items-center justify-between">
                <div>
                    <h3 class="font-extrabold">Pemindaian Kartu</h3>
                    <p class="mt-1 text-xs text-slate-400">Pindai kartu sebelum melakukan top-up</p>
                </div>
                ${badge('Mode TOPUP', 'purple')}
            </div>

            <div class="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-5 text-center">
                <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-600">
                    ${icon('contactless', 28)}
                </div>
                <p class="mt-3 font-extrabold">Tempelkan Kartu RFID</p>
                <p class="mt-1 text-xs text-slate-500">Reader siap menerima kartu</p>
                <p class="mt-4 font-mono text-lg font-extrabold tracking-widest">${mask(card.uid)}</p>
                <button class="btn-primary mt-4" data-action="simulate-scan">
                    ${icon('scan-line', 16)} Simulasikan Scan
                </button>
            </div>

            <div class="mt-5 rounded-xl border border-slate-100 p-4">
                <p class="mb-3 text-xs font-bold text-slate-500">KARTU TERPILIH</p>
                <div class="flex items-center gap-3">
                    <div class="icon-box">${icon('user-round', 20)}</div>
                    <div class="min-w-0 flex-1">
                        <p class="font-bold">${card.name}</p>
                        <p class="text-xs text-slate-400">UID ${mask(card.uid)} · ${card.nim}</p>
                    </div>
                    ${badge(card.status, card.status === 'Aktif' ? 'green' : 'red')}
                </div>

                <div class="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                    <span class="text-xs text-slate-500">Saldo saat ini</span>
                    <strong class="text-xl">${rupiah(card.balance)}</strong>
                </div>
            </div>
        </div>

        <div class="card p-5">
            <h3 class="font-extrabold">Form Top-up Saldo</h3>
            <p class="mt-1 text-xs text-slate-400">Pilih nominal atau masukkan jumlah lainnya.</p>

            <form id="topup-form" class="mt-5 space-y-4">
                <div>
                    <label class="mb-2 block text-xs font-bold text-slate-600">Pilih Nominal</label>
                    <div class="grid grid-cols-2 gap-2">
                        ${[10000, 20000, 50000, 100000].map(v =>
                            `<button type="button" class="amount-choice rounded-xl border border-slate-200 p-3 text-sm font-bold hover:border-brand-400 hover:bg-brand-50" data-amount="${v}">
                                ${rupiah(v)}
                            </button>`
                        ).join('')}
                    </div>
                </div>

                ${field('Nominal Lainnya (Rp)', 'amount', 'Contoh: 25000', 'number')}

                <p class="-mt-2 text-[11px] text-slate-400">
                    Minimal Rp1.000 dan maksimal Rp1.000.000. Nominal harus bilangan bulat.
                </p>

                <div class="rounded-xl bg-slate-50 p-4">
                    <div class="flex justify-between text-xs text-slate-500">
                        <span>Saldo saat ini</span>
                        <span>${rupiah(card.balance)}</span>
                    </div>
                    <div class="mt-2 flex justify-between text-xs text-slate-500">
                        <span>Nominal top-up</span>
                        <span id="topup-preview">Rp0</span>
                    </div>
                    <div class="my-3 border-t border-slate-200"></div>
                    <div class="flex justify-between">
                        <span class="text-sm font-bold">Estimasi saldo baru</span>
                        <strong class="text-lg text-brand-700" id="balance-preview">${rupiah(card.balance)}</strong>
                    </div>
                </div>

                <button class="btn-primary w-full" type="submit">
                    ${icon('wallet', 16)} Konfirmasi Top-up
                </button>
                <p class="text-center text-[11px] text-slate-400">
                    Transaksi memerlukan autentikasi dan konfirmasi administrator.
                </p>
            </form>
        </div>
    </div>

    <div class="card mt-5 p-5">
        <h3 class="font-extrabold">Ketentuan Top-up</h3>
        <div class="mt-3 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
            <p>✓ Saldo bertambah melalui transaksi yang sah.</p>
            <p>✓ Setiap transaksi memiliki Request ID unik.</p>
            <p>✓ Top-up tidak membuka palang parkir.</p>
        </div>
    </div>`;
}

function parkingPage() {
    const rows = state.sessions.map(s => `<tr>
        <td class="font-mono text-xs">${s.id}</td>
        <td class="font-bold text-slate-800">${s.name}<div class="text-[11px] font-normal text-slate-400">${s.uid}</div></td>
        <td>${s.entry}</td>
        <td>${s.duration}</td>
        <td class="font-bold">${rupiah(s.rate)}</td>
        <td>${badge(s.status, s.status === 'Aktif' ? 'green' : 'gray')}</td>
        <td><button class="text-xs font-bold text-brand-600" data-action="session-detail" data-id="${s.id}">Detail</button></td>
    </tr>`);

    return `<div class="grid gap-4 sm:grid-cols-4">
        ${stat('Sesi Aktif', '36', 'car-front')}
        ${stat('Sesi Selesai', '182', 'check-circle')}
        ${stat('Sesi Hari Ini', '218', 'calendar-check')}
        ${stat('Total Biaya Parkir', rupiah(436000), 'wallet')}
    </div>

    <div class="card mt-5">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
                <h3 class="font-extrabold">Daftar Sesi Parkir</h3>
                <p class="mt-1 text-xs text-slate-400">Sesi aktif dan selesai</p>
            </div>
            <div class="flex gap-2">
                <button class="btn-secondary" data-action="filter-active">Sesi Aktif</button>
                <button class="btn-secondary" data-action="filter-all">Semua Sesi</button>
            </div>
        </div>
        ${table(['ID Sesi', 'Pemilik / UID', 'Waktu Masuk', 'Durasi', 'Snapshot Tarif', 'Status', 'Aksi'], rows)}
    </div>

    <div class="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
        <b>Aturan sesi:</b> ENTRY tidak memotong saldo. Pembayaran dilakukan saat EXIT menggunakan snapshot tarif ketika masuk. Jika saldo tidak cukup, sesi tetap aktif dan palang tetap tertutup.
    </div>`;
}

function transactionsPage() {
    const rows = state.transactions
        .filter(t => (t.id + t.name + t.type).toLowerCase().includes(state.search.toLowerCase()))
        .map(t => `<tr>
            <td class="font-mono text-[11px]">${t.id}</td>
            <td>${t.time}</td>
            <td class="font-bold">${t.name}<div class="text-[11px] font-normal text-slate-400">${t.uid}</div></td>
            <td>${badge(t.type === 'TOPUP' ? 'TOPUP' : t.type, 'purple')}</td>
            <td class="font-bold">${rupiah(t.amount)}</td>
            <td>${rupiah(t.before)}</td>
            <td>${rupiah(t.after)}</td>
            <td>${badge(t.status, t.status === 'Berhasil' ? 'green' : 'red')}</td>
            <td><button class="text-xs font-bold text-brand-600" data-action="transaction-detail" data-id="${t.id}">Detail</button></td>
        </tr>`);

    return `<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${stat('Total Transaksi', '1.842', 'receipt')}
        ${stat('Total Top-up', rupiah(12800000), 'wallet')}
        ${stat('Pembayaran Parkir', rupiah(4250000), 'car-front')}
        ${stat('Transaksi Gagal', '18', 'alert-circle')}
    </div>

    <div class="card mt-5">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
                <h3 class="font-extrabold">Ledger Transaksi</h3>
                <p class="mt-1 text-xs text-slate-400">Riwayat perubahan saldo yang bersifat read-only</p>
            </div>
            <button class="btn-secondary" data-action="export-csv">${icon('download', 15)} Ekspor CSV</button>
        </div>

        <div class="flex flex-wrap gap-2 p-4">
            <input class="input max-w-sm" placeholder="Cari ID transaksi atau pemilik..." value="${state.search}" data-search />
            <select class="input !w-auto" id="transaction-filter">
                <option>Semua</option>
                <option>TOPUP</option>
                <option>PARKING_PAYMENT</option>
            </select>
        </div>

        ${table(['ID Transaksi', 'Waktu', 'Pemilik / UID', 'Jenis', 'Nominal', 'Saldo Sebelum', 'Saldo Sesudah', 'Status', 'Aksi'], rows)}
    </div>`;
}
function devicesPage() {
    const modes = [
        ['REGISTER', 'Registrasi kartu', 'user-plus'],
        ['TOPUP', 'Pengisian saldo', 'wallet'],
        ['ENTRY', 'Kendaraan masuk', 'log-in'],
        ['EXIT', 'Kendaraan keluar & pembayaran', 'log-out']
    ];

    return `<div class="grid gap-4 md:grid-cols-3">
        ${deviceRow('cpu', 'ESP8266 NodeMCU', 'Perangkat utama · Heartbeat 10:42:18', 'Online', 'green')}
        ${deviceRow('contactless', 'RFID Reader', 'RC522 · SPI', 'Terhubung', 'green')}
        ${deviceRow('settings', 'Servo Motor', 'Perintah terakhir', 'Tertutup', 'gray')}
    </div>

    <div class="card mt-5 p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h3 class="font-extrabold">Pemilihan Mode Reader</h3>
                <p class="mt-1 text-xs text-slate-400">Pilih satu mode operasional untuk reader RFID.</p>
            </div>
            ${badge(`Mode aktif: ${state.mode}`, 'purple')}
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            ${modes.map(([m, desc, ico]) => `
                <button class="rounded-2xl border p-4 text-left transition ${state.mode === m ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-100' : 'border-slate-200 hover:border-brand-200'}" data-mode="${m}">
                    <div class="flex items-center justify-between">
                        <div class="icon-box">${icon(ico, 21)}</div>
                        ${state.mode === m ? badge('Aktif', 'purple') : badge('Pilih', 'gray')}
                    </div>
                    <p class="mt-4 font-extrabold">${m}</p>
                    <p class="mt-1 text-xs text-slate-500">${desc}</p>
                </button>
            `).join('')}
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-xs">
            <span class="text-slate-500">Mode version saat ini: <b class="text-slate-800">v${state.modeVersion}</b></span>
            <span class="text-slate-500">Perubahan mode memerlukan konfirmasi administrator.</span>
        </div>
    </div>

    <div class="mt-5 grid gap-5 xl:grid-cols-2">
        <div class="card p-5">
            <h3 class="font-extrabold">Informasi Perangkat</h3>
            <div class="mt-4 space-y-4">
                ${deviceRow('wifi', 'Koneksi jaringan', 'LAN demonstrasi', 'Aktif', 'green')}
                ${deviceRow('activity', 'Heartbeat', 'Terakhir diterima', '10:42:18', 'purple')}
                ${deviceRow('scan-line', 'Pemindaian terakhir', 'UID tersamarkan', 'A38F••••', 'gray')}
                ${deviceRow('git-commit', 'Versi mode', 'Mode version', 'v' + state.modeVersion, 'purple')}
            </div>
        </div>

        <div class="card p-5">
            <h3 class="font-extrabold">Status Perintah Servo</h3>
            <div class="mt-4 rounded-xl bg-slate-50 p-4">
                <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-500">Perintah terakhir</span>
                    ${badge('ACK diterima', 'green')}
                </div>
                <p class="mt-2 text-lg font-extrabold">CLOSED</p>
                <p class="mt-1 text-xs text-slate-400">CMD-20261126-008 · 10:40:02</p>
            </div>
            <p class="mt-4 text-xs leading-5 text-slate-500">
                Servo hanya menerima perintah OPEN dari transaksi ENTRY atau EXIT yang telah disahkan server. REGISTER dan TOPUP tidak menggerakkan servo.
            </p>
        </div>
    </div>

    <div class="card mt-5">
        <div class="border-b border-slate-100 p-5">
            <h3 class="font-extrabold">Log Aktivitas Perangkat</h3>
        </div>
        ${table(
            ['Waktu', 'Aktor', 'Aktivitas', 'Hasil', 'Request ID'],
            state.logs.map(l => `
                <tr>
                    <td>${l.time}</td>
                    <td>${l.actor}</td>
                    <td>${l.action}</td>
                    <td>${badge(l.result, l.result === 'Berhasil' ? 'green' : 'red')}</td>
                    <td class="font-mono text-xs">${l.id}</td>
                </tr>
            `)
        )}
    </div>`;
}

function auditPage() {
    return `<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        ${stat('Total Aktivitas', '2.481', 'activity')}
        ${stat('Login Gagal', '12', 'lock')}
        ${stat('Permintaan Tanpa Otorisasi', '4', 'shield-alert')}
        ${stat('Transaksi Ditolak', '18', 'ban')}
    </div>

    <div class="card mt-5">
        <div class="border-b border-slate-100 p-5">
            <h3 class="font-extrabold">Log Keamanan Sistem</h3>
            <p class="mt-1 text-xs text-slate-400">Catatan aktivitas administrator dan perangkat</p>
        </div>

        ${table(
            ['Waktu', 'Aktor', 'Aktivitas', 'Hasil', 'Request ID', 'Detail'],
            state.logs.map(l => `
                <tr>
                    <td>${l.time}</td>
                    <td>${l.actor}</td>
                    <td>${l.action}</td>
                    <td>${badge(l.result, l.result === 'Berhasil' ? 'green' : 'red')}</td>
                    <td class="font-mono text-xs">${l.id}</td>
                    <td>
                        <button class="text-xs font-bold text-brand-600" data-action="audit-detail" data-id="${l.id}">Lihat</button>
                    </td>
                </tr>
            `)
        )}
    </div>

    <div class="mt-5 rounded-xl border border-violet-100 bg-violet-50 p-4 text-xs leading-5 text-violet-800">
        Log audit bersifat read-only. Password, token autentikasi, dan data sensitif tidak boleh ditampilkan pada halaman ini.
    </div>`;
}

function settingsPage() {
    return `<div class="grid gap-5 xl:grid-cols-2">
        <div class="card p-5">
            <div class="flex items-center gap-3">
                <div class="icon-box">${icon('wallet', 20)}</div>
                <div>
                    <h3 class="font-extrabold">Tarif Parkir</h3>
                    <p class="text-xs text-slate-400">Berlaku untuk sesi parkir baru</p>
                </div>
            </div>

            <div class="mt-5 rounded-xl bg-slate-50 p-4">
                <p class="text-xs text-slate-500">Tarif saat ini</p>
                <p class="mt-1 text-3xl font-extrabold text-brand-700">
                    Rp2.000 <span class="text-sm font-semibold text-slate-400">/ sesi</span>
                </p>
            </div>

            <button class="btn-primary mt-4" data-action="edit-rate">Ubah Tarif</button>
            <p class="mt-3 text-[11px] leading-5 text-slate-400">
                Tarif yang baru hanya berlaku untuk sesi berikutnya. Sesi aktif mempertahankan snapshot tarif saat ENTRY.
            </p>
        </div>

        <div class="card p-5">
            <div class="flex items-center gap-3">
                <div class="icon-box">${icon('wallet-cards', 20)}</div>
                <div>
                    <h3 class="font-extrabold">Batas Top-up</h3>
                    <p class="text-xs text-slate-400">Validasi nominal transaksi</p>
                </div>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-3">
                <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-xs text-slate-500">Minimum</p>
                    <p class="mt-1 text-xl font-extrabold">Rp1.000</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-xs text-slate-500">Maksimum</p>
                    <p class="mt-1 text-xl font-extrabold">Rp1.000.000</p>
                </div>
            </div>
            <p class="mt-3 text-[11px] text-slate-400">Nominal menggunakan bilangan bulat rupiah.</p>
        </div>

        <div class="card p-5">
            <div class="flex items-center gap-3">
                <div class="icon-box">${icon('gate', 20)}</div>
                <div>
                    <h3 class="font-extrabold">Konfigurasi Gerbang</h3>
                    <p class="text-xs text-slate-400">Parameter servo miniatur</p>
                </div>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-3">
                <div>${field('Durasi terbuka (detik)', 'servoDuration', '3', 'number', '3')}</div>
                <div>${selectField('Kondisi awal', 'servoDefault', ['CLOSED'])}</div>
            </div>
            <button class="btn-secondary mt-4" data-action="save-settings">Simpan Konfigurasi</button>
        </div>

        <div class="card p-5">
            <div class="flex items-center gap-3">
                <div class="icon-box">${icon('monitor', 20)}</div>
                <div>
                    <h3 class="font-extrabold">Digital Gate Display</h3>
                    <p class="text-xs text-slate-400">Pengaturan layar demonstrasi</p>
                </div>
            </div>

            <div class="mt-5 space-y-3">
                <div class="flex justify-between text-sm"><span>Status Display</span>${badge('Aktif', 'green')}</div>
                <div class="flex justify-between text-sm"><span>Durasi notifikasi</span><b>5 detik</b></div>
                <div class="flex justify-between text-sm"><span>Interval polling</span><b>1 detik</b></div>
            </div>
            <button class="btn-secondary mt-4" data-page="display">Buka Digital Gate Display</button>
        </div>
    </div>

    <div class="card mt-5 p-5">
        <h3 class="font-extrabold">Informasi Sistem</h3>
        <div class="mt-4 grid gap-4 text-xs sm:grid-cols-3">
            <div><p class="text-slate-400">Nama Produk</p><b>CampusPay</b></div>
            <div><p class="text-slate-400">Versi</p><b>1.0.0 — MVP</b></div>
            <div><p class="text-slate-400">Lingkungan</p><b>Prototipe Lokal</b></div>
            <div><p class="text-slate-400">Backend</p>${badge('Simulasi UI', 'yellow')}</div>
            <div><p class="text-slate-400">Database</p>${badge('Belum Terhubung', 'gray')}</div>
            <div><p class="text-slate-400">Mode</p><b>Demo Frontend</b></div>
        </div>
    </div>`;
}

function loginPage() {
    return `<div class="grid min-h-screen lg:grid-cols-2">
        <div class="hidden flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-violet-500 p-12 text-white lg:flex">
            <div class="flex items-center gap-3">
                <div class="h-12 w-12 overflow-hidden rounded-2xl bg-white/15">
                    <img src="/assets/campuspay-mark.svg" alt="CampusPay" class="h-full w-full object-cover" />
                </div>
                <div>
                    <p class="text-xl font-extrabold">CampusPay</p>
                    <p class="text-xs text-violet-100">Smart Campus Parking</p>
                </div>
            </div>

            <div>
                <p class="text-sm font-semibold text-violet-100">SISTEM PARKIR KAMPUS BERBASIS RFID</p>
                <h1 class="mt-4 max-w-lg text-5xl font-extrabold leading-tight tracking-tight">
                    Kelola parkir kampus dengan lebih aman dan mudah.
                </h1>
                <p class="mt-5 max-w-md text-sm leading-7 text-violet-100/80">
                    Satu platform untuk mengelola kartu RFID, saldo simulasi, transaksi, dan perangkat gerbang parkir.
                </p>
            </div>

            <p class="text-xs text-violet-100/60">© 2026 CampusPay · Prototipe Akademik</p>
        </div>

        <div class="flex items-center justify-center bg-slate-50 p-6">
            <div class="w-full max-w-md">
                <div class="mb-8 flex items-center gap-3 lg:hidden">
                    <div class="h-11 w-11 overflow-hidden rounded-2xl bg-brand-600">
                        <img src="/assets/campuspay-mark.svg" alt="CampusPay" class="h-full w-full object-cover" />
                    </div>
                    <div>
                        <p class="text-lg font-extrabold">CampusPay</p>
                        <p class="text-[10px] text-slate-400">SMART CAMPUS PARKING</p>
                    </div>
                </div>

                <div class="card p-7 sm:p-9">
                    <div class="mb-7">
                        <div class="mb-5 hidden h-12 w-12 overflow-hidden rounded-2xl bg-brand-600 lg:block">
                            <img src="/assets/campuspay-mark.svg" alt="CampusPay" class="h-full w-full object-cover" />
                        </div>
                        <h2 class="text-2xl font-extrabold tracking-tight">Selamat Datang</h2>
                        <p class="mt-2 text-sm text-slate-500">Masuk untuk mengelola sistem parkir kampus.</p>
                    </div>

                    <form id="login-form" class="space-y-4">
                        ${field('Email atau Username', 'username', 'Masukkan email atau username')}
                        ${field('Password', 'password', 'Masukkan password', 'password')}

                        <div class="flex items-center justify-between text-xs">
                            <label class="flex items-center gap-2 text-slate-500">
                                <input type="checkbox" class="rounded border-slate-300 text-brand-600"> Ingat saya
                            </label>
                            <span class="font-semibold text-brand-600">Akses administrator</span>
                        </div>

                        <button class="btn-primary w-full py-3" type="submit">
                            Masuk ke Dashboard ${icon('arrow-right', 16)}
                        </button>
                    </form>

                    <p class="mt-6 text-center text-[11px] leading-5 text-slate-400">
                        Akses hanya untuk administrator yang berwenang. Tidak tersedia pendaftaran akun publik.
                    </p>
                </div>

                <p class="mt-5 text-center text-[11px] text-slate-400">CampusPay v1.0 · Lingkungan demonstrasi</p>
            </div>
        </div>
    </div>`;
}

function renderPage() {
    switch (state.page) {
        case 'dashboard': return dashboard();
        case 'users': return usersPage();
        case 'cards': return cardsPage();
        case 'topup': return topupPage();
        case 'parking': return parkingPage();
        case 'transactions': return transactionsPage();
        case 'devices': return devicesPage();
        case 'audit': return auditPage();
        case 'settings': return settingsPage();
        default: return dashboard();
    }
}

function displayPage() {
    const configs = {
        STANDBY: ['Sistem Siap Digunakan', 'Silakan Tempelkan Kartu RFID', 'contactless', 'text-brand-300'],
        PROCESSING: ['Memproses Kartu', 'Mohon tunggu, transaksi sedang diproses', 'loader-circle', 'text-sky-300'],
        ENTRY_SUCCESS: ['SELAMAT DATANG', 'Kendaraan berhasil masuk', 'check-circle', 'text-emerald-300'],
        EXIT_SUCCESS: ['TERIMA KASIH', 'Transaksi keluar berhasil', 'check-circle', 'text-emerald-300'],
        REGISTER_SCAN: ['KARTU TERDETEKSI', 'Menunggu konfirmasi administrator', 'scan-line', 'text-violet-300'],
        TOPUP_SUCCESS: ['TOP-UP BERHASIL', 'Saldo kartu berhasil diperbarui', 'wallet', 'text-emerald-300'],
        UNKNOWN_CARD: ['KARTU TIDAK DIKENAL', 'Silakan hubungi administrator', 'x-circle', 'text-rose-300'],
        BLOCKED_CARD: ['KARTU DIBLOKIR', 'Akses tidak dapat diproses', 'ban', 'text-rose-300'],
        INSUFFICIENT_BALANCE: ['SALDO TIDAK MENCUKUPI', 'Silakan lakukan top-up saldo', 'wallet', 'text-amber-300'],
        INVALID_SESSION: ['SESI PARKIR TIDAK VALID', 'Tidak ditemukan sesi parkir aktif', 'alert-circle', 'text-rose-300'],
        ERROR: ['TERJADI KESALAHAN', 'Silakan hubungi administrator', 'alert-triangle', 'text-rose-300'],
        OFFLINE: ['KONEKSI TERPUTUS', 'Sistem sedang tidak terhubung ke server', 'wifi-off', 'text-rose-300']
    };

    const c = configs[state.displayState] || configs.STANDBY;
    const success = ['ENTRY_SUCCESS', 'EXIT_SUCCESS', 'TOPUP_SUCCESS'].includes(state.displayState);

    return `<div class="gate-display -mx-5 -mt-6 min-h-[calc(100vh-72px)] md:-mx-8 md:-mt-8">
        <div class="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-10">
            <div class="flex items-center gap-3">
                <div class="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500 text-white">${icon('contactless', 25)}</div>
                <div>
                    <p class="text-lg font-extrabold tracking-tight">CampusPay</p>
                    <p class="text-[10px] font-semibold tracking-[.18em] text-violet-200/60">SMART CAMPUS PARKING</p>
                </div>
            </div>

            <div class="text-right">
                <div class="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                    <span class="h-2 w-2 rounded-full bg-emerald-300"></span> ESP8266 Online
                </div>
                <p class="mt-2 text-[11px] text-violet-100/50">Mode aktif: <b class="text-violet-100">${state.mode}</b></p>
            </div>
        </div>

        <div class="mx-auto flex max-w-5xl flex-col items-center px-5 py-10 text-center md:py-14">
            <div class="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-violet-100/70">
                DIGITAL GATE DISPLAY · GERBANG PARKIR KAMPUS
            </div>

            <div class="grid h-36 w-36 place-items-center rounded-[2rem] border border-white/10 bg-white/[.06] shadow-2xl shadow-violet-950/40 md:h-44 md:w-44 ${state.displayState === 'STANDBY' ? 'gate-pulse' : ''}">
                <span class="${c[3]}">${icon(c[2], 72)}</span>
            </div>

            <p class="mt-9 text-xs font-extrabold tracking-[.3em] text-violet-200/60">${state.displayState.replaceAll('_', ' ')}</p>
            <h1 class="mt-3 text-3xl font-extrabold tracking-tight md:text-5xl">${c[0]}</h1>
            <p class="mt-3 max-w-xl text-sm text-violet-100/65 md:text-lg">${c[1]}</p>

            ${state.displayState === 'STANDBY' ? `
                <div class="mt-9 rounded-2xl border border-white/10 bg-white/[.05] px-8 py-5">
                    <p class="text-sm font-bold text-white">Tempelkan kartu pada RFID Reader</p>
                    <p class="mt-1 text-xs text-violet-100/50">Pastikan kartu berada dekat reader hingga terbaca.</p>
                </div>
            ` : ''}

            ${success ? `
                <div class="mt-8 grid w-full max-w-lg grid-cols-2 gap-3">
                    ${displayInfo('Waktu', '10:42:18')}
                    ${displayInfo('UID Kartu', 'A38F••••')}
                    ${state.displayState === 'EXIT_SUCCESS' ? displayInfo('Biaya Parkir', 'Rp2.000') : displayInfo('Status', 'Berhasil')}
                    ${state.displayState === 'EXIT_SUCCESS' ? displayInfo('Sisa Saldo', 'Rp18.000') : displayInfo('Gerbang', 'Otorisasi Buka')}
                </div>
            ` : ''}

            ${state.displayState === 'INSUFFICIENT_BALANCE' ? `
                <div class="mt-8 grid w-full max-w-lg grid-cols-2 gap-3">
                    ${displayInfo('Biaya Diperlukan', 'Rp2.000')}
                    ${displayInfo('Saldo Saat Ini', 'Rp500')}
                </div>
            ` : ''}

            <div class="mt-10 flex flex-wrap justify-center gap-2">
                <button class="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold text-violet-100/70" data-action="display-reset">Reset Tampilan</button>
                <button class="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold text-violet-100/70" data-action="display-offline">Simulasi Offline</button>
                <button class="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-semibold text-violet-100/70" data-action="display-test">Uji Hasil Scan</button>
            </div>

            <p class="mt-12 text-[10px] tracking-wider text-violet-100/30">CAMPUSPAY · PROTOTIPE DEMONSTRASI · SALDO SIMULASI</p>
        </div>
    </div>`;
}

function displayInfo(k, v) {
    return `<div class="rounded-xl border border-white/10 bg-white/[.05] p-4 text-left">
        <p class="text-[10px] font-bold uppercase tracking-wider text-violet-100/40">${k}</p>
        <p class="mt-1 text-lg font-extrabold">${v}</p>
    </div>`;
}

/* =========================
   MODAL & TOAST
========================= */

function modal(title, body, footer = '') {
    const root = document.getElementById('modal-root');
    if (!root) return;

    root.innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-panel">
                <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 class="font-extrabold">${title}</h3>
                    <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100" data-action="close-modal">
                        ${icon('x', 18)}
                    </button>
                </div>

                <div class="p-5">${body}</div>

                ${footer ? `
                    <div class="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
                        ${footer}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    lucideRefresh();
}

function closeModal() {
    const root = document.getElementById('modal-root');
    if (root) root.innerHTML = '';
}

function toast(message, type = 'success') {
    const root = document.getElementById('toast-root');
    if (!root) return;

    root.innerHTML = `
        <div class="toast flex items-center gap-3 rounded-xl border ${type === 'error' ? 'border-rose-200 bg-white' : 'border-emerald-200 bg-white'} px-4 py-3 shadow-xl">
            <div class="${type === 'error' ? 'text-rose-600' : 'text-emerald-600'}">
                ${icon(type === 'error' ? 'alert-circle' : 'check-circle', 19)}
            </div>
            <p class="text-sm font-semibold text-slate-700">${message}</p>
        </div>
    `;

    clearTimeout(state.toast);
    state.toast = setTimeout(() => {
        root.innerHTML = '';
    }, 3000);

    lucideRefresh();
}

function lucideRefresh() {
    if (window.lucide) window.lucide.createIcons();
}

/* =========================
   NAVIGATION
========================= */

function navigate(page) {
    state.page = page;
    state.search = '';

    history.replaceState(null, '', `#/${page}`);

    const app = document.getElementById('app');

    app.innerHTML =
        page === 'display' ? displayShell() :
        page === 'login' ? loginPage() :
        shell();

    lucideRefresh();

    if (page === 'dashboard') drawChart();
    if (page === 'topup') bindTopupPreview();
}

function displayShell() {
    return `<div class="min-h-screen">
        <header class="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
            <div class="flex items-center gap-2">
                <div class="h-9 w-9 overflow-hidden rounded-xl bg-brand-600">
                    <img src="/assets/campuspay-mark.svg" alt="CampusPay" class="h-full w-full object-cover" />
                </div>
                <div>
                    <p class="text-sm font-extrabold">CampusPay Display</p>
                    <p class="text-[10px] text-slate-400">Tampilan demonstrasi gerbang</p>
                </div>
            </div>
            <button class="btn-secondary" data-page="dashboard">
                ${icon('arrow-left', 15)} Kembali ke Admin
            </button>
        </header>

        ${displayPage()}
    </div>

    <div id="modal-root"></div>
    <div id="toast-root" class="fixed bottom-5 right-5 z-[100]"></div>`;
}

/* =========================
   CHART
========================= */

function drawChart() {
    const root = document.getElementById('activity-chart');
    if (!root) return;

    const values = [10, 18, 25, 22, 38, 31];
    const labels = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'];

    const width = 720;
    const height = 260;
    const left = 48;
    const right = 14;
    const top = 18;
    const bottom = 34;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const maxValue = 50;

    const points = values.map((value, index) => ({
        x: left + (plotWidth / (values.length - 1)) * index,
        y: top + plotHeight - (value / maxValue) * plotHeight,
        value,
        label: labels[index]
    }));

    const linePath = points.map((point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ');

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${top + plotHeight} L ${points[0].x} ${top + plotHeight} Z`;

    const grid = [0, 10, 20, 30, 40, 50].map(value => {
        const y = top + plotHeight - (value / maxValue) * plotHeight;
        return `
            <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="chart-grid-line" />
            <text x="${left - 12}" y="${y + 4}" text-anchor="end" class="chart-axis-label">${value}</text>
        `;
    }).join('');

    const dots = points.map(point => `
        <circle cx="${point.x}" cy="${point.y}" r="7" class="chart-point-halo" />
        <circle cx="${point.x}" cy="${point.y}" r="4" class="chart-point" />
        <text x="${point.x}" y="${height - 7}" text-anchor="middle" class="chart-axis-label">${point.label}</text>
    `).join('');

    root.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id="activity-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#7045dc" stop-opacity=".20" />
                    <stop offset="100%" stop-color="#7045dc" stop-opacity=".015" />
                </linearGradient>
            </defs>
            ${grid}
            <path d="${areaPath}" fill="url(#activity-area-gradient)" />
            <path d="${linePath}" class="chart-line" />
            ${dots}
        </svg>
    `;
}

/* =========================
   TOP-UP PREVIEW
========================= */

function bindTopupPreview() {
    const form = document.querySelector('#topup-form');
    if (!form) return;

    const input = form.querySelector('[name="amount"]');

    const update = () => {
        const amount = Number(input.value || 0);
        const card = state.cards.find(c => c.uid === state.selectedCard) || state.cards[0];

        document.getElementById('topup-preview').textContent = rupiah(amount);
        document.getElementById('balance-preview').textContent = rupiah(card.balance + amount);
    };

    input.addEventListener('input', update);

    document.querySelectorAll('[data-amount]').forEach(button => {
        button.addEventListener('click', () => {
            input.value = button.dataset.amount;
            update();

            document.querySelectorAll('[data-amount]').forEach(item => {
                item.classList.remove('border-brand-500', 'bg-brand-50');
            });

            button.classList.add('border-brand-500', 'bg-brand-50');
        });
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    sidebar?.classList.toggle('open');
    backdrop?.classList.toggle('show');
}

/* =========================
   ACTION HANDLER
========================= */

function handleAction(action, el) {
    const uid = el.dataset.uid;

    if (action === 'close-modal') {
        closeModal();
        return;
    }

    if (action === 'confirm-mode') {
        const nextMode = document.getElementById('modal-root').dataset.nextMode;

        if (!nextMode) return;

        state.mode = nextMode;
        state.modeVersion++;

        closeModal();
        toast('Mode reader diperbarui menjadi ' + state.mode + '.');
        navigate('devices');
        return;
    }

    if (action === 'confirm-topup') {
        const amount = Number(document.getElementById('modal-root').dataset.amount);
        const card = state.cards.find(c => c.uid === state.selectedCard) || state.cards[0];

        if (!Number.isInteger(amount) || amount < 1000 || amount > 1000000) {
            toast('Nominal top-up tidak valid.', 'error');
            return;
        }

        const before = card.balance;
        card.balance += amount;

        const id = 'TRX-' + Date.now();
        const time = new Date().toLocaleTimeString('id-ID');

        state.transactions.unshift({
            id,
            time,
            name: card.name,
            uid: mask(card.uid),
            type: 'TOPUP',
            amount,
            before,
            after: card.balance,
            status: 'Berhasil'
        });

        state.logs.unshift({
            time,
            actor: 'Admin',
            action: 'Top-up saldo ' + rupiah(amount),
            result: 'Berhasil',
            id: 'REQ-' + Math.random().toString(16).slice(2, 6).toUpperCase()
        });

        closeModal();
        toast('Top-up berhasil. Saldo terbaru ' + rupiah(card.balance));
        navigate('topup');
        return;
    }

    if (action === 'simulate-scan') {
        state.scannedUid = ['A38F2109', '08D4E5F6', 'C19A02EF'][Math.floor(Math.random() * 3)];
        state.selectedCard = state.scannedUid;

        toast('Kartu berhasil dipindai: ' + mask(state.scannedUid));
        navigate(state.page);
        return;
    }

    if (action === 'register-card') {
        const card = state.cards.find(c => c.uid === state.scannedUid);

        if (card) {
            toast('Kartu sudah terdaftar. UID harus unik.', 'error');
            return;
        }

        modal(
            'Konfirmasi Registrasi Kartu',
            `<div class="space-y-4">
                <div class="rounded-xl bg-brand-50 p-3">
                    <p class="text-xs text-slate-500">UID hasil scan terbaru</p>
                    <p class="mt-1 font-mono font-extrabold">${state.scannedUid}</p>
                </div>
                ${field('Nama Pemilik', 'name', 'Nama lengkap')}
                ${field('NIM', 'nim', 'Nomor induk mahasiswa')}
                ${field('Nomor Kendaraan', 'plate', 'Contoh: D 1234 ABC')}
                <p class="text-xs text-slate-500">Saldo awal kartu adalah Rp0. Proses ini tidak membuka palang.</p>
            </div>`,
            `${btn('Batal', 'close-modal', 'secondary')}
             ${btn('Simpan Kartu', 'confirm-register', 'primary')}`
        );
        return;
    }

    if (action === 'confirm-register') {
        const form = document.querySelector('#modal-root .modal-panel');

        const name = form.querySelector('[name="name"]').value;
        const nim = form.querySelector('[name="nim"]').value;
        const plate = form.querySelector('[name="plate"]').value;

        if (!name || !nim) {
            toast('Nama dan NIM wajib diisi.', 'error');
            return;
        }

        state.cards.push({
            name,
            nim,
            plate,
            uid: state.scannedUid,
            balance: 0,
            status: 'Aktif',
            date: '26 Nov 2026'
        });

        closeModal();
        toast('Kartu berhasil didaftarkan dengan saldo Rp0.');
        navigate('cards');
        return;
    }

    if (action === 'add-user') {
        modal(
            'Tambah Pemilik Kartu',
            `<div class="space-y-3">
                ${field('Nama Lengkap', 'name', 'Nama mahasiswa')}
                ${field('NIM', 'nim', 'Nomor induk mahasiswa')}
                ${field('Nomor Kendaraan', 'plate', 'Nomor kendaraan')}
            </div>`,
            `${btn('Batal', 'close-modal', 'secondary')}
             ${btn('Simpan', 'save-user', 'primary')}`
        );
        return;
    }

    if (action === 'save-user') {
        const form = document.querySelector('.modal-panel');

        const name = form.querySelector('[name="name"]').value;
        const nim = form.querySelector('[name="nim"]').value;
        const plate = form.querySelector('[name="plate"]').value;

        if (!name || !nim) {
            toast('Nama dan NIM wajib diisi.', 'error');
            return;
        }

        state.cards.push({
            name,
            nim,
            plate,
            uid: 'BELUM-ADA',
            balance: 0,
            status: 'Belum Ada Kartu',
            date: '26 Nov 2026'
        });

        closeModal();
        toast('Data pemilik berhasil ditambahkan.');
        navigate('users');
        return;
    }

    if (action === 'toggle-card') {
        const card = state.cards.find(c => c.uid === uid);

        if (card) {
            card.status = card.status === 'Aktif' ? 'Diblokir' : 'Aktif';
            toast(`Status kartu ${card.name} diubah menjadi ${card.status}.`);
            navigate('cards');
        }
        return;
    }

    if (action === 'card-detail' || action === 'edit-user') {
        const card = state.cards.find(c => c.uid === uid);
        if (!card) return;

        modal(
            'Detail Kartu / Pemilik',
            `<div class="space-y-3">
                <div class="flex items-center gap-3">
                    <div class="icon-box">${icon('user-round', 22)}</div>
                    <div>
                        <p class="font-extrabold">${card.name}</p>
                        <p class="text-xs text-slate-400">${card.nim}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    ${displayInfo('UID', mask(card.uid))}
                    ${displayInfo('Saldo', rupiah(card.balance))}
                    ${displayInfo('Kendaraan', card.plate || '—')}
                    ${displayInfo('Status', card.status)}
                </div>

                <p class="text-xs text-slate-500">
                    Saldo tidak dapat diedit langsung. Perubahan hanya melalui transaksi top-up atau pembayaran parkir yang sah.
                </p>
            </div>`,
            btn('Tutup', 'close-modal', 'secondary')
        );
        return;
    }

    if (action === 'transaction-detail') {
        const transaction = state.transactions.find(t => t.id === el.dataset.id);
        if (!transaction) return;

        modal(
            'Detail Transaksi',
            `<div class="space-y-3">
                <div class="rounded-xl bg-slate-50 p-3">
                    <p class="text-[10px] font-bold text-slate-400">ID TRANSAKSI</p>
                    <p class="mt-1 font-mono text-sm font-extrabold">${transaction.id}</p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    ${displayInfo('Pemilik', transaction.name)}
                    ${displayInfo('Jenis', transaction.type)}
                    ${displayInfo('Nominal', rupiah(transaction.amount))}
                    ${displayInfo('Status', transaction.status)}
                    ${displayInfo('Saldo Sebelum', rupiah(transaction.before))}
                    ${displayInfo('Saldo Sesudah', rupiah(transaction.after))}
                </div>

                <p class="text-xs text-slate-400">Data transaksi bersifat read-only.</p>
            </div>`,
            btn('Tutup', 'close-modal', 'secondary')
        );
        return;
    }

    if (action === 'session-detail') {
        const session = state.sessions.find(s => s.id === el.dataset.id);
        if (!session) return;

        modal(
            'Detail Sesi Parkir',
            `<div class="grid grid-cols-2 gap-3">
                ${displayInfo('ID Sesi', session.id)}
                ${displayInfo('Status', session.status)}
                ${displayInfo('Pemilik', session.name)}
                ${displayInfo('UID', session.uid)}
                ${displayInfo('Waktu Masuk', session.entry)}
                ${displayInfo('Durasi', session.duration)}
                ${displayInfo('Snapshot Tarif', rupiah(session.rate))}
            </div>
            <p class="mt-4 text-xs text-slate-500">
                Sesi hanya selesai setelah pembayaran EXIT berhasil di-commit.
            </p>`,
            btn('Tutup', 'close-modal', 'secondary')
        );
        return;
    }

    if (action === 'audit-detail') {
        const log = state.logs.find(l => l.id === el.dataset.id);
        if (!log) return;

        modal(
            'Detail Audit Keamanan',
            `<div class="space-y-3">
                ${displayInfo('Waktu', log.time)}
                ${displayInfo('Aktor', log.actor)}
                ${displayInfo('Aktivitas', log.action)}
                ${displayInfo('Hasil', log.result)}
                ${displayInfo('Request ID', log.id)}
                <p class="text-xs text-slate-500">Metadata sensitif tidak ditampilkan.</p>
            </div>`,
            btn('Tutup', 'close-modal', 'secondary')
        );
        return;
    }

    if (action === 'edit-rate') {
        modal(
            'Ubah Tarif Parkir',
            `<div class="space-y-3">
                ${field('Tarif Baru (Rupiah)', 'rate', 'Contoh: 2000', 'number', '2000')}
                <p class="text-xs text-amber-700">
                    Tarif baru hanya berlaku untuk sesi yang dibuat setelah perubahan. Sesi aktif tetap menggunakan tarif sebelumnya.
                </p>
            </div>`,
            `${btn('Batal', 'close-modal', 'secondary')}
             ${btn('Simpan Tarif', 'save-rate', 'primary')}`
        );
        return;
    }

    if (action === 'save-rate') {
        const amount = Number(document.querySelector('[name="rate"]').value);

        if (!Number.isInteger(amount) || amount < 1) {
            toast('Tarif harus berupa bilangan bulat positif.', 'error');
            return;
        }

        closeModal();
        toast('Tarif baru berhasil disimpan (simulasi).');
        return;
    }

    if (action === 'save-settings') {
        toast('Konfigurasi berhasil disimpan (simulasi).');
        return;
    }

    if (action === 'readwrite') {
        toast('Mode uji read/write data nonfinansial siap (simulasi).');
        return;
    }

    if (action === 'export-csv') {
        const lines = [
            ['ID Transaksi', 'Waktu', 'Pemilik', 'UID', 'Jenis', 'Nominal', 'Saldo Sebelum', 'Saldo Sesudah', 'Status'],
            ...state.transactions.map(t => [
                t.id, t.time, t.name, t.uid, t.type,
                t.amount, t.before, t.after, t.status
            ])
        ];

        const csv = lines
            .map(row => row.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(','))
            .join('\n');

        const a = document.createElement('a');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));

        a.href = url;
        a.download = 'campuspay-transaksi.csv';
        a.click();

        URL.revokeObjectURL(url);
        toast('File CSV berhasil disiapkan.');
        return;
    }

    if (action === 'filter-active') {
        state.filter = 'Aktif';
        navigate('parking');
        return;
    }

    if (action === 'filter-all') {
        state.filter = 'Semua';
        navigate('parking');
        return;
    }

    if (action === 'display-reset') {
        state.displayState = 'STANDBY';
        navigate('display');
        return;
    }

    if (action === 'display-offline') {
        state.displayState = 'OFFLINE';
        navigate('display');
        return;
    }

    if (action === 'display-test') {
        modal(
            'Simulasi Hasil Pemindaian',
            `<p class="mb-3 text-xs text-slate-500">
                Pilih hasil yang ingin ditampilkan pada Digital Gate Display.
            </p>
            <div class="grid grid-cols-2 gap-2">
                ${[
                    'ENTRY_SUCCESS',
                    'EXIT_SUCCESS',
                    'REGISTER_SCAN',
                    'TOPUP_SUCCESS',
                    'UNKNOWN_CARD',
                    'BLOCKED_CARD',
                    'INSUFFICIENT_BALANCE',
                    'INVALID_SESSION',
                    'ERROR'
                ].map(s => `
                    <button class="rounded-lg border border-slate-200 p-2 text-xs font-bold hover:border-brand-400"
                        data-display-state="${s}">
                        ${s}
                    </button>
                `).join('')}
            </div>`,
            btn('Batal', 'close-modal', 'secondary')
        );
        return;
    }

    if (action === 'notifications') {
        toast('Tidak ada notifikasi baru.');
        return;
    }

    if (action === 'logout') {
        toast('Demo: sesi administrator tidak diakhiri.');
        return;
    }
}

/* =========================
   EVENT HANDLER
========================= */

function onClick(e) {
    // Tutup modal jika klik area luar modal
    if (e.target.classList.contains('modal-backdrop')) {
        closeModal();
        return;
    }

    const pageEl = e.target.closest('[data-page]');

    if (pageEl) {
        navigate(pageEl.dataset.page);
        return;
    }

    const modeEl = e.target.closest('[data-mode]');

    if (modeEl) {
        const next = modeEl.dataset.mode;

        modal(
            'Konfirmasi Perubahan Mode',
            `<p class="text-sm text-slate-600">
                Ubah mode reader dari <b>${state.mode}</b> menjadi <b>${next}</b>?
            </p>
            <p class="mt-2 text-xs text-slate-400">
                Mode version akan bertambah dan scan dengan versi lama akan ditolak.
            </p>`,
            `${btn('Batal', 'close-modal', 'secondary')}
             ${btn('Ya, Ubah Mode', 'confirm-mode', 'primary')}`
        );

        document.getElementById('modal-root').dataset.nextMode = next;
        return;
    }

    const displayEl = e.target.closest('[data-display-state]');

    if (displayEl) {
        state.displayState = displayEl.dataset.displayState;
        closeModal();
        navigate('display');
        return;
    }

    const actionEl = e.target.closest('[data-action]');

    if (actionEl) {
        handleAction(actionEl.dataset.action, actionEl);
    }
}

document.addEventListener('click', onClick);

// Pencarian tabel
document.addEventListener('input', e => {
    if (!e.target.matches('[data-search]')) return;

    state.search = e.target.value;

    const position = e.target.selectionStart;

    document.getElementById('page-content').innerHTML = renderPage();

    const fresh = document.querySelector('[data-search]');

    if (fresh) {
        fresh.focus();
        fresh.setSelectionRange(position, position);
    }
});

// Form login dan top-up
document.addEventListener('submit', e => {
    if (e.target.id === 'login-form') {
        e.preventDefault();

        const username = e.target.username.value;
        const password = e.target.password.value;

        if (!username || !password) {
            toast('Email/username dan password wajib diisi.', 'error');
            return;
        }

        toast('Login demo berhasil.');
        navigate('dashboard');
        return;
    }

    if (e.target.id === 'topup-form') {
        e.preventDefault();

        const amount = Number(new FormData(e.target).get('amount'));
        const card = state.cards.find(c => c.uid === state.selectedCard) || state.cards[0];

        if (card.status !== 'Aktif') {
            toast('Kartu tidak aktif. Top-up ditolak.', 'error');
            return;
        }

        if (!Number.isInteger(amount) || amount < 1000 || amount > 1000000) {
            toast('Nominal harus Rp1.000–Rp1.000.000 dan bilangan bulat.', 'error');
            return;
        }

        modal(
            'Konfirmasi Top-up',
            `<div class="space-y-3">
                <div class="rounded-xl bg-brand-50 p-3">
                    <p class="text-xs text-slate-500">Pemilik kartu</p>
                    <p class="font-extrabold">${card.name}</p>
                    <p class="font-mono text-xs text-slate-500">UID ${mask(card.uid)}</p>
                </div>

                <div class="flex justify-between text-sm">
                    <span>Saldo saat ini</span>
                    <b>${rupiah(card.balance)}</b>
                </div>

                <div class="flex justify-between text-sm">
                    <span>Nominal top-up</span>
                    <b>${rupiah(amount)}</b>
                </div>

                <div class="flex justify-between border-t pt-3">
                    <span class="font-bold">Saldo setelah top-up</span>
                    <b class="text-lg text-brand-700">${rupiah(card.balance + amount)}</b>
                </div>

                <p class="text-xs text-slate-400">
                    Pastikan kartu dan nominal sudah benar. Transaksi akan dicatat pada ledger.
                </p>
            </div>`,
            `${btn('Batal', 'close-modal', 'secondary')}
             ${btn('Konfirmasi Transaksi', 'confirm-topup', 'primary')}`
        );

        document.getElementById('modal-root').dataset.amount = amount;
    }
});

// Tombol Escape untuk menutup modal
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Hash navigation
window.addEventListener('hashchange', () => {
    const page = location.hash.replace('#/', '');
    if (page) navigate(page);
});

window.toggleSidebar = toggleSidebar;

// Inisialisasi aplikasi
function boot() {
    if (state.page === 'display') {
        document.getElementById('app').innerHTML = displayShell();
    } else if (state.page === 'login') {
        document.getElementById('app').innerHTML = loginPage();
    } else {
        document.getElementById('app').innerHTML = shell();
    }

    lucideRefresh();

    if (state.page === 'dashboard') drawChart();
    if (state.page === 'topup') bindTopupPreview();
}

boot();