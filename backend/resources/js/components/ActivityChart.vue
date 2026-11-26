<script setup>
import { computed } from "vue";
const props = defineProps({ values: { type: Array, default: () => [] } });
const chart = computed(() => {
    const values = Array.from({ length: 24 }, (_, i) =>
        Number(props.values[i] || 0),
    );
    const max = Math.max(1, ...values);
    const pts = values.map((v, i) => [42 + i * 23, 185 - (v / max) * 140]);
    return {
        points: pts.map((p) => p.join(",")).join(" "),
        area:
            "M" +
            pts.map((p) => p.join(",")).join(" L") +
            " L571,185 L42,185 Z",
        total: values.reduce((a, b) => a + b, 0),
        max,
    };
});
</script>
<template>
    <div class="activity-chart-wrap">
        <div class="activity-chart">
            <svg
                viewBox="0 0 610 230"
                role="img"
                :aria-label="
                    'Grafik ' + chart.total + ' transaksi hari ini dalam WIB'
                "
            >
                <defs>
                    <linearGradient
                        id="activity-fill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stop-color="#9870f5"
                            stop-opacity=".25"
                        />
                        <stop
                            offset="100%"
                            stop-color="#9870f5"
                            stop-opacity="0"
                        />
                    </linearGradient>
                </defs>
                <g v-for="i in [0, 1, 2, 3]" :key="i">
                    <line
                        x1="42"
                        x2="571"
                        :y1="45 + i * 46.67"
                        :y2="45 + i * 46.67"
                        class="chart-grid-line"
                    />
                    <text
                        x="30"
                        :y="49 + i * 46.67"
                        text-anchor="end"
                        class="chart-axis-label"
                    >
                        {{ Math.round(chart.max * (1 - i / 3)) }}
                    </text>
                </g>
                <path :d="chart.area" fill="url(#activity-fill)" />
                <polyline :points="chart.points" class="chart-line" />
                <text
                    v-for="h in [0, 4, 8, 12, 16, 20, 23]"
                    :key="h"
                    :x="42 + h * 23"
                    y="213"
                    text-anchor="middle"
                    class="chart-axis-label"
                >
                    {{ String(h).padStart(2, "0") }}.00
                </text>
            </svg>
        </div>
    </div>
    <p v-if="!chart.total" class="text-center text-xs text-slate-400">
        Belum ada transaksi hari ini.
    </p>
</template>
