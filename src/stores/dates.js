import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase/config'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore'
import { useCoupleStore } from './couple'

export const useDatesStore = defineStore('dates', () => {
  const dates = ref([])
  const loading = ref(false)

  const dateTypes = [
    { value: 'deep-talk', label: 'Deep Talk', icon: '💬', color: 'bg-purple-100 text-purple-700' },
    { value: 'silent-connection', label: 'Silent Connection', icon: '🤫', color: 'bg-blue-100 text-blue-700' },
    { value: 'quality-time', label: 'Quality Time', icon: '⏰', color: 'bg-pink-100 text-pink-700' },
    { value: 'surprise', label: 'Surprise Date', icon: '🎁', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'game-night', label: 'Game Night', icon: '🎮', color: 'bg-green-100 text-green-700' },
    { value: 'watch-party', label: 'Watch Party', icon: '🍿', color: 'bg-red-100 text-red-700' },
    { value: 'self-care', label: 'Self-Care Date', icon: '🧘', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'other', label: 'Other', icon: '✨', color: 'bg-gray-100 text-gray-700' }
  ]

  // Create a new date request (pending partner approval)
  const createDateRequest = async (dateData) => {
    const coupleStore = useCoupleStore()
    if (!coupleStore.coupleCode) {
      throw new Error('No couple code found')
    }

    loading.value = true
    try {
      const newDate = {
        ...dateData,
        coupleCode: coupleStore.coupleCode,
        createdBy: coupleStore.userId,
        createdByName: coupleStore.userName,
        createdAt: new Date().toISOString(),
        status: 'pending', // Waiting for partner approval
        requestStatus: 'pending'
      }

      await addDoc(collection(db, 'dates'), newDate)
    } catch (error) {
      console.error('Error creating date request:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Accept date request
  const acceptDateRequest = async (dateId) => {
    const coupleStore = useCoupleStore()
    loading.value = true
    try {
      const dateRef = doc(db, 'dates', dateId)
      await updateDoc(dateRef, {
        status: 'scheduled',
        requestStatus: 'accepted',
        acceptedBy: coupleStore.userId,
        acceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error accepting date request:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Decline date request
  const declineDateRequest = async (dateId, reason = '') => {
    const coupleStore = useCoupleStore()
    loading.value = true
    try {
      const dateRef = doc(db, 'dates', dateId)
      await updateDoc(dateRef, {
        status: 'declined',
        requestStatus: 'declined',
        declinedBy: coupleStore.userId,
        declinedAt: new Date().toISOString(),
        declineReason: reason,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error declining date request:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Legacy: Create a new date directly (no approval needed)
  const createDate = async (dateData) => {
    const coupleStore = useCoupleStore()
    if (!coupleStore.coupleCode) {
      throw new Error('No couple code found')
    }

    loading.value = true
    try {
      const newDate = {
        ...dateData,
        coupleCode: coupleStore.coupleCode,
        createdBy: coupleStore.userId,
        createdByName: coupleStore.userName,
        createdAt: new Date().toISOString(),
        status: 'scheduled',
        requestStatus: 'auto-approved' // Bypass approval
      }

      await addDoc(collection(db, 'dates'), newDate)
    } catch (error) {
      console.error('Error creating date:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Update date
  const updateDate = async (dateId, updates) => {
    loading.value = true
    try {
      const dateRef = doc(db, 'dates', dateId)
      await updateDoc(dateRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating date:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Delete date
  const deleteDate = async (dateId) => {
    loading.value = true
    try {
      await deleteDoc(doc(db, 'dates', dateId))
    } catch (error) {
      console.error('Error deleting date:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Subscribe to dates
  const subscribeToDates = () => {
    const coupleStore = useCoupleStore()
    if (!coupleStore.coupleCode) return null

    const q = query(
      collection(db, 'dates'),
      where('coupleCode', '==', coupleStore.coupleCode),
      orderBy('dateTime', 'asc')
    )

    return onSnapshot(q, (snapshot) => {
      dates.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    })
  }

  // Get upcoming dates
  const getUpcomingDates = () => {
    const now = new Date().toISOString()
    return dates.value.filter(date => date.dateTime > now && date.status === 'scheduled')
  }

  // Get past dates
  const getPastDates = () => {
    const now = new Date().toISOString()
    return dates.value.filter(date => date.dateTime <= now || date.status === 'completed')
  }

  // Get pending date requests (for current user to review)
  const getPendingRequests = () => {
    const coupleStore = useCoupleStore()
    return dates.value.filter(date =>
      date.status === 'pending' &&
      date.createdBy !== coupleStore.userId // Not created by me
    )
  }

  // Get my pending requests (waiting for partner's response)
  const getMyPendingRequests = () => {
    const coupleStore = useCoupleStore()
    return dates.value.filter(date =>
      date.status === 'pending' &&
      date.createdBy === coupleStore.userId // Created by me
    )
  }

  // Get declined dates
  const getDeclinedDates = () => {
    return dates.value.filter(date => date.status === 'declined')
  }

  return {
    dates,
    loading,
    dateTypes,
    createDate,
    createDateRequest,
    acceptDateRequest,
    declineDateRequest,
    updateDate,
    deleteDate,
    subscribeToDates,
    getUpcomingDates,
    getPastDates,
    getPendingRequests,
    getMyPendingRequests,
    getDeclinedDates
  }
})
