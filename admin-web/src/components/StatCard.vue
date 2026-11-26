<script setup>
defineProps({
  label: String,
  value: [String, Number],
  description: String,
  accent: Boolean,
});
</script>
<template>
  <section class="stat">
    <span>{{ label }}</span
    ><strong :class="{ 'mode-text': accent }">{{ value }}</strong
    ><small>{{ description }}</small>
  </section>
</template>
