<script setup>
import { computed, ref } from "vue";
import { useDemoStore } from "../../stores/demoStore";
import StatusBadge from "../../components/StatusBadge.vue";
const { auditLogs, query } = useDemoStore();
const result = ref("Semua");
const filtered = computed(() =>
  auditLogs.value.filter(
    (l) =>
      (result.value === "Semua" || l.result === result.value) &&
      [l.actor, l.action, l.requestId].some((v) =>
        v.toLowerCase().includes(query.value.toLowerCase()),
      ),
  ),
);
</script>
<template>
  <section class="card">
    <div class="section-heading">
      <div>
        <h2>Audit keamanan</h2>
        <p>
          Catatan contoh aktivitas dan penolakan, tanpa password atau token.
        </p>
      </div>
    </div>
    <div class="toolbar">
      <input
        v-model="query"
        type="search"
        aria-label="Cari audit"
        placeholder="Cari aktor, tindakan, atau request ID…"
      /><select v-model="result" aria-label="Hasil audit">
        <option>Semua</option>
        <option>Berhasil</option>
        <option>Ditolak</option>
      </select>
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Waktu (WIB)</th>
            <th>Aktor</th>
            <th>Tindakan</th>
            <th>Hasil</th>
            <th>Request ID</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in filtered" :key="l.id">
            <td>{{ l.time }}</td>
            <td>{{ l.actor }}</td>
            <td class="mono">{{ l.action }}</td>
            <td>
              <StatusBadge
                :tone="l.result === 'Ditolak' ? 'negative' : 'positive'"
                >{{ l.result }}</StatusBadge
              >
            </td>
            <td class="mono">{{ l.requestId }}</td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="5" class="empty">Tidak ada audit yang cocok.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
