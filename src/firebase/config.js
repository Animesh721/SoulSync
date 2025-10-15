import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getMessaging, isSupported } from 'firebase/messaging'

// Firebase configuration
// Your SoulSync project credentials
const firebaseConfig = {
  apiKey: "AIzaSyAIrfZQnuQM/Z2XEzfPsaqHLK_Idsk",
  authDomain: "soulsync-a4c9c.firebaseapp.com",
  projectId: "soulsync-a4c9c",
  storageBucket: "soulsync-a4c9c.firebasestorage.app",
  messagingSenderId: "597853897409",
  appId: "1:597853897409:web:9e4579576efd4af048320"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const db = getFirestore(app)
export const auth = getAuth(app)

// Initialize Firebase Cloud Messaging (only if supported)
let messaging = null
isSupported().then(supported => {
  if (supported) {
    messaging = getMessaging(app)
  }
})

export { messaging }
export default app
