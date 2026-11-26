<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { api } from "../../services/api";
import { displayStates } from "../../constants/displayMessages";
const data = ref({ online: false, code: "OFFLINE", mode: "UNKNOWN", rate: 0 }),
    displayError = ref("");
let timer,
    stopped = false;
const extra = {
    TOPUP_SCAN: {
        title: "Kartu siap diisi saldo",
        description: "Administrator akan mengonfirmasi nominal top-up.",
        tone: "ready",
    },
};
const current = computed(
    () =>
        extra[data.value.code] ||
        displayStates[data.value.code] ||
        displayStates.ERROR,
);
const rupiah = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(n);
async function poll() {
    try {
        data.value = await api("/api/v1/display/status");
    } catch {
        data.value = { online: false, code: "OFFLINE", mode: "UNKNOWN" };
    }
    if (!stopped) timer = setTimeout(poll, 1000);
}
onMounted(poll);
onUnmounted(() => {
    stopped = true;
    clearTimeout(timer);
});
async function fullscreen() {
    try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
    } catch {
        displayError.value = "Fullscreen tidak tersedia pada browser ini.";
    }
}
</script>
<template>
    <div class="gate-display" :class="current.tone">
        <header>
            <RouterLink class="brand" to="/login"
                ><span class="brand-icon">P</span>OneParking.</RouterLink
            ><span class="gate-connection"
                >{{ data.online ? "● Perangkat terhubung" : "● Offline" }} ·
                {{ data.mode }}</span
            >
        </header>
        <main class="gate-content" aria-live="polite">
            <p class="eyebrow">DIGITAL GATE DISPLAY / GERBANG UTAMA</p>
            <div class="gate-status-icon" aria-hidden="true">
                {{
                    current.tone === "success"
                        ? "✓"
                        : current.tone === "error"
                          ? "!"
                          : data.code === "OFFLINE"
                            ? "○"
                            : "P"
                }}
            </div>
            <h1>{{ current.title }}</h1>
            <p>{{ current.description }}</p>
            <div class="gate-amounts">
                <div v-if="data.fee !== null && data.fee !== undefined">
                    <span>Biaya sesi</span
                    ><strong>{{ rupiah(data.fee) }}</strong>
                </div>
                <div
                    v-if="
                        data.balance_after !== null &&
                        data.balance_after !== undefined
                    "
                >
                    <span>Saldo setelah transaksi</span
                    ><strong>{{ rupiah(data.balance_after) }}</strong>
                </div>
                <div v-if="data.code === 'STANDBY'">
                    <span>Tarif sesi baru</span
                    ><strong>{{ rupiah(data.rate) }}</strong>
                </div>
            </div>
            <small>Posisi fisik palang belum terverifikasi.</small>
        </main>
        <footer>
            <span>CampusPay · Saldo simulasi</span
            ><button class="text-button" @click="fullscreen">Fullscreen</button>
        </footer>
        <p v-if="displayError" role="alert">{{ displayError }}</p>
    </div>
</template>
