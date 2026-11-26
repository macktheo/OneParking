<script setup>
import {ref} from 'vue';
import CardRegistrationDialog from '../../components/CardRegistrationDialog.vue';
import {useParkingStore} from '../../stores/parkingStore';
import ConfirmDialog from '../../components/ConfirmDialog.vue';
import {api,business} from '../../services/api';
const {cards,filteredCards,query,statusFilter,showCardForm,busy,pendingBlock,confirmBlock,rupiah,loadBusiness,refreshLive,message}=useParkingStore();
const pendingDelete=ref(null),deleteBusy=ref(false),deleteError=ref('');
function askDelete(card){deleteError.value='';pendingDelete.value=card;}
async function removeCard(){
 if(deleteBusy.value||!pendingDelete.value)return;
 deleteBusy.value=true;deleteError.value='';
 let deleted=false;
 try{
  await api(business('cards/'+pendingDelete.value.id),'DELETE');
  deleted=true;pendingDelete.value=null;
  await loadBusiness();await refreshLive(true);
  message('Kartu berhasil dihapus dari daftar. Saldo dan riwayat tetap tersimpan.');
 }catch(e){
  if(deleted)message('Kartu sudah dihapus, tetapi tampilan belum diperbarui. Refresh halaman.',true);
  else deleteError.value=(e.data?.message==='CARD_HAS_ACTIVE_SESSION'||e.data?.code==='CARD_HAS_ACTIVE_SESSION')?'Kartu masih memiliki sesi parkir aktif. Selesaikan proses keluar kendaraan terlebih dahulu, lalu hapus kartu.':e.status===0?'Koneksi terputus; hasil penghapusan belum diketahui. Coba lagi untuk kartu yang sama atau refresh daftar.':e.message;
 }finally{deleteBusy.value=false;}
}
</script>
<template>
<CardRegistrationDialog v-if="showCardForm" @close="showCardForm=false"/>
<section class="card p-5">
 <div class="section-heading"><div><h2>Daftar kartu</h2><p>{{cards.length}} kartu terdaftar. Identitas kendaraan menggunakan UID kartu.</p></div></div>
 <div class="toolbar"><input aria-label="Cari kartu" v-model="query" type="search" placeholder="Cari UID kartu…"><select aria-label="Filter status kartu" v-model="statusFilter"><option>Semua</option><option>Aktif</option><option>Diblokir</option></select></div>
 <div class="table-wrap"><table class="data-table"><thead><tr><th>UID kartu</th><th>Saldo</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
 <tr v-for="c in filteredCards" :key="c.id"><td class="mono font-bold">{{c.uid}}</td><td>{{rupiah(c.balance)}}</td><td><span class="badge" :class="{blocked:c.status!=='Aktif'}">{{c.status}}</span></td><td>
 <button class="text-button" :disabled="busy||deleteBusy" @click="pendingBlock=c">{{c.status==='Aktif'?'Blokir':'Aktifkan'}}</button>
 <button class="text-button ml-3 text-red-600" :disabled="busy||deleteBusy" @click="askDelete(c)">Hapus</button>
 </td></tr>
 <tr v-if="!filteredCards.length"><td colspan="4" class="empty">Belum ada kartu. Klik Tambah kartu untuk menambahkan UID melalui tap RFID.</td></tr>
 </tbody></table></div>
</section>
<ConfirmDialog v-if="pendingBlock" title="Ubah status kartu?" :description="'UID '+pendingBlock.uid+' akan '+(pendingBlock.status==='Aktif'?'diblokir':'diaktifkan')+'. Sesi aktif tidak dihapus.'" confirm-label="Konfirmasi perubahan" @cancel="pendingBlock=null" @confirm="confirmBlock"/>
<ConfirmDialog v-if="pendingDelete" title="Hapus kartu?" :description="'UID '+pendingDelete.uid+' akan dihapus dari daftar dan tidak bisa digunakan untuk parkir/top-up. Saldo '+rupiah(pendingDelete.balance)+' dan riwayat tetap disimpan; saldo kembali tersedia jika UID didaftarkan ulang.'" confirm-label="Ya, hapus kartu" :busy="deleteBusy" :error="deleteError" @cancel="pendingDelete=null" @confirm="removeCard"/>
</template>
