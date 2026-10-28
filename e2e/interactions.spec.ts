import { test, expect } from '@playwright/test';

test.describe('section 4 interactions', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('command menu opens instantly and shows shortcut hints', async ({ page }) => {
    await page.goto('/preview/dashboard');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('esc Close')).toBeVisible();
    await expect(dialog.getByText('Move')).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(200);
  });
});

test.describe('mobile shell', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test('preview dashboard does not overflow', async ({ page }) => {
    await page.goto('/preview/dashboard');
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  });
});
