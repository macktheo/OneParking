<script setup>
defineProps({ message: String, error: Boolean });
defineEmits(["close"]);
</script>
<template>
  <div v-if="message" class="notice" :class="{ error }" role="status">
    {{ message
    }}<button class="dismiss" aria-label="Tutup pesan" @click="$emit('close')">
      ×
    </button>
  </div>
</template>
