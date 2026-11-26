<script setup>
import { useDemoStore } from "../../stores/demoStore";
import ConfirmDialog from "../../components/ConfirmDialog.vue";
const {
  cards,
  query,
  statusFilter,
  showCardForm,
  cardForm,
  title,
  filteredCards,
  rupiah,
  addCard,
  pendingBlock,
  confirmBlock,
} = useDemoStore();
</script>
<template>
  <section v-if="showCardForm" class="card">
    <div class="section-heading">
      <div>
        <h2>Tambah kartu</h2>
        <p>Kartu contoh baru dimulai dengan saldo Rp0.</p>
      </div>
    </div>
    <form @submit.prevent="addCard">
      <div class="form-grid">
        <label
          >Nama pemilik<input
            v-model="cardForm.name"
            required
            maxlength="100"
            placeholder="Nama lengkap" /></label
        ><label
          >NIM<input
            v-model="cardForm.nim"
            required
            maxlength="40"
            placeholder="Contoh: 2301005" /></label
        ><label
          >Nomor kendaraan<input
            v-model="cardForm.plate"
            required
            maxlength="20"
            placeholder="B 1234 ABC" /></label
        ><label
          >UID kartu<input
            v-model="cardForm.uid"
            required
            maxlength="20"
            placeholder="Contoh: 0012ABCD"
        /></label>
      </div>
      <div class="form-actions">
        <button type="button" class="secondary" @click="showCardForm = false">
          Batal</button
        ><button>Simpan kartu contoh</button>
      </div>
    </form>
  </section>
  <section class="card">
    <div class="section-heading">
      <div>
        <h2>Daftar kartu</h2>
        <p>{{ cards.length }} kartu terdaftar pada pratinjau.</p>
      </div>
    </div>
    <div class="toolbar">
      <input
        aria-label="Cari kartu"
        v-model="query"
        type="search"
        placeholder="Cari nama, NIM, plat, atau UID…"
      /><select aria-label="Filter status kartu" v-model="statusFilter">
        <option>Semua</option>
        <option>Aktif</option>
        <option>Diblokir</option>
      </select>
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Pemilik</th>
            <th>Kendaraan</th>
            <th>UID kartu</th>
            <th>Saldo</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in filteredCards" :key="c.id">
            <td>
              <strong>{{ c.name }}</strong><small>{{ c.nim }}</small>
            </td>
            <td>{{ c.plate }}</td>
            <td class="mono">{{ c.uid }}</td>
            <td>{{ rupiah(c.balance) }}</td>
            <td>
              <span class="badge" :class="{ blocked: c.status !== 'Aktif' }">{{
                c.status
              }}</span>
            </td>
            <td>
              <button class="text-button" @click="pendingBlock = c">
                {{ c.status === "Aktif" ? "Blokir" : "Aktifkan" }}
              </button>
            </td>
          </tr>
          <tr v-if="!filteredCards.length">
            <td colspan="6" class="empty">Tidak ada kartu yang cocok.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <ConfirmDialog
    v-if="pendingBlock"
    title="Ubah status kartu?"
    :description="
      pendingBlock.name +
      ' akan ' +
      (pendingBlock.status === 'Aktif' ? 'diblokir' : 'diaktifkan') +
      ' pada data contoh.'
    "
    confirm-label="Konfirmasi perubahan"
    @cancel="pendingBlock = null"
    @confirm="confirmBlock"
  />
</template>
