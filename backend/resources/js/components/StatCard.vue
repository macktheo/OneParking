<script setup>
import UiIcon from "./UiIcon.vue";
defineProps({
    label: String,
    value: [String, Number],
    description: String,
    accent: Boolean,
    icon: { type: String, default: "cards" },
});
</script>
<template>
    <div class="card p-4">
        <div class="flex items-start justify-between">
            <div>
                <p class="text-xs font-semibold text-slate-500">{{ label }}</p>
                <p
                    class="mt-2 text-2xl font-extrabold tracking-tight text-slate-900"
                >
                    {{ value }}
                </p>
                <p v-if="description" class="mt-1 text-xs text-slate-400">
                    {{ description }}
                </p>
            </div>
            <div class="icon-box"><UiIcon :name="icon" :size="21" /></div>
        </div>
    </div>
</template>
