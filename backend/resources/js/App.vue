<script setup>
import { provide } from "vue";
import { useRouter } from "vue-router";
import { createParkingStore, parkingKey } from "./stores/parkingStore";
provide(parkingKey, createParkingStore(useRouter()));
</script>
<template><RouterView /></template>
