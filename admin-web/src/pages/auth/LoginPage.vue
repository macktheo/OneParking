<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { demoSession } from "../../stores/session";
const email = ref("admin@oneparking.test"),
  password = ref(""),
  error = ref(""),
  loading = ref(false),
  show = ref(false);
const router = useRouter(),
  route = useRoute();
async function login() {
  loading.value = true;
  error.value = "";
  await new Promise((r) => setTimeout(r, 350));
  if (
    email.value === "admin@oneparking.test" &&
    password.value === "demo12345"
  ) {
    demoSession.value = true;
    const next = String(route.query.next || "");
    router.push(next.startsWith("/admin/") ? next : "/admin/dashboard");
  } else error.value = "Email atau password contoh tidak sesuai.";
  loading.value = false;
}
</script>
<template>
  <main class="auth-page">
    <section class="auth-intro">
      <RouterLink class="brand" to="/login"
        ><span class="brand-icon">P</span>OneParking.</RouterLink
      >
      <div>
        <p class="eyebrow">CAMPUSPAY / CAMPUS PARKING</p>
        <h1>Parkir kampus,<br />lebih tertata.</h1>
        <p>
          Kelola kartu, saldo simulasi, dan aktivitas gerbang dalam satu
          workspace.
        </p>
        <div class="auth-highlights">
          <span>01 · Kartu RFID</span><span>02 · Transaksi parkir</span
          ><span>03 · Digital gate display</span>
        </div>
      </div>
      <small>Acuan antarmuka website · Data contoh</small>
    </section>
    <section class="login-card">
      <span class="demo-tag">Pratinjau UI</span>
      <h1>Masuk ke admin</h1>
      <p>Gunakan akun contoh untuk meninjau seluruh halaman.</p>
      <form @submit.prevent="login">
        <label
          >Email<input
            type="email"
            v-model="email"
            autocomplete="username"
            required /></label
        ><label
          >Password
          <div class="password-field">
            <input
              :type="show ? 'text' : 'password'"
              aria-label="Password"
              v-model="password"
              autocomplete="current-password"
              required
            /><button type="button" class="text-button" @click="show = !show">
              {{ show ? "Sembunyikan" : "Lihat" }}
            </button>
          </div></label
        >
        <p v-if="error" role="alert" class="login-error">{{ error }}</p>
        <button class="full-width" :disabled="loading">
          {{ loading ? "Memproses…" : "Masuk ke dashboard" }}
        </button>
      </form>
      <div class="demo-credentials">
        <strong>Akun contoh</strong><code>admin@oneparking.test</code
        ><code>demo12345</code
        ><small>Simulasi login di browser; bukan autentikasi nyata.</small>
      </div>
      <RouterLink class="display-link" to="/display"
        >Buka Digital Gate Display →</RouterLink
      >
    </section>
  </main>
</template>
