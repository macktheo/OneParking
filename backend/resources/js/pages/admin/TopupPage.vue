<script setup>
import { ref, computed } from 'vue';
import { useParkingStore } from '../../stores/parkingStore';
import TapDialog from '../../components/CardRegistrationDialog.vue';
import { pendingTapTopup } from '../../services/tapTopup';
const { busy, settings, rupiah, notice } = useParkingStore();
const amount=ref(20000), frozenAmount=ref(0), opened=ref(false), result=ref(null);
const valid=computed(()=>Number.isSafeInteger(amount.value)&&amount.value>=settings.min&&amount.value<=settings.max);
function start(){if(!valid.value)return;frozenAmount.value=amount.value;notice.value='';opened.value=true;}
const hasPending=ref(!!pendingTapTopup());
function close(){opened.value=false;hasPending.value=!!pendingTapTopup();}
function completed(data){result.value=data;hasPending.value=false;}
</script>
<template>
<div class="grid gap-5 lg:grid-cols-2">
<section class="card p-5"><h2>Top-up dengan tap kartu</h2><p class="helper">Pilih nominal, mulai top-up, lalu tempelkan kartu. Saldo otomatis bertambah setelah kartu terbaca.</p>
<form @submit.prevent="start">
<label>Nominal top-up<input type="number" v-model.number="amount" :min="settings.min" :max="settings.max" step="1" required :disabled="opened||busy" /></label>
<div class="amount-options"><button type="button" v-for="n in [10000,20000,50000,100000]" :key="n" class="secondary" :disabled="opened||busy||n<settings.min||n>settings.max" :aria-pressed="amount===n" @click="amount=n">{{rupiah(n)}}</button></div>
<p class="helper">Batas {{rupiah(settings.min)}}–{{rupiah(settings.max)}}. Hanya kartu terdaftar dan aktif yang bisa diisi saldo.</p>
<button class="full-width" :disabled="!valid||opened||busy">{{hasPending?'Periksa top-up sebelumnya':'Mulai top-up'}}</button>
</form></section>
<section class="card p-5"><h2>Ringkasan top-up</h2><template v-if="result"><p class="helper">Top-up berhasil dikonfirmasi server.</p><div v-if="result.uid" class="summary-row"><span>UID kartu</span><strong class="mono">{{result.uid}}</strong></div><div v-if="result.amount" class="summary-row"><span>Nominal</span><strong>{{rupiah(result.amount)}}</strong></div><div class="summary-row total"><span>Saldo akhir</span><strong>{{rupiah(result.balance_after)}}</strong></div></template><p v-else class="helper">Pilih nominal di sebelah kiri. Setelah klik Mulai top-up, tunggu popup Tempelkan kartu lalu tap dan lepaskan satu kartu. UID yang belum terdaftar harus didaftarkan melalui menu Kartu RFID terlebih dahulu.</p></section>
</div>
<TapDialog v-if="opened" operation="TOPUP" :amount="frozenAmount" @close="close" @completed="completed" />
</template>
