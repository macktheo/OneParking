<script setup>
import { provide } from "vue";
import { useRouter } from "vue-router";
import { createDemoStore, demoKey } from "./stores/demoStore";
provide(demoKey, createDemoStore(useRouter()));
</script>
<template><RouterView /></template>
