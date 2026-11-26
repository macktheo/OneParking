<script setup>
import StatCard from "../../components/StatCard.vue";
import ActivityChart from "../../components/ActivityChart.vue";
import UiIcon from "../../components/UiIcon.vue";
import { useParkingStore } from "../../stores/parkingStore";
const {
    cards,
    recentTransactions: transactions,
    mode,
    activeCards,
    activeSessions,
    revenue,
    rejected,
    rupiah,
    go,
    dashboard,
    currentDevice,
    time,
} = useParkingStore();
const today = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeZone: "Asia/Jakarta",
}).format(new Date());
</script>
<template>
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
            <p class="text-lg font-extrabold">Selamat datang, Admin</p>
            <p class="text-xs text-slate-500">
                Berikut ringkasan operasional CampusPay.
            </p>
        </div>
        <div class="text-xs text-slate-500">{{ today }}</div>
    </div>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
            label="Kartu Aktif"
            :value="activeCards"
            icon="cards"
            :description="cards.length + ' kartu terdaftar'"
        /><StatCard
            label="Sesi Parkir Aktif"
            :value="activeSessions"
            icon="parking"
            description="Sesi yang belum selesai"
        /><StatCard
            label="Pendapatan Parkir"
            :value="rupiah(revenue)"
            icon="topup"
            description="Pembayaran yang sudah di-commit"
        /><StatCard
            label="Transaksi Ditolak"
            :value="rejected"
            icon="audit"
            description="Hasil penolakan yang dicatat server"
        />
    </div>
    <div class="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section class="card p-5">
            <div class="mb-4">
                <h2 class="font-extrabold">Aktivitas Parkir</h2>
                <p class="mt-1 text-xs text-slate-400">
                    Jumlah transaksi hari ini per jam · WIB
                </p>
            </div>
            <ActivityChart :values="dashboard.activity || []" />
        </section>
        <section class="card p-5">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="font-extrabold">Status Perangkat</h2>
                <span
                    class="badge"
                    :class="
                        currentDevice?.online ? 'badge-green' : 'badge-yellow'
                    "
                    >{{ currentDevice?.online ? "Online" : "Offline" }}</span
                >
            </div>
            <div class="space-y-4">
                <div
                    v-for="item in [
                        {
                            icon: 'devices',
                            name: 'ESP8266',
                            description: currentDevice?.name || 'NodeMCU utama',
                            value: currentDevice?.online ? 'Online' : 'Offline',
                        },
                        {
                            icon: 'cards',
                            name: 'RFID Reader',
                            description: 'RC522 · laporan firmware',
                            value:
                                currentDevice?.online &&
                                currentDevice?.reader_ready
                                    ? 'Dilaporkan siap'
                                    : 'Belum terverifikasi',
                        },
                        {
                            icon: 'settings',
                            name: 'Servo Motor',
                            description: 'Posisi yang diperintahkan',
                            value: currentDevice?.online
                                ? currentDevice?.commanded_position
                                : 'UNKNOWN',
                        },
                        {
                            icon: 'transactions',
                            name: 'Heartbeat Terakhir',
                            description: 'Pembaruan perangkat',
                            value: time(currentDevice?.last_seen_at),
                        },
                    ]"
                    :key="item.name"
                    class="flex items-center gap-3"
                >
                    <div class="icon-box !h-10 !w-10">
                        <UiIcon :name="item.icon" />
                    </div>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-bold">{{ item.name }}</p>
                        <p class="text-[11px] text-slate-400">
                            {{ item.description }}
                        </p>
                    </div>
                    <span class="badge badge-gray">{{ item.value }}</span>
                </div>
            </div>
            <button class="btn-secondary mt-5 w-full" @click="go('devices')">
                Lihat Detail Perangkat <UiIcon name="arrow" :size="15" />
            </button>
        </section>
    </div>
    <section class="card mt-5 overflow-hidden">
        <div
            class="flex items-center justify-between border-b border-slate-100 p-5"
        >
            <div>
                <h2 class="font-extrabold">Aktivitas Terbaru</h2>
                <p class="mt-1 text-xs text-slate-400">
                    Transaksi dan aktivitas sistem terkini
                </p>
            </div>
            <button
                class="text-xs font-bold text-brand-600"
                @click="go('transactions')"
            >
                Lihat Semua
            </button>
        </div>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Waktu</th>
                        <th>UID Kartu</th>
                        <th>Aktivitas</th>
                        <th>Status</th>
                        <th>Nominal</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="t in transactions.slice(0, 4)" :key="t.id">
                        <td>{{ t.time }}</td>
                        <td class="font-bold">{{ t.name }}</td>
                        <td>
                            <span class="badge badge-purple">{{ t.type }}</span>
                        </td>
                        <td>
                            <span
                                class="badge"
                                :class="
                                    t.status === 'Berhasil'
                                        ? 'badge-green'
                                        : 'badge-red'
                                "
                                >{{ t.status }}</span
                            >
                        </td>
                        <td class="font-bold">{{ rupiah(t.amount) }}</td>
                    </tr>
                    <tr v-if="!transactions.length">
                        <td
                            colspan="5"
                            class="py-10 text-center text-slate-400"
                        >
                            Belum ada aktivitas
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
