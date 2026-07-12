// =============================================================================
// Module M — AI Configuration  ·  Ref: §5.M
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

test.describe('M. AI Configuration', () => {
  test('M1-5 — every AI-config tab loads', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    const tabs = ['?tab=services', '', '?tab=prompts', '?tab=quotas', '?tab=usage'];
    for (const tab of tabs) {
      await adminPage.goto(`/app/superadmin/ai-config${tab}`);
      await expect(adminPage.locator('main h1, main h2').first()).toBeVisible({ timeout: 15_000 });
    }
    expect(errors).toEqual([]);
  });
});
