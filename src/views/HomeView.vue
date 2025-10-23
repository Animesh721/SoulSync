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
        <h1 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00BFAF] to-[#4A4A4A]">
          SoulSync
        </h1>
        <p class="text-xl md:text-2xl text-[#9E9E9E]">
          Stay connected across the miles
        </p>
      </div>

      <div class="space-y-6">
        <div class="grid md:grid-cols-3 gap-6 text-left">
          <div class="bg-white backdrop-blur rounded-2xl p-6 shadow-lg">
            <div class="text-4xl mb-3">📅</div>
            <h3 class="font-semibold text-lg mb-2 text-[#4A4A4A]">Schedule Dates</h3>
            <p class="text-[#9E9E9E] text-sm">Plan meaningful moments together, from deep talks to game nights</p>
          </div>

          <div class="bg-white backdrop-blur rounded-2xl p-6 shadow-lg">
            <div class="text-4xl mb-3">💬</div>
            <h3 class="font-semibold text-lg mb-2 text-[#4A4A4A]">Share Feelings</h3>
            <p class="text-[#9E9E9E] text-sm">Log how each date made you feel and understand each other better</p>
          </div>

          <div class="bg-white backdrop-blur rounded-2xl p-6 shadow-lg">
            <div class="text-4xl mb-3">🎯</div>
            <h3 class="font-semibold text-lg mb-2 text-[#4A4A4A]">Dream Together</h3>
            <p class="text-[#9E9E9E] text-sm">Build a shared bucket list of experiences to look forward to</p>
          </div>
        </div>

        <button
          @click="goToLink"
          class="bg-[#00BFAF] text-white px-12 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl hover:bg-[#009688] transform hover:scale-105 transition-all duration-200"
        >
          Get Started
        </button>
      </div>

      <p class="text-sm text-[#9E9E9E]">
        Free. Simple. Made with love for couples in long-distance relationships.
      </p>
    </div>
  </div>
</template>
