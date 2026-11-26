<script setup>
import { onMounted, onUnmounted, ref } from "vue";
const props = defineProps({
    title: String,
    description: String,
    confirmLabel: { type: String, default: "Konfirmasi" },
    busy: Boolean,
    error: String,
});
const emit = defineEmits(["cancel", "confirm"]);
const dialog = ref(null);
let previous;
function cancel(event) {
    event.preventDefault();
    if (!props.busy) emit("cancel");
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
        <p v-if="error" role="alert" class="notice error">{{ error }}</p>
        <div class="form-actions">
            <button class="secondary" autofocus :disabled="busy" @click="$emit('cancel')">
                Batal</button
            ><button :disabled="busy" @click="$emit('confirm')">{{ busy ? "Memproses…" : confirmLabel }}</button>
        </div>
    </dialog>
</template>
