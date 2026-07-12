// =============================================================================
// Module L — Billing  ·  Ref: §5.L
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

test.describe('L. Billing', () => {
  // NOTE: the handover's §5.L description ("subscription plans", "college
  // subscriptions", "invoice history") does not match the implemented page —
  // it's a per-academic-year student fee-collection dashboard ("Collection by
  // College", "Recent Payments"), not a SaaS billing/plans screen. Asserting
  // against the real, live copy; see Known Issues re: the doc/impl mismatch.
  test('L1-4 — billing page loads fee-collection summary or empty state', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    await adminPage.goto('/app/superadmin/billing');
    await expect(adminPage.getByRole('heading', { name: 'Billing' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(
      adminPage.getByText(/collection by college|recent payments|no subscriptions|empty/i).first()
    ).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });
});
