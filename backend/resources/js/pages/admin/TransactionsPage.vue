<script setup>
import { ref, reactive, onMounted } from "vue";
import { useParkingStore } from "../../stores/parkingStore";
const {
    transactions,
    cards,
    historyPage,
    historyLast,
    historyTotal,
    loadHistory,
    run,
    rupiah,
    exportUrl,
} = useParkingStore();
const filters = reactive({
    query: "",
    type: "",
    status: "",
    card_id: "",
    from: "",
    to: "",
});
const downloading = ref(false);
function apply(p = 1) {
    run(() => loadHistory(filters, p));
}
function reset() {
    Object.keys(filters).forEach((k) => (filters[k] = ""));
    apply();
}
onMounted(() => apply());
</script>
<template>
    <section class="card p-5">
        <div class="section-heading">
            <div>
                <h2>Riwayat transaksi dan penolakan</h2>
                <p>
                    Saldo sebelum/sesudah untuk transaksi berhasil.
                    {{ historyTotal }} hasil.
                </p>
            </div>
            <a :href="exportUrl(filters)" class="button-link">Ekspor CSV</a>
        </div>
        <form @submit.prevent="apply()">
            <div class="toolbar">
                <input
                    aria-label="Cari transaksi"
                    v-model="filters.query"
                    type="search"
                    placeholder="Cari UID atau request ID…"
                /><select aria-label="Jenis transaksi" v-model="filters.type">
                    <option value="">Semua jenis</option>
                    <option value="TOPUP">Top-up</option>
                    <option value="PARKING_PAYMENT">Pembayaran parkir</option>
                    <option value="SCAN_REJECTED">
                        Penolakan scan
                    </option></select
                ><select aria-label="Status transaksi" v-model="filters.status">
                    <option value="">Semua status</option>
                    <option value="SUCCESS">Berhasil</option>
                    <option value="REJECTED">Ditolak</option>
                </select>
            </div>
            <div class="toolbar date-filters">
                <label
                    >Kartu<select v-model="filters.card_id">
                        <option value="">Semua kartu</option>
                        <option v-for="c in cards" :value="c.id" :key="c.id">
                            {{ c.uid }}
                        </option>
                    </select></label
                ><label
                    >Dari tanggal<input
                        type="date"
                        v-model="filters.from" /></label
                ><label
                    >Sampai tanggal<input
                        type="date"
                        v-model="filters.to"
                        :min="filters.from || undefined" /></label
                ><button>Terapkan filter</button
                ><button type="button" class="secondary" @click="reset">
                    Reset
                </button>
            </div>
        </form>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Transaksi</th>
                        <th>UID Kartu</th>
                        <th>Jenis / hasil</th>
                        <th>Nominal</th>
                        <th>Saldo awal</th>
                        <th>Saldo akhir</th>
                        <th>Waktu WIB</th>
                        <th>Request ID</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="t in transactions" :key="t.id">
                        <td>{{ t.id }}</td>
                        <td>{{ t.name }}</td>
                        <td>
                            <span
                                class="badge"
                                :class="{ blocked: t.status === 'Ditolak' }"
                                >{{ t.type }}</span
                            ><small>{{ t.status }} {{ t.reason || "" }}</small>
                        </td>
                        <td>{{ rupiah(t.amount) }}</td>
                        <td>{{ rupiah(t.before) }}</td>
                        <td>{{ rupiah(t.after) }}</td>
                        <td>{{ t.time }}</td>
                        <td class="mono">{{ t.requestId }}</td>
                    </tr>
                    <tr v-if="!transactions.length">
                        <td colspan="8" class="empty">
                            Tidak ada transaksi yang cocok.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="form-actions">
            <button
                class="secondary"
                :disabled="historyPage <= 1"
                @click="apply(historyPage - 1)"
            >
                Sebelumnya</button
            ><span>Halaman {{ historyPage }} / {{ historyLast }}</span
            ><button
                class="secondary"
                :disabled="historyPage >= historyLast"
                @click="apply(historyPage + 1)"
            >
                Berikutnya
            </button>
        </div>
    </section>
</template>
