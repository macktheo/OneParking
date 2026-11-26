<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api, business } from '../services/api';
import { useParkingStore } from '../stores/parkingStore';
import { pendingTapTopup, submitTapTopup } from '../services/tapTopup';
const props = defineProps({ operation: {type:String, default:'REGISTER'}, amount:Number });
const isTopup = props.operation === 'TOPUP';
const targetMode = props.operation;
const emit = defineEmits(['close','completed']);
const { loadBusiness, refreshLive, query, statusFilter, rupiah, scanDialogOpen, message } = useParkingStore();
const dialog = ref(null), phase = ref('sync'), detail = ref(''), uid = ref(''), seconds = ref(60);
const title = computed(() => ({sync:'Menyiapkan reader', waiting:'Tempelkan kartu', saving:isTopup?'Memproses top-up':'Menyimpan kartu', success:isTopup?'Top-up berhasil':'Kartu berhasil terdaftar', error:isTopup?'Top-up gagal':'Registrasi gagal'})[phase.value]);
let generation = 0, previous, lease = null;
const closing = ref(false);
async function restoreMode() {
    if (!lease) return;
    const owned = lease; lease = null;
    try { await api(business(`devices/${owned.id}/mode`), 'PATCH', {mode:owned.returnMode, expected_version:owned.version}); }
    catch(e) { if(e.status !== 409) message('Mode parkir belum dapat dipulihkan. Periksa koneksi, lalu pilih AUTO pada menu Perangkat.',true); }
}
const pause = () => new Promise(resolve => setTimeout(resolve, 800));
async function close(event) {
    event?.preventDefault();
    if (phase.value === 'saving' || closing.value) return;
    closing.value = true;
    generation++;
    await restoreMode();
    emit('close');
}
function problem(code) {
    return ({
        STALE_MODE:'Mode ESP belum sesuai dengan server. Lepaskan kartu, klik Coba lagi, lalu tunggu tulisan Tempelkan kartu sebelum tap.',
        STALE_SCAN:'Waktu scan sudah kedaluwarsa. Periksa NTP di Serial Monitor, lalu lepaskan dan tap ulang kartu.',
        CARD_EXISTS:'UID ini sudah terdaftar. Periksa daftar kartu atau gunakan kartu lain.',
        SCAN_MODE_CHANGED:'Mode perangkat berubah saat proses berlangsung. Hindari mengubah mode dari tab lain, lalu coba lagi.',
        SCAN_ALREADY_USED:'Scan telah dipakai oleh proses lain. Lepaskan kartu dan lakukan tap baru.',
        INVALID_SCAN_CLAIM:'Referensi scan kedaluwarsa. Lepaskan kartu dan coba lagi.',
        UNKNOWN_CARD:'UID belum terdaftar. Daftarkan kartu terlebih dahulu melalui menu Kartu RFID sebelum melakukan top-up.',
        BLOCKED_CARD:'Kartu diblokir. Aktifkan kartu pada menu Kartu RFID sebelum melakukan top-up.',
        CARD_NOT_ACTIVE:'Kartu belum terdaftar atau tidak aktif. Periksa kartu pada menu Kartu RFID terlebih dahulu.',
    })[code];
}
async function begin() {
    const token = ++generation, active = () => token === generation;
    phase.value = 'sync'; detail.value = `Menyinkronkan mode ${targetMode} dengan ESP. Tunggu sebelum menempelkan kartu.`; uid.value = '';
    let committed = false;
    try {
        if (isTopup && pendingTapTopup()) {
            phase.value = 'saving'; detail.value = 'Memeriksa transaksi sebelumnya dengan referensi yang sama…';
            const result = await submitTapTopup();
            committed = true; await loadBusiness(); await refreshLive(true);
            if (!active()) return;
            phase.value = 'success'; detail.value = 'Transaksi sebelumnya terkonfirmasi. Saldo akhir: '+rupiah(result.balance_after); emit('completed',result); return;
        }
        const before = await api(business('reader-state'));
        if (!active()) return;
        const reader = before.devices[0], baseline = Number(before.scan?.id || 0);
        if (!reader?.online) throw Error('ESP Offline. Pastikan WiFi dan server terhubung; periksa log HEARTBEAT di Serial Monitor 115200 baud, lalu coba lagi.');
        if (reader.reader_ready === false || reader.reader_ready === 0) throw Error('Reader RFID belum siap. Periksa wiring dan log RFID pada Serial Monitor, lalu coba lagi.');
        const target = await api(business(`devices/${reader.id}/mode`), 'PATCH', {mode:targetMode});
        lease = {id:reader.id, version:target.mode_version, returnMode:lease?.returnMode || (['AUTO','ENTRY','EXIT'].includes(reader.mode) ? reader.mode : 'AUTO')};
        if (!active()) { await restoreMode(); return; }
        const deadline = Date.now() + 60000;
        while (active() && Date.now() < deadline) {
            const live = await api(business('reader-state'));
            if (!active()) return;
            seconds.value = Math.max(0, Math.ceil((deadline-Date.now())/1000));
            const device = live.devices.find(d => d.id === reader.id), scan = live.scan;
            if (!device?.online) throw Error('Koneksi ESP terputus. Periksa WiFi dan heartbeat, kemudian klik Coba lagi.');
            if (device.mode !== targetMode || Number(device.mode_version) !== Number(target.mode_version)) throw Error(problem('SCAN_MODE_CHANGED'));
            if (scan && Number(scan.id) > baseline && scan.device_id === reader.id) {
                if (scan.result_code !== targetMode+'_SCAN') throw Error(problem(scan.result_code) || `Scan ditolak (${scan.result_code}). Periksa Serial Monitor dan coba lagi.`);
                if (Number(scan.mode_version) !== Number(target.mode_version)) throw Error(problem('STALE_MODE'));
                uid.value = scan.uid;
                phase.value = 'saving'; detail.value = 'UID terbaca. Memproses dan memperbarui dashboard…';
                const claim = await api(business('scan-claims'), 'POST', {});
                if (!active()) return;
                if (Number(claim.scan_id) !== Number(scan.id) || claim.uid !== scan.uid || claim.mode !== targetMode) throw Error('Scan berubah karena ada tap lain. Lepaskan semua kartu dan coba lagi dengan satu kartu.');
                if (isTopup) {
                    if (!claim.card) throw Error(problem('UNKNOWN_CARD'));
                    if (claim.card.status !== 'ACTIVE') throw Error(problem('BLOCKED_CARD'));
                    const result = await submitTapTopup(claim, props.amount);
                    committed = true; await loadBusiness(); await refreshLive(true);
                    if (!active()) return;
                    phase.value = 'success'; detail.value = `Saldo berhasil ditambah ${rupiah(props.amount)}. Saldo akhir: ${rupiah(result.balance_after)}.`; emit('completed',{...result,uid:uid.value,amount:props.amount}); return;
                }
                try {
                    const saved = await api(business('cards'), 'POST', {claim_id:claim.claim_id});
                    if (saved.restored) uid.value = saved.uid;
                } catch (e) {
                    if (e.status !== 0) throw e;
                    // A lost response may still have committed. Check the UID before reporting failure.
                    const cards = await api(business('cards'));
                    if (!cards.some(c => c.uid === uid.value)) throw Error('Respons penyimpanan terputus; hasil belum dapat dipastikan. Tutup popup dan periksa UID pada daftar kartu sebelum mencoba lagi.');
                }
                committed = true;
                query.value = ''; statusFilter.value = 'Semua';
                await loadBusiness(); await refreshLive(true);
                if (!active()) return;
                phase.value = 'success'; detail.value = 'UID sudah tersimpan dan daftar kartu diperbarui. Kartu siap digunakan sebagai identitas masuk/keluar.';
                return;
            }
            if (Number(device.reported_mode_version) === Number(target.mode_version)) {
                phase.value = 'waiting'; detail.value = isTopup ? `Tempelkan kartu terdaftar lalu lepaskan. Saldo otomatis ditambah ${rupiah(props.amount)} satu kali.` : 'Tempelkan satu kartu ke reader RFID, lalu lepaskan. UID akan disimpan otomatis tanpa mengisi data.';
            }
            await pause();
        }
        if (active()) throw Error(phase.value === 'sync' ? `ESP belum mengonfirmasi mode ${targetMode}. Periksa log CONFIG/HEARTBEAT dan koneksi server, lalu coba lagi.` : 'Belum ada kartu terbaca dalam 60 detik. Periksa posisi kartu dan wiring RC522, lalu klik Coba lagi.');
    } catch (e) {
        if (!active()) return;
        phase.value = 'error';
        const code = e.data?.message || e.data?.code;
        const help = e.status === 0 ? 'Koneksi dashboard ke server terputus. Pastikan layanan server aktif, refresh halaman, lalu coba lagi.' : [401,419].includes(e.status) ? 'Sesi login berakhir. Tutup popup, refresh halaman dan login kembali.' : e.status >= 500 ? 'Layanan server gagal memproses permintaan. Periksa layanan backend dan database, lalu coba lagi setelah normal.' : e.message;
        detail.value = committed ? (isTopup ? 'Top-up sudah berhasil, tetapi tampilan gagal diperbarui. Tutup popup dan refresh halaman; jangan ulangi top-up ini.' : `UID ${uid.value} sudah tersimpan, tetapi daftar gagal diperbarui. Tutup popup dan refresh halaman; tidak perlu mendaftarkan ulang.`) : isTopup && pendingTapTopup() ? 'Hasil top-up belum terkonfirmasi. Klik Coba lagi untuk memeriksa transaksi yang sama; nominal tidak akan ditambahkan dua kali.' : (problem(code) || help);
    }
}
onMounted(() => { scanDialogOpen.value = true; previous = document.activeElement; dialog.value.showModal(); begin(); });
onUnmounted(() => { generation++; scanDialogOpen.value = false; restoreMode(); previous?.focus(); });
</script>
<template>
    <dialog ref="dialog" class="confirm-dialog registration-dialog" aria-labelledby="registration-title" @cancel="close">
        <div class="registration-symbol" aria-hidden="true">{{phase==='success'?'✓':phase==='error'?'!':'▣'}}</div>
        <h2 id="registration-title">{{title}}</h2>
        <div :role="phase==='error'?'alert':'status'" aria-live="polite"><p>{{detail}}</p></div>
        <p v-if="uid" class="mono font-bold">UID: {{uid}}</p>
        <p v-if="phase==='waiting'" class="helper">Menunggu kartu · {{seconds}} detik</p>
        <p v-if="phase==='sync'" class="helper">Menunggu konfirmasi mode dari heartbeat ESP…</p>
        <div class="form-actions">
            <button class="secondary" :disabled="phase==='saving'||closing" @click="close">{{closing?'Mengembalikan mode…':phase==='success'||phase==='error'?'Tutup':'Batal'}}</button>
            <button v-if="phase==='error'" @click="begin">Coba lagi</button>
            <button v-if="phase==='success' && !isTopup" @click="begin">Tambah kartu lain</button>
        </div>
    </dialog>
</template>
