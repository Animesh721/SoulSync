import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, auth, messaging } from '@/firebase/config'
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot
} from 'firebase/firestore'
import { getToken, onMessage } from 'firebase/messaging'

export const useCoupleStore = defineStore('couple', () => {
  const coupleCode = ref(localStorage.getItem('coupleCode') || null)
  const userId = ref(localStorage.getItem('userId') || null)
  const userEmail = ref(localStorage.getItem('userEmail') || null)
  const userName = ref(localStorage.getItem('userName') || null)
  const recoveryCode = ref(localStorage.getItem('recoveryCode') || null)
  const userTimezone = ref(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const partnerInfo = ref(null)
  const partnerLastSeen = ref(null)
  const fcmToken = ref(localStorage.getItem('fcmToken') || null)
  const notificationPermission = ref(Notification.permission)
  const isLinked = computed(() => !!coupleCode.value && !!userId.value)
  const isPartnerOnline = computed(() => {
    if (!partnerLastSeen.value) return false
    const lastSeen = new Date(partnerLastSeen.value)
    const now = new Date()
    return (now - lastSeen) < 5 * 60 * 1000 // Online if seen within 5 minutes
  })

  // Create a new couple code
  const createCoupleCode = async (email, name) => {
    const code = generateCoupleCode()
    const newUserId = generateUserId()
    const newRecoveryCode = generateRecoveryCode()

    try {
      await setDoc(doc(db, 'couples', code), {
        createdAt: new Date().toISOString(),
        recoveryCode: newRecoveryCode,
        users: {
          [newUserId]: {
            email,
            name,
            timezone: userTimezone.value,
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
          }
        }
      })

      coupleCode.value = code
      userId.value = newUserId
      userEmail.value = email
      userName.value = name
      recoveryCode.value = newRecoveryCode

      localStorage.setItem('coupleCode', code)
      localStorage.setItem('userId', newUserId)
      localStorage.setItem('userEmail', email)
      localStorage.setItem('userName', name)
      localStorage.setItem('recoveryCode', newRecoveryCode)

      return { code, recoveryCode: newRecoveryCode }
    } catch (error) {
      console.error('Error creating couple code:', error)
      throw error
    }
  }

  // Join existing couple with code
  const joinCoupleCode = async (code, email, name) => {
    try {
      const coupleRef = doc(db, 'couples', code)
      const coupleDoc = await getDoc(coupleRef)

      if (!coupleDoc.exists()) {
        throw new Error('Couple code not found')
      }

      const coupleData = coupleDoc.data()
      const userCount = Object.keys(coupleData.users || {}).length

      if (userCount >= 2) {
        throw new Error('This couple code already has 2 users')
      }

      const newUserId = generateUserId()

      await updateDoc(coupleRef, {
        [`users.${newUserId}`]: {
          email,
          name,
          timezone: userTimezone.value,
          joinedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }
      })

      coupleCode.value = code
      userId.value = newUserId
      userEmail.value = email
      userName.value = name
      recoveryCode.value = coupleData.recoveryCode

      localStorage.setItem('coupleCode', code)
      localStorage.setItem('userId', newUserId)
      localStorage.setItem('userEmail', email)
      localStorage.setItem('userName', name)
      localStorage.setItem('recoveryCode', coupleData.recoveryCode)

      return { success: true, recoveryCode: coupleData.recoveryCode }
    } catch (error) {
      console.error('Error joining couple:', error)
      throw error
    }
  }

  // Recover account with recovery code
  const recoverAccount = async (recoveryCodeInput, email) => {
    try {
      // Search for couple with this recovery code
      const couplesRef = collection(db, 'couples')
      const snapshot = await getDoc(doc(db, 'couples', recoveryCodeInput))

      // Try to find by recovery code stored in couple doc
      const allCouples = []
      const querySnapshot = await getDocs(couplesRef)

      let foundCouple = null
      let foundUserId = null

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.recoveryCode === recoveryCodeInput) {
          // Find user by email
          const users = data.users || {}
          for (const [uid, userData] of Object.entries(users)) {
            if (userData.email === email) {
              foundCouple = { id: doc.id, ...data }
              foundUserId = uid
              break
            }
          }
        }
      })

      if (!foundCouple || !foundUserId) {
        throw new Error('Recovery code or email not found')
      }

      const userData = foundCouple.users[foundUserId]

      // Restore session
      coupleCode.value = foundCouple.id
      userId.value = foundUserId
      userEmail.value = userData.email
      userName.value = userData.name
      recoveryCode.value = foundCouple.recoveryCode

      localStorage.setItem('coupleCode', foundCouple.id)
      localStorage.setItem('userId', foundUserId)
      localStorage.setItem('userEmail', userData.email)
      localStorage.setItem('userName', userData.name)
      localStorage.setItem('recoveryCode', foundCouple.recoveryCode)

      // Update last seen
      await updateDoc(doc(db, 'couples', foundCouple.id), {
        [`users.${foundUserId}.lastSeen`]: new Date().toISOString()
      })

      return true
    } catch (error) {
      console.error('Error recovering account:', error)
      throw error
    }
  }

  // Listen to partner information
  const subscribeToPartner = () => {
    if (!coupleCode.value || !userId.value) return null

    const coupleRef = doc(db, 'couples', coupleCode.value)

    // Update own lastSeen every minute
    const updateLastSeen = () => {
      updateDoc(coupleRef, {
        [`users.${userId.value}.lastSeen`]: new Date().toISOString()
      }).catch(err => console.error('Failed to update lastSeen:', err))
    }

    updateLastSeen()
    const lastSeenInterval = setInterval(updateLastSeen, 60000) // Every minute

    const unsubscribe = onSnapshot(coupleRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const users = data.users || {}

        // Find partner (the other user)
        const partnerKey = Object.keys(users).find(key => key !== userId.value)
        if (partnerKey) {
          partnerInfo.value = users[partnerKey]
          partnerLastSeen.value = users[partnerKey].lastSeen
        }
      }
    })

    // Return cleanup function
    return () => {
      clearInterval(lastSeenInterval)
      unsubscribe()
    }
  }

  // Request notification permission and get FCM token
  const requestNotificationPermission = async () => {
    if (!messaging) {
      console.warn('FCM not supported on this browser')
      return null
    }

    try {
      const permission = await Notification.requestPermission()
      notificationPermission.value = permission

      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        })

        if (token) {
          fcmToken.value = token
          localStorage.setItem('fcmToken', token)

          // Save token to user profile in Firestore
          if (coupleCode.value && userId.value) {
            await updateDoc(doc(db, 'couples', coupleCode.value), {
              [`users.${userId.value}.fcmToken`]: token,
              [`users.${userId.value}.fcmTokenUpdatedAt`]: new Date().toISOString()
            })
          }

          console.log('FCM token saved:', token)
          return token
        }
      } else {
        console.log('Notification permission denied')
        return null
      }
    } catch (error) {
      console.error('Error getting FCM token:', error)
      return null
    }
  }

  // Listen for foreground messages
  const setupForegroundMessageListener = () => {
    if (!messaging) return null

    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload)

      // Show notification using browser Notification API
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'SoulSync', {
          body: payload.notification?.body || 'You have a new notification',
          icon: '/favicon.svg',
          tag: payload.data?.dateId || 'soulsync-notification',
          requireInteraction: true
        })
      }
    })
  }

  // Logout
  const logout = () => {
    coupleCode.value = null
    userId.value = null
    userEmail.value = null
    userName.value = null
    partnerInfo.value = null

    localStorage.removeItem('coupleCode')
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    // Keep recovery code for recovery
  }

  // Helper functions
  function generateCoupleCode() {
    const adjectives = ['Sweet', 'Lovely', 'Happy', 'Soul', 'Heart', 'Star', 'Moon', 'Sun']
    const nouns = ['Mates', 'Hearts', 'Lovers', 'Pair', 'Team', 'Duo', 'Bond', 'Connection']
    const randomNum = Math.floor(Math.random() * 1000)

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]

    return `${adj}${noun}${randomNum}`.toUpperCase()
  }

  function generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 11) + Date.now()
  }

  function generateRecoveryCode() {
    // Generate a secure 16-character recovery code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
      if ((i + 1) % 4 === 0 && i !== 15) code += '-' // Add dash every 4 chars
    }
    return code
  }

  return {
    coupleCode,
    userId,
    userEmail,
    userName,
    recoveryCode,
    userTimezone,
    partnerInfo,
    partnerLastSeen,
    fcmToken,
    notificationPermission,
    isLinked,
    isPartnerOnline,
    createCoupleCode,
    joinCoupleCode,
    recoverAccount,
    subscribeToPartner,
    requestNotificationPermission,
    setupForegroundMessageListener,
    logout
  }
})
