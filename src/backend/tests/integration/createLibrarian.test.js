/**
 * Integration tests for UC-23: Create Librarian
 * Based on TestPlan.xls — TC-23.1 through TC-23.3
 *
 * Librarian accounts are created by admins using the standard registration
 * endpoint (POST /api/v1/auth/register) with role: 'LIBRARIAN'.
 */

const request = require('supertest');
const app = require('../../src/app');

const { registerAndLogin } = require('../utils/testHelpers');

describe('UC-23: Create Librarian', () => {
    let adminToken, userToken;

    beforeEach(async () => {
        const admin = await registerAndLogin('ADMIN');
        adminToken = admin.token;

        const user = await registerAndLogin('USER');
        userToken = user.token;
    });

    /**
     * TC-23.1: Admin can register a new librarian
     * POST /api/v1/auth/register with role: LIBRARIAN
     * Expected: 201 Created; user with LIBRARIAN role in system
     */
    test('TC-23.1 — should register a new librarian successfully', async () => {
        const unique = Date.now();
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: `librarian_${unique}@library.com`,
                password: 'libpass123',
                phone: '9000000001',
                name: 'Test Librarian',
                role: 'LIBRARIAN',
                preferredGenres: []
            })
            .expect(201);

        expect(res.body.status).toBe('success');
        expect(res.body.data).toHaveProperty('token');
        // User object should report LIBRARIAN role
        expect(res.body.data.user.role).toBe('LIBRARIAN');
    });

    /**
     * TC-23.2: Duplicate email → 400 'already registered'
     * POST /api/v1/auth/register with an email that already exists
     * Expected: 400 Bad Request; already registered
     */
    test('TC-23.2 — should reject duplicate librarian email', async () => {
        const sharedEmail = `dup_librarian_${Date.now()}@library.com`;

        // Register first time
        await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: sharedEmail,
                password: 'libpass123',
                phone: '9000000002',
                name: 'Librarian One',
                role: 'LIBRARIAN'
            });

        // Try again with the same email
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: sharedEmail,
                password: 'libpass456',
                phone: '9000000003',
                name: 'Librarian Two',
                role: 'LIBRARIAN'
            })
            .expect(400);

        expect(res.body.status).toBe('fail');
        expect(res.body.message).toContain('already registered');
    });

    /**
     * TC-23.3: Regular USER cannot create librarian via a librarian-only endpoint
     * A USER role should not be able to access librarian-protected routes.
     * Expected: 403 Forbidden when accessing a LIBRARIAN-only resource
     */
    test('TC-23.3 — should forbid USER from accessing librarian endpoints', async () => {
        // POST /api/v1/inventory is LIBRARIAN/ADMIN only — tests RBAC guard
        const res = await request(app)
            .post('/api/v1/inventory')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                bookId: '000000000000000000000001',
                branchId: '000000000000000000000001',
                quantity: 1,
                condition: 'GOOD'
            })
            .expect(403);

        expect(res.body.status).toBe('fail');
    });
});
