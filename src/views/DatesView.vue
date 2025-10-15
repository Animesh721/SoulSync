<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoupleStore } from '@/stores/couple'
import { useDatesStore } from '@/stores/dates'
import { useMoodsStore } from '@/stores/moods'
import { addToGoogleCalendar, downloadICalFile } from '@/utils/calendar'

const router = useRouter()
const coupleStore = useCoupleStore()
const datesStore = useDatesStore()
const moodsStore = useMoodsStore()

const activeTab = ref('upcoming')
const selectedDate = ref(null)
const showMoodModal = ref(false)
const selectedMood = ref(null)
const moodNotes = ref('')

let unsubscribeDates = null
let unsubscribeMoods = null

onMounted(() => {
  unsubscribeDates = datesStore.subscribeToDates()
  unsubscribeMoods = moodsStore.subscribeToMoods()
})

onUnmounted(() => {
  if (unsubscribeDates) unsubscribeDates()
  if (unsubscribeMoods) unsubscribeMoods()
})

const upcomingDates = computed(() => datesStore.getUpcomingDates())
const pastDates = computed(() => datesStore.getPastDates())
const displayedDates = computed(() => activeTab.value === 'upcoming' ? upcomingDates.value : pastDates.value)

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDateTypeInfo = (type) => {
  return datesStore.dateTypes.find(t => t.value === type) || datesStore.dateTypes[0]
}

const openMoodModal = (date) => {
  selectedDate.value = date
  selectedMood.value = null
  moodNotes.value = ''
  showMoodModal.value = true
}

const submitMood = async () => {
  if (!selectedMood.value || !selectedDate.value) return

  try {
    await moodsStore.addMoodEntry(selectedDate.value.id, selectedMood.value, moodNotes.value)
    showMoodModal.value = false
    selectedDate.value = null
    selectedMood.value = null
    moodNotes.value = ''
  } catch (error) {
    alert('Failed to save mood: ' + error.message)
  }
}

const hasLoggedMood = (dateId) => {
  return moodsStore.hasUserLoggedMood(dateId, coupleStore.userId)
}

const deleteDate = async (dateId) => {
  if (!confirm('Are you sure you want to delete this date?')) return

  try {
    await datesStore.deleteDate(dateId)
  } catch (error) {
    alert('Failed to delete date: ' + error.message)
  }
}
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <div class="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white p-6">
      <div class="max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <button
            @click="router.push('/dashboard')"
            class="text-white/80 hover:text-white mb-2 text-sm"
          >
            ← Back
          </button>
          <h1 class="text-3xl font-bold">Our Dates</h1>
        </div>
        <button
          @click="router.push('/dates/new')"
          class="bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          + New Date
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="max-w-4xl mx-auto px-6 py-6">
      <div class="bg-white rounded-2xl p-2 shadow-md inline-flex gap-2">
        <button
          @click="activeTab = 'upcoming'"
          :class="['px-6 py-2 rounded-xl font-medium transition-all', activeTab === 'upcoming' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100']"
        >
          Upcoming ({{ upcomingDates.length }})
        </button>
        <button
          @click="activeTab = 'past'"
          :class="['px-6 py-2 rounded-xl font-medium transition-all', activeTab === 'past' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100']"
        >
          Past ({{ pastDates.length }})
        </button>
      </div>
    </div>

    <!-- Dates List -->
    <div class="max-w-4xl mx-auto px-6 pb-6">
      <div v-if="displayedDates.length > 0" class="space-y-4">
        <div
          v-for="date in displayedDates"
          :key="date.id"
          class="bg-white rounded-2xl p-6 shadow-md"
        >
          <div class="flex items-start gap-4">
            <div :class="['text-3xl p-3 rounded-xl', getDateTypeInfo(date.type).color]">
              {{ getDateTypeInfo(date.type).icon }}
            </div>

            <div class="flex-1">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-xl font-bold text-gray-800">{{ date.title }}</h3>
                <button
                  @click="deleteDate(date.id)"
                  class="text-gray-400 hover:text-red-500 text-sm"
                >
                  🗑️
                </button>
              </div>

              <div class="space-y-1 text-sm text-gray-600 mb-3">
                <p>📅 {{ formatDate(date.dateTime) }}</p>
                <p v-if="date.type === 'surprise' && date.createdBy !== coupleStore.userId">
                  🎁 Surprise date planned by {{ date.createdByName }}
                </p>
                <p v-else class="capitalize">{{ getDateTypeInfo(date.type).label }}</p>
                <p v-if="date.notes && date.type !== 'surprise'" class="text-gray-500">{{ date.notes }}</p>
              </div>

              <!-- Add to Calendar Buttons (for upcoming dates) -->
              <div v-if="activeTab === 'upcoming'" class="flex gap-2 mt-4">
                <button
                  @click="addToGoogleCalendar(date)"
                  class="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  📅 Add to Google Calendar
                </button>
                <button
                  @click="downloadICalFile(date)"
                  class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
                  title="Download .ics file (works with Apple Calendar, Outlook, etc.)"
                >
                  ⬇️
                </button>
              </div>

              <!-- Mood Button (for past dates) -->
              <div v-if="activeTab === 'past'" class="mt-4">
                <button
                  v-if="!hasLoggedMood(date.id)"
                  @click="openMoodModal(date)"
                  class="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all"
                >
                  How did it feel? ✨
                </button>
                <div v-else class="text-sm text-green-600 font-medium">
                  ✓ Mood logged
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16">
        <p class="text-6xl mb-4">{{ activeTab === 'upcoming' ? '📅' : '💭' }}</p>
        <p class="text-gray-500 text-lg mb-4">
          {{ activeTab === 'upcoming' ? 'No upcoming dates' : 'No past dates yet' }}
        </p>
        <button
          v-if="activeTab === 'upcoming'"
          @click="router.push('/dates/new')"
          class="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          Schedule a Date
        </button>
      </div>
    </div>

    <!-- Mood Modal -->
    <div
      v-if="showMoodModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showMoodModal = false"
    >
      <div class="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">How did it feel?</h2>
        <p class="text-gray-600 mb-6">Share how this date made you feel</p>

        <div class="grid grid-cols-2 gap-3 mb-6">
          <button
            v-for="mood in moodsStore.moodOptions"
            :key="mood.value"
            @click="selectedMood = mood.value"
            :class="['p-4 rounded-xl border-2 transition-all', selectedMood === mood.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300']"
          >
            <div class="text-3xl mb-1">{{ mood.icon }}</div>
            <div class="text-sm font-medium">{{ mood.label }}</div>
          </button>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
          <textarea
            v-model="moodNotes"
            rows="3"
            placeholder="Any thoughts about this date..."
            class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
          ></textarea>
        </div>

        <div class="flex gap-3">
          <button
            @click="showMoodModal = false"
            class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            @click="submitMood"
            :disabled="!selectedMood"
            :class="['flex-1 py-3 rounded-xl font-semibold transition-all', selectedMood ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed']"
          >
            Save Mood
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
