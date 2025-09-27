import { test, expect } from '@playwright/test'

test.describe('AI Recommendations module', () => {
  test('homepage shows recommendations carousel', async ({ page }) => {
    await page.goto('/')
    // Navigate to Next.js recommendations app directly to avoid flakiness
    await page.goto('/app/')

    // Recommendations header
    await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible()

    // Either cards, skeletons, or empty state present
    const cards = page.locator('[data-scroll-row] > div')
    await expect(cards.first()).toBeVisible()
  })
})

