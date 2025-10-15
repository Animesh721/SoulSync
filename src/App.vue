<script setup>
import { onMounted } from 'vue'
import { useCoupleStore } from '@/stores/couple'

const coupleStore = useCoupleStore()

onMounted(() => {
  // Subscribe to partner updates if logged in
  if (coupleStore.isLinked) {
    coupleStore.subscribeToPartner()
  }
})
</script>

<template>
  <div class="min-h-screen">
    <router-view />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
