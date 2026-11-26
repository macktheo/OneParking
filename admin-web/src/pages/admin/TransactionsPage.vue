<script setup>
import { ref, computed } from "vue";
import { useDemoStore } from "../../stores/demoStore";

const { query, transactionType, filteredTransactions, rupiah } = useDemoStore();
const from = ref(""),
  to = ref("");
const rows = computed(() =>
  filteredTransactions.value.filter(
    (t) =>
      (!from.value || t.date >= from.value) &&
      (!to.value || t.date <= to.value),
  ),
);
</script>
<template>
  <section class="card">
    <div class="section-heading">
      <div>
        <h2>Riwayat transaksi</h2>
        <p>Saldo sebelum dan sesudah setiap transaksi.</p>
      </div>
    </div>
    <div class="toolbar">
      <input
        aria-label="Cari transaksi"
        v-model="query"
        type="search"
        placeholder="Cari nama atau nomor transaksi…"
      /><select aria-label="Jenis transaksi" v-model="transactionType">
        <option>Semua</option>
        <option>Top-up</option>
        <option>Pembayaran parkir</option>
      </select>
    </div>
    <div class="toolbar date-filters">
      <label>Dari tanggal<input type="date" v-model="from" /></label
      ><label
        >Sampai tanggal<input
          type="date"
          v-model="to"
          :min="from || undefined" /></label
      ><button
        class="secondary"
        @click="
          from = '';
          to = '';
          query = '';
          transactionType = 'Semua';
        "
      >
        Reset filter
      </button>
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Transaksi</th>
            <th>Pemilik</th>
            <th>Jenis</th>
            <th>Nominal</th>
            <th>Saldo awal</th>
            <th>Saldo akhir</th>
            <th>Tanggal / waktu (WIB)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in rows" :key="t.id">
            <td class="mono">{{ t.id }}</td>
            <td>{{ t.name }}</td>
            <td>
              <span class="badge" :class="{ neutral: t.type !== 'Top-up' }">{{
                t.type
              }}</span>
            </td>
            <td>{{ rupiah(t.amount) }}</td>
            <td>{{ rupiah(t.before) }}</td>
            <td>{{ rupiah(t.after) }}</td>
            <td>{{ t.date }} · {{ t.time }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="7" class="empty">Tidak ada transaksi yang cocok.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
