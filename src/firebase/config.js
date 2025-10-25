import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getMessaging, isSupported } from 'firebase/messaging'

// Firebase configuration
// Your SoulSync project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase with error handling
let app, db, auth

try {
  if (!firebaseConfig.apiKey) {
    throw new Error('Firebase configuration is missing. Please check environment variables.')
  }
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
} catch (error) {
  console.error('Firebase initialization error:', error)
  // Create minimal fallback to prevent app crash
  app = null
  db = null
  auth = null
}

export { db, auth }

// Initialize Firebase Cloud Messaging (only if supported and app initialized)
let messaging = null
if (app) {
  isSupported().then(supported => {
    if (supported) {
      try {
        messaging = getMessaging(app)
      } catch (error) {
        console.error('Error initializing messaging:', error)
      }
    }
  }).catch(error => {
    console.error('Error checking messaging support:', error)
  })
}

export { messaging }
export default app
