<script setup>
import { computed, ref, reactive } from "vue";
import { useDemoStore } from "../../stores/demoStore";
import StatusBadge from "../../components/StatusBadge.vue";
const { cards, editOwner, query } = useDemoStore();
const editing = ref(null),
  form = reactive({ name: "", nim: "", plate: "" });
const owners = computed(() =>
  cards.value.filter((c) =>
    [c.name, c.nim, c.plate].some((v) =>
      v.toLowerCase().includes(query.value.toLowerCase()),
    ),
  ),
);
function start(card) {
  editing.value = card.id;
  Object.assign(form, { name: card.name, nim: card.nim, plate: card.plate });
}
function save() {
  if (Object.values(form).some((v) => !v.trim())) return;
  editOwner(editing.value, form);
  editing.value = null;
}
</script>
<template>
  <section v-if="editing" class="card">
    <h2>Edit identitas pemilik</h2>
    <form @submit.prevent="save">
      <div class="form-grid">
        <label
          >Nama pemilik<input
            v-model="form.name"
            required
            maxlength="100" /></label
        ><label>NIM<input v-model="form.nim" required maxlength="40" /></label
        ><label
          >Nomor kendaraan<input v-model="form.plate" required maxlength="20"
        /></label>
      </div>
      <div class="form-actions">
        <button type="button" class="secondary" @click="editing = null">
          Batal</button
        ><button>Simpan identitas contoh</button>
      </div>
    </form>
  </section>
  <section class="card">
    <div class="section-heading">
      <div>
        <h2>Daftar pemilik</h2>
        <p>Identitas pemegang kartu uji.</p>
      </div>
    </div>
    <div class="toolbar">
      <input
        type="search"
        aria-label="Cari pemilik"
        v-model="query"
        placeholder="Cari nama, NIM, atau kendaraan…"
      />
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Pemilik</th>
            <th>NIM</th>
            <th>Kendaraan</th>
            <th>Status kartu</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in owners" :key="c.id">
            <td>{{ c.name }}</td>
            <td>{{ c.nim }}</td>
            <td>{{ c.plate }}</td>
            <td>
              <StatusBadge
                :tone="c.status === 'Aktif' ? 'positive' : 'negative'"
                >{{ c.status }}</StatusBadge
              >
            </td>
            <td>
              <button class="text-button" @click="start(c)">
                Edit identitas
              </button>
            </td>
          </tr>
          <tr v-if="!owners.length">
            <td colspan="5" class="empty">Tidak ada pemilik yang cocok.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
