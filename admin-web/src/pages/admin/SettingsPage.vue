<script setup>
import { useDemoStore } from "../../stores/demoStore";

const { settings, settingsForm, saveSettings } = useDemoStore();
</script>
<template>
  <section class="card settings-card">
    <h2>Pengaturan parkir</h2>
    <p class="section-description">
      Nilai awal untuk tampilan dan simulasi top-up.
    </p>
    <form @submit.prevent="saveSettings">
      <div class="form-grid">
        <label
          >Tarif per sesi (Rp)<input
            type="number"
            min="1"
            step="1"
            v-model.number="settingsForm.rate"
            required /></label
        ><label
          >Durasi buka palang (detik)<input
            type="number"
            min="0.5"
            max="5"
            step="0.5"
            v-model.number="settingsForm.duration"
            required /></label
        ><label
          >Minimum top-up (Rp)<input
            type="number"
            min="1"
            step="1"
            v-model.number="settingsForm.min"
            required /></label
        ><label
          >Maksimum top-up (Rp)<input
            type="number"
            :min="settingsForm.min"
            step="1"
            v-model.number="settingsForm.max"
            required
        /></label>
      </div>
      <div class="form-actions">
        <button>Simpan pengaturan contoh</button>
      </div>
    </form>
  </section>
</template>
