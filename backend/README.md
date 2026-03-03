# Hyper Local Cloud Library - Backend API

A comprehensive backend service for a mobile-first platform that enables kids and parents to borrow books from nearby libraries with doorstep delivery.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)

## ✨ Features

- **JWT-based Authentication** with bcrypt password hashing
- **Profile Management** - Parent and child profiles with separate preferences
- **Book Catalog** with advanced filtering and search
- **Geospatial Delivery Validation** using Haversine formula (8km radius check)
- **Inventory Management** per library branch
- **Circulation System** - Issue and return books with tracking
- **Payment Integration** (Razorpay ready)
- **Automated Penalty Calculation** with daily cron jobs
- **MySQL Transaction Database** for immutable payment records
- **MongoDB** for flexible book and user data
- **Modular Architecture** for easy unit testing

## 🛠 Tech Stack

- **Backend Framework**: Node.js + Express
- **Databases**: 
  - MongoDB (books, users, inventory)
  - MySQL (payments, penalties)
- **Authentication**: JWT with bcrypt
- **Scheduled Tasks**: node-cron
- **Validation**: Joi
- **Testing**: Jest + Supertest

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.js
│   │   ├── mongodb.js
│   │   ├── mysql.js
│   │   └── mysql-schema.sql
│   ├── models/           # MongoDB schemas
│   │   ├── Auth.js
│   │   ├── User.js
│   │   ├── Book.js
│   │   ├── BookCopy.js
│   │   ├── Issue.js
│   │   ├── Delivery.js
│   │   ├── LibraryBranch.js
│   │   └── Organization.js
│   ├── services/         # Business logic
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── bookService.js
│   │   ├── inventoryService.js
│   │   ├── circulationService.js
│   │   ├── libraryService.js
│   │   ├── paymentService.js
│   │   └── penaltyService.js
│   ├── controllers/      # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── utils/            # Utility functions
│   │   ├── haversine.js
│   │   ├── fineCalculator.js
│   │   ├── AppError.js
│   │   ├── catchAsync.js
│   │   └── cronJobs.js
│   └── app.js            # Express app setup
├── server.js             # Entry point
├── package.json
├── .env.example
└── .gitignore
```

## 🚀 Installation

1. **Clone the repository**
```bash
cd hyper-local-cloud-library/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up MySQL database**
```bash
mysql -u root -p < src/config/mysql-schema.sql
```

## ⚙️ Configuration

Edit `.env` file with your settings:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hyper-local-library

# MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=library_transactions

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Business Rules
DELIVERY_RADIUS_KM=8
LATE_FEE_PER_DAY=10
GRACE_PERIOD_DAYS=2
DEFAULT_BORROW_PERIOD_DAYS=14
```

## 🏃 Running the Application

**Development Mode** (with auto-reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

**Run Tests**:
```bash
npm test
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "phone": "9876543210",
  "name": "John Doe",
  "preferredGenres": ["Fiction", "Mystery"]
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Book Endpoints

#### Get All Books
```http
GET /books?age=6-8&genre=Fiction&search=dinosaur
```

#### Check Book Availability
```http
GET /books/:bookId/availability?lat=28.6139&lng=77.2090
Authorization: Bearer <token>
```

#### Create Book (Librarian/Admin)
```http
POST /books
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Dinosaur Adventures",
  "author": "Jane Smith",
  "isbn": "978-3-16-148410-0",
  "genre": ["Adventure", "Science"],
  "ageRating": "6-8",
  "summary": "An exciting journey through prehistoric times..."
}
```

### Circulation Endpoints

#### Issue Book
```http
POST /issues
Authorization: Bearer <token>
Content-Type: application/json

{
  "profileId": "profile_id_here",
  "bookId": "book_id_here",
  "branchId": "branch_id_here",
  "type": "PHYSICAL"
}
```

**Note**: This endpoint includes automatic:
- Haversine distance validation (checks if user is within 8km)
- Inventory availability check
- Atomic transaction for book copy status update
- Delivery scheduling

#### Return Book
```http
PUT /issues/:issueId/return
Authorization: Bearer <token>
```

#### Get User Issues
```http
GET /users/:userId/issues?status=ISSUED
Authorization: Bearer <token>
```

### User Profile Endpoints

#### Create Child Profile
```http
POST /users/:parentId/children
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Emma Doe",
  "ageGroup": "6-8",
  "preferredGenres": ["Fantasy", "Adventure"]
}
```

#### Update Profile
```http
PUT /users/:userId/profiles/:profileId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Emma Smith",
  "preferredGenres": ["Fantasy", "Science Fiction"]
}
```

### Library Endpoints

#### Get Nearby Libraries
```http
GET /libraries/nearby?lat=28.6139&lng=77.2090&maxDistance=10
```

#### Create Library (Admin)
```http
POST /libraries
Authorization: Bearer <token>
Content-Type: application/json

{
  "organizationId": "org_id",
  "name": "Central Library",
  "address": "123 Main St, City",
  "location": {
    "type": "Point",
    "coordinates": [77.2090, 28.6139]
  },
  "librarian": "John Smith"
}
```

### Payment Endpoints

#### Create Payment
```http
POST /payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "issueId": "issue_id_here",
  "amount": 50.00
}
```

#### Get User Payments
```http
GET /users/:userId/payments
Authorization: Bearer <token>
```

### Penalty Endpoints

#### Get User Penalties
```http
GET /users/:userId/penalties?status=PENDING
Authorization: Bearer <token>
```

#### Get Total Pending Fines
```http
GET /users/:userId/fines/total
Authorization: Bearer <token>
```

#### Pay Penalty
```http
PUT /penalties/:issueId/pay
Authorization: Bearer <token>
```

### Inventory Endpoints (Librarian/Admin)

#### Add Book Copies
```http
POST /inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "book_id",
  "branchId": "branch_id",
  "quantity": 5,
  "condition": "GOOD"
}
```

#### Get Branch Inventory
```http
GET /inventory/branch/:branchId
Authorization: Bearer <token>
```

## 🧪 Testing

The modular architecture supports easy unit testing. Example test structure:

```javascript
// Example: tests/services/authService.test.js
const authService = require('../../src/services/authService');

describe('Auth Service', () => {
  test('should register new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      // ...
    };
    const result = await authService.register(userData);
    expect(result).toHaveProperty('token');
  });
});
```

Run tests:
```bash
npm test
```

## 🔄 Automated Tasks

### Daily Penalty Processing
A cron job runs daily at 2:00 AM to:
1. Identify overdue books
2. Calculate fines based on overdue days
3. Update penalty records
4. Send notifications (to be implemented)

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt (10 salt rounds)
- Input validation with Joi
- Error handling middleware
- SQL injection prevention (parameterized queries)
- CORS enabled
- Security headers

## 📝 Key Business Logic

### Haversine Distance Validation
The system validates delivery eligibility using the Haversine formula:
- Calculates distance between user and library branch
- Rejects orders beyond configured radius (default: 8km)
- Location stored as GeoJSON Point in MongoDB

### Fine Calculation
```
overdue_days = max(0, current_date - due_date - grace_period)
fine_amount = overdue_days × late_fee_per_day
```

### Atomic Transactions
Book issuing uses MongoDB transactions to ensure:
- Book copy status update
- Issue record creation
- Delivery scheduling
All succeed or all fail together.

## 👥 Roles & Permissions

- **USER**: Browse books, issue/return, manage profiles
- **LIBRARIAN**: Manage inventory, view issue history
- **ADMIN**: Manage libraries, process penalties, full access

## 📞 Support

For issues or questions, contact the development team.

---

**Built by Guntesh** - Backend & Server Lead
**Project**: Design and Analysis of Software Systems (DASS)
**Date**: February 2026
