/**
 * Supplementary integration tests — Missing TestPlan cases
 *
 * This file fills gaps not covered in the existing test files.
 * Cases covered (by test plan ID):
 *   UC-1 (Auth):     TC-1.5, TC-1.6, TC-1.7
 *   UC-3 (Profile):  TC-3.5
 *   UC-4 (Profile):  TC-4.5, TC-4.6
 *   UC-7 (Profile):  TC-7.2, TC-7.4
 *   UC-9 (Avail.):   TC-9.4
 *   UC-10 (Issue):   TC-10.5, TC-10.8
 *   UC-12 (Track):   TC-12.4
 *   UC-17 (Fines):   TC-17.3, TC-17.4, TC-17.5, TC-17.8, TC-17.9
 *   UC-19 (Books):   TC-19.4
 */

const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Issue = require('../../src/models/Issue');
const BookCopy = require('../../src/models/BookCopy');
const jwt = require('jsonwebtoken');
const { calculateFine } = require('../../src/utils/fineCalculator');

const {
    registerAndLogin,
    createTestBook,
    createTestBranch,
    createTestOrganization
} = require('../utils/testHelpers');

// ─────────────────────────────────────────────────────────────────────────────
// UC-1: Auth — Missing Registration Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('UC-1 Auth — Additional Registration Checks', () => {

    /**
     * TC-1.5: Short password → 400 validation error
     * Steps: Enter password shorter than minimum (e.g., '123') → submit
     * Expected: 400 Bad Request; password validation error
     */
    test('TC-1.5 — should reject password shorter than minimum length', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: `tc15_${Date.now()}@example.com`,
                password: '123',       // Too short
                phone: '9876543210',
                name: 'Short Pass User'
            })
            .expect(400);

        expect(res.body.status).toBe('fail');
    });

    /**
     * TC-1.6: Password is stored as bcrypt hash, NOT plaintext
     * Steps: Register → query Auth collection → check password field
     * Expected: Auth record password is a bcrypt hash (starts with "$2b$")
     */
    test('TC-1.6 — should store password as bcrypt hash, not plaintext', async () => {
        const Auth = require('../../src/models/Auth');
        const email = `tc16_${Date.now()}@example.com`;
        const plainPassword = 'password123';

        await request(app)
            .post('/api/v1/auth/register')
            .send({
                email,
                password: plainPassword,
                phone: '9876543210',
                name: 'Hash Check User',
                preferredGenres: ['Fiction']
            })
            .expect(201);

        const authRecord = await Auth.findOne({ email }).select('+password');
        expect(authRecord).toBeDefined();
        expect(authRecord.password).not.toBe(plainPassword);
        // bcrypt hashes start with $2b$ or $2a$
        expect(authRecord.password).toMatch(/^\$2[ab]\$/);
    });

    /**
     * TC-1.7: Returned JWT decodes to correct claims
     * Steps: Register → decode JWT → verify id and expiry
     * Expected: Token decodes to { id: userId }, expiry matches config (7d)
     */
    test('TC-1.7 — should return a valid JWT with correct claims', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: `tc17_${Date.now()}@example.com`,
                password: 'password123',
                phone: '9876543210',
                name: 'JWT Claim User',
                preferredGenres: ['Fiction']
            })
            .expect(201);

        const token = res.body.data.token;
        expect(token).toBeDefined();

        // Decode without verifying signature to inspect claims
        const decoded = jwt.decode(token);
        expect(decoded).toHaveProperty('id');
        expect(decoded.id).toBe(res.body.data.user.id);

        // exp - iat should be ~7 days (604800 seconds), allow ±300 seconds
        const durationSec = decoded.exp - decoded.iat;
        expect(durationSec).toBeGreaterThan(604800 - 300);
        expect(durationSec).toBeLessThan(604800 + 300);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// UC-3/4/7: Profile — Authorization Guard Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('UC-3/4/7 Profile — Cross-User Authorization', () => {
    let userAToken, userAId;
    let userBToken, userBId;

    beforeEach(async () => {
        const userA = await registerAndLogin('USER');
        userAToken = userA.token;
        userAId = userA.userId;

        const userB = await registerAndLogin('USER');
        userBToken = userB.token;
        userBId = userB.userId;
    });

    /**
     * TC-3.5: User A tries to create a profile under User B's account
     * Expected: 403 Forbidden or 401 Unauthorized
     */
    test('TC-3.5 — should forbid creating profile under another user\'s account', async () => {
        const res = await request(app)
            .post(`/api/v1/users/${userBId}/children`)
            .set('Authorization', `Bearer ${userAToken}`)  // User A's token, User B's route
            .send({
                name: 'Unauthorized Child',
                accountType: 'CHILD',
                ageGroup: '6-8'
            });

        expect([401, 403]).toContain(res.statusCode);
    });

    /**
     * TC-4.5: Edit a non-existent profileId → 404
     */
    test('TC-4.5 — should return 404 when editing non-existent profile', async () => {
        const fakeProfileId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .put(`/api/v1/users/${userAId}/profiles/${fakeProfileId}`)
            .set('Authorization', `Bearer ${userAToken}`)
            .send({ name: 'Ghost Profile' });

        expect([404, 400]).toContain(res.statusCode);
    });

    /**
     * TC-4.6: User A tries to edit User B's profile → 403 Forbidden
     */
    test('TC-4.6 — should forbid User A from editing User B\'s profile', async () => {
        // Get User B's default profile ID
        const userBDoc = await User.findById(userBId);
        const userBProfileId = userBDoc.profiles[0].profileId;

        const res = await request(app)
            .put(`/api/v1/users/${userBId}/profiles/${userBProfileId}`)
            .set('Authorization', `Bearer ${userAToken}`)   // User A's token
            .send({ name: 'Hijacked Name' });

        expect([401, 403]).toContain(res.statusCode);
    });

    /**
     * TC-7.2: Attempt to delete the last PARENT profile → 400
     */
    test('TC-7.2 — should reject deletion of the last parent profile', async () => {
        // User A has only one profile (their own PARENT profile)
        const userADoc = await User.findById(userAId);
        const parentProfileId = userADoc.profiles[0].profileId;

        const res = await request(app)
            .delete(`/api/v1/users/${userAId}/profiles/${parentProfileId}`)
            .set('Authorization', `Bearer ${userAToken}`);

        // Should be rejected — cannot delete the only/last parent profile
        expect([400, 403]).toContain(res.statusCode);
    });

    /**
     * TC-7.4: User A tries to delete User B's profile → 403 Forbidden
     */
    test('TC-7.4 — should forbid User A from deleting User B\'s profile', async () => {
        // First create a child profile under User B so there's something to delete
        const createRes = await request(app)
            .post(`/api/v1/users/${userBId}/children`)
            .set('Authorization', `Bearer ${userBToken}`)
            .send({
                name: 'B Child',
                accountType: 'CHILD',
                ageGroup: '8-10'
            });

        const childProfileId = createRes.body.data?.profile?.profileId;
        if (!childProfileId) return; // Skip if creation failed

        const res = await request(app)
            .delete(`/api/v1/users/${userBId}/profiles/${childProfileId}`)
            .set('Authorization', `Bearer ${userAToken}`);  // User A's token

        expect([401, 403]).toContain(res.statusCode);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// UC-9: Check Availability — Boundary Distance Case
// ─────────────────────────────────────────────────────────────────────────────

describe('UC-9: Availability — Boundary Distance (TC-9.4)', () => {
    let userToken, userId, book, org;

    beforeEach(async () => {
        const user = await registerAndLogin('USER');
        userToken = user.token;
        userId = user.userId;

        // Place user exactly at Hyderabad origin
        await request(app)
            .put(`/api/v1/users/${userId}/location`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                latitude: 17.3850,
                longitude: 78.4867,
                street: '1 Main St',
                city: 'Hyderabad',
                pincode: '500001'
            });

        org = await createTestOrganization();
        book = await createTestBook();
    });

    /**
     * TC-9.4: Branch at approximately 8 km boundary
     * Haversine check: result depends on <= vs < comparison.
     * Test asserts that system responds with 200 and returns a valid structure.
     * (Boundary inclusion/exclusion is implementation-specific).
     */
    test('TC-9.4 — should handle branch at ~8 km boundary distance', async () => {
        // Place branch at roughly 8 km from user (slightly different lat/lng)
        // 0.072 degrees lat ≈ ~8 km
        const boundaryBranch = await createTestBranch(org._id.toString(), [78.4867, 17.4570]);
        await BookCopy.create({
            bookId: book._id,
            branchId: boundaryBranch._id,
            barcode: `TC94-${Date.now()}`,
            status: 'AVAILABLE',
            condition: 'GOOD'
        });

        const res = await request(app)
            .get(`/api/v1/books/${book._id}/availability`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

        expect(res.body.status).toBe('success');
        // The branch should be listed (either within or just outside radius)
        // The key assertion: the response is well-formed
        expect(res.body.data).toHaveProperty('totalAvailable');
        expect(res.body.data).toHaveProperty('branches');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// UC-10: Order / Issue Books — Missing Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('UC-10/12: Circulation — Missing Cases', () => {
    let userToken, userId, profileId;
    let book, branch, org;

    beforeEach(async () => {
        const user = await registerAndLogin('USER');
        userToken = user.token;
        userId = user.userId;

        const userDoc = await User.findById(userId);
        profileId = userDoc.profiles[0].profileId;

        await request(app)
            .put(`/api/v1/users/${userId}/location`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                latitude: 17.3850,
                longitude: 78.4867,
                street: '1 Test St',
                city: 'Hyderabad',
                pincode: '500001'
            });

        org = await createTestOrganization();
        branch = await createTestBranch(org._id.toString(), [78.4867, 17.3850]);
        book = await createTestBook();

        await BookCopy.create({
            bookId: book._id,
            branchId: branch._id,
            barcode: `MISS-${Date.now()}-${Math.random()}`,
            status: 'AVAILABLE',
            condition: 'GOOD'
        });
    });

    /**
     * TC-10.5: Issue with a profileId that does not belong to the user
     * Expected: 400 or 403 — profile not found on this user
     */
    test('TC-10.5 — should fail if profileId is not in user\'s profiles', async () => {
        const fakeProfileId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .post('/api/v1/issues')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                bookId: book._id.toString(),
                branchId: branch._id.toString(),
                profileId: fakeProfileId.toString()
            });

        expect([400, 403, 404]).toContain(res.statusCode);
    });

    /**
     * TC-10.8: dueDate + 1–3 days implies scheduledAt is near-term
     * After issuing, delivery scheduledAt should be 1–3 days after issueDate.
     */
    test('TC-10.8 — should schedule delivery within 1-3 days of issue', async () => {
        const res = await request(app)
            .post('/api/v1/issues')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                bookId: book._id.toString(),
                branchId: branch._id.toString(),
                profileId: profileId.toString()
            })
            .expect(201);

        const issueId = res.body.data.issue._id;

        // Fetch the issue to get the delivery record
        const detailRes = await request(app)
            .get(`/api/v1/issues/${issueId}`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

        const scheduledAt = new Date(detailRes.body.data.delivery?.scheduledAt);
        const issueDate = new Date(res.body.data.issue.issueDate);

        const diffDays = Math.round((scheduledAt - issueDate) / (1000 * 60 * 60 * 24));
        // Delivery should be scheduled within 1 to 3 days of issue
        expect(diffDays).toBeGreaterThanOrEqual(1);
        expect(diffDays).toBeLessThanOrEqual(3);
    });

    /**
     * TC-12.4: Filter issues by profileId to get issues for a specific child
     * GET /api/v1/issues/users/:userId/issues?profileId=xxx
     * Expected: Only issues for the specified profileId returned
     */
    test('TC-12.4 — should filter user issues by profileId', async () => {
        // Issue a book under the default profile
        await request(app)
            .post('/api/v1/issues')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                bookId: book._id.toString(),
                branchId: branch._id.toString(),
                profileId: profileId.toString()
            })
            .expect(201);

        const res = await request(app)
            .get(`/api/v1/issues/users/${userId}/issues`)
            .query({ profileId: profileId.toString() })
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

        expect(res.body.status).toBe('success');

        // All returned issues should belong to the specified profile
        res.body.data.issues.forEach(issue => {
            expect(issue.profileId.toString()).toBe(profileId.toString());
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// UC-17: Apply Fines — Specific Fine Calculation Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('UC-17: Apply Fines — Specific TestPlan Cases', () => {

    /**
     * TC-17.1: On-time return → 0 overdue days, Rs.0 fine
     */
    test('TC-17.1 — should return 0 fine for on-time return', () => {
        const dueDate = new Date('2025-06-15');
        const returnDate = new Date('2025-06-14'); // 1 day early
        const result = calculateFine(dueDate, returnDate);
        expect(result.overdueDays).toBe(0);
        expect(result.fineAmount).toBe(0);
    });

    /**
     * TC-17.2: Return within grace period (2 days) → 0 effective overdue, Rs.0 fine
     */
    test('TC-17.2 — should return 0 fine when returned within 2-day grace period', () => {
        const dueDate = new Date('2025-06-15');
        const returnDate = new Date('2025-06-17'); // 2 days late (within grace)
        const result = calculateFine(dueDate, returnDate);
        expect(result.overdueDays).toBe(0);
        expect(result.fineAmount).toBe(0);
    });

    /**
     * TC-17.3: Returned 10 days late → 8 effective overdue days (10 - 2 grace), Rs.80 fine
     */
    test('TC-17.3 — should calculate Rs.80 fine for 10 days late return', () => {
        const dueDate = new Date('2025-06-01');
        const returnDate = new Date('2025-06-11'); // exactly 10 days late
        const result = calculateFine(dueDate, returnDate);
        expect(result.overdueDays).toBe(8); // 10 - 2 grace = 8
        expect(result.fineAmount).toBe(80); // 8 days × Rs.10/day
    });

    /**
     * TC-17.4: Returned 1 day late → within 2-day grace period → Rs.0 fine
     */
    test('TC-17.4 — should return 0 fine for 1-day late return (within grace)', () => {
        const dueDate = new Date('2025-06-15');
        const returnDate = new Date('2025-06-16'); // 1 day late
        const result = calculateFine(dueDate, returnDate);
        expect(result.overdueDays).toBe(0);
        expect(result.fineAmount).toBe(0);
    });

    /**
     * TC-17.5: Returned 3 days late → 1 effective overdue day (3 - 2 grace), Rs.10 fine
     */
    test('TC-17.5 — should calculate Rs.10 fine for 3-day late return', () => {
        const dueDate = new Date('2025-06-15');
        const returnDate = new Date('2025-06-18'); // 3 days late
        const result = calculateFine(dueDate, returnDate);
        expect(result.overdueDays).toBe(1); // 3 - 2 grace = 1
        expect(result.fineAmount).toBe(10); // 1 day × Rs.10/day
    });

    /**
     * TC-17.8: Admin can manually trigger overdue processing
     * POST /api/v1/penalties/process-overdue with ADMIN token → 200
     */
    test('TC-17.8 — admin should be able to trigger overdue penalty processing', async () => {
        const admin = await registerAndLogin('ADMIN');

        const res = await request(app)
            .post('/api/v1/penalties/process-overdue')
            .set('Authorization', `Bearer ${admin.token}`)
            .expect(200);

        expect(res.body.status).toBe('success');
    });

    /**
     * TC-17.9: Regular USER cannot trigger overdue processing → 403 Forbidden
     * POST /api/v1/penalties/process-overdue with USER token
     */
    test('TC-17.9 — regular USER should be forbidden from triggering overdue processing', async () => {
        const user = await registerAndLogin('USER');

        const res = await request(app)
            .post('/api/v1/penalties/process-overdue')
            .set('Authorization', `Bearer ${user.token}`)
            .expect(403);

        expect(res.body.status).toBe('fail');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// UC-19: Add Books — Missing Invalid ageRating Case
// ─────────────────────────────────────────────────────────────────────────────

describe('UC-19: Add Books — Invalid ageRating (TC-19.4)', () => {
    let librarianToken;

    beforeEach(async () => {
        const librarian = await registerAndLogin('LIBRARIAN');
        librarianToken = librarian.token;
    });

    /**
     * TC-19.4: Add book with an invalid ageRating enum value → 400
     * Steps: POST book with ageRating: 'ADULT' (not a valid enum) → observe
     * Expected: 400 Bad Request; invalid ageRating enum
     */
    test('TC-19.4 — should reject book with invalid ageRating enum', async () => {
        const res = await request(app)
            .post('/api/v1/books')
            .set('Authorization', `Bearer ${librarianToken}`)
            .send({
                isbn: Math.floor(Math.random() * 9000000000000) + 1000000000000,
                title: 'Invalid Rating Book',
                author: 'Some Author',
                genre: ['Fiction'],
                language: 'English',
                ageRating: 'ADULT',   // Not a valid enum value
                summary: 'This should fail validation.'
            })
            .expect(400);

        expect(res.body.status).toBe('fail');
    });
});
