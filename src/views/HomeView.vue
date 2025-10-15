<script setup>
import { useRouter } from 'vue-router'
import { useCoupleStore } from '@/stores/couple'

const router = useRouter()
const coupleStore = useCoupleStore()

// Redirect if already linked
if (coupleStore.isLinked) {
  router.push('/dashboard')
}

const goToLink = () => {
  router.push('/link')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-2xl w-full text-center space-y-8">
      <div class="space-y-4">
        <h1 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500">
          SoulSync
        </h1>
        <p class="text-xl md:text-2xl text-gray-600">
          Stay connected across the miles
        </p>
      </div>

      <div class="space-y-6">
        <div class="grid md:grid-cols-3 gap-6 text-left">
          <div class="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <div class="text-4xl mb-3">📅</div>
            <h3 class="font-semibold text-lg mb-2">Schedule Dates</h3>
            <p class="text-gray-600 text-sm">Plan meaningful moments together, from deep talks to game nights</p>
          </div>

          <div class="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <div class="text-4xl mb-3">💬</div>
            <h3 class="font-semibold text-lg mb-2">Share Feelings</h3>
            <p class="text-gray-600 text-sm">Log how each date made you feel and understand each other better</p>
          </div>

          <div class="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg">
            <div class="text-4xl mb-3">🎯</div>
            <h3 class="font-semibold text-lg mb-2">Dream Together</h3>
            <p class="text-gray-600 text-sm">Build a shared bucket list of experiences to look forward to</p>
          </div>
        </div>

        <button
          @click="goToLink"
          class="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-12 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Get Started
        </button>
      </div>

      <p class="text-sm text-gray-500">
        Free. Simple. Made with love for couples in long-distance relationships.
      </p>
    </div>
  </div>
</template>
