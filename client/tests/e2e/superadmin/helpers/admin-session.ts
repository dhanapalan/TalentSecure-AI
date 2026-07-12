// =============================================================================
// SuperAdmin QA Automation Suite — Authentication / Session helpers
// -----------------------------------------------------------------------------
// The portal stores its session in **sessionStorage** (keys accessToken /
// refreshToken / user / permissions) and derives `isAuthenticated` at store
// init from `sessionStorage.accessToken`. `super_admin` bypasses every
// PermissionGuard, so a valid injected session is enough to reach any page.
//
// We authenticate once against the real API, then seed sessionStorage via an
// init script that runs before the app bundle boots on every navigation.
// =============================================================================

import { APIRequestContext, Page, expect, request as pwRequest, test as base } from '@playwright/test';
import { API_URL, ADMIN, NON_ADMIN } from './admin-config';

export interface AdminSession {
  accessToken: string;
  refreshToken?: string;
  user: Record<string, unknown>;
  permissions: string[];
}

const LOGIN_TIMEOUT_MS = 15_000;
const LOGIN_RETRIES = 3;

/** POST /auth/login and normalise the `{ data: {...} }` envelope. */
export async function loginViaApi(
  request: APIRequestContext,
  creds: { email: string; password: string }
): Promise<AdminSession> {
  let lastError = 'unknown login failure';

  for (let attempt = 1; attempt <= LOGIN_RETRIES; attempt++) {
    try {
      const res = await request.post(`${API_URL}/auth/login`, {
        data: { email: creds.email, password: creds.password },
        timeout: LOGIN_TIMEOUT_MS,
      });
      const text = await res.text();

      if (res.status() === 429) {
        // Login is rate-limited (10 req/15min/IP). Retrying immediately only
        // burns more of the same budget — fail fast so the suite's own
        // per-worker session cache (not blind retry) is what absorbs load.
        lastError = `login ${creds.email} → HTTP 429: rate limited, not retrying`;
        break;
      }

      if (!res.ok()) {
        lastError = `login ${creds.email} → HTTP ${res.status()}: ${text.slice(0, 200)}`;
      } else {
        const body = JSON.parse(text);
        const d = body?.data ?? body;
        if (d?.requires2FA) {
          throw new Error(`login ${creds.email} requires 2FA — disable 2FA on the QA account or use a non-2FA user`);
        }
        if (d?.accessToken && d?.user) {
          return {
            accessToken: d.accessToken,
            refreshToken: d.refreshToken,
            user: d.user,
            permissions: Array.isArray(d.permissions) ? d.permissions : [],
          };
        }
        lastError = `login ${creds.email} returned no accessToken/user: ${text.slice(0, 200)}`;
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
      if (/requires 2FA/.test(lastError)) break;
    }
    if (attempt < LOGIN_RETRIES) await new Promise((r) => setTimeout(r, 800 * attempt));
  }

  // Fail loudly with a QA-actionable message rather than a cryptic timeout.
  expect(false, `Auth failed. Check BASE_URL/API_URL and credentials. Last error: ${lastError}`).toBeTruthy();
  throw new Error(lastError);
}

/** Seed sessionStorage so the SPA boots already authenticated. */
export async function injectSession(page: Page, session: AdminSession): Promise<void> {
  await page.addInitScript((s) => {
    try {
      sessionStorage.setItem('accessToken', s.accessToken);
      if (s.refreshToken) sessionStorage.setItem('refreshToken', s.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(s.user));
      sessionStorage.setItem('permissions', JSON.stringify(s.permissions));
    } catch {
      /* storage may be unavailable before first navigation — ignored */
    }
  }, session as any);
}

// The login endpoint is rate-limited (10 req/15min/IP). authenticateAsAdmin/
// authenticateAsNonAdmin are used purely for TEST SETUP across many spec
// files (not to exercise login mechanics itself), so cache the session per
// worker process and reuse it — one real network login per credential per
// worker for the whole suite, instead of one per test.
const setupSessionCache = new Map<string, AdminSession>();

export async function cachedLogin(
  request: APIRequestContext,
  creds: { email: string; password: string }
): Promise<AdminSession> {
  const cached = setupSessionCache.get(creds.email);
  if (cached) return cached;
  const session = await loginViaApi(request, creds);
  setupSessionCache.set(creds.email, session);
  return session;
}

/** Convenience: authenticate a page as the super admin (cached per worker — setup only, not a login test). */
export async function authenticateAsAdmin(page: Page, request: APIRequestContext): Promise<AdminSession> {
  const session = await cachedLogin(request, ADMIN);
  await injectSession(page, session);
  return session;
}

/** Authenticate as the seeded non-super-admin (cached per worker — setup only, not a login test). */
export async function authenticateAsNonAdmin(page: Page, request: APIRequestContext): Promise<AdminSession> {
  const session = await cachedLogin(request, NON_ADMIN);
  await injectSession(page, session);
  return session;
}

// ── Fixture: `adminTest` gives every spec a pre-authenticated admin page ──────
// The login endpoint is rate-limited (10 req/15min/IP — see AUTH_THROTTLE in
// auth.controller.ts), so we authenticate ONCE PER WORKER and reuse the token
// across every test that worker runs. `adminSession` (test-scoped) can't
// depend on the test-scoped `request` fixture and stay worker-scoped, so we
// open a standalone APIRequestContext via the top-level `request` import.

type AdminFixtures = {
  adminSession: AdminSession;
  adminPage: Page;
};

type AdminWorkerFixtures = {
  adminSessionWorker: AdminSession;
};

export const adminTest = base.extend<AdminFixtures, AdminWorkerFixtures>({
  adminSessionWorker: [
    async ({}, use) => {
      const ctx = await pwRequest.newContext();
      const session = await loginViaApi(ctx, ADMIN);
      await ctx.dispose();
      await use(session);
    },
    { scope: 'worker' },
  ],
  adminSession: async ({ adminSessionWorker }, use) => {
    await use(adminSessionWorker);
  },
  adminPage: async ({ page, adminSession }, use) => {
    await injectSession(page, adminSession);
    await use(page);
  },
});

export const expect2 = expect;
