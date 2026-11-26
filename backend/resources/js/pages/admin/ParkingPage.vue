<script setup>
import { useParkingStore } from "../../stores/parkingStore";

const { sessions, statusFilter, activeSessions, rupiah } = useParkingStore();
</script>
<template>
    <section class="card p-5">
        <div class="section-heading">
            <div>
                <h2>Daftar sesi parkir</h2>
                <p>{{ activeSessions }} sesi aktif saat ini.</p>
            </div>
            <select aria-label="Filter sesi" v-model="statusFilter">
                <option>Semua</option>
                <option>Aktif</option>
                <option>Selesai</option>
            </select>
        </div>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Sesi</th>
                        <th>UID kartu</th>
                        <th>Masuk (WIB)</th>
                        <th>Keluar (WIB)</th>
                        <th>Tarif</th>
                        <th>Durasi</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="s in sessions.filter(
                            (s) =>
                                statusFilter === 'Semua' ||
                                s.status === statusFilter,
                        )"
                        :key="s.id"
                    >
                        <td class="mono">{{ s.id }}</td>
                        <td class="mono">{{ s.uid }}</td>
                        <td>{{ s.entry }}</td>
                        <td>{{ s.exit }}</td>
                        <td>{{ rupiah(s.fee) }}</td>
                        <td>{{ s.duration }}</td>
                        <td>
                            <span
                                class="badge"
                                :class="{ neutral: s.status === 'Selesai' }"
                                >{{ s.status }}</span
                            >
                        </td>
                    </tr>
                    <tr
                        v-if="
                            !sessions.some(
                                (s) =>
                                    statusFilter === 'Semua' ||
                                    s.status === statusFilter,
                            )
                        "
                    >
                        <td colspan="7" class="empty">
                            Belum ada sesi pada filter ini.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
