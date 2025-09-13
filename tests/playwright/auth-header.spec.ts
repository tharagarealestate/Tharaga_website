import { test, expect } from '@playwright/test';

test.describe('Top-right auth header', () => {
  test('shows Login / Signup when logged out and opens modal', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('.thg-auth-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Login / Signup');
    await btn.click();
    await expect(page.locator('.thg-auth-overlay')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.getByRole('tab', { name: 'Sign in' })).toHaveAttribute('aria-selected', 'true');
  });
});

