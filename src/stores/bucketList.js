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

export const useBucketListStore = defineStore('bucketList', () => {
  const items = ref([])
  const loading = ref(false)

  const categories = [
    { value: 'travel', label: 'Travel', icon: '✈️' },
    { value: 'food', label: 'Food & Dining', icon: '🍽️' },
    { value: 'experience', label: 'Experience', icon: '🎭' },
    { value: 'adventure', label: 'Adventure', icon: '🏔️' },
    { value: 'learning', label: 'Learning', icon: '📚' },
    { value: 'milestone', label: 'Milestone', icon: '🎯' },
    { value: 'other', label: 'Other', icon: '⭐' }
  ]

  const priorities = [
    { value: 'high', label: 'High', color: 'text-red-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'low', label: 'Low', color: 'text-green-600' }
  ]

  // Create bucket list item
  const createItem = async (itemData) => {
    const coupleStore = useCoupleStore()
    if (!coupleStore.coupleCode) {
      throw new Error('No couple code found')
    }

    loading.value = true
    try {
      const newItem = {
        ...itemData,
        coupleCode: coupleStore.coupleCode,
        createdBy: coupleStore.userId,
        createdByName: coupleStore.userName,
        createdAt: new Date().toISOString(),
        completed: false
      }

      console.log('Creating bucket list item:', newItem)
      console.log('Couple code:', coupleStore.coupleCode)
      console.log('User ID:', coupleStore.userId)

      await addDoc(collection(db, 'bucketList'), newItem)
      console.log('Bucket list item created successfully!')
    } catch (error) {
      console.error('Error creating bucket list item:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Update item
  const updateItem = async (itemId, updates) => {
    loading.value = true
    try {
      const itemRef = doc(db, 'bucketList', itemId)
      await updateDoc(itemRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating bucket list item:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Toggle completion
  const toggleComplete = async (itemId, completed) => {
    const coupleStore = useCoupleStore()
    await updateItem(itemId, {
      completed,
      completedAt: completed ? new Date().toISOString() : null,
      completedBy: completed ? coupleStore.userId : null
    })
  }

  // Delete item
  const deleteItem = async (itemId) => {
    loading.value = true
    try {
      await deleteDoc(doc(db, 'bucketList', itemId))
    } catch (error) {
      console.error('Error deleting bucket list item:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Subscribe to bucket list items
  const subscribeToItems = () => {
    const coupleStore = useCoupleStore()
    if (!coupleStore.coupleCode) {
      console.log('No couple code found for subscription')
      return null
    }

    console.log('Subscribing to bucket list for couple:', coupleStore.coupleCode)

    const q = query(
      collection(db, 'bucketList'),
      where('coupleCode', '==', coupleStore.coupleCode),
      orderBy('createdAt', 'desc')
    )

    return onSnapshot(q, (snapshot) => {
      console.log('Bucket list snapshot received:', snapshot.docs.length, 'items')
      items.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('Bucket list items updated:', items.value)
    }, (error) => {
      console.error('Error in bucket list subscription:', error)
    })
  }

  // Get active items
  const getActiveItems = () => {
    return items.value.filter(item => !item.completed)
  }

  // Get completed items
  const getCompletedItems = () => {
    return items.value.filter(item => item.completed)
  }

  return {
    items,
    loading,
    categories,
    priorities,
    createItem,
    updateItem,
    toggleComplete,
    deleteItem,
    subscribeToItems,
    getActiveItems,
    getCompletedItems
  }
})
