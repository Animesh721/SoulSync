<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCoupleStore } from '@/stores/couple'

const router = useRouter()
const coupleStore = useCoupleStore()

const mode = ref('select') // 'select', 'create', 'join', 'recover'
const email = ref('')
const name = ref('')
const joinCode = ref('')
const recoveryCodeInput = ref('')
const generatedCode = ref('')
const generatedRecoveryCode = ref('')
const loading = ref(false)
const error = ref('')

const createCouple = async () => {
  if (!email.value || !name.value) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await coupleStore.createCoupleCode(email.value, name.value)
    generatedCode.value = result.code
    generatedRecoveryCode.value = result.recoveryCode

    setTimeout(() => {
      router.push('/dashboard')
    }, 5000)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const joinCouple = async () => {
  if (!email.value || !name.value || !joinCode.value) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await coupleStore.joinCoupleCode(joinCode.value.toUpperCase(), email.value, name.value)
    generatedRecoveryCode.value = result.recoveryCode
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const recoverAccount = async () => {
  if (!email.value || !recoveryCodeInput.value) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await coupleStore.recoverAccount(recoveryCodeInput.value.toUpperCase(), email.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const copyCode = (code) => {
  navigator.clipboard.writeText(code)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="bg-white/80 backdrop-blur rounded-3xl p-8 shadow-2xl space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-3xl font-bold text-gray-800">Connect with Your Partner</h2>
          <p class="text-gray-600">Start your journey together</p>
        </div>

        <!-- Mode Selection -->
        <div v-if="mode === 'select'" class="space-y-4">
          <button
            @click="mode = 'create'"
            class="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Create New Couple Code
          </button>

          <button
            @click="mode = 'join'"
            class="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Join with Existing Code
          </button>

          <div class="pt-4 border-t border-gray-200">
            <button
              @click="mode = 'recover'"
              class="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              Recover Account
            </button>
          </div>
        </div>

        <!-- Create Mode -->
        <div v-if="mode === 'create' && !generatedCode" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input
              v-model="name"
              type="text"
              placeholder="Your name"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <div v-if="error" class="text-red-600 text-sm text-center">
            {{ error }}
          </div>

          <div class="flex gap-3">
            <button
              @click="mode = 'select'"
              class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              :disabled="loading"
            >
              Back
            </button>
            <button
              @click="createCouple"
              class="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              :disabled="loading"
            >
              {{ loading ? 'Creating...' : 'Create Code' }}
            </button>
          </div>
        </div>

        <!-- Generated Code Display -->
        <div v-if="generatedCode" class="space-y-4 text-center">
          <div class="bg-gradient-to-br from-pink-100 to-purple-100 p-6 rounded-2xl">
            <p class="text-sm text-gray-600 mb-2">Your Couple Code</p>
            <p class="text-3xl font-bold text-purple-600 mb-4">{{ generatedCode }}</p>
            <button
              @click="copyCode(generatedCode)"
              class="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:shadow-md transition-all"
            >
              Copy Code
            </button>
          </div>

          <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-orange-200">
            <p class="text-sm text-orange-800 mb-2 font-semibold">⚠️ SAVE THIS RECOVERY CODE</p>
            <p class="text-lg font-mono font-bold text-orange-900 mb-3">{{ generatedRecoveryCode }}</p>
            <button
              @click="copyCode(generatedRecoveryCode)"
              class="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:shadow-md transition-all mb-2"
            >
              Copy Recovery Code
            </button>
            <p class="text-xs text-orange-700">Use this to restore access if you get logged out!</p>
          </div>

          <p class="text-sm text-gray-600">Share the couple code with your partner so they can join!</p>
          <p class="text-xs text-gray-500">Redirecting to dashboard...</p>
        </div>

        <!-- Join Mode -->
        <div v-if="mode === 'join'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Couple Code</label>
            <input
              v-model="joinCode"
              type="text"
              placeholder="SWEETHEARTS123"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none uppercase"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input
              v-model="name"
              type="text"
              placeholder="Your name"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <div v-if="error" class="text-red-600 text-sm text-center">
            {{ error }}
          </div>

          <div class="flex gap-3">
            <button
              @click="mode = 'select'"
              class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              :disabled="loading"
            >
              Back
            </button>
            <button
              @click="joinCouple"
              class="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              :disabled="loading"
            >
              {{ loading ? 'Joining...' : 'Join' }}
            </button>
          </div>
        </div>

        <!-- Recover Mode -->
        <div v-if="mode === 'recover'" class="space-y-4">
          <div class="bg-blue-50 p-4 rounded-xl mb-4">
            <p class="text-sm text-blue-800">Enter your recovery code and email to restore your account access.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Recovery Code</label>
            <input
              v-model="recoveryCodeInput"
              type="text"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div v-if="error" class="text-red-600 text-sm text-center">
            {{ error }}
          </div>

          <div class="flex gap-3">
            <button
              @click="mode = 'select'"
              class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              :disabled="loading"
            >
              Back
            </button>
            <button
              @click="recoverAccount"
              class="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              :disabled="loading"
            >
              {{ loading ? 'Recovering...' : 'Recover Account' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
