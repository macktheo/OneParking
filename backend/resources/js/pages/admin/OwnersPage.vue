<script setup>
import { ref, reactive, computed } from "vue";
import { useParkingStore } from "../../stores/parkingStore";
const { holders, query, editOwner, createOwner, busy } = useParkingStore();
const editing = ref(null),
    show = ref(false),
    form = reactive({ name: "", nim: "", plate: "" });
const rows = computed(() =>
    holders.value.filter((h) =>
        [h.name, h.student_number, h.vehicle_plate].some((v) =>
            v.toLowerCase().includes(query.value.toLowerCase()),
        ),
    ),
);
function start(h = null) {
    editing.value = h?.id || null;
    Object.assign(form, {
        name: h?.name || "",
        nim: h?.student_number || "",
        plate: h?.vehicle_plate || "",
    });
    show.value = true;
}
async function save() {
    const ok = editing.value
        ? await editOwner(editing.value, form)
        : await createOwner(form);
    if (ok) show.value = false;
}
</script>
<template>
    <section v-if="show" class="card p-5">
        <h2>{{ editing ? "Edit identitas pemilik" : "Tambah pemilik" }}</h2>
        <form @submit.prevent="save">
            <div class="form-grid">
                <label
                    >Nama pemilik<input
                        v-model="form.name"
                        required
                        maxlength="100" /></label
                ><label
                    >NIM<input
                        v-model="form.nim"
                        required
                        maxlength="40" /></label
                ><label
                    >Nomor kendaraan<input
                        v-model="form.plate"
                        required
                        maxlength="20"
                /></label>
            </div>
            <div class="form-actions">
                <button type="button" class="secondary" @click="show = false">
                    Batal</button
                ><button :disabled="busy">Simpan identitas</button>
            </div>
        </form>
    </section>
    <section class="card p-5">
        <div class="section-heading">
            <div>
                <h2>Daftar pemilik</h2>
                <p>Identitas pemegang kartu uji.</p>
            </div>
            <button @click="start()">+ Tambah pemilik</button>
        </div>
        <div class="toolbar">
            <input
                type="search"
                aria-label="Cari pemilik"
                v-model="query"
                placeholder="Cari nama, NIM, atau kendaraan…"
            />
        </div>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Pemilik</th>
                        <th>NIM</th>
                        <th>Kendaraan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="h in rows" :key="h.id">
                        <td>{{ h.name }}</td>
                        <td>{{ h.student_number }}</td>
                        <td>{{ h.vehicle_plate }}</td>
                        <td>
                            <button class="text-button" @click="start(h)">
                                Edit identitas
                            </button>
                        </td>
                    </tr>
                    <tr v-if="!rows.length">
                        <td colspan="4" class="empty">
                            Belum ada pemilik yang cocok.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>
