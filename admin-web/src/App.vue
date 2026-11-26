<script setup>
import {computed,reactive,ref,watch} from 'vue';
import {initialCards,initialTransactions,initialSessions} from './data';

const menu=[['dashboard','Ringkasan','▦'],['cards','Kartu & pemilik','▤'],['topup','Top-up saldo','＋'],['parking','Sesi parkir','P'],['transactions','Transaksi','↔'],['devices','Perangkat','◉'],['settings','Pengaturan','⚙']];
const page=ref('dashboard');
const cards=ref(structuredClone(initialCards));
const transactions=ref(structuredClone(initialTransactions));
const sessions=ref(structuredClone(initialSessions));
const query=ref(''),statusFilter=ref('Semua'),transactionType=ref('Semua');
const notice=ref(''),error=ref(false),showCardForm=ref(false),review=ref(null);
const cardForm=reactive({name:'',nim:'',plate:'',uid:''});
const topup=reactive({cardId:1,amount:20000});
const settings=reactive({rate:2000,duration:3,min:1000,max:1000000});
const settingsForm=reactive({...settings});
const mode=ref('ENTRY'),selectedMode=ref('ENTRY');
const title=computed(()=>menu.find(m=>m[0]===page.value)?.[1]);
const selectedCard=computed(()=>cards.value.find(c=>c.id===Number(topup.cardId)));
const filteredCards=computed(()=>cards.value.filter(c=>(statusFilter.value==='Semua'||c.status===statusFilter.value)&&[c.name,c.nim,c.plate,c.uid].some(v=>v.toLowerCase().includes(query.value.toLowerCase()))));
const filteredTransactions=computed(()=>transactions.value.filter(t=>(transactionType.value==='Semua'||t.type===transactionType.value)&&[t.name,t.id].some(v=>v.toLowerCase().includes(query.value.toLowerCase()))));
const activeCards=computed(()=>cards.value.filter(c=>c.status==='Aktif').length);
const activeSessions=computed(()=>sessions.value.filter(s=>s.status==='Aktif').length);
const revenue=computed(()=>transactions.value.filter(t=>t.type==='Pembayaran parkir').reduce((a,t)=>a+t.amount,0));
const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
function message(text,isError=false){notice.value=text;error.value=isError;}
function go(key){page.value=key;query.value='';statusFilter.value='Semua';notice.value='';review.value=null;showCardForm.value=false;}
watch(()=>[topup.cardId,topup.amount],()=>review.value=null);
function addCard(){
 const values=Object.fromEntries(Object.entries(cardForm).map(([k,v])=>[k,v.trim()]));
 if(Object.values(values).some(v=>!v))return message('Lengkapi seluruh data kartu.',true);
 values.uid=values.uid.toUpperCase();
 if(!/^(?:[0-9A-F]{8}|[0-9A-F]{14}|[0-9A-F]{20})$/.test(values.uid))return message('UID harus berupa 8, 14, atau 20 karakter heksadesimal.',true);
 if(cards.value.some(c=>c.uid===values.uid))return message('UID sudah ada dalam daftar contoh.',true);
 cards.value.push({id:Math.max(0,...cards.value.map(c=>c.id))+1,...values,balance:0,status:'Aktif'});
 Object.keys(cardForm).forEach(k=>cardForm[k]='');showCardForm.value=false;message('Kartu ditambahkan ke data contoh dengan saldo Rp0.');
}
function toggleCard(card){card.status=card.status==='Aktif'?'Diblokir':'Aktif';message(`Status ${card.name}: ${card.status.toLowerCase()}.`);}
function reviewTopup(){
 const c=selectedCard.value,n=Number(topup.amount);
 if(!c||c.status!=='Aktif')return message('Pilih kartu yang aktif.',true);
 if(!Number.isSafeInteger(n)||n<settings.min||n>settings.max)return message(`Nominal harus rupiah bulat antara ${rupiah(settings.min)} dan ${rupiah(settings.max)}.`,true);
 review.value={cardId:c.id,name:c.name,uid:c.uid,amount:n};notice.value='';
}
function confirmTopup(){
 if(!review.value)return;
 const item=review.value,c=cards.value.find(c=>c.id===item.cardId);
 if(!c||c.status!=='Aktif'){review.value=null;return message('Kartu sudah tidak aktif.',true);}
 const before=c.balance;c.balance+=item.amount;
 const id='TRX-'+String(transactions.value.length+1).padStart(3,'0');
 transactions.value.unshift({id,name:c.name,type:'Top-up',amount:item.amount,before,after:c.balance,time:new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}),status:'Berhasil'});
 review.value=null;message(`Simulasi top-up berhasil. Saldo ${c.name}: ${rupiah(c.balance)}.`);
}
function saveSettings(){
 const s=settingsForm;
 if(![s.rate,s.min,s.max].every(n=>Number.isSafeInteger(n)&&n>0)||s.min>s.max||!Number.isFinite(s.duration)||s.duration<0.5||s.duration>5)return message('Periksa tarif, batas top-up, dan durasi buka (0,5–5 detik).',true);
 Object.assign(settings,s);message('Pengaturan contoh disimpan untuk sesi browser ini.');
}
</script>

<template>
 <div class="layout">
  <aside class="sidebar">
   <a class="brand" href="#" @click.prevent="go('dashboard')"><span class="brand-icon">P</span>OneParking<span class="brand-dot">.</span></a>
   <p class="nav-caption">ADMIN KAMPUS</p>
   <nav aria-label="Menu utama"><button v-for="[key,label,icon] in menu" :key="key" :class="{selected:page===key}" :aria-current="page===key?'page':undefined" @click="go(key)"><span class="nav-icon" aria-hidden="true">{{icon}}</span>{{label}}</button></nav>
   <div class="sidebar-footer"><span class="avatar">A</span><div><strong>Administrator</strong><small>Workspace kampus</small></div></div>
  </aside>
  <div class="workspace">
   <header class="topbar"><span>Manajemen parkir kampus</span><span class="demo-tag"><i></i>Pratinjau UI</span></header>
   <main>
    <div class="page-heading"><div><p class="eyebrow">ONEPARKING / ADMIN</p><h1>{{title}}</h1><p class="subtitle">{{page==='dashboard'?'Pantau aktivitas parkir dalam satu tempat.':'Kelola '+title.toLowerCase()+' dengan mudah.'}}</p></div><button v-if="page==='cards'" @click="showCardForm=!showCardForm">{{showCardForm?'Tutup formulir':'+ Tambah kartu'}}</button><button v-if="page==='dashboard'" @click="go('topup')">+ Top-up saldo</button></div>
    <p class="demo-note">Data contoh · Perubahan hanya berlaku di halaman ini dan kembali ke awal saat dimuat ulang.</p>
    <div v-if="notice" class="notice" :class="{error}" role="status">{{notice}}<button class="dismiss" aria-label="Tutup pesan" @click="notice=''">×</button></div>

    <template v-if="page==='dashboard'">
     <div class="stats-grid"><section class="stat"><span>Kartu aktif</span><strong>{{activeCards}}</strong><small>Dari {{cards.length}} kartu terdaftar</small></section><section class="stat"><span>Sedang parkir</span><strong>{{activeSessions}}</strong><small>Sesi masih berlangsung</small></section><section class="stat"><span>Pendapatan parkir</span><strong>{{rupiah(revenue)}}</strong><small>Dari pembayaran yang berhasil</small></section><section class="stat"><span>Mode reader</span><strong class="mode-text">{{mode}}</strong><small>Gerbang utama · Perangkat contoh</small></section></div>
     <div class="dashboard-grid"><section class="card"><div class="section-heading"><div><h2>Aktivitas terbaru</h2><p>Ringkasan transaksi parkir dan top-up.</p></div><button class="text-button" @click="go('transactions')">Lihat semua →</button></div><div class="activity" v-for="t in transactions.slice(0,4)" :key="t.id"><span class="activity-icon" :class="{payment:t.type!=='Top-up'}">{{t.type==='Top-up'?'+':'P'}}</span><div class="activity-description"><strong>{{t.name}}</strong><small>{{t.type}} · {{t.time}} WIB</small></div><strong>{{rupiah(t.amount)}}</strong></div></section><section class="card gate-card"><span class="status"><i></i>Perangkat contoh</span><div class="gate-illustration" aria-hidden="true"><div class="gate-arm"></div><div class="gate-base">P</div><div class="ground"></div></div><h2>Gerbang utama</h2><p>Mode saat ini <strong>{{mode}}</strong>. Pilih mode reader sebelum memulai alur kartu.</p><button class="secondary" @click="go('devices')">Kelola perangkat →</button></section></div>
     <section class="card quick-start"><div><h2>Mulai dari kartu pemilik</h2><p>Tambahkan kartu, isi saldo, lalu tinjau sesi dan riwayat parkir.</p></div><button class="secondary" @click="go('cards')">Lihat daftar kartu</button></section>
    </template>

    <template v-if="page==='cards'">
     <section v-if="showCardForm" class="card"><div class="section-heading"><div><h2>Tambah kartu</h2><p>Kartu contoh baru dimulai dengan saldo Rp0.</p></div></div><form @submit.prevent="addCard"><div class="form-grid"><label>Nama pemilik<input v-model="cardForm.name" required maxlength="100" placeholder="Nama lengkap"></label><label>NIM<input v-model="cardForm.nim" required maxlength="40" placeholder="Contoh: 2301005"></label><label>Nomor kendaraan<input v-model="cardForm.plate" required maxlength="20" placeholder="B 1234 ABC"></label><label>UID kartu<input v-model="cardForm.uid" required maxlength="20" placeholder="Contoh: 0012ABCD"></label></div><div class="form-actions"><button type="button" class="secondary" @click="showCardForm=false">Batal</button><button>Simpan kartu contoh</button></div></form></section>
     <section class="card"><div class="section-heading"><div><h2>Daftar kartu</h2><p>{{cards.length}} kartu terdaftar pada pratinjau.</p></div></div><div class="toolbar"><input aria-label="Cari kartu" v-model="query" type="search" placeholder="Cari nama, NIM, plat, atau UID…"><select aria-label="Filter status kartu" v-model="statusFilter"><option>Semua</option><option>Aktif</option><option>Diblokir</option></select></div><div class="table-scroll"><table><thead><tr><th>Pemilik</th><th>Kendaraan</th><th>UID kartu</th><th>Saldo</th><th>Status</th><th>Aksi</th></tr></thead><tbody><tr v-for="c in filteredCards" :key="c.id"><td><strong>{{c.name}}</strong><small>{{c.nim}}</small></td><td>{{c.plate}}</td><td class="mono">{{c.uid}}</td><td>{{rupiah(c.balance)}}</td><td><span class="badge" :class="{blocked:c.status!=='Aktif'}">{{c.status}}</span></td><td><button class="text-button" @click="toggleCard(c)">{{c.status==='Aktif'?'Blokir':'Aktifkan'}}</button></td></tr><tr v-if="!filteredCards.length"><td colspan="6" class="empty">Tidak ada kartu yang cocok.</td></tr></tbody></table></div></section>
    </template>

    <div v-if="page==='topup'" class="two-columns"><section class="card"><h2>Isi saldo kartu</h2><p class="section-description">Pilih pemilik kartu dan nominal top-up.</p><form @submit.prevent="reviewTopup"><label>Pemilik kartu<select aria-label="Pemilik kartu" v-model.number="topup.cardId"><option v-for="c in cards" :key="c.id" :value="c.id">{{c.name}} · {{c.plate}}{{c.status==='Diblokir'?' (Diblokir)':''}}</option></select></label><label>Nominal top-up<input type="number" v-model.number="topup.amount" :min="settings.min" :max="settings.max" step="1" required></label><div class="amount-options"><button type="button" v-for="n in [10000,20000,50000,100000]" :class="['secondary',{chosen:Number(topup.amount)===n}]" @click="topup.amount=n">{{rupiah(n)}}</button></div><small class="helper">Batas {{rupiah(settings.min)}}–{{rupiah(settings.max)}} per top-up.</small><button class="full-width">Tinjau top-up</button></form></section><section class="card" v-if="selectedCard"><h2>Ringkasan kartu</h2><div class="account-preview"><span class="avatar large">{{selectedCard.name.charAt(0)}}</span><strong>{{selectedCard.name}}</strong><small>{{selectedCard.nim}} · {{selectedCard.plate}}</small><span class="badge" :class="{blocked:selectedCard.status!=='Aktif'}">{{selectedCard.status}}</span></div><div class="summary-row"><span>Saldo saat ini</span><strong>{{rupiah(selectedCard.balance)}}</strong></div><template v-if="review"><div class="summary-row"><span>Nominal top-up</span><strong>{{rupiah(review.amount)}}</strong></div><div class="summary-row total"><span>Saldo setelah top-up</span><strong>{{rupiah(selectedCard.balance+review.amount)}}</strong></div><p class="helper">Pastikan pemilik dan nominal sudah sesuai.</p><div class="form-actions"><button class="secondary" @click="review=null">Batal</button><button @click="confirmTopup">Konfirmasi simulasi</button></div></template><p v-else class="helper">Tinjau nominal untuk melihat ringkasan konfirmasi.</p></section></div>

    <section v-if="page==='parking'" class="card"><div class="section-heading"><div><h2>Daftar sesi parkir</h2><p>{{activeSessions}} sesi aktif saat ini.</p></div><select aria-label="Filter sesi" v-model="statusFilter"><option>Semua</option><option>Aktif</option><option>Selesai</option></select></div><div class="table-scroll"><table><thead><tr><th>Sesi</th><th>Pemilik</th><th>Kendaraan</th><th>Masuk (WIB)</th><th>Keluar (WIB)</th><th>Tarif</th><th>Status</th></tr></thead><tbody><tr v-for="s in sessions.filter(s=>statusFilter==='Semua'||s.status===statusFilter)" :key="s.id"><td class="mono">{{s.id}}</td><td>{{s.name}}</td><td>{{s.plate}}</td><td>{{s.entry}}</td><td>{{s.exit}}</td><td>{{rupiah(s.fee)}}</td><td><span class="badge" :class="{neutral:s.status==='Selesai'}">{{s.status}}</span></td></tr><tr v-if="!sessions.some(s=>statusFilter==='Semua'||s.status===statusFilter)"><td colspan="7" class="empty">Belum ada sesi pada filter ini.</td></tr></tbody></table></div></section>

    <section v-if="page==='transactions'" class="card"><div class="section-heading"><div><h2>Riwayat transaksi</h2><p>Saldo sebelum dan sesudah setiap transaksi.</p></div></div><div class="toolbar"><input aria-label="Cari transaksi" v-model="query" type="search" placeholder="Cari nama atau nomor transaksi…"><select aria-label="Jenis transaksi" v-model="transactionType"><option>Semua</option><option>Top-up</option><option>Pembayaran parkir</option></select></div><div class="table-scroll"><table><thead><tr><th>Transaksi</th><th>Pemilik</th><th>Jenis</th><th>Nominal</th><th>Saldo awal</th><th>Saldo akhir</th><th>Waktu (WIB)</th></tr></thead><tbody><tr v-for="t in filteredTransactions" :key="t.id"><td class="mono">{{t.id}}</td><td>{{t.name}}</td><td><span class="badge" :class="{neutral:t.type!=='Top-up'}">{{t.type}}</span></td><td>{{rupiah(t.amount)}}</td><td>{{rupiah(t.before)}}</td><td>{{rupiah(t.after)}}</td><td>{{t.time}}</td></tr><tr v-if="!filteredTransactions.length"><td colspan="7" class="empty">Tidak ada transaksi yang cocok.</td></tr></tbody></table></div></section>

    <div v-if="page==='devices'" class="two-columns"><section class="card"><div class="section-heading"><h2>Gerbang utama</h2><span class="badge neutral">Contoh</span></div><dl class="device-details"><div><dt>Perangkat</dt><dd>NodeMCU Gate 01</dd></div><div><dt>Reader</dt><dd>RC522</dd></div><div><dt>Mode dipilih</dt><dd>{{mode}}</dd></div><div><dt>Posisi fisik palang</dt><dd>Belum terverifikasi</dd></div></dl><p class="helper">Status di halaman ini adalah tampilan contoh.</p></section><section class="card"><h2>Mode reader</h2><p class="section-description">Pilih satu mode untuk alur yang akan digunakan.</p><form @submit.prevent="mode=selectedMode;message('Mode contoh diperbarui menjadi '+mode+'.')"><label>Mode<select aria-label="Mode reader" v-model="selectedMode"><option value="REGISTER">REGISTER — Registrasi kartu</option><option value="TOPUP">TOPUP — Pilih kartu top-up</option><option value="ENTRY">ENTRY — Gerbang masuk</option><option value="EXIT">EXIT — Gerbang keluar</option></select></label><p class="helper">REGISTER dan TOPUP tidak mengotorisasi pembukaan palang.</p><button>Terapkan mode contoh</button></form></section></div>

    <section v-if="page==='settings'" class="card settings-card"><h2>Pengaturan parkir</h2><p class="section-description">Nilai awal untuk tampilan dan simulasi top-up.</p><form @submit.prevent="saveSettings"><div class="form-grid"><label>Tarif per sesi (Rp)<input type="number" min="1" step="1" v-model.number="settingsForm.rate" required></label><label>Durasi buka palang (detik)<input type="number" min="0.5" max="5" step="0.5" v-model.number="settingsForm.duration" required></label><label>Minimum top-up (Rp)<input type="number" min="1" step="1" v-model.number="settingsForm.min" required></label><label>Maksimum top-up (Rp)<input type="number" :min="settingsForm.min" step="1" v-model.number="settingsForm.max" required></label></div><div class="form-actions"><button>Simpan pengaturan contoh</button></div></form></section>
    <footer>OneParking · CampusPay <span>Admin workspace</span></footer>
   </main>
  </div>
 </div>
</template>
