<script setup>
defineProps({ state: String });
defineEmits(["retry"]);
const labels = {
  loading: ["Memuat halaman", "Menyiapkan tampilan contoh…"],
  empty: ["Belum ada data", "Data akan tampil di sini setelah tersedia."],
  error: ["Data gagal dimuat", "Coba muat ulang untuk melihat contoh halaman."],
  offline: ["Koneksi terputus", "Status perangkat belum dapat dipastikan."],
};
</script>
<template>
  <section class="card state-card" :aria-busy="state === 'loading'">
    <div class="state-symbol" aria-hidden="true">
      {{ state === "loading" ? "◌" : state === "empty" ? "□" : "!" }}
    </div>
    <h2>{{ labels[state]?.[0] }}</h2>
    <p>{{ labels[state]?.[1] }}</p>
    <button
      v-if="state !== 'loading'"
      class="secondary"
      @click="$emit('retry')"
    >
      Kembali ke data contoh
    </button>
    <p v-else class="helper">
      Pilih “Normal” pada kontrol pratinjau untuk melanjutkan.
    </p>
  </section>
</template>
