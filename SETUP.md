# Quick Setup Guide

This guide will help you get the app up and running quickly.

## Step 1: Install Dependencies

```bash
cd couple-date-planner
npm install
```

## Step 2: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database**
4. Enable **Authentication** (choose Email/Password)
5. Go to Project Settings → General → Your apps
6. Click "Add app" → Web (</>) icon
7. Copy the Firebase configuration

8. Update `src/firebase/config.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",  // Your actual keys here
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
}
```

## Step 3: Deploy Firebase Configuration

```bash
# Install Firebase CLI globally (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

## Step 4: Set Up Email Notifications (Optional but Recommended)

1. Create a [SendGrid account](https://sendgrid.com/) (free tier available)
2. Get your SendGrid API key from Settings → API Keys
3. Verify a sender email address in SendGrid
4. Set the API key in Firebase Functions:

```bash
firebase functions:config:set sendgrid.key="SG.your-api-key-here"
```

5. Update the sender email in `functions/index.js`:

```javascript
from: 'your-verified-email@yourdomain.com'
```

6. Deploy Cloud Functions:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Step 5: Run the App Locally

```bash
npm run dev
```

Open your browser to `http://localhost:5173`

## Step 6: Build and Deploy (When Ready)

```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy everything at once
firebase deploy
```

Your app will be live at `https://your-project-id.web.app`

## Quick Test

1. Open the app in your browser
2. Click "Get Started"
3. Click "Create New Couple Code"
4. Enter your email and name
5. Copy the generated couple code
6. Open the app in another browser/incognito window
7. Click "Join with Existing Code"
8. Enter the couple code
9. You should now see both users connected!

## Troubleshooting

### "Firebase not configured" error
- Check that you've updated `src/firebase/config.js` with your actual Firebase credentials

### "Permission denied" error in Firestore
- Make sure you've deployed Firestore rules: `firebase deploy --only firestore`

### Email notifications not working
- Verify SendGrid API key is set: `firebase functions:config:get`
- Check that you've verified your sender email in SendGrid
- Make sure Cloud Functions are deployed: `firebase deploy --only functions`

### PWA not working
- PWA requires HTTPS. Use Firebase Hosting or another HTTPS host
- For local testing, use `localhost` (which browsers treat as secure)

## Next Steps

- Customize the app colors in `tailwind.config.js`
- Add your own app icons in the `public` folder (192x192 and 512x512 PNG files)
- Update the app name and description in `vite.config.js` (PWA manifest)
- Set up push notifications with Firebase Cloud Messaging (see README for details)

## Need Help?

Check the full [README.md](README.md) for detailed documentation.
