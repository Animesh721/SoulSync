<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCoupleStore } from '@/stores/couple'

const router = useRouter()
const coupleStore = useCoupleStore()

const showRecoveryCode = ref(false)
const showLogoutConfirm = ref(false)

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
}

const handleLogout = () => {
  coupleStore.logout()
  router.push('/link')
}

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Never'
  const date = new Date(lastSeen)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white p-4">
    <div class="max-w-2xl mx-auto py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-[#4A4A4A]">Settings</h1>
          <p class="text-[#9E9E9E]">Manage your account</p>
        </div>
        <button
          @click="router.push('/dashboard')"
          class="bg-white p-3 rounded-xl shadow hover:shadow-lg transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <!-- Your Info Card -->
        <div class="bg-white backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 class="text-xl font-bold text-[#4A4A4A] mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-[#00BFAF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Your Information
          </h2>

          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-[#9E9E9E]">Name</label>
              <p class="text-lg text-[#4A4A4A] font-semibold">{{ coupleStore.userName }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-[#9E9E9E]">Email</label>
              <p class="text-lg text-[#4A4A4A] font-semibold">{{ coupleStore.userEmail }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-[#9E9E9E]">Timezone</label>
              <p class="text-lg text-[#4A4A4A] font-semibold">{{ coupleStore.userTimezone }}</p>
            </div>
          </div>
        </div>

        <!-- Partner Info Card -->
        <div v-if="coupleStore.partnerInfo" class="bg-white backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 class="text-xl font-bold text-[#4A4A4A] mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-[#00BFAF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Partner Information
          </h2>

          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-[#9E9E9E]">Name</label>
              <p class="text-lg text-[#4A4A4A] font-semibold">{{ coupleStore.partnerInfo.name }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-[#9E9E9E]">Email</label>
              <p class="text-lg text-[#4A4A4A] font-semibold">{{ coupleStore.partnerInfo.email }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-[#9E9E9E]">Status</label>
              <div class="flex items-center gap-2">
                <div :class="coupleStore.isPartnerOnline ? 'bg-green-500' : 'bg-gray-400'" class="w-3 h-3 rounded-full"></div>
                <p class="text-lg text-[#4A4A4A] font-semibold">
                  {{ coupleStore.isPartnerOnline ? 'Online' : 'Offline' }}
                </p>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium text-[#9E9E9E]">Last Seen</label>
              <p class="text-lg text-[#4A4A4A] font-semibold">{{ formatLastSeen(coupleStore.partnerLastSeen) }}</p>
            </div>
          </div>
        </div>

        <!-- Couple Code Card -->
        <div class="bg-white backdrop-blur rounded-2xl p-6 shadow-lg">
          <h2 class="text-xl font-bold text-[#4A4A4A] mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-[#00BFAF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Access Codes
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-[#9E9E9E]">Couple Code</label>
              <div class="flex items-center gap-2 mt-1">
                <p class="text-2xl text-[#00BFAF] font-bold font-mono">{{ coupleStore.coupleCode }}</p>
                <button
                  @click="copyToClipboard(coupleStore.coupleCode)"
                  class="bg-[#E0F7F5] text-[#00BFAF] px-3 py-1 rounded-lg text-sm font-semibold hover:bg-[#B2EBE6] transition-all"
                >
                  Copy
                </button>
              </div>
              <p class="text-xs text-[#9E9E9E] mt-1">Share this with your partner to connect</p>
            </div>

            <div class="border-t border-gray-200 pt-4">
              <label class="text-sm font-medium text-[#9E9E9E]">Recovery Code</label>
              <div v-if="!showRecoveryCode" class="mt-2">
                <button
                  @click="showRecoveryCode = true"
                  class="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-200 transition-all"
                >
                  Show Recovery Code
                </button>
                <p class="text-xs text-[#9E9E9E] mt-2">⚠️ Keep this safe! Use it to restore access if logged out</p>
              </div>
              <div v-else class="mt-2 bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
                <div class="flex items-center gap-2 mb-2">
                  <p class="text-xl text-orange-800 font-bold font-mono">{{ coupleStore.recoveryCode }}</p>
                  <button
                    @click="copyToClipboard(coupleStore.recoveryCode)"
                    class="bg-white text-orange-600 px-3 py-1 rounded-lg text-sm font-semibold hover:shadow-md transition-all"
                  >
                    Copy
                  </button>
                </div>
                <p class="text-xs text-orange-700">Save this somewhere safe outside this app!</p>
                <button
                  @click="showRecoveryCode = false"
                  class="text-orange-600 text-xs underline mt-2"
                >
                  Hide
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border-2 border-red-200">
          <h2 class="text-xl font-bold text-red-600 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Danger Zone
          </h2>

          <div v-if="!showLogoutConfirm">
            <p class="text-gray-600 mb-4">Logging out will remove your session. You'll need your recovery code to log back in.</p>
            <button
              @click="showLogoutConfirm = true"
              class="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-all"
            >
              Logout
            </button>
          </div>

          <div v-else class="space-y-3">
            <p class="text-red-600 font-semibold">Are you sure you want to logout?</p>
            <p class="text-sm text-gray-600">Make sure you have saved your recovery code!</p>
            <div class="flex gap-3">
              <button
                @click="showLogoutConfirm = false"
                class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                @click="handleLogout"
                class="flex-1 bg-red-500 text-white py-2 rounded-xl font-semibold hover:bg-red-600 transition-all"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
