import { test, expect } from '@playwright/test';

/**
 * Campus CRUD — API-Level Tests (no browser)
 *
 * Uses Playwright's built-in `request` context to hit the real backend
 * endpoints directly. This tests the API layer + DB without any UI.
 *
 * Prerequisites:
 *  - Backend API is running at http://localhost:5050
 *  - Admin user `admin@gradlogic.com` / `admin123` exists
 */

const API_BASE = process.env.API_URL || 'http://localhost:5050/api';

const TS = Date.now();
const CAMPUS_NAME = `API Test Campus ${TS}`;
const CAMPUS_CITY = 'API City';
const CAMPUS_STATE = 'API State';
const ADMIN_NAME = `API Admin ${TS}`;
const ADMIN_EMAIL = `api.admin.${TS}@testcampus.com`;
const ADMIN_PASSWORD = 'Test@123';

const UPDATED_NAME = `API Updated Campus ${TS}`;
const UPDATED_CITY = 'Updated API City';

// ── Helper: get JWT token via real login ────────────────────────────────────────

async function getAuthToken(request: typeof test extends (name: string, fn: (args: infer T) => void) => void ? T['request'] : any): Promise<string> {
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
        data: {
            email: 'admin@gradlogic.com',
            password: 'admin123',
        },
    });

    expect(loginRes.ok(), `Login failed: ${loginRes.status()}`).toBeTruthy();
    const body = await loginRes.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeTruthy();
    return body.data.accessToken;
}

// ── Test Suite ──────────────────────────────────────────────────────────────────

test.describe.serial('Campus CRUD — API Tests', () => {
    let token: string;
    let campusId: string;

    // Authenticate once before all tests
    test('AUTH - should login and get JWT token', async ({ request }) => {
        token = await getAuthToken(request);
        console.log(`✓ Authenticated — token starts with: ${token.substring(0, 20)}...`);
    });

    // ─── 1. CREATE ───────────────────────────────────────────────────────────────

    test('C - POST /api/campuses — should create a new campus', async ({ request }) => {
        const res = await request.post(`${API_BASE}/campuses`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                name: CAMPUS_NAME,
                city: CAMPUS_CITY,
                state: CAMPUS_STATE,
                tier: 'Tier 1',
                adminName: ADMIN_NAME,
                adminEmail: ADMIN_EMAIL,
                adminPassword: ADMIN_PASSWORD,
            },
        });

        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data).toBeTruthy();
        expect(body.data.id).toBeTruthy();
        expect(body.data.name).toBe(CAMPUS_NAME);
        expect(body.data.city).toBe(CAMPUS_CITY);
        expect(body.data.state).toBe(CAMPUS_STATE);
        expect(body.data.is_active).toBe(true);
        expect(body.data.college_code).toBeTruthy();

        campusId = body.data.id;
        console.log(`✓ Created campus: ${campusId} (code: ${body.data.college_code})`);
    });

    test('C - POST /api/campuses — should reject duplicate admin email', async ({ request }) => {
        const res = await request.post(`${API_BASE}/campuses`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                name: `Duplicate Test ${TS}`,
                city: 'Dup City',
                state: 'Dup State',
                adminName: 'Dup Admin',
                adminEmail: ADMIN_EMAIL,      // Same email as above
                adminPassword: 'Test@123',
            },
        });

        expect(res.status()).toBe(409);
        const body = await res.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('email already in use');
        console.log(`✓ Duplicate email correctly rejected`);
    });

    test('C - POST /api/campuses — should reject missing required fields', async ({ request }) => {
        const res = await request.post(`${API_BASE}/campuses`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                name: '',       // empty
                city: '',       // empty
                state: '',      // empty
                adminName: '',
                adminEmail: '',
                adminPassword: '',
            },
        });

        // Should fail validation (400 or 422)
        expect(res.ok()).toBe(false);
        const body = await res.json();
        expect(body.success).toBe(false);
        console.log(`✓ Validation error: ${body.error || JSON.stringify(body.errors || body.message)}`);
    });

    // ─── 2. READ ─────────────────────────────────────────────────────────────────

    test('R - GET /api/campuses — should return list including new campus', async ({ request }) => {
        const res = await request.get(`${API_BASE}/campuses`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThan(0);

        // Find our campus in the list
        const ourCampus = body.data.find((c: any) => c.id === campusId);
        expect(ourCampus).toBeTruthy();
        expect(ourCampus.name).toBe(CAMPUS_NAME);
        expect(ourCampus.is_active).toBe(true);
        expect(ourCampus.student_count).toBeDefined();
        expect(ourCampus.admin_count).toBeGreaterThanOrEqual(1);

        console.log(`✓ List returned ${body.data.length} campuses, found ours with ${ourCampus.admin_count} admin(s)`);
    });

    test('R - GET /api/campuses/:id — should return campus detail (deep view)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/campuses/${campusId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);

        const campus = body.data;
        expect(campus.id).toBe(campusId);
        expect(campus.name).toBe(CAMPUS_NAME);
        expect(campus.city).toBe(CAMPUS_CITY);
        expect(campus.state).toBe(CAMPUS_STATE);
        expect(campus.college_code).toBeTruthy();
        expect(campus.is_active).toBe(true);

        // Should include admins array
        expect(Array.isArray(campus.admins)).toBe(true);
        expect(campus.admins.length).toBeGreaterThanOrEqual(1);
        expect(campus.admins[0].email).toBe(ADMIN_EMAIL);

        // Should include stats
        expect(campus.stats).toBeTruthy();
        expect(campus.stats.student_count).toBeDefined();

        console.log(`✓ Deep view: ${campus.name}, ${campus.admins.length} admin(s), code: ${campus.college_code}`);
    });

    test('R - GET /api/campuses/:id — should return 404 for non-existent campus', async ({ request }) => {
        const res = await request.get(`${API_BASE}/campuses/00000000-0000-0000-0000-000000000000`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        expect(res.status()).toBe(404);
        const body = await res.json();
        expect(body.success).toBe(false);
        console.log(`✓ 404 for non-existent campus`);
    });

    // ─── 3. UPDATE ───────────────────────────────────────────────────────────────

    test('U - PUT /api/campuses/:id — should update campus name and city', async ({ request }) => {
        const res = await request.put(`${API_BASE}/campuses/${campusId}`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                name: UPDATED_NAME,
                city: UPDATED_CITY,
                state: CAMPUS_STATE,
            },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.name).toBe(UPDATED_NAME);
        expect(body.data.city).toBe(UPDATED_CITY);

        console.log(`✓ Updated campus name to: ${body.data.name}`);
    });

    test('U - PUT /api/campuses/:id — should verify update persisted', async ({ request }) => {
        const res = await request.get(`${API_BASE}/campuses/${campusId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.data.name).toBe(UPDATED_NAME);
        expect(body.data.city).toBe(UPDATED_CITY);
        console.log(`✓ Verified update persisted on re-fetch`);
    });

    test('U - PUT /api/campuses/:id — should update eligibility flags', async ({ request }) => {
        const res = await request.put(`${API_BASE}/campuses/${campusId}`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                name: UPDATED_NAME,
                city: UPDATED_CITY,
                state: CAMPUS_STATE,
                eligible_for_hiring: true,
                eligible_for_tier1: true,
            },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.eligible_for_hiring).toBe(true);
        expect(body.data.eligible_for_tier1).toBe(true);

        console.log(`✓ Eligibility flags updated: hiring=${body.data.eligible_for_hiring}, tier1=${body.data.eligible_for_tier1}`);
    });

    test('U - PUT /api/campuses/:id — should return 404 for non-existent campus', async ({ request }) => {
        const res = await request.put(`${API_BASE}/campuses/00000000-0000-0000-0000-000000000000`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                name: 'Ghost',
                city: 'Nowhere',
                state: 'NA',
            },
        });

        expect(res.status()).toBe(404);
        console.log(`✓ 404 for updating non-existent campus`);
    });

    // ─── 4. ADD ADMIN ────────────────────────────────────────────────────────────

    test('U - POST /api/campuses/:id/admins — should add a second admin', async ({ request }) => {
        const secondAdminEmail = `api.admin2.${TS}@testcampus.com`;
        const res = await request.post(`${API_BASE}/campuses/${campusId}/admins`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                name: `Second Admin ${TS}`,
                email: secondAdminEmail,
                password: 'Temp@12345',
            },
        });

        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.email).toBe(secondAdminEmail);
        expect(body.data.role).toBe('college_admin');

        console.log(`✓ Second admin added: ${secondAdminEmail}`);
    });

    // ─── 5. DELETE (Soft Delete) — Toggle active status ──────────────────────────

    test('D - DELETE /api/campuses/:id — should deactivate (soft-delete) the campus', async ({ request }) => {
        const res = await request.delete(`${API_BASE}/campuses/${campusId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.is_active).toBe(false);
        expect(body.message).toContain('deactivated');

        console.log(`✓ Campus deactivated (soft-deleted)`);
    });

    test('D - GET /api/campuses/:id — should confirm campus is_active = false', async ({ request }) => {
        const res = await request.get(`${API_BASE}/campuses/${campusId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.data.is_active).toBe(false);

        console.log(`✓ Confirmed: campus is_active = ${body.data.is_active}`);
    });

    test('D - DELETE /api/campuses/:id — should re-activate the campus (toggle back)', async ({ request }) => {
        const res = await request.delete(`${API_BASE}/campuses/${campusId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.is_active).toBe(true);
        expect(body.message).toContain('activated');

        console.log(`✓ Campus re-activated`);
    });

    // ─── 6. BULK ACTIONS ─────────────────────────────────────────────────────────

    test('D - POST /api/campuses/bulk-action — should bulk suspend', async ({ request }) => {
        const res = await request.post(`${API_BASE}/campuses/bulk-action`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                action: 'suspend',
                campusIds: [campusId],
            },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.count).toBe(1);

        console.log(`✓ Bulk suspend completed`);
    });

    test('D - GET — should confirm campus is suspended', async ({ request }) => {
        const res = await request.get(`${API_BASE}/campuses/${campusId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.data.is_suspended).toBe(true);

        console.log(`✓ Confirmed: campus is_suspended = ${body.data.is_suspended}`);
    });

    test('D - POST /api/campuses/bulk-action — should bulk activate', async ({ request }) => {
        const res = await request.post(`${API_BASE}/campuses/bulk-action`, {
            headers: { Authorization: `Bearer ${token}` },
            data: {
                action: 'activate',
                campusIds: [campusId],
            },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);

        console.log(`✓ Bulk activate completed`);
    });

    test('D - GET — should confirm campus is active and not suspended', async ({ request }) => {
        const res = await request.get(`${API_BASE}/campuses/${campusId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.data.is_active).toBe(true);
        expect(body.data.is_suspended).toBe(false);

        console.log(`✓ Final state: is_active=${body.data.is_active}, is_suspended=${body.data.is_suspended}`);
    });

    // ─── 7. AUTH GUARD TESTS ─────────────────────────────────────────────────────

    test('AUTH - GET /api/campuses — should reject unauthenticated requests', async ({ request }) => {
        const res = await request.get(`${API_BASE}/campuses`);
        expect(res.status()).toBe(401);
        console.log(`✓ 401 for unauthenticated request`);
    });

    test('AUTH - POST /api/campuses — should reject with invalid token', async ({ request }) => {
        const res = await request.post(`${API_BASE}/campuses`, {
            headers: { Authorization: 'Bearer invalid-token-here' },
            data: {
                name: 'Should Fail',
                city: 'Nope',
                state: 'NA',
                adminName: 'Nobody',
                adminEmail: 'nobody@fail.com',
                adminPassword: 'fail123',
            },
        });

        expect(res.ok()).toBe(false);
        expect([401, 403]).toContain(res.status());
        console.log(`✓ ${res.status()} for invalid token`);
    });
});
