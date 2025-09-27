// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Signup flow', () => {
  test('shows non-blocking UI feedback when creating account', async ({ page, baseURL }) => {
    await page.goto('/login_signup_glassdrop/');

    // Helper to attempt signup
    const doSignup = async (email: string, password: string) => {
      // Switch to Create Account tab and scope within signup form
      await page.getByRole('tab', { name: 'Create Account' }).click();
      const form = page.locator('#signupForm');
      await form.getByLabel('Email').fill(email);
      await form.getByLabel('Password', { exact: true }).fill(password);
      await form.getByLabel('Confirm Password').fill(password);
      await page.getByRole('button', { name: 'Create account' }).click();
      await page.waitForTimeout(400); // allow UI to update
      return page.locator('#su_msg').textContent();
    };

    const unique = `u${Date.now()}@example.com`;

    const first = await doSignup(unique, 'password123');
    expect((first || '').toLowerCase()).toMatch(/creating account|account created|verify|rate|already/);
  });
});

