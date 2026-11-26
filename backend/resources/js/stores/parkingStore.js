import { ref, reactive, computed, watch, inject } from "vue";
import { api, business } from "../services/api";
import { user } from "./session";
export const parkingKey = Symbol("parking");
export const useParkingStore = () => inject(parkingKey);
export function createParkingStore(router) {
    const menu = [
        ["dashboard", "Ringkasan", "â–¦"],
        ["cards", "Kartu & registrasi", "â–¤"],
        ["topup", "Top-up saldo", "ï¼‹"],
        ["parking", "Sesi parkir", "P"],
        ["transactions", "Transaksi", "â†”"],
        ["devices", "Perangkat", "â—‰"],
        ["security-logs", "Audit keamanan", "â—‡"],
        ["settings", "Pengaturan", "âš™"],
    ];
    const page = computed(() => router.currentRoute.value.name || "dashboard"),
        title = computed(
            () => menu.find((m) => m[0] === page.value)?.[1] || "OneParking",
        );
    const cards = ref([]),
        holders = ref([]),
        transactions = ref([]),
        recentTransactions = ref([]),
        sessions = ref([]),
        devices = ref([]),
        auditLogs = ref([]),
        dashboard = ref({});
    const query = ref(""),
        statusFilter = ref("Semua"),
        transactionType = ref("Semua"),
        notice = ref(""),
        error = ref(false),
        viewState = ref("loading"),
        busy = ref(false);
    const scanDialogOpen = ref(false);
    const showCardForm = ref(false),
        review = ref(null),
        pendingBlock = ref(null),
        claim = ref(null),
        latestScan = ref(null),
        historyPage = ref(1),
        historyLast = ref(1),
        historyTotal = ref(0);
    const cardForm = reactive({
            name: "",
            nim: "",
            plate: "",
            uid: "",
            holderId: "",
        }),
        topup = reactive({ cardId: null, amount: 20000 });
    const settings = reactive({
            rate: 2000,
            duration: 3,
            min: 1000,
            max: 1000000,
        }),
        settingsForm = reactive({ ...settings }),
        mode = ref("UNKNOWN"),
        selectedMode = ref("ENTRY");
    let selectedHistory = {},
        pendingTopup = null,
        historySequence = 0,
        lastScanId = null;
    const currentDevice = computed(() => devices.value[0] || null);
    const selectedCard = computed(() =>
        cards.value.find((c) => c.id === Number(topup.cardId)),
    );
    const activeCards = computed(() => dashboard.value.active_cards || 0),
        activeSessions = computed(() => dashboard.value.active_sessions || 0),
        revenue = computed(() => dashboard.value.revenue || 0),
        rejected = computed(() => dashboard.value.rejected || 0);
    const filteredCards = computed(() =>
        cards.value.filter(
            (c) =>
                (statusFilter.value === "Semua" ||
                    c.status === statusFilter.value) &&
                [c.uid].some((v) =>
                    String(v).toLowerCase().includes(query.value.toLowerCase()),
                ),
        ),
    );
    const filteredTransactions = computed(() => transactions.value);
    const rupiah = (n) =>
        n === null || n === undefined
            ? "â€”"
            : new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
              }).format(n);
    const dateValue = (v) =>
        v ? new Date(v.includes("T") ? v : v.replace(" ", "T") + "Z") : null;
    const time = (v) =>
        dateValue(v)?.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) ||
        "â€”";
    const humanStatus = (raw) =>
        raw === "ACTIVE"
            ? "Aktif"
            : raw === "BLOCKED"
              ? "Diblokir"
              : raw === "COMPLETED"
                ? "Selesai"
                : raw;
    function message(text, isError = false) {
        notice.value = text;
        error.value = isError;
    }
    async function run(fn) {
        if (busy.value) return;
        busy.value = true;
        notice.value = "";
        error.value = false;
        try {
            const result = await fn();
            return result === undefined ? true : result;
        } catch (e) {
            message(e.message, true);
            if (e.status === 401) router.push("/login");
            return false;
        } finally {
            busy.value = false;
        }
    }
    function go(key) {
        router.push({ name: key });
    }
    function mapHistory(t) {
        return {
            id: (t.status === "REJECTED" ? "SCAN-" : "TRX-") + t.id,
            cardId: t.card_id,
            name: t.name,
            type: {
                TOPUP: "Top-up",
                PARKING_PAYMENT: "Pembayaran parkir",
                SCAN_REJECTED: "Penolakan scan",
            }[t.type],
            rawType: t.type,
            amount: t.amount === null ? null : Number(t.amount),
            before: t.balance_before === null ? null : Number(t.balance_before),
            after: t.balance_after === null ? null : Number(t.balance_after),
            date: dateValue(t.created_at)?.toLocaleDateString("en-CA", {
                timeZone: "Asia/Jakarta",
            }),
            time: time(t.created_at),
            status: t.status === "SUCCESS" ? "Berhasil" : "Ditolak",
            reason: t.reason,
            requestId: t.request_id,
        };
    }
    async function loadHistory(filters = selectedHistory, p = 1) {
        selectedHistory = { ...filters };
        const sequence = ++historySequence;
        const params = new URLSearchParams({
            ...Object.fromEntries(
                Object.entries(filters).filter(
                    ([, v]) => v !== "" && v !== null && v !== undefined,
                ),
            ),
            page: p,
        });
        const data = await api(business("transactions?" + params));
        if (sequence !== historySequence) return;
        transactions.value = data.data.map(mapHistory);
        historyPage.value = data.current_page;
        historyLast.value = data.last_page;
        historyTotal.value = data.total;
    }
    async function loadBusiness() {
        const [cs, ps, as, recent] = await Promise.all([
            api(business("cards")),
            api(business("parking")),
            api(business("audit-logs")),
            api(business("transactions?page=1")),
        ]);
        recentTransactions.value = recent.data.map(mapHistory);
        cards.value = cs.map((c) => ({
            id: c.id,
            name: c.uid,
            uid: c.uid,
            balance: Number(c.balance),
            status: humanStatus(c.status),
        }));
        holders.value = []; // Legacy holder records are not loaded by the UID-only UI.
        sessions.value = ps.map((s) => ({
            id: "PKR-" + s.id,
            cardId: s.card_id,
            name: s.uid,
            uid: s.uid,
            entry: time(s.entry_at),
            exit: time(s.exit_at),
            fee: s.fee_snapshot,
            status: humanStatus(s.status),
            duration: s.exit_at
                ? Math.round(
                      (dateValue(s.exit_at) - dateValue(s.entry_at)) / 60000,
                  ) + " menit"
                : "Berlangsung",
        }));
        auditLogs.value = as.map((a) => ({
            id: a.id,
            time: time(a.created_at),
            actor: a.actor,
            action: a.action,
            result: /DENIED|RATE_LIMIT|HTTP_[45]|BLOCKED|UNKNOWN|INSUFFICIENT|INVALID|STALE|ALREADY/.test(
                a.result,
            )
                ? "Ditolak"
                : "Berhasil",
            rawResult: a.result,
            requestId: a.request_id || "â€”",
        }));
        await loadHistory(selectedHistory, historyPage.value);
    }
    async function load() {
        viewState.value = "loading";
        try {
            const [d, ds, config] = await Promise.all([
                api(business("dashboard")),
                api(business("devices")),
                api(business("settings")),
            ]);
            dashboard.value = d;
            devices.value = ds;
            mode.value = ds[0]?.mode || "UNKNOWN";
            selectedMode.value = mode.value;
            Object.assign(settings, {
                rate: config.rate,
                duration: config.duration_ms / 1000,
                min: config.topup_min,
                max: config.topup_max,
            });
            Object.assign(settingsForm, settings);
            await loadBusiness();
            viewState.value = "ready";
        } catch (e) {
            viewState.value = e.status === 0 ? "offline" : "error";
            message(e.message, true);
            throw e;
        }
    }
    async function refreshLive(force = false) {
        if (busy.value || (scanDialogOpen.value && !force)) return;
        try {
            const live = await api(business("live"));
            const d = live.dashboard,
                ds = live.devices,
                scan = { scan: live.scan };
            dashboard.value = d;
            devices.value = ds;
            mode.value = ds[0]?.mode || "UNKNOWN";
            latestScan.value = scan.scan;
            if (scan.scan?.id !== lastScanId) {
                lastScanId = scan.scan?.id;
                await loadBusiness();
            }
            if (
                claim.value &&
                Date.now() >= Date.parse(claim.value.expires_at)
            ) {
                claim.value = null;
                review.value = null;
                message(
                    "Referensi scan kedaluwarsa. Tap kartu lagi lalu ambil scan terbaru.",
                    true,
                );
            }
        } catch (e) {
            if (e.status === 401) {
                router.push("/login");
                return;
            }
            message(
                "Pembaruan perangkat terputus. Status fisik palang belum terverifikasi.",
                true,
            );
        }
    }
    async function acquireScan(expected) {
        return run(async () => {
            if(!currentDevice.value?.online) throw Error('ESP belum terhubung ke server. Buka Serial Monitor 115200 dan periksa WiFi/NTP/HTTPS sebelum tap kartu.');
            const data = await api(business("scan-claims"), "POST", {});
            if (data.mode !== expected)
                throw Error(
                    "Pilih mode " +
                        expected +
                        " pada perangkat, lalu tap dan lepas kartu.",
                );
            claim.value = data;
            cardForm.uid = data.uid;
            if (expected === "TOPUP") {
                const c = cards.value.find((c) => c.uid === data.uid);
                if (!c || c.status !== "Aktif") {
                    claim.value = null;
                    throw Error("Kartu belum terdaftar atau tidak aktif.");
                }
                topup.cardId = c.id;
            }
            showCardForm.value = true;
            message(
                "Scan dipilih. Periksa identitas dan konfirmasikan sebelum kedaluwarsa.",
            );
        });
    }
    async function addCard() {
        return run(async () => {
            if (!claim.value || claim.value.mode !== "REGISTER")
                throw Error("Ambil scan REGISTER terbaru terlebih dahulu.");
            const body = { claim_id: claim.value.claim_id };
            await api(business("cards"), "POST", body);
            claim.value = null;
            showCardForm.value = false;
            Object.keys(cardForm).forEach((k) => (cardForm[k] = ""));
            await loadBusiness();
            message("Kartu terdaftar dengan saldo awal Rp0.");
        });
    }
    function pendingKey() {
        return "oneparking-pending-topup-" + user.value?.id;
    }
    function savePending() {
        if (pendingTopup)
            sessionStorage.setItem(pendingKey(), JSON.stringify(pendingTopup));
        else sessionStorage.removeItem(pendingKey());
    }
    async function recoverPending() {
        const text = sessionStorage.getItem(pendingKey());
        if (!text) return;
        try {
            pendingTopup = JSON.parse(text);
            const result = await api(
                business("requests/" + pendingTopup.request_id),
            );
            pendingTopup = null;
            savePending();
            message(
                "Top-up sebelumnya sudah diproses. Saldo akhir: " +
                    rupiah(result.balance_after),
            );
            await loadBusiness();
        } catch (e) {
            message(
                "Ada top-up yang belum terkonfirmasi. Gunakan Rekonsiliasi transaksi sebelum membuat top-up baru.",
                true,
            );
        }
    }
    async function reconcileTopup() {
        return run(async () => {
            await recoverPending();
            if (pendingTopup) {
                try {
                    const result = await api(
                        business("topup"),
                        "POST",
                        pendingTopup,
                    );
                    pendingTopup = null;
                    savePending();
                    claim.value = null;
                    review.value = null;
                    await loadBusiness();
                    message(
                        "Rekonsiliasi selesai. Saldo: " +
                            rupiah(result.balance_after),
                    );
                } catch (e) {
                    if (e.status === 409 || e.status === 422) {
                        pendingTopup = null;
                        savePending();
                        message(
                            "Request belum diproses dan referensi sudah tidak valid. Periksa riwayat sebelum scan ulang.",
                            true,
                        );
                    } else throw e;
                }
            }
        });
    }
    function reviewTopup() {
        if (pendingTopup)
            return message("Rekonsiliasi transaksi sebelumnya dahulu.", true);
        const c = selectedCard.value,
            n = Number(topup.amount);
        if (
            !claim.value ||
            claim.value.mode !== "TOPUP" ||
            !c ||
            claim.value.uid !== c.uid
        )
            return message("Ambil scan TOPUP untuk memilih kartu.", true);
        if (c.status !== "Aktif") return message("Kartu tidak aktif.", true);
        if (!Number.isSafeInteger(n) || n < settings.min || n > settings.max)
            return message(
                "Nominal harus rupiah bulat sesuai batas pengaturan.",
                true,
            );
        review.value = {
            cardId: c.id,
            name: c.name,
            amount: n,
            claimId: claim.value.claim_id,
        };
    }
    async function confirmTopup() {
        return run(async () => {
            if (!review.value) return;
            if (!pendingTopup) {
                pendingTopup = {
                    request_id: crypto.randomUUID(),
                    claim_id: review.value.claimId,
                    amount: review.value.amount,
                };
                savePending();
            }
            let result;
            try {
                result = await api(
                    business("requests/" + pendingTopup.request_id),
                );
            } catch (e) {
                if (e.status !== 404) throw e;
                result = await api(business("topup"), "POST", pendingTopup);
            }
            pendingTopup = null;
            savePending();
            review.value = null;
            claim.value = null;
            await loadBusiness();
            message(
                "Top-up berhasil. Saldo akhir: " + rupiah(result.balance_after),
            );
        });
    }
    async function confirmBlock() {
        return run(async () => {
            const c = pendingBlock.value;
            if (!c) return;
            await api(business("cards/" + c.id + "/status"), "PATCH", {
                status: c.status === "Aktif" ? "BLOCKED" : "ACTIVE",
            });
            pendingBlock.value = null;
            await loadBusiness();
            message("Status kartu diperbarui. Sesi aktif tetap tersimpan.");
        });
    }
    async function editOwner(id, values) {
        return run(async () => {
            await api(business("holders/" + id), "PATCH", {
                name: values.name,
                student_number: values.nim,
                vehicle_plate: values.plate,
            });
            await loadBusiness();
            message("Identitas pemilik diperbarui.");
        });
    }
    async function createOwner(values) {
        return run(async () => {
            await api(business("holders"), "POST", {
                name: values.name,
                student_number: values.nim,
                vehicle_plate: values.plate,
            });
            await loadBusiness();
            message("Pemilik ditambahkan.");
        });
    }
    async function applyMode(value = selectedMode.value) {
        return run(async () => {
            if (!currentDevice.value)
                throw Error("Perangkat belum dikonfigurasi.");
            await api(
                business("devices/" + currentDevice.value.id + "/mode"),
                "PATCH",
                { mode: value },
            );
            claim.value = null;
            review.value = null;
            await refreshMode();
            message(
                "Mode diperbarui. Tunggu perangkat menyinkronkan mode sebelum tap.",
            );
        });
    }
    async function refreshMode() {
        const ds = await api(business("devices"));
        devices.value = ds;
        mode.value = ds[0]?.mode || "UNKNOWN";
        selectedMode.value = mode.value;
    }
    async function saveSettings() {
        return run(async () => {
            await api(business("settings"), "PATCH", {
                rate: settingsForm.rate,
                duration_ms: Math.round(settingsForm.duration * 1000),
                topup_min: settingsForm.min,
                topup_max: settingsForm.max,
            });
            Object.assign(settings, settingsForm);
            message(
                "Pengaturan tersimpan. Sesi lama tetap memakai snapshot tarif saat masuk.",
            );
        });
    }
    function exportUrl(filters = selectedHistory) {
        return business(
            "transactions/export?" +
                new URLSearchParams(
                    Object.fromEntries(
                        Object.entries(filters).filter(
                            ([, v]) =>
                                v !== "" && v !== null && v !== undefined,
                        ),
                    ),
                ),
        );
    }
    watch(
        () => [topup.cardId, topup.amount],
        () => {
            review.value = null;
        },
    );
    watch(page, () => {
        query.value = "";
        statusFilter.value = "Semua";
        notice.value = "";
        review.value = null;
        showCardForm.value = false;
        pendingBlock.value = null;
    });
    return {
        menu,
        page,
        title,
        cards,
        holders,
        transactions,
        recentTransactions,
        sessions,
        devices,
        auditLogs,
        dashboard,
        query,
        statusFilter,
        transactionType,
        notice,
        error,
        viewState,
        busy,
        showCardForm,
        scanDialogOpen,
        review,
        pendingBlock,
        claim,
        latestScan,
        historyPage,
        historyLast,
        historyTotal,
        cardForm,
        topup,
        settings,
        settingsForm,
        mode,
        selectedMode,
        currentDevice,
        selectedCard,
        activeCards,
        activeSessions,
        revenue,
        rejected,
        filteredCards,
        filteredTransactions,
        rupiah,
        time,
        message,
        run,
        go,
        load,
        loadBusiness,
        loadHistory,
        refreshLive,
        acquireScan,
        addCard,
        reviewTopup,
        confirmTopup,
        confirmBlock,
        editOwner,
        createOwner,
        applyMode,
        saveSettings,
        recoverPending,
        reconcileTopup,
        exportUrl,
    };
}
