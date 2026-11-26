<script setup>
import { useParkingStore } from "../stores/parkingStore";
import UiIcon from "./UiIcon.vue";
defineProps({ open: Boolean });
const emit = defineEmits(["close"]);
const { page, go } = useParkingStore();
const nav = [
    ["dashboard", "Dashboard"],
    ["cards", "Kartu RFID"],
    ["topup", "Top-up Saldo"],
    ["parking", "Sesi Parkir"],
    ["transactions", "Transaksi"],
    ["devices", "Perangkat"],
    ["security-logs", "Audit Keamanan"],
    ["settings", "Pengaturan"],
];
</script>
<template>
    <button
        v-if="open"
        class="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        aria-label="Tutup navigasi"
        @click="emit('close')"
    ></button>
    <aside
        id="sidebar"
        :class="{ open }"
        class="fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-violet-100 bg-white px-4 py-5 lg:translate-x-0"
    >
        <RouterLink
            to="/admin/dashboard"
            class="mb-8 flex items-center gap-3 px-2"
            ><div
                class="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-brand-600 shadow-lg shadow-violet-200"
            >
                <img
                    :src="'/assets/campuspay-mark.svg'"
                    alt=""
                    class="h-full w-full object-cover"
                />
            </div>
            <div>
                <div
                    class="text-lg font-extrabold tracking-tight text-slate-900"
                >
                    CampusPay
                </div>
                <div
                    class="text-[10px] font-semibold tracking-wide text-slate-400"
                >
                    SMART CAMPUS PARKING
                </div>
            </div></RouterLink
        >
        <p
            class="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400"
        >
            Menu Utama
        </p>
        <nav aria-label="Menu utama" class="space-y-1">
            <button
                v-for="[key, label] in nav"
                :key="key"
                class="sidebar-link"
                :class="{ active: page === key }"
                :aria-current="page === key ? 'page' : undefined"
                @click="
                    go(key);
                    emit('close');
                "
            >
                <UiIcon
                    :name="key === 'security-logs' ? 'audit' : key"
                /><span>{{ label }}</span>
            </button>
        </nav>
        <div class="mt-auto rounded-2xl bg-brand-50 p-3">
            <p class="text-xs font-bold text-slate-800">Administrator</p>
            <p class="text-[10px] text-slate-500">
                Admin CampusPay · Saldo simulasi
            </p>
        </div>
    </aside>
</template>
