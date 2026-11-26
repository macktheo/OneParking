<script setup>
import { onMounted, onUnmounted, ref } from "vue";
defineProps({
  title: String,
  description: String,
  confirmLabel: { type: String, default: "Konfirmasi" },
});
const emit = defineEmits(["cancel", "confirm"]);
const dialog = ref(null);
let previous;
function cancel(event) {
  event.preventDefault();
  emit("cancel");
}
onMounted(() => {
  previous = document.activeElement;
  dialog.value.showModal();
});
onUnmounted(() => previous?.focus());
</script>
<template>
  <dialog
    ref="dialog"
    class="confirm-dialog"
    aria-labelledby="confirmation-title"
    @cancel="cancel"
  >
    <h2 id="confirmation-title">{{ title }}</h2>
    <p>{{ description }}</p>
    <div class="form-actions">
      <button class="secondary" autofocus @click="$emit('cancel')">Batal</button
      ><button @click="$emit('confirm')">{{ confirmLabel }}</button>
    </div>
  </dialog>
</template>
