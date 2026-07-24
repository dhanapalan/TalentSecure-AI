// =============================================================================
// SuperAdmin QA Automation Suite — shared assertions & utilities
// =============================================================================

import { Page, expect } from '@playwright/test';
import { BASE_URL, AdminRoute } from './admin-config';

/** Absolute URL for a route path. */
export const url = (path: string): string => `${BASE_URL}${path}`;

/** Unique, human-readable suffix so mutating tests never collide. */
export const uniqueSuffix = (): string =>
  `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;

// ── Console / page-error capture ─────────────────────────────────────────────
// Attach at the top of a test to assert "no console errors on happy path".
// Known-benign noise (favicon, aborted HMR, ResizeObserver) is filtered out.

const BENIGN = [
  /favicon/i,
  /ResizeObserver loop/i,
  /Failed to load resource.*(404|401|403)/i, // network status surfaced elsewhere
  /Download the React DevTools/i,
  /\[vite\]/i,
  /Content Security Policy/i, // prod CSP blocks fonts.googleapis.com; UI still renders
  /fonts\.googleapis\.com/i,
];

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!BENIGN.some((re) => re.test(text))) errors.push(text);
    }
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

// ── Portal shell / navigation assertions ─────────────────────────────────────

/**
 * Assert the SuperAdmin portal shell rendered for the current page and that we
 * were neither bounced to login nor to /not-authorized, nor hit the 404 page.
 * This is the resilient baseline every route must satisfy.
 */
export async function expectInPortal(page: Page): Promise<void> {
  await expect(page, 'should not be redirected to login').not.toHaveURL(/\/auth\/login/);
  await expect(page, 'should not be blocked as unauthorized').not.toHaveURL(/\/not-authorized/);
  // Sidebar brand confirms we are inside the admin console shell.
  await expect(page.getByText('GradLogic', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  // No React error-boundary / crash text.
  await expect(page.getByText(/something went wrong|application error/i)).toHaveCount(0);
  // Not the 404 route.
  await expect(page.getByText(/404|page not found/i)).toHaveCount(0);
}

/**
 * Navigate to a route and assert it loaded correctly. When the route declares a
 * static `heading`, assert it verbatim; otherwise assert a non-empty page title
 * region. Always confirms the portal shell + URL.
 */
export async function gotoAndAssert(page: Page, route: AdminRoute): Promise<void> {
  await page.goto(url(route.path));
  await expectInPortal(page);
  await expect(page, `URL should reflect ${route.key}`).toHaveURL(new RegExp(escapeRe(route.path.split('?')[0])));

  if (route.heading) {
    await expect(
      page.getByRole('heading', { name: route.heading }).first(),
      `heading "${route.heading}" should be visible on ${route.key}`
    ).toBeVisible({ timeout: 15_000 });
  } else {
    // Dynamic-title page: assert the primary heading exists and is non-empty.
    const h = page.locator('main h1, main h2').first();
    await expect(h, `a page heading should render on ${route.key}`).toBeVisible({ timeout: 15_000 });
    await expect(h).not.toHaveText('');
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Wait for the app's initial network/render to settle. */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {});
}
