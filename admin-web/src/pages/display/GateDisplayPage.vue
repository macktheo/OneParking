<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { useDemoStore } from "../../stores/demoStore";
import { displayStates } from "../../mocks/displayStates";
const { mode, rupiah, settings } = useDemoStore();
const state = ref("STANDBY"),
  controls = ref(true),
  displayError = ref("");
const current = computed(() => displayStates[state.value]);
let timer;
watch(state, (value) => {
  clearTimeout(timer);
  if (!["STANDBY", "OFFLINE", "PROCESSING"].includes(value))
    timer = setTimeout(() => (state.value = "STANDBY"), 5000);
});
onUnmounted(() => clearTimeout(timer));
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
        >{{ state === "OFFLINE" ? "● Offline" : "● Status contoh" }} ·
        {{ mode }}</span
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
              : state === "OFFLINE"
                ? "○"
                : "P"
        }}
      </div>
      <h1>{{ current.title }}</h1>
      <p>{{ current.description }}</p>
      <div class="gate-amounts">
        <div v-if="current.fee">
          <span>Biaya sesi</span><strong>{{ rupiah(current.fee) }}</strong>
        </div>
        <div v-if="current.balance !== undefined">
          <span>Saldo setelah transaksi</span
          ><strong>{{ rupiah(current.balance) }}</strong>
        </div>
        <div v-if="state === 'STANDBY'">
          <span>Tarif sesi baru</span
          ><strong>{{ rupiah(settings.rate) }}</strong>
        </div>
      </div>
      <small>Posisi fisik palang belum terverifikasi.</small>
    </main>
    <footer>
      <span>CampusPay · Saldo simulasi</span>
      <div>
        <button class="text-button" @click="controls = !controls">
          {{ controls ? "Sembunyikan" : "Tampilkan" }} kontrol contoh</button
        ><button class="text-button" @click="fullscreen">Fullscreen</button>
      </div>
    </footer>
    <div v-if="controls" class="display-controls">
      <label
        >Skenario display<select v-model="state">
          <option v-for="(_, key) in displayStates" :value="key" :key="key">
            {{ key }}
          </option>
        </select></label
      ><label
        >Mode contoh<select v-model="mode">
          <option>REGISTER</option>
          <option>TOPUP</option>
          <option>ENTRY</option>
          <option>EXIT</option>
        </select></label
      >
      <p>
        Pratinjau UI · Hasil sementara kembali standby setelah 5 detik. Tidak
        menampilkan identitas lengkap.
      </p>
    </div>
    <p v-if="displayError" role="alert">{{ displayError }}</p>
  </div>
</template>
