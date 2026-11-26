<script setup>
import { useDemoStore } from "../stores/demoStore";
const { menu, page, go } = useDemoStore();
</script>
<template>
  <aside class="sidebar">
    <RouterLink class="brand" to="/admin/dashboard"
      ><span class="brand-icon">P</span>OneParking<span class="brand-dot"
        >.</span
      ></RouterLink
    >
    <p class="nav-caption">ADMIN KAMPUS</p>
    <nav aria-label="Menu utama">
      <button
        v-for="[key, label, icon] in menu"
        :key="key"
        :class="{ selected: page === key }"
        :aria-current="page === key ? 'page' : undefined"
        @click="go(key)"
      >
        <span class="nav-icon" aria-hidden="true">{{ icon }}</span
        >{{ label }}
      </button>
    </nav>
    <div class="sidebar-footer">
      <span class="avatar">A</span>
      <div><strong>Administrator</strong><small>Akun contoh</small></div>
    </div>
  </aside>
</template>
