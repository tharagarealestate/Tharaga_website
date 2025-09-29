import { test, expect } from '@playwright/test'

test.describe('Buyer Form - Email autofill and lock', () => {
  test('locks email after auth signal and mirrors into hidden input', async ({ page }) => {
    await page.goto('/buyer-form/')

    const userEmail = 'user@example.com'
    await page.addInitScript((email) => {
      try { localStorage.setItem('__tharaga_magic_continue', JSON.stringify({ user: { email }, ts: Date.now() })) } catch(_) {}
    }, userEmail)

    await page.reload()

    await page.waitForFunction(() =>
      !!document.querySelector('#buyerForm input[disabled]') ||
      !!document.querySelector('#buyer-email-hidden')
    )

<<<<<<< HEAD
<<<<<<< HEAD
    // Wait for the lock to apply (field disabled and name moved to hidden)
=======
    // Wait for the lock to apply (field disabled OR hidden mirror created)
>>>>>>> 746fac3 (feat: Add Playwright tests and improve test reliability)
    await page.waitForFunction(() => !!document.querySelector('#buyerForm input[disabled]') || !!document.querySelector('#buyer-email-hidden'))

    // The visible field should have data-session-email and be disabled/read-only
=======
>>>>>>> dd6f385 (feat: Add auth modal stub and update tests)
    const hasSessionAttr = await page.locator('#buyerForm input[data-session-email]').count()
    expect(hasSessionAttr).toBeGreaterThan(0)

    const hidden = page.locator('#buyerForm input#buyer-email-hidden[type="hidden"][name="email"]')
    await expect(hidden).toHaveValue(userEmail)
  })
})
