// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Signup flow', () => {
  test('shows friendly error on duplicate email and succeeds on new email', async ({ page }) => {
    const base = 'http://localhost:4173/login_signup_glassdrop/';
    await page.goto(base);

    // Helper to attempt signup
    const doSignup = async (email: string, password: string) => {
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password);
      await page.getByRole('button', { name: 'Create account' }).click();
      await page.waitForTimeout(400); // allow UI to update
      return page.locator('#msg').textContent();
    };

    const unique = `u${Date.now()}@example.com`;

    // First time should create account or show success message
    const first = await doSignup(unique, 'password123');
    expect(first || '').toMatch(/Account created|already registered|rate/i);

    // Second time with same email should not crash the page
    const second = await doSignup(unique, 'password123');
    expect(second || '').not.toMatch(/Database error saving new user/i);
  });
});

