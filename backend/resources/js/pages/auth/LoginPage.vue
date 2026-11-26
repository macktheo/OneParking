<script setup>
import UiIcon from "../../components/UiIcon.vue";

import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { login } from "../../stores/session";
const email = ref(""),
    password = ref(""),
    error = ref(""),
    loading = ref(false),
    show = ref(false);
const router = useRouter(),
    route = useRoute();
async function submit() {
    if (loading.value) return;
    loading.value = true;
    error.value = "";
    try {
        const me = await login(email.value, password.value);
        password.value = "";
        if (me.role !== "admin") {
            router.push("/forbidden");
            return;
        }
        const next = String(route.query.next || "");
        router.push(next.startsWith("/admin/") ? next : "/admin/dashboard");
    } catch (e) {
        error.value =
            e.status === 422
                ? "Email atau password tidak sesuai."
                : e.status === 429
                  ? "Terlalu banyak percobaan. Tunggu satu menit."
                  : e.message;
    } finally {
        loading.value = false;
    }
}
</script>
<template>
    <div class="grid min-h-screen lg:grid-cols-2">
        <div
            class="hidden flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-violet-500 p-12 text-white lg:flex"
        >
            <div class="flex items-center gap-3">
                <div class="h-12 w-12 overflow-hidden rounded-2xl bg-white/15">
                    <img
                        :src="'/assets/campuspay-mark.svg'"
                        alt="CampusPay"
                        class="h-full w-full object-cover"
                    />
                </div>
                <div>
                    <p class="text-xl font-extrabold">CampusPay</p>
                    <p class="text-xs text-violet-100">Smart Campus Parking</p>
                </div>
            </div>

            <div>
                <p class="text-sm font-semibold text-violet-100">
                    SISTEM PARKIR KAMPUS BERBASIS RFID
                </p>
                <h1
                    class="mt-4 max-w-lg text-5xl font-extrabold leading-tight tracking-tight"
                >
                    Kelola parkir kampus dengan lebih aman dan mudah.
                </h1>
                <p class="mt-5 max-w-md text-sm leading-7 text-violet-100/80">
                    Satu platform untuk mengelola kartu RFID, saldo simulasi,
                    transaksi, dan perangkat gerbang parkir.
                </p>
            </div>

            <p class="text-xs text-violet-100/60">
                © 2026 CampusPay · Prototipe Akademik
            </p>
        </div>

        <div class="flex items-center justify-center bg-slate-50 p-6">
            <div class="w-full max-w-md">
                <div class="mb-8 flex items-center gap-3 lg:hidden">
                    <div
                        class="h-11 w-11 overflow-hidden rounded-2xl bg-brand-600"
                    >
                        <img
                            :src="'/assets/campuspay-mark.svg'"
                            alt="CampusPay"
                            class="h-full w-full object-cover"
                        />
                    </div>
                    <div>
                        <p class="text-lg font-extrabold">CampusPay</p>
                        <p class="text-[10px] text-slate-400">
                            SMART CAMPUS PARKING
                        </p>
                    </div>
                </div>

                <div class="card p-7 sm:p-9">
                    <div class="mb-7">
                        <div
                            class="mb-5 hidden h-12 w-12 overflow-hidden rounded-2xl bg-brand-600 lg:block"
                        >
                            <img
                                :src="'/assets/campuspay-mark.svg'"
                                alt="CampusPay"
                                class="h-full w-full object-cover"
                            />
                        </div>
                        <h2 class="text-2xl font-extrabold tracking-tight">
                            Selamat Datang
                        </h2>
                        <p class="mt-2 text-sm text-slate-500">
                            Masuk untuk mengelola sistem parkir kampus.
                        </p>
                    </div>

                    <form
                        id="login-form"
                        class="space-y-4"
                        @submit.prevent="submit"
                    >
                        <p
                            v-if="error"
                            role="alert"
                            class="rounded-xl bg-rose-50 p-3 text-xs text-rose-700"
                        >
                            {{ error }}
                        </p>
                        <label class="block"
                            ><span
                                class="mb-1.5 block text-xs font-bold text-slate-600"
                                >Email</span
                            ><input
                                class="input"
                                type="email"
                                v-model="email"
                                placeholder="Email administrator"
                                autocomplete="username"
                                required
                        /></label>
                        <label class="block"
                            ><span
                                class="mb-1.5 block text-xs font-bold text-slate-600"
                                >Password</span
                            >
                            <div class="password-field">
                                <input
                                    class="input"
                                    aria-label="Password"
                                    :type="show ? 'text' : 'password'"
                                    v-model="password"
                                    placeholder="Masukkan password"
                                    autocomplete="current-password"
                                    required
                                /><button
                                    type="button"
                                    class="text-button"
                                    @click="show = !show"
                                >
                                    {{ show ? "Sembunyikan" : "Lihat" }}
                                </button>
                            </div></label
                        >

                        <div class="flex items-center justify-between text-xs">
                            <span class="text-slate-400"
                                >Saldo simulasi, bukan uang bank</span
                            >
                            <span class="font-semibold text-brand-600"
                                >Akses administrator</span
                            >
                        </div>

                        <button
                            class="btn-primary w-full py-3"
                            type="submit"
                            :disabled="loading"
                        >
                            {{ loading ? "Memproses…" : "Masuk ke Dashboard" }}
                            <UiIcon name="arrow" :size="16" />
                        </button>
                    </form>

                    <p
                        class="mt-6 text-center text-[11px] leading-5 text-slate-400"
                    >
                        Akses hanya untuk administrator yang berwenang. Tidak
                        tersedia pendaftaran akun publik.
                    </p>
                </div>

                <p class="mt-5 text-center text-[11px] text-slate-400">
                    CampusPay v1.0 · Saldo simulasi
                    <RouterLink class="ml-2 text-brand-600" to="/display"
                        >Digital Display ↗</RouterLink
                    >
                </p>
            </div>
        </div>
    </div>
</template>
