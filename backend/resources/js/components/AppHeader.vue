<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { logout, user } from "../stores/session";
import { useParkingStore } from "../stores/parkingStore";
import UiIcon from "./UiIcon.vue";
defineEmits(["toggle"]);
const router = useRouter(),
    error = ref("");
const { title, currentDevice } = useParkingStore();
async function signOut() {
    try {
        await logout();
        router.push("/login");
    } catch {
        error.value = "Logout belum berhasil; coba lagi.";
    }
}
</script>
<template>
    <header
        class="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur md:px-8"
    >
        <div class="flex items-center gap-3">
            <button
                class="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                aria-label="Buka navigasi"
                @click="$emit('toggle')"
            >
                <UiIcon name="menu" :size="21" />
            </button>
            <div>
                <p class="text-sm font-extrabold text-slate-900">{{ title }}</p>
                <p class="text-[11px] text-slate-400">Admin / {{ title }}</p>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <RouterLink
                to="/display"
                target="_blank"
                rel="noopener"
                class="hidden text-xs font-bold text-brand-600 sm:block"
                >Digital Display ↗</RouterLink
            ><span
                :class="
                    currentDevice?.online
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                "
                class="hidden rounded-full px-3 py-1.5 text-[11px] font-bold md:inline"
                >{{
                    currentDevice?.online
                        ? "Perangkat Online"
                        : "Perangkat Offline"
                }}</span
            >
            <div class="hidden sm:block">
                <p class="text-xs font-bold">
                    {{ user?.name || "Administrator" }}
                </p>
                <p class="text-[10px] text-slate-400">Admin CampusPay</p>
            </div>
            <button
                class="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Keluar"
                @click="signOut"
            >
                <UiIcon name="logout" />
            </button>
        </div>
        <p v-if="error" role="alert">{{ error }}</p>
    </header>
</template>
