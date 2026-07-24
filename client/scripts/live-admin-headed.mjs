/**
 * Headed, one-by-one admin portal validation on DISPLAY=:1
 * so it is visible in the Cursor Cloud desktop / noVNC viewer.
 *
 * Each scenario pauses so a human can watch the screen.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://admin.gradlogic.atherasys.com';
const EMAIL = 'admin@gradlogic.com';
const PASS = 'gradlogic123';
const PAUSE_MS = Number(process.env.SCENARIO_PAUSE_MS || 5000);
const OUT = '/opt/cursor/artifacts/screenshots/admin-headed-live';

fs.mkdirSync(OUT, { recursive: true });

function announce(step, title) {
  console.log('\n' + '='.repeat(72));
  console.log(`SCENARIO ${step}: ${title}`);
  console.log('='.repeat(72));
  console.log(`>> Watch the Cursor Desktop / browser panel now (${PAUSE_MS / 1000}s pause)`);
}

async function pause(page, ms = PAUSE_MS) {
  await page.waitForTimeout(ms);
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`SHOT ${file}`);
}

async function main() {
  console.log('Launching HEADED Chrome on DISPLAY=' + (process.env.DISPLAY || ':1'));
  const browser = await chromium.launch({
    headless: false,
    slowMo: 250,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',
      '--no-default-browser-check',
      '--disable-infobars',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // --- 01 Login page ---
  announce('01', 'Open ADMIN PORTAL login');
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await pause(page);
  await shot(page, '01-login');

  // --- 02 Wrong password ---
  announce('02', 'Wrong password shows error');
  await page.getByLabel(/email or student id/i).fill(EMAIL);
  await page.getByLabel(/^password$/i).fill('wrong-password-xyz');
  await page.getByRole('button', { name: /sign in/i }).click();
  await pause(page, 4000);
  await shot(page, '02-wrong-password');

  // --- 03 Valid login → dashboard ---
  announce('03', 'Valid login → Admin Dashboard');
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email or student id/i).fill(EMAIL);
  await page.getByLabel(/^password$/i).fill(PASS);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/app\/superadmin\/dashboard/, { timeout: 30_000 });
  await pause(page);
  await shot(page, '03-dashboard');

  const modules = [
    ['04', 'Colleges', '/app/superadmin/colleges'],
    ['05', 'Students', '/app/superadmin/students'],
    ['06', 'Users', '/app/superadmin/users'],
    ['07', 'Roles', '/app/superadmin/roles'],
    ['08', 'Permission Matrix', '/app/superadmin/roles/matrix'],
    ['09', 'Question Bank', '/app/superadmin/question-bank'],
    ['10', 'Question Collections', '/app/superadmin/question-collections'],
    ['11', 'Assessment Builder', '/app/superadmin/drives'],
    ['12', 'AI Configuration', '/app/superadmin/ai-config'],
    ['13', 'Analytics', '/app/superadmin/analytics'],
    ['14', 'Platform Settings', '/app/superadmin/settings'],
    ['15', 'Audit Trail', '/app/superadmin/audit-trail'],
    ['16', 'Approvals', '/app/superadmin/approvals'],
    ['17', 'Billing', '/app/superadmin/billing'],
    ['18', 'Notifications', '/app/superadmin/notifications'],
    ['19', 'Modules', '/app/superadmin/modules'],
  ];

  for (const [num, title, route] of modules) {
    announce(num, title);
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    const extra = title.includes('Permission') ? 6000 : 0;
    await pause(page, PAUSE_MS + extra);
    await shot(page, `${num}-${title.toLowerCase().replace(/\s+/g, '-')}`);
  }

  // --- Logout ---
  announce('20', 'Logout back to login');
  await page.goto(`${BASE}/app/superadmin/dashboard`);
  await pause(page, 2000);
  await page.getByRole('button', { name: /logout/i }).first().click();
  await page.waitForURL(/\/auth\/login/, { timeout: 20_000 });
  await pause(page);
  await shot(page, '20-logout');

  console.log('\nALL SCENARIOS COMPLETE — browser stays open 20s for final look');
  await pause(page, 20_000);
  await browser.close();
  console.log('DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
