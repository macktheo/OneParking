<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import AppSidebar from "../components/AppSidebar.vue";
import AppHeader from "../components/AppHeader.vue";
import NoticeBanner from "../components/NoticeBanner.vue";
import PageState from "../components/PageState.vue";
import { useParkingStore } from "../stores/parkingStore";
const {
    page,
    title,
    notice,
    error,
    showCardForm,
    go,
    viewState,
    load,
    refreshLive,
    busy,
    recoverPending,
} = useParkingStore();
const sidebar = ref(false);
let timer,
    stopped = false;
async function poll() {
    if (stopped) return;
    await refreshLive();
    if (!stopped) timer = setTimeout(poll, 1000);
}
onMounted(async () => {
    try {
        await load();
        await recoverPending();
    } catch {}
    if (!stopped) poll();
});
onUnmounted(() => {
    stopped = true;
    clearTimeout(timer);
});
</script>
<template>
    <div class="min-h-screen bg-slate-50 text-slate-900">
        <AppSidebar :open="sidebar" @close="sidebar = false" />
        <main class="min-h-screen lg:pl-[258px]">
            <AppHeader @toggle="sidebar = !sidebar" />
            <section class="mx-auto max-w-[1600px] p-5 md:p-8">
                <div
                    class="mb-6 flex flex-wrap items-start justify-between gap-3"
                >
                    <div>
                        <h1 class="page-title">{{ title }}</h1>
                        <p class="page-subtitle">
                            {{
                                page === "dashboard"
                                    ? "Ringkasan aktivitas parkir kampus."
                                    : "Kelola " +
                                      title.toLowerCase() +
                                      " melalui server CampusPay."
                            }}
                        </p>
                    </div>
                    <button
                        class="btn-primary"
                        v-if="page === 'cards'"
                        :disabled="busy"
                        @click="showCardForm = true"
                    >
                        {{
                            "+ Tambah kartu"
                        }}
                    </button>
                </div>
                <div id="page-content" class="content-area" :aria-busy="busy">
                    <NoticeBanner
                        :message="notice"
                        :error="error"
                        @close="notice = ''"
                    /><RouterView v-if="viewState === 'ready'" /><PageState
                        v-else
                        :state="viewState"
                        @retry="load().catch(() => {})"
                    />
                </div>
                <p class="mt-8 text-[10px] text-slate-400">
                    CampusPay · Saldo simulasi · Timestamp WIB · Posisi mekanik
                    tanpa sensor tidak terverifikasi
                </p>
            </section>
        </main>
    </div>
</template>
