import { test, expect } from '@playwright/test';
import path from 'node:path';

const OUT = path.join('/opt/cursor/artifacts', 'screenshots');

const routes = [
  { name: 'landing', path: '/' },
  { name: 'sign-in', path: '/sign-in' },
  { name: 'sign-up', path: '/sign-up' },
  { name: 'dashboard', path: '/preview/dashboard' },
  { name: 'watchlist', path: '/preview/watchlist' },
  { name: 'stock', path: '/preview/stock' },
];

async function assertNoOverflow(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    fonts: document.fonts.status,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect(metrics.fonts).toBe('loaded');
}

for (const theme of ['dark', 'light'] as const) {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 360, height: 800 },
  ]) {
    test.describe(`${theme} ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height }, colorScheme: theme });

      test.beforeEach(async ({ page }) => {
        await page.addInitScript((value) => {
          localStorage.setItem('theme', value);
        }, theme);
      });

      for (const route of routes) {
        test(route.name, async ({ page }) => {
          await page.goto(route.path, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(400);
          await page.evaluate(() => document.fonts.ready);
          await assertNoOverflow(page);
          await page.screenshot({
            path: path.join(OUT, `${route.name}-${viewport.name}-${theme}.png`),
            fullPage: true,
          });
        });
      }
    });
  }
}
