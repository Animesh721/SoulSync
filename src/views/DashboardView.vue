<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoupleStore } from '@/stores/couple'
import { useDatesStore } from '@/stores/dates'
import { addToGoogleCalendar, downloadICalFile } from '@/utils/calendar'

const router = useRouter()
const coupleStore = useCoupleStore()
const datesStore = useDatesStore()

let unsubscribe = null
let messagingUnsubscribe = null
const showNotificationBanner = ref(false)

onMounted(async () => {
  unsubscribe = datesStore.subscribeToDates()

  // Setup foreground message listener
  messagingUnsubscribe = coupleStore.setupForegroundMessageListener()

  // Check if notifications are supported and not yet granted
  if ('Notification' in window && Notification.permission === 'default') {
    showNotificationBanner.value = true
  }

  // Auto-request notification permission if already linked
  if (coupleStore.isLinked && Notification.permission === 'default') {
    // Wait a bit before prompting to avoid overwhelming user on first load
    setTimeout(() => {
      requestNotifications()
    }, 3000)
  }
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  if (messagingUnsubscribe) messagingUnsubscribe()
})

const requestNotifications = async () => {
  showNotificationBanner.value = false
  await coupleStore.requestNotificationPermission()
}

const dismissNotificationBanner = () => {
  showNotificationBanner.value = false
}

const upcomingDates = computed(() => datesStore.getUpcomingDates().slice(0, 3))
const pendingRequests = computed(() => datesStore.getPendingRequests())
const myPendingRequests = computed(() => datesStore.getMyPendingRequests())
const myDeclinedRequests = computed(() => {
  return datesStore.getDeclinedDates().filter(date =>
    date.createdBy === coupleStore.userId // Only show declined requests I created
  )
})
const hasPartner = computed(() => !!coupleStore.partnerInfo)

const acceptRequest = async (dateId) => {
  try {
    await datesStore.acceptDateRequest(dateId)
  } catch (error) {
    alert('Failed to accept request: ' + error.message)
  }
}

const declineRequest = async (dateId) => {
  const reason = prompt('Optional: Let your partner know why you can\'t make it')
  try {
    await datesStore.declineDateRequest(dateId, reason || '')
  } catch (error) {
    alert('Failed to decline request: ' + error.message)
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTimeUntil = (dateString) => {
  const now = new Date()
  const target = new Date(dateString)
  const diff = target - now

  if (diff < 0) return 'Past'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h`
}

const getDateTypeInfo = (type) => {
  return datesStore.dateTypes.find(t => t.value === type) || datesStore.dateTypes[0]
}

const dismissDeclinedRequest = async (dateId) => {
  try {
    await datesStore.deleteDate(dateId)
  } catch (error) {
    alert('Failed to dismiss request: ' + error.message)
  }
}

const logout = () => {
  if (confirm('Are you sure you want to disconnect?')) {
    coupleStore.logout()
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Notification Permission Banner -->
    <div v-if="showNotificationBanner" class="bg-gradient-to-r from-orange-400 to-amber-500 text-white p-4">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <div>
            <p class="font-semibold">Enable Push Notifications</p>
            <p class="text-sm text-white/90">Get instant alerts for date requests and reminders</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="requestNotifications"
            class="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg font-medium transition-all"
          >
            Enable
          </button>
          <button
            @click="dismissNotificationBanner"
            class="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Header -->
    <div class="bg-[#4A4A4A] text-white p-6">
      <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h1 class="text-3xl font-bold mb-2">Dashboard</h1>
            <p class="text-white/90">Welcome back, {{ coupleStore.userName }}!</p>
          </div>
          <button
            @click="router.push('/settings')"
            class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>

        <!-- Partner Status -->
        <div class="bg-white/20 backdrop-blur rounded-2xl p-4">
          <div v-if="hasPartner" class="flex items-center gap-3">
            <div class="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center text-2xl">
              💝
            </div>
            <div>
              <p class="font-semibold">Connected with {{ coupleStore.partnerInfo.name }}</p>
              <p class="text-sm text-white/80">{{ coupleStore.partnerInfo.timezone }}</p>
            </div>
          </div>
          <div v-else class="text-center py-4">
            <p class="font-semibold mb-2">Waiting for your partner...</p>
            <p class="text-sm text-white/80">Share your couple code: <span class="font-mono bg-white/20 px-3 py-1 rounded">{{ coupleStore.coupleCode }}</span></p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <!-- Quick Actions -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          @click="router.push('/dates/new')"
          class="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-center"
        >
          <div class="text-4xl mb-2">📅</div>
          <p class="font-semibold text-[#4A4A4A]">New Date</p>
        </button>

        <button
          @click="router.push('/dates')"
          class="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-center"
        >
          <div class="text-4xl mb-2">💕</div>
          <p class="font-semibold text-[#4A4A4A]">All Dates</p>
        </button>

        <button
          @click="router.push('/bucket-list')"
          class="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all text-center"
        >
          <div class="text-4xl mb-2">🎯</div>
          <p class="font-semibold text-[#4A4A4A]">Bucket List</p>
        </button>
      </div>

      <!-- Pending Date Requests (To Review) -->
      <div v-if="pendingRequests.length > 0" class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-md border-2 border-yellow-200">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">📬</span>
          <h2 class="text-2xl font-bold text-gray-800">Date Requests</h2>
          <span class="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">{{ pendingRequests.length }}</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="request in pendingRequests"
            :key="request.id"
            class="bg-white rounded-xl p-5 shadow-sm"
          >
            <div class="flex items-start gap-3 mb-4">
              <div :class="['text-2xl p-2 rounded-lg', getDateTypeInfo(request.type).color]">
                {{ getDateTypeInfo(request.type).icon }}
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800 text-lg">{{ request.title }}</h3>
                <p class="text-sm text-gray-600 mb-1">{{ formatDate(request.dateTime) }}</p>
                <p class="text-xs text-gray-500">Requested by {{ request.createdByName }}</p>
                <p v-if="request.notes" class="text-sm text-gray-600 mt-2 italic">"{{ request.notes }}"</p>
              </div>
            </div>

            <div class="flex gap-3">
              <button
                @click="declineRequest(request.id)"
                class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                ✕ Decline
              </button>
              <button
                @click="acceptRequest(request.id)"
                class="flex-1 bg-[#00BFAF] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:bg-[#009688] transition-all"
              >
                ✓ Accept
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- My Pending Requests (Waiting for Response) -->
      <div v-if="myPendingRequests.length > 0" class="bg-blue-50 rounded-2xl p-6 shadow-md border border-blue-200">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">⏳</span>
          <h2 class="text-xl font-bold text-gray-800">Waiting for Response</h2>
        </div>

        <div class="space-y-3">
          <div
            v-for="request in myPendingRequests"
            :key="request.id"
            class="bg-white rounded-xl p-4 opacity-75"
          >
            <div class="flex items-start gap-3">
              <div :class="['text-2xl p-2 rounded-lg', getDateTypeInfo(request.type).color]">
                {{ getDateTypeInfo(request.type).icon }}
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800">{{ request.title }}</h3>
                <p class="text-sm text-gray-600">{{ formatDate(request.dateTime) }}</p>
                <p class="text-xs text-blue-600 font-medium mt-1">Waiting for {{ coupleStore.partnerInfo?.name || 'partner' }}'s response</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Declined Requests (My Requests That Were Declined) -->
      <div v-if="myDeclinedRequests.length > 0" class="bg-red-50 rounded-2xl p-6 shadow-md border border-red-200">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">✕</span>
          <h2 class="text-xl font-bold text-gray-800">Declined Requests</h2>
        </div>

        <div class="space-y-3">
          <div
            v-for="request in myDeclinedRequests"
            :key="request.id"
            class="bg-white rounded-xl p-5"
          >
            <div class="flex items-start gap-3 mb-3">
              <div :class="['text-2xl p-2 rounded-lg', getDateTypeInfo(request.type).color]">
                {{ getDateTypeInfo(request.type).icon }}
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800">{{ request.title }}</h3>
                <p class="text-sm text-gray-600">{{ formatDate(request.dateTime) }}</p>
                <p class="text-xs text-red-600 font-medium mt-1">
                  Declined by {{ coupleStore.partnerInfo?.name || 'your partner' }}
                </p>
              </div>
              <button
                @click="dismissDeclinedRequest(request.id)"
                class="text-gray-400 hover:text-gray-600 text-sm"
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            <!-- Decline Reason -->
            <div v-if="request.declineReason" class="bg-gray-50 rounded-lg p-3 border-l-4 border-red-400">
              <p class="text-xs text-gray-500 font-medium mb-1">Reason:</p>
              <p class="text-sm text-gray-700">{{ request.declineReason }}</p>
            </div>
            <div v-else class="text-sm text-gray-500 italic">
              No reason provided
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Dates -->
      <div class="bg-white rounded-2xl p-6 shadow-md">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-gray-800">Upcoming Dates</h2>
          <button
            @click="router.push('/dates')"
            class="text-[#00BFAF] hover:text-[#009688] text-sm font-medium"
          >
            View All →
          </button>
        </div>

        <div v-if="upcomingDates.length > 0" class="space-y-3">
          <div
            v-for="date in upcomingDates"
            :key="date.id"
            class="border border-gray-200 rounded-xl p-4 hover:border-[#00BFAF] transition-all"
          >
            <div class="flex items-start gap-3">
              <div :class="['text-2xl p-2 rounded-lg', getDateTypeInfo(date.type).color]">
                {{ getDateTypeInfo(date.type).icon }}
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-[#4A4A4A]">{{ date.title }}</h3>
                <p class="text-sm text-[#9E9E9E]">{{ formatDate(date.dateTime) }}</p>
                <p class="text-xs text-[#00BFAF] font-medium mt-1">In {{ getTimeUntil(date.dateTime) }}</p>

                <!-- Calendar buttons -->
                <div class="flex gap-2 mt-3">
                  <button
                    @click="addToGoogleCalendar(date)"
                    class="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition-all"
                  >
                    📅 Add to Calendar
                  </button>
                  <button
                    @click="downloadICalFile(date)"
                    class="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-all"
                    title="Download .ics file"
                  >
                    ⬇️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <p class="text-5xl mb-3">📅</p>
          <p>No upcoming dates scheduled</p>
          <button
            @click="router.push('/dates/new')"
            class="mt-4 text-[#00BFAF] hover:text-[#009688] font-medium"
          >
            Schedule your first date →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
