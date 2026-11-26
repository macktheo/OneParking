import { computed, reactive, ref, watch, inject } from "vue";
import {
  initialCards,
  initialTransactions,
  initialSessions,
} from "../mocks/data";

export const demoKey = Symbol("demo");
export function useDemoStore() {
  return inject(demoKey);
}
export function createDemoStore(router) {
  const menu = [
    ["dashboard", "Ringkasan", "▦"],
    ["users", "Pemilik", "♙"],
    ["cards", "Kartu & registrasi", "▤"],
    ["topup", "Top-up saldo", "＋"],
    ["parking", "Sesi parkir", "P"],
    ["transactions", "Transaksi", "↔"],
    ["devices", "Perangkat", "◉"],
    ["security-logs", "Audit keamanan", "◇"],
    ["settings", "Pengaturan", "⚙"],
  ];
  const page = computed(() => router.currentRoute.value.name || "dashboard");
  const cards = ref(structuredClone(initialCards));
  const transactions = ref(structuredClone(initialTransactions));
  const sessions = ref(structuredClone(initialSessions));
  const query = ref(""),
    statusFilter = ref("Semua"),
    transactionType = ref("Semua");
  const notice = ref(""),
    error = ref(false),
    showCardForm = ref(false),
    review = ref(null);
  const cardForm = reactive({ name: "", nim: "", plate: "", uid: "" });
  const topup = reactive({ cardId: 1, amount: 20000 });
  const settings = reactive({
    rate: 2000,
    duration: 3,
    min: 1000,
    max: 1000000,
  });
  const settingsForm = reactive({ ...settings });
  const mode = ref("ENTRY"),
    selectedMode = ref("ENTRY");
  const title = computed(() => menu.find((m) => m[0] === page.value)?.[1]);
  const selectedCard = computed(() =>
    cards.value.find((c) => c.id === Number(topup.cardId)),
  );
  const filteredCards = computed(() =>
    cards.value.filter(
      (c) =>
        (statusFilter.value === "Semua" || c.status === statusFilter.value) &&
        [c.name, c.nim, c.plate, c.uid].some((v) =>
          v.toLowerCase().includes(query.value.toLowerCase()),
        ),
    ),
  );
  const filteredTransactions = computed(() =>
    transactions.value.filter(
      (t) =>
        (transactionType.value === "Semua" ||
          t.type === transactionType.value) &&
        [t.name, t.id].some((v) =>
          v.toLowerCase().includes(query.value.toLowerCase()),
        ),
    ),
  );
  const activeCards = computed(
    () => cards.value.filter((c) => c.status === "Aktif").length,
  );
  const activeSessions = computed(
    () => sessions.value.filter((s) => s.status === "Aktif").length,
  );
  const revenue = computed(() =>
    transactions.value
      .filter((t) => t.type === "Pembayaran parkir")
      .reduce((a, t) => a + t.amount, 0),
  );
  const rupiah = (n) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  function message(text, isError = false) {
    notice.value = text;
    audit("UI_ACTION", isError ? "Ditolak" : "Berhasil");
    error.value = isError;
  }
  function go(key) {
    router.push({ name: key });
    query.value = "";
    statusFilter.value = "Semua";
    notice.value = "";
    review.value = null;
    showCardForm.value = false;
  }
  watch(
    () => [topup.cardId, topup.amount],
    () => (review.value = null),
  );
  function addCard() {
    const values = Object.fromEntries(
      Object.entries(cardForm).map(([k, v]) => [k, v.trim()]),
    );
    if (Object.values(values).some((v) => !v))
      return message("Lengkapi seluruh data kartu.", true);
    values.uid = values.uid.toUpperCase();
    if (!/^(?:[0-9A-F]{8}|[0-9A-F]{14}|[0-9A-F]{20})$/.test(values.uid))
      return message(
        "UID harus berupa 8, 14, atau 20 karakter heksadesimal.",
        true,
      );
    if (cards.value.some((c) => c.uid === values.uid))
      return message("UID sudah ada dalam daftar contoh.", true);
    cards.value.push({
      id: Math.max(0, ...cards.value.map((c) => c.id)) + 1,
      ...values,
      balance: 0,
      status: "Aktif",
    });
    Object.keys(cardForm).forEach((k) => (cardForm[k] = ""));
    showCardForm.value = false;
    message("Kartu ditambahkan ke data contoh dengan saldo Rp0.");
  }
  function toggleCard(card) {
    card.status = card.status === "Aktif" ? "Diblokir" : "Aktif";
    message(`Status ${card.name}: ${card.status.toLowerCase()}.`);
  }
  function reviewTopup() {
    const c = selectedCard.value,
      n = Number(topup.amount);
    if (!c || c.status !== "Aktif")
      return message("Pilih kartu yang aktif.", true);
    if (!Number.isSafeInteger(n) || n < settings.min || n > settings.max)
      return message(
        `Nominal harus rupiah bulat antara ${rupiah(settings.min)} dan ${rupiah(settings.max)}.`,
        true,
      );
    review.value = { cardId: c.id, name: c.name, uid: c.uid, amount: n };
    notice.value = "";
  }
  function confirmTopup() {
    if (!review.value) return;
    const item = review.value,
      c = cards.value.find((c) => c.id === item.cardId);
    if (!c || c.status !== "Aktif") {
      review.value = null;
      return message("Kartu sudah tidak aktif.", true);
    }
    const before = c.balance;
    c.balance += item.amount;
    const id = "TRX-" + String(transactions.value.length + 1).padStart(3, "0");
    transactions.value.unshift({
      id,
      name: c.name,
      type: "Top-up",
      amount: item.amount,
      before,
      after: c.balance,
      date: new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
      }).format(new Date()),
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
      status: "Berhasil",
    });
    review.value = null;
    message(`Simulasi top-up berhasil. Saldo ${c.name}: ${rupiah(c.balance)}.`);
  }
  function saveSettings() {
    const s = settingsForm;
    if (
      ![s.rate, s.min, s.max].every((n) => Number.isSafeInteger(n) && n > 0) ||
      s.min > s.max ||
      !Number.isFinite(s.duration) ||
      s.duration < 0.5 ||
      s.duration > 5
    )
      return message(
        "Periksa tarif, batas top-up, dan durasi buka (0,5–5 detik).",
        true,
      );
    Object.assign(settings, s);
    message("Pengaturan contoh disimpan untuk sesi browser ini.");
  }

  const viewState = ref("ready");
  const pendingBlock = ref(null);
  const auditLogs = ref([
    {
      id: 3,
      time: "09.42",
      actor: "NodeMCU Gate 01",
      action: "EXIT_PAYMENT",
      result: "Berhasil",
      requestId: "demo-003",
    },
    {
      id: 2,
      time: "09.30",
      actor: "Administrator",
      action: "TOPUP",
      result: "Berhasil",
      requestId: "demo-002",
    },
    {
      id: 1,
      time: "09.10",
      actor: "Tidak dikenal",
      action: "LOGIN",
      result: "Ditolak",
      requestId: "demo-001",
    },
  ]);
  function audit(action, result) {
    auditLogs.value.unshift({
      id: auditLogs.value.length + 1,
      time: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
      actor: "Administrator contoh",
      action,
      result,
      requestId: "demo-" + (auditLogs.value.length + 1),
    });
  }
  function editOwner(id, values) {
    if (Object.values(values).some((v) => !v.trim()))
      return message("Lengkapi data pemilik.", true);
    const card = cards.value.find((c) => c.id === id);
    if (!card) return;
    Object.assign(
      card,
      Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])),
    );
    message("Identitas pemilik contoh diperbarui.");
  }
  function confirmBlock() {
    if (pendingBlock.value) toggleCard(pendingBlock.value);
    pendingBlock.value = null;
  }
  watch(page, () => {
    query.value = "";
    statusFilter.value = "Semua";
    notice.value = "";
    review.value = null;
    showCardForm.value = false;
    viewState.value = "ready";
    pendingBlock.value = null;
  });

  return {
    menu,
    page,
    cards,
    transactions,
    sessions,
    query,
    statusFilter,
    transactionType,
    notice,
    error,
    showCardForm,
    review,
    cardForm,
    topup,
    settings,
    settingsForm,
    mode,
    selectedMode,
    title,
    selectedCard,
    filteredCards,
    filteredTransactions,
    activeCards,
    activeSessions,
    revenue,
    rupiah,
    message,
    go,
    addCard,
    toggleCard,
    reviewTopup,
    confirmTopup,
    saveSettings,
    auditLogs,
    audit,
    viewState,
    pendingBlock,
    editOwner,
    confirmBlock,
  };
}
