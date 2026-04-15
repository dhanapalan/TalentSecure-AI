import { APIRequestContext, expect, Page } from '@playwright/test';

const API_BASE = process.env.API_URL || 'http://localhost:5050/api';
const AUTH_RETRY_ATTEMPTS = 3;
const AUTH_REQUEST_TIMEOUT_MS = 15000;
const AUTH_RETRY_DELAY_MS = 1000;

type AuthSession = {
    token: string;
    user: unknown;
};

const fetchAdminSession = async (request: APIRequestContext): Promise<AuthSession> => {
    let lastError = 'Unknown auth failure';

    for (let attempt = 1; attempt <= AUTH_RETRY_ATTEMPTS; attempt++) {
        try {
            const response = await request.post(`${API_BASE}/auth/login`, {
                data: { email: 'admin@gradlogic.com', password: 'admin123' },
                timeout: AUTH_REQUEST_TIMEOUT_MS,
            });

            const bodyText = await response.text();

            if (!response.ok()) {
                lastError = `Admin login failed (${response.status()}): ${bodyText.slice(0, 250)}`;
            } else {
                let body: any;
                try {
                    body = JSON.parse(bodyText);
                } catch {
                    body = null;
                }

                if (body?.data?.accessToken && body?.data?.user) {
                    return { token: body.data.accessToken, user: body.data.user };
                }

                lastError = `Admin login response missing expected auth payload: ${bodyText.slice(0, 250)}`;
            }
        } catch (error: any) {
            lastError = error?.message || String(error);
        }

        if (attempt < AUTH_RETRY_ATTEMPTS) {
            await new Promise((resolve) => setTimeout(resolve, AUTH_RETRY_DELAY_MS * attempt));
        }
    }

    expect(false, lastError).toBeTruthy();
    return { token: '', user: null };
};

export const injectAdminAuth = async (page: Page, request: APIRequestContext): Promise<void> => {
    const { token, user } = await fetchAdminSession(request);
    await page.context().addInitScript(({ authToken, authUser }) => {
        localStorage.setItem('accessToken', authToken);
        localStorage.setItem('user', JSON.stringify(authUser));
    }, { authToken: token, authUser: user });
};
