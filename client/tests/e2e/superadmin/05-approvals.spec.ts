// =============================================================================
// Module E — Approvals  ·  Ref: §5.E
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

test.describe('E. Approvals', () => {
  test('E1 — approvals queue loads (list or empty state)', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    await adminPage.goto('/app/superadmin/approvals');
    await expect(adminPage.getByRole('heading', { name: 'Approvals' })).toBeVisible();
    // Either pending items or a graceful empty state.
    await expect(
      adminPage.getByText(/no pending|nothing to approve|all caught up/i)
        .or(adminPage.locator('button, [role="listitem"], table')).first()
    ).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });
});
