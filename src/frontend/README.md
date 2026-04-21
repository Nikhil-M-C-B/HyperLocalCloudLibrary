# Hyper Local Cloud Library - Frontend

React Native mobile app built with Expo + Expo Router.

## Tech Stack
- Expo SDK 54 + React Native 0.81
- Expo Router for file-based routing
- Zustand for client state stores
- Axios for backend API calls
- TypeScript + ESLint

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment in `src/frontend/.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```
3. Start dev server:
   ```bash
   npm start
   ```

## Scripts
- `npm start` - start Expo dev server
- `npm run android` - run on Android
- `npm run ios` - run on iOS
- `npm run web` - run web target
- `npm run lint` - lint code

## App Structure
- `app/` - route groups and screens (`(auth)`, `(user)`, `(child)`, `(librarian)`, `(admin)`)
- `api/` - Axios instance + service wrappers
- `store/` - Zustand stores (auth, profiles, books, issues, network)
- `components/` - reusable UI components
- `constants/` - theme/config/static constants
- `utils/` - client helpers

## Backend Integration
- Base URL is read from `EXPO_PUBLIC_API_URL`.
- Default fallback in code is `http://localhost:5000/api/v1`.
- Authenticated calls use token-aware Axios configuration from `api/axiosInstance.js`.

## Notes
- Ensure backend is running before testing authenticated flows.
- If Metro behaves unexpectedly, run `npx expo start -c` to clear cache.
