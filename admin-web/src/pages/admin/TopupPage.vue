<script setup>
import { useDemoStore } from "../../stores/demoStore";

const {
  cards,
  review,
  topup,
  settings,
  selectedCard,
  rupiah,
  reviewTopup,
  confirmTopup,
} = useDemoStore();
</script>
<template>
  <div class="two-columns">
    <section class="card">
      <h2>Isi saldo kartu</h2>
      <p class="section-description">Pilih pemilik kartu dan nominal top-up.</p>
      <form @submit.prevent="reviewTopup">
        <label
          >Pemilik kartu<select
            aria-label="Pemilik kartu"
            v-model.number="topup.cardId"
          >
            <option v-for="c in cards" :key="c.id" :value="c.id">
              {{ c.name }} · {{ c.plate
              }}{{ c.status === "Diblokir" ? " (Diblokir)" : "" }}
            </option>
          </select></label
        ><label
          >Nominal top-up<input
            type="number"
            v-model.number="topup.amount"
            :min="settings.min"
            :max="settings.max"
            step="1"
            required
        /></label>
        <div class="amount-options">
          <button
            type="button"
            v-for="n in [10000, 20000, 50000, 100000]"
            :class="['secondary', { chosen: Number(topup.amount) === n }]"
            @click="topup.amount = n"
          >
            {{ rupiah(n) }}
          </button>
        </div>
        <small class="helper"
          >Batas {{ rupiah(settings.min) }}–{{ rupiah(settings.max) }} per
          top-up.</small
        ><button class="full-width">Tinjau top-up</button>
      </form>
    </section>
    <section class="card" v-if="selectedCard">
      <h2>Ringkasan kartu</h2>
      <div class="account-preview">
        <span class="avatar large">{{
          selectedCard.name.charAt(0)
        }}</span><strong>{{ selectedCard.name }}</strong
        ><small>{{ selectedCard.nim }} · {{ selectedCard.plate }}</small
        ><span
          class="badge"
          :class="{ blocked: selectedCard.status !== 'Aktif' }"
          >{{ selectedCard.status }}</span
        >
      </div>
      <div class="summary-row">
        <span>Saldo saat ini</span
        ><strong>{{ rupiah(selectedCard.balance) }}</strong>
      </div>
      <template v-if="review"
        ><div class="summary-row">
          <span>Nominal top-up</span
          ><strong>{{ rupiah(review.amount) }}</strong>
        </div>
        <div class="summary-row total">
          <span>Saldo setelah top-up</span
          ><strong>{{ rupiah(selectedCard.balance + review.amount) }}</strong>
        </div>
        <p class="helper">Pastikan pemilik dan nominal sudah sesuai.</p>
        <div class="form-actions">
          <button class="secondary" @click="review = null">Batal</button
          ><button @click="confirmTopup">Konfirmasi simulasi</button>
        </div></template
      >
      <p v-else class="helper">
        Tinjau nominal untuk melihat ringkasan konfirmasi.
      </p>
    </section>
  </div>
</template>
