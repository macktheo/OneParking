import { createRouter, createWebHistory } from "vue-router";
import { user, refreshSession } from "../stores/session";
import AdminLayout from "../layouts/AdminLayout.vue";
const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", redirect: "/login" },
        {
            path: "/login",
            name: "login",
            component: () => import("../pages/auth/LoginPage.vue"),
            meta: { title: "Login admin" },
        },
        {
            path: "/display",
            name: "display",
            component: () => import("../pages/display/GateDisplayPage.vue"),
            meta: { title: "Digital Gate Display" },
        },
        {
            path: "/forbidden",
            name: "forbidden",
            component: () => import("../pages/system/ForbiddenPage.vue"),
            meta: { title: "Akses ditolak" },
        },
        {
            path: "/admin",
            component: AdminLayout,
            meta: { requiresSession: true },
            children: [
                { path: "", redirect: "/admin/dashboard" },
                {
                    path: "dashboard",
                    name: "dashboard",
                    component: () => import("../pages/admin/DashboardPage.vue"),
                    meta: { title: "Ringkasan" },
                },
                {path:'users',redirect:'/admin/cards'},
                {
                    path: "cards",
                    name: "cards",
                    component: () => import("../pages/admin/CardsPage.vue"),
                    meta: { title: "Kartu & registrasi" },
                },
                {
                    path: "topup",
                    name: "topup",
                    component: () => import("../pages/admin/TopupPage.vue"),
                    meta: { title: "Top-up saldo" },
                },
                {
                    path: "parking",
                    name: "parking",
                    component: () => import("../pages/admin/ParkingPage.vue"),
                    meta: { title: "Sesi parkir" },
                },
                {
                    path: "transactions",
                    name: "transactions",
                    component: () =>
                        import("../pages/admin/TransactionsPage.vue"),
                    meta: { title: "Transaksi" },
                },
                {
                    path: "devices",
                    name: "devices",
                    component: () => import("../pages/admin/DevicesPage.vue"),
                    meta: { title: "Perangkat" },
                },
                {
                    path: "security-logs",
                    name: "security-logs",
                    component: () =>
                        import("../pages/admin/SecurityLogsPage.vue"),
                    meta: { title: "Audit keamanan" },
                },
                {
                    path: "settings",
                    name: "settings",
                    component: () => import("../pages/admin/SettingsPage.vue"),
                    meta: { title: "Pengaturan" },
                },
            ],
        },
        {
            path: "/:pathMatch(.*)*",
            name: "not-found",
            component: () => import("../pages/system/NotFoundPage.vue"),
            meta: { title: "Halaman tidak ditemukan" },
        },
    ],
});
router.beforeEach(async (to) => {
    if (to.matched.some((r) => r.meta.requiresSession)) {
        try {
            const me = user.value || (await refreshSession());
            if (!me) return { name: "login", query: { next: to.fullPath } };
            if (me.role !== "admin") return { name: "forbidden" };
        } catch {
            return { name: "login" };
        }
    }
});
router.afterEach((to) => {
    document.title = (to.meta.title || "OneParking") + " · OneParking";
});
export default router;
