# Hyper Local Cloud Library - Backend

Node.js + Express backend for authentication, user/profile management, catalog browsing, circulation, delivery, penalties, and payments.

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose (primary data)
- MySQL (payments/penalties)
- JWT auth + role-based middleware
- Joi request validation
- Jest + Supertest test suite

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` in `src/backend/` (example below).
3. Start server:
   ```bash
   npm start
   ```

Server runs on `http://localhost:5000` by default.

## Scripts
- `npm start` - start server
- `npm run dev` - start with nodemon
- `npm test` - run tests with coverage
- `npm run test:watch` - watch mode
- `npm run seed` - seed sample data

## Environment Variables (Common)
```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/hyper-local-library
MONGODB_TEST_URI=mongodb://localhost:27017/hyper-local-library-test

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=library_transactions

JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=7d

DELIVERY_RADIUS_KM=8
LATE_FEE_PER_DAY=10
GRACE_PERIOD_DAYS=2
DEFAULT_BORROW_PERIOD_DAYS=14

AI_API_URL=http://localhost:8000/recommend
EXTRA_API_KEYS_OPTIONAL=true
```

For the full config surface, see `src/config/index.js`.

## Key API Groups
- `/api/v1/auth` - register/login/me/change-password
- `/api/v1/users` - user data, child profiles, reading history, locations
- `/api/v1/books` - browse/search/book details/availability
- `/api/v1/issues` - issue, return, status/history
- `/api/v1/libraries` - branches and nearby discovery
- `/api/v1/inventory` - copy-level inventory operations
- `/api/v1/payments`, `/api/v1/penalties` - financial flows

## Recent Backend Updates
- Added ownership guard middleware `verifyUserOwnership` for user-scoped routes.
- Improved `Book` model pre-validation to keep `ageRating` and `minAge` in sync.
- Added bounded retry handling for transient Mongo transaction conflicts in `issueBook`.
- On return flow, reading history is now updated from the returned issue’s resolved `bookId`.

## Testing
```bash
npm test
```

Integration tests live under `tests/integration`, utility tests under `tests/utils`.
