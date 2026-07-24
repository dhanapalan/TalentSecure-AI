/**
 * Headed, one-by-one admin validation on DISPLAY=:1
 * Target: https://gradlogic.atherasys.com (main host)
 *
 * Open the Cursor Cloud **Desktop** panel to watch live.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'https://gradlogic.atherasys.com';
const EMAIL = process.env.ADMIN_EMAIL || 'admin@gradlogic.com';
const PASS = process.env.ADMIN_PASSWORD || 'gradlogic123';
const PAUSE_MS = Number(process.env.SCENARIO_PAUSE_MS || 8000);
const OUT = '/opt/cursor/artifacts/screenshots/gradlogic-headed-live';

fs.mkdirSync(OUT, { recursive: true });

function announce(step, title) {
  console.log('\n' + '='.repeat(72));
  console.log(`SCENARIO ${step}: ${title}`);
  console.log('='.repeat(72));
  console.log(`>> Watch Cursor Desktop now — ${PAUSE_MS / 1000}s on this screen`);
  console.log(`>> URL base: ${BASE}`);
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
  console.log('HEADED Chrome starting on DISPLAY=' + (process.env.DISPLAY || ':1'));
  console.log('TARGET ' + BASE + '/auth/login');
  console.log('Open Cursor Desktop panel NOW to watch.');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
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

  // 01 Login page
  announce('01', 'Open login page');
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await pause(page);
  await shot(page, '01-login');

  // 02 Wrong password
  announce('02', 'Wrong password → error toast');
  await page.getByLabel(/email or student id/i).fill(EMAIL);
  await page.getByLabel(/^password$/i).fill('wrong-password-xyz');
  await page.getByRole('button', { name: /sign in/i }).click();
  await pause(page, Math.max(PAUSE_MS, 5000));
  await shot(page, '02-wrong-password');

  // 03 Valid login
  announce('03', 'Valid login → Super Admin dashboard');
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email or student id/i).fill(EMAIL);
  await page.getByLabel(/^password$/i).fill(PASS);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/app\/superadmin\/dashboard/, { timeout: 35_000 });
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
    const extra = title.includes('Permission') ? 5000 : 0;
    await pause(page, PAUSE_MS + extra);
    await shot(page, `${num}-${title.toLowerCase().replace(/\s+/g, '-')}`);
  }

  // 20 Logout
  announce('20', 'Logout → back to login');
  await page.goto(`${BASE}/app/superadmin/dashboard`);
  await pause(page, 2500);
  await page.getByRole('button', { name: /logout/i }).first().click();
  await page.waitForURL(/\/auth\/login/, { timeout: 20_000 });
  await pause(page);
  await shot(page, '20-logout');

  console.log('\nALL 20 SCENARIOS COMPLETE');
  console.log('Browser stays open 25s for final look on Desktop');
  await pause(page, 25_000);
  await browser.close();
  console.log('DONE');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
