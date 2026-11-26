<script setup>
defineProps({ name: String, size: { type: Number, default: 19 } });
const paths = {
    dashboard: [
        "M3 3h7v7H3z",
        "M14 3h7v7h-7z",
        "M3 14h7v7H3z",
        "M14 14h7v7h-7z",
    ],
    users: [
        "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
        "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
        "M22 21v-2a4 4 0 0 0-3-3.87",
        "M16 3.13a4 4 0 0 1 0 7.75",
    ],
    cards: ["M3 5h18v14H3z", "M3 9h18", "M7 15h3"],
    topup: ["M20 8V5H4v14h16v-4", "M16 8h6v7h-6z", "M19 11h.01"],
    parking: [
        "m5 8 2-5h10l2 5",
        "M3 8h18v10H3z",
        "M5 18v3",
        "M19 18v3",
        "M6 12h.01",
        "M18 12h.01",
    ],
    transactions: ["M4 7h16", "m16 3 4 4-4 4", "M20 17H4", "m8 13-4 4 4 4"],
    devices: [
        "M7 7h10v10H7z",
        "M9 1v6",
        "M15 1v6",
        "M9 17v6",
        "M15 17v6",
        "M1 9h6",
        "M1 15h6",
        "M17 9h6",
        "M17 15h6",
    ],
    audit: ["M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11", "m9 12 2 2 4-4"],
    settings: [
        "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8",
        "m9 3 1-2h4l1 2 3 2 2 0 2 4-1 2v3l1 2-2 4-2 0-3 2-1 2h-4l-1-2-3-2-2 0-2-4 1-2v-3l-1-2 2-4h2z",
    ],
    menu: ["M3 6h18", "M3 12h18", "M3 18h18"],
    logout: ["M9 21H3V3h6", "M9 12h12", "m17 8 4 4-4 4"],
    arrow: ["M5 12h14", "m13 6 6 6-6 6"],
    check: ["m5 12 4 4L19 6"],
};
</script>
<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <path v-for="(d, i) in paths[name] || paths.cards" :key="i" :d="d" />
    </svg>
</template>
