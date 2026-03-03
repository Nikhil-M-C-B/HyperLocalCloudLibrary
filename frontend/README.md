# Hyper-Local Cloud Library 📚

A cloud-based, mobile-first library management platform for young children (ages 2–10). Built with **React Native (Expo)**, designed for micro-libraries, communities, and schools.

## Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| **Framework** | React Native (Expo) | Cross-platform mobile app |
| **State Management** | Zustand | Lightweight global state (profiles, books, auth, network) |
| **API Client** | Axios | HTTP requests with JWT interceptors & timeout handling |
| **Secure Storage** | expo-secure-store | Encrypted JWT tokens & parent PIN |
| **Cache Storage** | AsyncStorage | Offline book catalog & dashboard data |
| **Network Detection** | NetInfo | Real-time connectivity monitoring |

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Expo CLI**: `npm install -g expo-cli` (optional, can use `npx expo`)
- **Expo Go** app on your phone (for physical device testing)
- **Android Studio** or **Xcode** (for emulator testing)

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/Astr0Lynx/hyper-local-cloud-library.git
cd hyper-local-cloud-library

# 2. Install dependencies
npm install

# 3. (Optional) Set your backend API URL
# Create a .env file in the root:
echo "EXPO_PUBLIC_API_URL=http://your-server-ip:3000/api" > .env
```

## Running the App

```bash
# Start the Expo development server
npx expo start

# ── Platform-specific shortcuts ─────────────────────
npx expo start --android   # Open on Android emulator
npx expo start --ios       # Open on iOS simulator
npx expo start --web       # Open in web browser
```

### Running on a Physical Device
1. Install **Expo Go** from the App Store / Play Store
2. Run `npx expo start`
3. Scan the QR code shown in the terminal with your phone's camera

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000/api` |

## Project Structure

```
hyper-local-cloud-library/
├── app/                          # Expo Router screens
├── src/
│   ├── store/                    # Zustand state stores
│   │   ├── authStore.js          # Authentication state
│   │   ├── profileStore.js       # User profile management
│   │   ├── bookStore.js          # Book catalog + cache
│   │   └── networkStore.js       # Offline/online tracking
│   ├── api/
│   │   ├── axiosInstance.js      # Axios config + interceptors
│   │   └── services/
│   │       ├── authService.js    # Login, register, logout
│   │       ├── bookService.js    # Browse, search, issue, return
│   │       ├── profileService.js # Profile CRUD
│   │       ├── orderService.js   # Orders & delivery tracking
│   │       └── librarianService.js # Admin book management
│   ├── hooks/
│   │   ├── useAppInit.js         # App startup sequence
│   │   └── useNetworkStatus.js   # Real-time network monitoring
│   └── utils/
│       └── storage.js            # SecureStore + AsyncStorage utilities
├── docs/                         # Project documentation (SRS, DB schema)
├── package.json
└── README.md
```

## User Profiles

| Profile | Capabilities |
|---------|-------------|
| **Child** | Browse books, chat with AI librarian, read summaries, take quizzes |
| **Parent** | All child features + rent/buy books, payments, monitor child activity |
| **Librarian** | Manage book catalog, track issued books, handle returns |

## Offline Support

The app is designed for low-connectivity environments:

1. **Instant Load** — Cached book catalog is shown immediately on launch
2. **Background Sync** — Fresh data is fetched in the background via Axios
3. **Timeout Detection** — 5-second timeout triggers offline mode
4. **Graceful Fallback** — Offline banner appears; cached data remains browsable

## Scripts

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run lint       # Run ESLint
```

## License

This project is part of the DASS course at IIIT Hyderabad.
