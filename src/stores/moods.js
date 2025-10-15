import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase/config'
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import { useCoupleStore } from './couple'

export const useMoodsStore = defineStore('moods', () => {
  const moods = ref([])
  const loading = ref(false)

  const moodOptions = [
    { value: 'happy', label: 'Happy', icon: '😊', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'loved', label: 'Loved', icon: '🥰', color: 'bg-pink-100 text-pink-700' },
    { value: 'content', label: 'Content', icon: '😌', color: 'bg-blue-100 text-blue-700' },
    { value: 'excited', label: 'Excited', icon: '🤩', color: 'bg-purple-100 text-purple-700' },
    { value: 'grateful', label: 'Grateful', icon: '🙏', color: 'bg-green-100 text-green-700' },
    { value: 'peaceful', label: 'Peaceful', icon: '😇', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'tired', label: 'Tired', icon: '😴', color: 'bg-gray-100 text-gray-700' },
    { value: 'sad', label: 'Sad', icon: '😢', color: 'bg-blue-200 text-blue-800' },
    { value: 'anxious', label: 'Anxious', icon: '😰', color: 'bg-orange-100 text-orange-700' },
    { value: 'disconnected', label: 'Disconnected', icon: '😶', color: 'bg-gray-200 text-gray-800' }
  ]

  // Add mood entry
  const addMoodEntry = async (dateId, mood, notes = '') => {
    const coupleStore = useCoupleStore()
    if (!coupleStore.coupleCode) {
      throw new Error('No couple code found')
    }

    loading.value = true
    try {
      const moodEntry = {
        dateId,
        coupleCode: coupleStore.coupleCode,
        userId: coupleStore.userId,
        userName: coupleStore.userName,
        mood,
        notes,
        createdAt: new Date().toISOString()
      }

      await addDoc(collection(db, 'moods'), moodEntry)
    } catch (error) {
      console.error('Error adding mood entry:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Subscribe to mood entries
  const subscribeToMoods = () => {
    const coupleStore = useCoupleStore()
    if (!coupleStore.coupleCode) return null

    const q = query(
      collection(db, 'moods'),
      where('coupleCode', '==', coupleStore.coupleCode),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      moods.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    })
  }

  // Get mood entries for a specific date
  const getMoodsForDate = (dateId) => {
    return moods.value.filter(mood => mood.dateId === dateId)
  }

  // Check if user already logged mood for a date
  const hasUserLoggedMood = (dateId, userId) => {
    return moods.value.some(mood => mood.dateId === dateId && mood.userId === userId)
  }

  return {
    moods,
    loading,
    moodOptions,
    addMoodEntry,
    subscribeToMoods,
    getMoodsForDate,
    hasUserLoggedMood
  }
})
