import { test, expect } from '@playwright/test'
test.skip(true, 'Skip in isolated CTA test run (no server)')

test.describe('AI Recommendations module', () => {
  test('homepage shows recommendations carousel', async ({ page }) => {
    await page.goto('/')
    // Link to Next app is present
    const link = page.locator('a:text("AI Recommendations")')
    await expect(link).toBeVisible()

    // Navigate to Next.js recommendations app
    await link.click()

    // Recommendations header
    await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible()

    // Either cards, skeletons, or empty state present
    const cards = page.locator('[data-scroll-row] > div')
    await expect(cards.first()).toBeVisible()
  })
})

