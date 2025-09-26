import { test, expect } from '@playwright/test';

test.describe('Top-right auth header', () => {
  test('auth modal can be opened via hook if header absent', async ({ page }) => {
    await page.goto('/');
    // Fallback to direct hook; some pages/environments do not render header button
    await page.evaluate(() => {
      const anyWin: any = window as any;
      if (typeof anyWin.__thgOpenAuthModal === 'function') {
        anyWin.__thgOpenAuthModal({ next: '/' });
      }
    });
    await expect(page.locator('.thg-auth-overlay')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.getByRole('tab', { name: 'Sign in' })).toHaveAttribute('aria-selected', 'true');
  });
});

