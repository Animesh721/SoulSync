<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBucketListStore } from '@/stores/bucketList'

const router = useRouter()
const bucketListStore = useBucketListStore()

const showModal = ref(false)
const title = ref('')
const description = ref('')
const category = ref('experience')
const priority = ref('medium')
const loading = ref(false)
const error = ref('')
const activeTab = ref('active')

let unsubscribe = null

onMounted(() => {
  unsubscribe = bucketListStore.subscribeToItems()
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const activeItems = computed(() => bucketListStore.getActiveItems())
const completedItems = computed(() => bucketListStore.getCompletedItems())
const displayedItems = computed(() => activeTab.value === 'active' ? activeItems.value : completedItems.value)

const openModal = () => {
  title.value = ''
  description.value = ''
  category.value = 'experience'
  priority.value = 'medium'
  error.value = ''
  showModal.value = true
}

const createItem = async () => {
  if (!title.value) {
    error.value = 'Please enter a title'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await bucketListStore.createItem({
      title: title.value,
      description: description.value,
      category: category.value,
      priority: priority.value
    })

    showModal.value = false

    // Reset form
    title.value = ''
    description.value = ''
    category.value = 'experience'
    priority.value = 'medium'
  } catch (err) {
    error.value = err.message
    console.error('Error creating bucket list item:', err)
  } finally {
    loading.value = false
  }
}

const toggleComplete = async (item) => {
  try {
    await bucketListStore.toggleComplete(item.id, !item.completed)
  } catch (error) {
    alert('Failed to update item: ' + error.message)
  }
}

const deleteItem = async (itemId) => {
  if (!confirm('Are you sure you want to delete this item?')) return

  try {
    await bucketListStore.deleteItem(itemId)
  } catch (error) {
    alert('Failed to delete item: ' + error.message)
  }
}

const getCategoryInfo = (categoryValue) => {
  return bucketListStore.categories.find(c => c.value === categoryValue) || bucketListStore.categories[0]
}

const getPriorityInfo = (priorityValue) => {
  return bucketListStore.priorities.find(p => p.value === priorityValue) || bucketListStore.priorities[1]
}
</script>

<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <div class="bg-[#4A4A4A] text-white p-6">
      <div class="max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <button
            @click="router.push('/dashboard')"
            class="text-white/80 hover:text-white mb-2 text-sm"
          >
            ← Back
          </button>
          <h1 class="text-3xl font-bold">Our Bucket List</h1>
          <p class="text-white/90 mt-1">Dreams to experience together</p>
        </div>
        <button
          @click="openModal"
          class="bg-white text-[#00BFAF] px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          + Add Item
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="max-w-4xl mx-auto px-6 py-6">
      <div class="bg-white rounded-2xl p-2 shadow-md inline-flex gap-2">
        <button
          @click="activeTab = 'active'"
          :class="['px-6 py-2 rounded-xl font-medium transition-all', activeTab === 'active' ? 'bg-[#00BFAF] text-white' : 'text-gray-600 hover:bg-gray-100']"
        >
          To Do ({{ activeItems.length }})
        </button>
        <button
          @click="activeTab = 'completed'"
          :class="['px-6 py-2 rounded-xl font-medium transition-all', activeTab === 'completed' ? 'bg-[#00BFAF] text-white' : 'text-gray-600 hover:bg-gray-100']"
        >
          Done ({{ completedItems.length }})
        </button>
      </div>
    </div>

    <!-- Items List -->
    <div class="max-w-4xl mx-auto px-6 pb-6">
      <div v-if="displayedItems.length > 0" class="space-y-4">
        <div
          v-for="item in displayedItems"
          :key="item.id"
          :class="['bg-white rounded-2xl p-6 shadow-md transition-all', item.completed && 'opacity-75']"
        >
          <div class="flex items-start gap-4">
            <button
              @click="toggleComplete(item)"
              :class="['w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 mt-1', item.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-[#00BFAF]']"
            >
              <span v-if="item.completed" class="text-white text-sm">✓</span>
            </button>

            <div class="flex-1">
              <div class="flex items-start justify-between gap-4 mb-2">
                <div class="flex items-center gap-3 flex-1">
                  <span class="text-2xl">{{ getCategoryInfo(item.category).icon }}</span>
                  <h3 :class="['text-lg font-bold', item.completed ? 'line-through text-gray-500' : 'text-[#4A4A4A]']">
                    {{ item.title }}
                  </h3>
                </div>

                <div class="flex items-center gap-2">
                  <span :class="['text-xs font-medium', getPriorityInfo(item.priority).color]">
                    {{ getPriorityInfo(item.priority).label }}
                  </span>
                  <button
                    @click="deleteItem(item.id)"
                    class="text-gray-400 hover:text-red-500"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p v-if="item.description" class="text-gray-600 text-sm mb-2">
                {{ item.description }}
              </p>

              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span class="capitalize">{{ getCategoryInfo(item.category).label }}</span>
                <span>•</span>
                <span>Added by {{ item.createdByName }}</span>
                <span v-if="item.completed">•</span>
                <span v-if="item.completed" class="text-green-600 font-medium">✓ Completed!</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16">
        <p class="text-6xl mb-4">{{ activeTab === 'active' ? '🎯' : '🎉' }}</p>
        <p class="text-gray-500 text-lg mb-4">
          {{ activeTab === 'active' ? 'No bucket list items yet' : 'No completed items yet' }}
        </p>
        <button
          v-if="activeTab === 'active'"
          @click="openModal"
          class="bg-[#00BFAF] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:bg-[#009688] transition-all"
        >
          Add Your First Dream
        </button>
      </div>
    </div>

    <!-- Add Item Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showModal = false"
    >
      <div class="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 class="text-2xl font-bold text-[#4A4A4A] mb-6">Add to Bucket List</h2>

        <div class="space-y-5">
          <!-- Title -->
          <div>
            <label class="block text-sm font-semibold text-[#4A4A4A] mb-2">
              What do you want to do? <span class="text-red-500">*</span>
            </label>
            <input
              v-model="title"
              type="text"
              placeholder="e.g., Visit Paris together, Try skydiving..."
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#00BFAF] focus:border-transparent outline-none"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-semibold text-[#4A4A4A] mb-2">
              Description (Optional)
            </label>
            <textarea
              v-model="description"
              rows="3"
              placeholder="Add more details..."
              class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#00BFAF] focus:border-transparent outline-none resize-none"
            ></textarea>
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-semibold text-[#4A4A4A] mb-3">Category</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="cat in bucketListStore.categories"
                :key="cat.value"
                @click="category = cat.value"
                :class="['p-3 rounded-xl border-2 transition-all', category === cat.value ? 'border-[#00BFAF] bg-[#E0F7F5]' : 'border-gray-200 hover:border-gray-300']"
              >
                <div class="text-2xl mb-1">{{ cat.icon }}</div>
                <div class="text-xs font-medium text-[#4A4A4A]">{{ cat.label }}</div>
              </button>
            </div>
          </div>

          <!-- Priority -->
          <div>
            <label class="block text-sm font-semibold text-[#4A4A4A] mb-3">Priority</label>
            <div class="flex gap-3">
              <button
                v-for="prio in bucketListStore.priorities"
                :key="prio.value"
                @click="priority = prio.value"
                :class="['flex-1 py-3 rounded-xl border-2 font-medium transition-all', priority === prio.value ? 'border-[#00BFAF] bg-[#E0F7F5] text-[#00BFAF]' : 'border-gray-200 text-gray-600 hover:border-gray-300']"
              >
                {{ prio.label }}
              </button>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
            {{ error }}
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button
              @click="showModal = false"
              class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
              :disabled="loading"
            >
              Cancel
            </button>
            <button
              @click="createItem"
              class="flex-1 bg-[#00BFAF] text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:bg-[#009688] transition-all"
              :disabled="loading"
            >
              {{ loading ? 'Adding...' : 'Add to List' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
