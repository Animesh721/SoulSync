<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDatesStore } from '@/stores/dates'

const router = useRouter()
const datesStore = useDatesStore()

const title = ref('')
const dateTime = ref('')
const type = ref('quality-time')
const notes = ref('')
const loading = ref(false)
const error = ref('')
const sendAsRequest = ref(true) // Default to sending as request

const createDate = async () => {
  if (!title.value || !dateTime.value || !type.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const dateData = {
      title: title.value,
      dateTime: new Date(dateTime.value).toISOString(),
      type: type.value,
      notes: notes.value
    }

    // Send as request or create directly based on toggle
    if (sendAsRequest.value) {
      await datesStore.createDateRequest(dateData)
    } else {
      await datesStore.createDate(dateData)
    }

    router.push('/dates')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Set minimum datetime to now
const getMinDateTime = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <div class="bg-[#4A4A4A] text-white p-6">
      <div class="max-w-2xl mx-auto">
        <button
          @click="router.push('/dates')"
          class="text-white/80 hover:text-white mb-2 text-sm"
        >
          ← Back
        </button>
        <h1 class="text-3xl font-bold">Schedule a Date</h1>
        <p class="text-white/90 mt-2">Plan a special moment together</p>
      </div>
    </div>

    <!-- Form -->
    <div class="max-w-2xl mx-auto px-6 py-8">
      <div class="bg-white rounded-3xl p-8 shadow-lg space-y-6">
        <!-- Title -->
        <div>
          <label class="block text-sm font-semibold text-[#4A4A4A] mb-2">
            Date Title <span class="text-red-500">*</span>
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="e.g., Movie Night, Deep Conversation..."
            class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#00BFAF] focus:border-transparent outline-none"
          />
        </div>

        <!-- Date & Time -->
        <div>
          <label class="block text-sm font-semibold text-[#4A4A4A] mb-2">
            Date & Time <span class="text-red-500">*</span>
          </label>
          <input
            v-model="dateTime"
            type="datetime-local"
            :min="getMinDateTime()"
            class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#00BFAF] focus:border-transparent outline-none"
          />
        </div>

        <!-- Type -->
        <div>
          <label class="block text-sm font-semibold text-[#4A4A4A] mb-3">
            Date Type <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              v-for="dateType in datesStore.dateTypes"
              :key="dateType.value"
              @click="type = dateType.value"
              :class="['p-4 rounded-xl border-2 transition-all text-left', type === dateType.value ? 'border-[#00BFAF] bg-[#E0F7F5]' : 'border-gray-200 hover:border-gray-300']"
            >
              <div class="text-2xl mb-1">{{ dateType.icon }}</div>
              <div class="text-sm font-medium text-[#4A4A4A]">{{ dateType.label }}</div>
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-semibold text-[#4A4A4A] mb-2">
            Notes (Optional)
          </label>
          <textarea
            v-model="notes"
            rows="4"
            placeholder="Any special plans or ideas for this date..."
            class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#00BFAF] focus:border-transparent outline-none resize-none"
          ></textarea>
        </div>

        <!-- Request Toggle -->
        <div class="bg-[#E0F7F5] rounded-xl p-4 border border-[#00BFAF]">
          <label class="flex items-center justify-between cursor-pointer">
            <div>
              <div class="font-semibold text-[#4A4A4A] mb-1">
                📬 Send as Request
              </div>
              <div class="text-sm text-[#9E9E9E]">
                Your partner will need to accept this date before it's scheduled
              </div>
            </div>
            <div class="relative">
              <input
                type="checkbox"
                v-model="sendAsRequest"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00BFAF]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BFAF]"
              ></div>
            </div>
          </label>
        </div>

        <!-- Error -->
        <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
          {{ error }}
        </div>

        <!-- Submit -->
        <div class="flex gap-3 pt-4">
          <button
            @click="router.push('/dates')"
            class="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            @click="createDate"
            class="flex-1 bg-[#00BFAF] text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:bg-[#009688] transition-all"
            :disabled="loading"
          >
            {{ loading ? (sendAsRequest ? 'Sending Request...' : 'Creating...') : (sendAsRequest ? 'Send Request' : 'Create Date') }}
          </button>
        </div>
      </div>

      <!-- Info Card -->
      <div class="mt-6 bg-blue-50 rounded-2xl p-6">
        <h3 class="font-semibold text-blue-900 mb-2">💡 Tips</h3>
        <ul class="text-sm text-blue-800 space-y-1">
          <li>• Both you and your partner will receive notifications</li>
          <li>• Choose "Surprise Date" to keep details hidden from your partner</li>
          <li>• You can log your feelings after the date</li>
        </ul>
      </div>
    </div>
  </div>
</template>
