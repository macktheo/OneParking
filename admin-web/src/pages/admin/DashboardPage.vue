<script setup>
import StatCard from "../../components/StatCard.vue";
import { useDemoStore } from "../../stores/demoStore";

const {
  cards,
  transactions,
  mode,
  activeCards,
  activeSessions,
  revenue,
  rupiah,
  go,
} = useDemoStore();
</script>
<template>
  <div class="stats-grid">
    <StatCard
      label="Kartu aktif"
      :value="activeCards"
      :description="'Dari ' + cards.length + ' kartu terdaftar'"
    /><StatCard
      label="Sedang parkir"
      :value="activeSessions"
      description="Sesi masih berlangsung"
    /><StatCard
      label="Pendapatan parkir"
      :value="rupiah(revenue)"
      description="Dari pembayaran yang berhasil"
    /><StatCard
      label="Mode reader"
      :value="mode"
      description="Gerbang utama · Perangkat contoh"
      accent
    />
  </div>
  <div class="dashboard-grid">
    <section class="card">
      <div class="section-heading">
        <div>
          <h2>Aktivitas terbaru</h2>
          <p>Ringkasan transaksi parkir dan top-up.</p>
        </div>
        <button class="text-button" @click="go('transactions')">
          Lihat semua →
        </button>
      </div>
      <div class="activity" v-for="t in transactions.slice(0, 4)" :key="t.id">
        <span class="activity-icon" :class="{ payment: t.type !== 'Top-up' }">{{
          t.type === "Top-up" ? "+" : "P"
        }}</span>
        <div class="activity-description">
          <strong>{{ t.name }}</strong><small
            >{{ t.type }} · {{ t.time }} WIB</small
          >
        </div>
        <strong>{{ rupiah(t.amount) }}</strong>
      </div>
    </section>
    <section class="card gate-card">
      <span class="status"><i></i>Perangkat contoh</span>
      <div class="gate-illustration" aria-hidden="true">
        <div class="gate-arm"></div>
        <div class="gate-base">P</div>
        <div class="ground"></div>
      </div>
      <h2>Gerbang utama</h2>
      <p>
        Mode saat ini <strong>{{ mode }}</strong>. Pilih mode reader sebelum
        memulai alur kartu.
      </p>
      <button class="secondary" @click="go('devices')">
        Kelola perangkat →
      </button>
    </section>
  </div>
  <section class="card quick-start">
    <div>
      <h2>Mulai dari kartu pemilik</h2>
      <p>Tambahkan kartu, isi saldo, lalu tinjau sesi dan riwayat parkir.</p>
    </div>
    <button class="secondary" @click="go('cards')">Lihat daftar kartu</button>
  </section>
</template>
