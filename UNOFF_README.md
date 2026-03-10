# Hyper Local Cloud Library

A comprehensive full-stack ecosystem to manage physical and digital library branches across the city, designed with a focus on delivering books hyper-locally to users while facilitating interactive experiences for children.

This monorepo contains both the **Frontend** mobile application and the **Backend** REST API.

---

## 🏗️ Architecture Overview

The system architecture bridges the gap between traditional library paradigms and modern e-commerce delivery mechanics.

### 1. **Backend (Node.js + Express + MongoDB)**
A powerful RESTful service handling multiple core domains:
- **Authentication & Profiles**: JWT-based session management handling Multi-profile architectures (one parent can manage multiple children).
- **Inventory & Branches**: Manages books, their individual physical copies (`BookCopy`), and distinct library branches geolocated across regions.
- **Circulation & Delivery**: Deeply integrated issue logic calculating live `availableCopies`, running Haversine formulations to validate user delivery addresses against physical branch radiuses.

[→ Read the Backend Documentation](./backend/README.md)

### 2. **Frontend (React Native + Expo)**
A dynamic mobile application architected with `expo-router` for complex role-based nested navigation.
- **Role-based Authentication**: Distinct layouts for `(user)`, `(child)`, `(librarian)`, and `(admin)`.
- **State Management**: Zustand-powered stores caching JWT tokens, securely handling session persistence, and tracking dynamic Active Profiles cross-screen.
- **UI & UX Details**: A highly polished, aesthetic interface avoiding stock Native UI elements—featuring pure custom styled components, OpenLibrary dynamically populated cover graphics, and interactive dashboards!

[→ Read the Frontend Documentation](./frontend/README.md)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB Atlas](https://www.mongodb.com/atlas) (or Local MongoDB Server)
- [Expo CLI](https://expo.dev/) installed globally or via npx.

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables detailed in `backend/README.md`.
4. Run the development server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the `.env.example` configurations (Make sure `EXPO_PUBLIC_API_URL` points to your backend):
   ```bash
   # example
   EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```
4. Start the Expo bundler:
   ```bash
   npx expo start -c
   ```

---

## 🔒 Security & Data Note
The architecture leverages production-scale MongoDB Transactions across the circulation service to guarantee ACID compliance when issuing a book generates parallel Document instances across `Issue`, `Delivery`, and `BookCopy` schemas.
