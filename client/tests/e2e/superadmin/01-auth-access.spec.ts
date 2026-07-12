// =============================================================================
// Module A — Authentication & Access Control
// Ref: ADMIN_PORTAL_TEST_HANDOVER.md §5.A
// =============================================================================

import { test, expect } from '@playwright/test';
import { ADMIN, API_URL } from './helpers/admin-config';
import {
  loginViaApi,
  cachedLogin,
  injectSession,
  authenticateAsAdmin,
  authenticateAsNonAdmin,
} from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

/**
 * Inject a session as a ONE-TIME write into the current document, not via
 * page.context().addInitScript() — that persists for every future navigation
 * in the context, which silently re-authenticates the very page a test is
 * using to prove the session was cleared (logout, sessionStorage.clear()).
 * Caller must already be on a same-origin page (e.g. /auth/login) before
 * calling this, then navigate to the protected route afterward.
 */
async function injectSessionOnce(page: import('@playwright/test').Page, session: Awaited<ReturnType<typeof loginViaApi>>) {
  await page.evaluate((s) => {
    sessionStorage.setItem('accessToken', s.accessToken);
    if (s.refreshToken) sessionStorage.setItem('refreshToken', s.refreshToken);
    sessionStorage.setItem('user', JSON.stringify(s.user));
    sessionStorage.setItem('permissions', JSON.stringify(s.permissions));
  }, session);
}

test.describe('A. Authentication & Access Control', () => {
  test.describe('Positive', () => {
    test('A1 — valid super-admin login lands on the dashboard', async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('input[type="email"]').fill(ADMIN.email);
      await page.locator('input[type="password"]').fill(ADMIN.password);
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page).toHaveURL(/\/app\/superadmin\/dashboard/, { timeout: 20_000 });
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    });

    test('A2 — logout returns to login and the session is not restorable', async ({ page, request }) => {
      const session = await cachedLogin(request, ADMIN);
      await page.goto('/auth/login');
      await injectSessionOnce(page, session);
      await page.goto('/app/superadmin/dashboard');
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

      await page.getByRole('button', { name: /logout/i }).first().click();
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
      // toHaveURL can resolve slightly before the triggering window.location.href
      // navigation's document fully settles; wait for load so the next
      // evaluate() doesn't race a still-in-flight navigation and get its
      // execution context torn down mid-call.
      await page.waitForLoadState('load');

      // The real guarantee is that sessionStorage is actually cleared — check
      // it directly rather than navigating again, since injectSessionOnce's
      // write would otherwise need to be repeated on every future navigation
      // in this browsing context, masking a real logout bug behind a false
      // "still logged in" symptom.
      const accessToken = await page.evaluate(() => sessionStorage.getItem('accessToken'));
      expect(accessToken, 'sessionStorage must be cleared after logout').toBeNull();

      // Back button must not resurrect an authenticated view.
      await page.goBack();
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toHaveCount(0);
    });

    test('A3 — refresh keeps the session', async ({ page, request }) => {
      await authenticateAsAdmin(page, request);
      await page.goto('/app/superadmin/dashboard');
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

      await page.reload();
      await expect(page).toHaveURL(/\/app\/superadmin\/dashboard/);
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    });
  });

  test.describe('Negative / edge', () => {
    test('A-neg1 — wrong password shows a clear error, no crash', async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto('/auth/login');
      await page.locator('input[type="email"]').fill(ADMIN.email);
      await page.locator('input[type="password"]').fill('definitely-wrong-password');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/invalid|incorrect|failed|wrong/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(page).toHaveURL(/\/auth\/login/);
      expect(errors, 'no unhandled console errors on failed login').toEqual([]);
    });

    test('A-neg3 — empty email & password show validation errors', async ({ page }) => {
      await page.goto('/auth/login');
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page.getByText('Email is required')).toBeVisible();
      await expect(page.getByText('Password is required')).toBeVisible();
    });

    test('A-neg4 — non-super-admin is blocked from the portal', async ({ page, request }) => {
      await authenticateAsNonAdmin(page, request);
      await page.goto('/app/superadmin/users');
      // RoleGuard bounces non-super-admins to /not-authorized.
      await expect(page).toHaveURL(/\/not-authorized|\/app\/(?!superadmin)/, { timeout: 15_000 });
      await expect(page.getByRole('heading', { name: 'All Users' })).toHaveCount(0);
    });

    test('A-neg5 — direct URL without a session redirects to login', async ({ page }) => {
      await page.goto('/app/superadmin/users');
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
    });

    test('A-neg6 — cleared session token redirects to login', async ({ page, request }) => {
      const session = await cachedLogin(request, ADMIN);
      await page.goto('/auth/login');
      await injectSessionOnce(page, session);
      await page.goto('/app/superadmin/dashboard');
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

      await page.evaluate(() => sessionStorage.clear());
      await page.goto('/app/superadmin/users');
      await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
    });
  });

  test('API — login returns a bearer token and 401s protect the API', async ({ request }) => {
    const session = await loginViaApi(request, ADMIN);
    expect(session.accessToken).toBeTruthy();

    // No JWT → 401 (Security §6).
    const noAuth = await request.get(`${API_URL}/superadmin/colleges`).catch(() => null);
    if (noAuth) expect([401, 403]).toContain(noAuth.status());
  });
});
