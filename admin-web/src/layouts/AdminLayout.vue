<script setup>
import AppSidebar from "../components/AppSidebar.vue";
import AppHeader from "../components/AppHeader.vue";
import NoticeBanner from "../components/NoticeBanner.vue";
import PageState from "../components/PageState.vue";
import { useDemoStore } from "../stores/demoStore";
const { page, title, notice, error, showCardForm, go, viewState } =
  useDemoStore();
</script>
<template>
  <div class="layout">
    <AppSidebar />
    <div class="workspace">
      <AppHeader />
      <main>
        <div class="page-heading">
          <div>
            <p class="eyebrow">ONEPARKING / ADMIN</p>
            <h1>{{ title }}</h1>
            <p class="subtitle">
              {{
                page === "dashboard"
                  ? "Pantau aktivitas parkir dalam satu tempat."
                  : "Kelola " + title.toLowerCase() + " dengan mudah."
              }}
            </p>
          </div>
          <button v-if="page === 'cards'" @click="showCardForm = !showCardForm">
            {{ showCardForm ? "Tutup formulir" : "+ Tambah kartu" }}</button
          ><button v-if="page === 'dashboard'" @click="go('topup')">
            + Top-up saldo
          </button>
        </div>
        <div class="demo-note preview-toolbar">
          <span>Data contoh · Perubahan kembali ke awal saat reload.</span
          ><label
            >Tampilan pratinjau<select v-model="viewState">
              <option value="ready">Normal</option>
              <option value="loading">Loading</option>
              <option value="empty">Data kosong</option>
              <option value="error">Gagal memuat</option>
              <option value="offline">Offline</option>
            </select></label
          >
        </div>
        <NoticeBanner
          :message="notice"
          :error="error"
          @close="notice = ''"
        /><RouterView v-if="viewState === 'ready'" /><PageState
          v-else
          :state="viewState"
          @retry="viewState = 'ready'"
        />
        <footer>OneParking · CampusPay<span>Admin workspace</span></footer>
      </main>
    </div>
  </div>
</template>
