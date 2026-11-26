<script setup>
import { useDemoStore } from "../../stores/demoStore";

const { sessions, statusFilter, activeSessions, rupiah } = useDemoStore();
</script>
<template>
  <section class="card">
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
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Sesi</th>
            <th>Pemilik</th>
            <th>Kendaraan</th>
            <th>Masuk (WIB)</th>
            <th>Keluar (WIB)</th>
            <th>Tarif</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in sessions.filter(
              (s) => statusFilter === 'Semua' || s.status === statusFilter,
            )"
            :key="s.id"
          >
            <td class="mono">{{ s.id }}</td>
            <td>{{ s.name }}</td>
            <td>{{ s.plate }}</td>
            <td>{{ s.entry }}</td>
            <td>{{ s.exit }}</td>
            <td>{{ rupiah(s.fee) }}</td>
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
                (s) => statusFilter === 'Semua' || s.status === statusFilter,
              )
            "
          >
            <td colspan="7" class="empty">Belum ada sesi pada filter ini.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
