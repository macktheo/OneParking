<script setup>
import { useDemoStore } from "../../stores/demoStore";

const { mode, selectedMode, message } = useDemoStore();
</script>
<template>
  <div class="two-columns">
    <section class="card">
      <div class="section-heading">
        <h2>Gerbang utama</h2>
        <span class="badge neutral">Contoh</span>
      </div>
      <dl class="device-details">
        <div>
          <dt>Perangkat</dt>
          <dd>NodeMCU Gate 01</dd>
        </div>
        <div>
          <dt>Reader</dt>
          <dd>RC522</dd>
        </div>
        <div>
          <dt>Mode dipilih</dt>
          <dd>{{ mode }}</dd>
        </div>
        <div>
          <dt>Posisi fisik palang</dt>
          <dd>Belum terverifikasi</dd>
        </div>
      </dl>
      <p class="helper">Status di halaman ini adalah tampilan contoh.</p>
    </section>
    <section class="card">
      <h2>Mode reader</h2>
      <p class="section-description">
        Pilih satu mode untuk alur yang akan digunakan.
      </p>
      <form
        @submit.prevent="
          mode = selectedMode;
          message('Mode contoh diperbarui menjadi ' + mode + '.');
        "
      >
        <label
          >Mode<select aria-label="Mode reader" v-model="selectedMode">
            <option value="REGISTER">REGISTER — Registrasi kartu</option>
            <option value="TOPUP">TOPUP — Pilih kartu top-up</option>
            <option value="ENTRY">ENTRY — Gerbang masuk</option>
            <option value="EXIT">EXIT — Gerbang keluar</option>
          </select></label
        >
        <p class="helper">
          REGISTER dan TOPUP tidak mengotorisasi pembukaan palang.
        </p>
        <button>Terapkan mode contoh</button>
      </form>
    </section>
  </div>
</template>
