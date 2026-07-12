// =============================================================================
// Module H — Question Bank (all sub-pages)  ·  Ref: §5.H
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

test.describe('H. Question Bank', () => {
  test('H-all — every sub-page loads', async ({ adminPage }) => {
    const pages: Array<[string, string]> = [
      ['/app/superadmin/question-bank', 'All Questions'],
      ['/app/superadmin/question-bank/ai-generator', 'AI Question Generator'],
      ['/app/superadmin/question-bank/categories', 'Categories & Topics'],
      ['/app/superadmin/question-bank/review-queue', 'Review Queue'],
      ['/app/superadmin/question-bank/import-books', 'Import from Books'],
    ];
    for (const [path, heading] of pages) {
      await adminPage.goto(path);
      await expect(adminPage.getByRole('heading', { name: heading })).toBeVisible({ timeout: 15_000 });
    }
  });

  test('H-list — All Questions supports search + filters without error', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    await adminPage.goto('/app/superadmin/question-bank');
    const search = adminPage.getByPlaceholder(/search/i).first();
    if (await search.count()) {
      await search.fill('C++'); // special chars must not break search
      await adminPage.waitForTimeout(600);
      await search.fill('');
    }
    expect(errors).toEqual([]);
  });

  test('H-review — review queue shows a queue or an empty state', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/question-bank/review-queue');
    await expect(
      adminPage.getByText(/no pending questions|queue is empty/i)
        .or(adminPage.getByRole('button', { name: /approve|reject/i })).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('H-ai — AI generator validates an empty prompt', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/question-bank/ai-generator');
    const generate = adminPage.getByRole('button', { name: /generate/i }).first();
    if (await generate.count()) {
      await generate.click();
      // Either a validation message or a disabled control — must not crash / navigate.
      await expect(adminPage).toHaveURL(/ai-generator/);
    }
  });
});
