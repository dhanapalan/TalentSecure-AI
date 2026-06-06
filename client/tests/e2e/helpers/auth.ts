import { APIRequestContext, expect, Page } from '@playwright/test';
import { USERS } from './test-data';

const API_BASE = process.env.API_URL || 'http://localhost:5050/api';
const AUTH_RETRY_ATTEMPTS = 3;
const AUTH_REQUEST_TIMEOUT_MS = 15000;
const AUTH_RETRY_DELAY_MS = 1000;

type AuthSession = { token: string; user: unknown };
type Role = 'admin' | 'campusAdmin' | 'student';

const CREDENTIALS: Record<Role, { email: string; password: string }> = {
    admin:       { email: USERS.admin.email,       password: USERS.admin.password },
    campusAdmin: { email: USERS.campusAdmin.email, password: USERS.campusAdmin.password },
    student:     { email: USERS.student.email,     password: USERS.student.password },
};

const fetchSession = async (request: APIRequestContext, role: Role): Promise<AuthSession> => {
    let lastError = 'Unknown auth failure';
    const creds = CREDENTIALS[role];

    for (let attempt = 1; attempt <= AUTH_RETRY_ATTEMPTS; attempt++) {
        try {
            const response = await request.post(`${API_BASE}/auth/login`, {
                data: creds,
                timeout: AUTH_REQUEST_TIMEOUT_MS,
            });
            const bodyText = await response.text();

            if (!response.ok()) {
                lastError = `${role} login failed (${response.status()}): ${bodyText.slice(0, 250)}`;
            } else {
                let body: any;
                try { body = JSON.parse(bodyText); } catch { body = null; }
                if (body?.data?.accessToken && body?.data?.user) {
                    return { token: body.data.accessToken, user: body.data.user };
                }
                lastError = `${role} login response missing auth payload: ${bodyText.slice(0, 250)}`;
            }
        } catch (error: any) {
            lastError = error?.message || String(error);
        }

        if (attempt < AUTH_RETRY_ATTEMPTS) {
            await new Promise((r) => setTimeout(r, AUTH_RETRY_DELAY_MS * attempt));
        }
    }

    expect(false, lastError).toBeTruthy();
    return { token: '', user: null };
};

// Inject real session from live API
export const injectAdminAuth = async (page: Page, request: APIRequestContext) => {
    const { token, user } = await fetchSession(request, 'admin');
    await page.context().addInitScript(({ authToken, authUser }) => {
        localStorage.setItem('accessToken', authToken);
        localStorage.setItem('user', JSON.stringify(authUser));
    }, { authToken: token, authUser: user });
};

export const injectCampusAdminAuth = async (page: Page, request: APIRequestContext) => {
    const { token, user } = await fetchSession(request, 'campusAdmin');
    await page.context().addInitScript(({ authToken, authUser }) => {
        localStorage.setItem('accessToken', authToken);
        localStorage.setItem('user', JSON.stringify(authUser));
    }, { authToken: token, authUser: user });
};

export const injectStudentAuth = async (page: Page, request: APIRequestContext) => {
    const { token, user } = await fetchSession(request, 'student');
    await page.context().addInitScript(({ authToken, authUser }) => {
        localStorage.setItem('accessToken', authToken);
        localStorage.setItem('user', JSON.stringify(authUser));
    }, { authToken: token, authUser: user });
};

// Inject mock session without hitting API (use when API is unavailable)
export const injectMockAuth = async (page: Page, role: Role) => {
    const user = role === 'admin' ? USERS.admin : role === 'campusAdmin' ? USERS.campusAdmin : USERS.student;
    await page.context().addInitScript(({ authToken, authUser }) => {
        localStorage.setItem('accessToken', authToken);
        localStorage.setItem('user', JSON.stringify(authUser));
    }, { authToken: `mock-token-${role}`, authUser: user });
};
