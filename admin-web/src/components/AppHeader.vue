<script setup>
import { useRouter } from "vue-router";
import { demoSession } from "../stores/session";
const router = useRouter();
function logout() {
  demoSession.value = false;
  router.push("/login");
}
</script>
<template>
  <header class="topbar">
    <span>Manajemen parkir kampus</span>
    <div class="header-actions">
      <RouterLink to="/display" target="_blank" rel="noopener"
        >Digital Display ↗</RouterLink
      ><span class="demo-tag"><i></i>Pratinjau UI</span
      ><button class="text-button" @click="logout">Keluar</button>
    </div>
  </header>
</template>
