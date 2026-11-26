<script setup>
defineProps({ tone: { type: String, default: "positive" } });
</script>
<template>
  <span
    class="badge"
    :class="{ blocked: tone === 'negative', neutral: tone === 'neutral' }"
    ><slot
  /></span>
</template>
