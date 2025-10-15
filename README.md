# Together Always - Long-Distance Couple Date Planner 💕

A Progressive Web App (PWA) built with Vue.js to help couples in long-distance relationships stay connected through scheduled dates, mood tracking, and shared bucket lists.

## ✨ Features

### 👥 Couple Linking
- Create or join with a unique couple code
- Automatic sync between partners
- Timezone-aware scheduling

### 📅 Date Reservations
- Schedule virtual dates with various types:
  - Deep Talk 💬
  - Silent Connection 🤫
  - Quality Time ⏰
  - Surprise Date 🎁
  - Game Night 🎮
  - Watch Party 🍿
  - Self-Care Date 🧘
  - And more!
- Automatic notifications via email and push notifications
- Reminders 1 hour before scheduled dates

### 💬 Mood & Emotion Tracker
- Log how each date made you feel
- Private mood entries stored per user
- Multiple mood options (Happy, Loved, Content, Tired, etc.)
- Optional notes for each mood entry

### 🎯 Relationship Bucket List
- Shared list of goals and experiences
- Categorized items (Travel, Food, Experience, Adventure, etc.)
- Priority levels (High, Medium, Low)
- Track completed items together

### 📱 Progressive Web App
- Install on mobile devices
- Offline-capable
- App-like experience
- Fast loading with service workers

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase account
- SendGrid account (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   cd couple-date-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**

   a. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)

   b. Enable Firestore Database

   c. Enable Authentication (Email/Password or Anonymous)

   d. Copy your Firebase configuration and update `src/firebase/config.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   }
   ```

4. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

5. **Set up SendGrid for email notifications**

   a. Create a SendGrid account at [SendGrid](https://sendgrid.com/)

   b. Get your API key

   c. Set the API key in Firebase Functions config:
   ```bash
   firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
   ```

   d. Verify your sender email in SendGrid

   e. Update the sender email in `functions/index.js`:
   ```javascript
   from: 'noreply@yourdomain.com'
   ```

6. **Deploy Firestore rules and indexes**
   ```bash
   firebase deploy --only firestore
   ```

7. **Deploy Cloud Functions**
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Or deploy everything at once:

```bash
npm run build
firebase deploy
```

## 📱 Installing as PWA

### On Mobile (iOS/Android)

1. Open the app in your mobile browser
2. Look for the "Add to Home Screen" or "Install" prompt
3. Follow the prompts to install
4. The app will appear as an icon on your home screen

### On Desktop (Chrome/Edge)

1. Open the app in your browser
2. Look for the install icon (⊕) in the address bar
3. Click "Install"
4. The app will open in its own window

## 🔧 Configuration

### Firebase Firestore Schema

#### Couples Collection
```javascript
{
  couples: {
    [coupleCode]: {
      createdAt: timestamp,
      users: {
        [userId]: {
          email: string,
          name: string,
          timezone: string,
          joinedAt: timestamp
        }
      }
    }
  }
}
```

#### Dates Collection
```javascript
{
  dates: {
    [dateId]: {
      coupleCode: string,
      title: string,
      dateTime: timestamp,
      type: string,
      notes: string,
      createdBy: string,
      createdByName: string,
      status: 'scheduled' | 'completed',
      reminderSent: boolean
    }
  }
}
```

#### Moods Collection
```javascript
{
  moods: {
    [moodId]: {
      coupleCode: string,
      dateId: string,
      userId: string,
      userName: string,
      mood: string,
      notes: string,
      createdAt: timestamp
    }
  }
}
```

#### Bucket List Collection
```javascript
{
  bucketList: {
    [itemId]: {
      coupleCode: string,
      title: string,
      description: string,
      category: string,
      priority: 'high' | 'medium' | 'low',
      completed: boolean,
      createdBy: string,
      createdByName: string,
      createdAt: timestamp,
      completedAt: timestamp,
      completedBy: string
    }
  }
}
```

### Notifications

The app sends notifications in two ways:

1. **Email Notifications** (via SendGrid)
   - When a new date is created
   - 1 hour before a scheduled date

2. **Push Notifications** (via Firebase Cloud Messaging)
   - Requires additional setup for FCM
   - See [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)

### Cloud Functions

The app includes two Cloud Functions:

1. **onDateCreated** - Triggered when a new date is created
   - Sends email notifications to both partners
   - Schedules reminder

2. **sendDateReminders** - Scheduled function (runs every 15 minutes)
   - Checks for dates happening in the next hour
   - Sends reminder emails

## 🛠️ Tech Stack

- **Frontend**: Vue.js 3 (Composition API)
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Cloud Functions)
- **Notifications**: SendGrid (Email), Firebase Cloud Messaging (Push)
- **Build Tool**: Vite
- **PWA**: vite-plugin-pwa with Workbox

## 📂 Project Structure

```
couple-date-planner/
├── functions/                 # Firebase Cloud Functions
│   ├── index.js              # Function definitions
│   └── package.json          # Function dependencies
├── public/                    # Static assets
├── src/
│   ├── assets/               # Images, fonts, etc.
│   ├── components/           # Reusable Vue components
│   ├── firebase/             # Firebase configuration
│   │   └── config.js
│   ├── router/               # Vue Router configuration
│   │   └── index.js
│   ├── stores/               # Pinia stores
│   │   ├── couple.js         # Couple linking logic
│   │   ├── dates.js          # Date management
│   │   ├── moods.js          # Mood tracking
│   │   └── bucketList.js     # Bucket list management
│   ├── views/                # Page components
│   │   ├── HomeView.vue
│   │   ├── LinkView.vue
│   │   ├── DashboardView.vue
│   │   ├── DatesView.vue
│   │   ├── NewDateView.vue
│   │   └── BucketListView.vue
│   ├── App.vue               # Root component
│   ├── main.js               # App entry point
│   └── style.css             # Global styles
├── firebase.json              # Firebase configuration
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore indexes
├── tailwind.config.js        # Tailwind configuration
├── vite.config.js            # Vite configuration
└── package.json              # Project dependencies
```

## 🔒 Security

- Firestore security rules protect data access
- Users can only access data from their coupled account
- Email/password authentication recommended
- All sensitive keys should be stored as environment variables

## 🐛 Troubleshooting

### Firebase Connection Issues
- Verify your Firebase config in `src/firebase/config.js`
- Check Firebase project settings
- Ensure Firestore is enabled

### Email Notifications Not Sending
- Verify SendGrid API key is set: `firebase functions:config:get`
- Check SendGrid sender verification
- Review Cloud Functions logs: `firebase functions:log`

### PWA Not Installing
- Ensure the app is served over HTTPS
- Check browser console for service worker errors
- Verify manifest.json is accessible

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 💖 Support

If you find this project helpful, consider giving it a star ⭐

---

Built with ❤️ for couples in long-distance relationships
