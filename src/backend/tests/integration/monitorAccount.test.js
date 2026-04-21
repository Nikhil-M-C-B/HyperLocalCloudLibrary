/**
 * Integration tests for UC-18: Monitor Account (Reading History)
 * Based on TestPlan.xls — TC-18.1 through TC-18.3
 *
 * Tests the GET /:userId/profiles/:profileId/history endpoint which
 * returns the reading history for a specific profile.
 */

const request = require('supertest');
const app = require('../../src/app');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Issue = require('../../src/models/Issue');
const BookCopy = require('../../src/models/BookCopy');

const {
    registerAndLogin,
    createTestBook,
    createTestBranch,
    createTestOrganization
} = require('../utils/testHelpers');

describe('UC-18: Monitor Account (Reading History)', () => {
    let userToken, userId, profileId;
    let book, branch, org;

    beforeEach(async () => {
        const user = await registerAndLogin('USER');
        userToken = user.token;
        userId = user.userId;

        const userDoc = await User.findById(userId);
        profileId = userDoc.profiles[0].profileId;

        org = await createTestOrganization();
        branch = await createTestBranch(org._id.toString());
        book = await createTestBook();
    });

    /**
     * TC-18.1: Child profile has reading history
     * GET /:userId/profiles/:profileId/history
     * Expected: 200 OK; list of books read with dates
     */
    test('TC-18.1 — should return reading history for a profile with activity', async () => {
        // Seed a RETURNED issue to represent a read book
        const copy = await BookCopy.create({
            bookId: book._id,
            branchId: branch._id,
            barcode: `TC181-${Date.now()}`,
            status: 'AVAILABLE',
            condition: 'GOOD'
        });

        await Issue.create({
            userId,
            copyId: copy._id,
            profileId,
            issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            returnDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            status: 'RETURNED'
        });

        const res = await request(app)
            .get(`/api/v1/users/${userId}/profiles/${profileId}/history`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

        expect(res.body.status).toBe('success');
        expect(Array.isArray(res.body.data.history)).toBe(true);
        expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
    });

    /**
     * TC-18.2: Child profile has no reading activity
     * GET /:userId/profiles/:profileId/history
     * Expected: 200 OK; empty array
     */
    test('TC-18.2 — should return empty array for profile with no reading history', async () => {
        // Create a fresh child profile with no issues
        const createRes = await request(app)
            .post(`/api/v1/users/${userId}/children`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                name: 'Fresh Child',
                accountType: 'CHILD',
                ageGroup: '6-8'
            });

        const childProfileId = createRes.body.data.profile.profileId;

        const res = await request(app)
            .get(`/api/v1/users/${userId}/profiles/${childProfileId}/history`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

        expect(res.body.status).toBe('success');
        // Should return empty or have zero items for the new child profile
        expect(Array.isArray(res.body.data.history)).toBe(true);
        expect(res.body.data.history.length).toBe(0);
    });

    /**
     * TC-18.3: Profile does not exist → 404
     * GET /:userId/profiles/:profileId/history
     * Expected: 404 Not Found
     */
    test('TC-18.3 — should return 404 for non-existent profileId', async () => {
        const fakeProfileId = new mongoose.Types.ObjectId();

        const res = await request(app)
            .get(`/api/v1/users/${userId}/profiles/${fakeProfileId}/history`)
            .set('Authorization', `Bearer ${userToken}`);

        expect([404, 400]).toContain(res.statusCode);
    });
});
