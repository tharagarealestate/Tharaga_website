import { test, expect } from '@playwright/test';

// This test boots the static site and checks that the verified property listings
// page hydrates filters from URL params and renders cards accordingly.
// Note: we run against the local static server; data comes from Supabase.

test.describe('Verified listings deep-link hydration', () => {
  test('applies URL params to controls and results', async ({ page, baseURL }) => {
    const url = (baseURL || 'http://localhost:4173') + '/property-listing/index.html' +
      '?type=buy&city=Chennai&locality=Anna%20Nagar&price_min=4000000&price_max=5000000&ptype=apartment&bhk=2&furnished=semi%20furnished&facing=east&area_min=900&area_max=1200&amenity=gym&near_metro=1&max_walk=12&sort=ai_relevance';

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // wait for results container to attach (not necessarily visible immediately)
    await page.waitForSelector('#results', { state: 'attached' });
    await expect(page.locator('#q')).toHaveValue(/Anna\s*Nagar/i, { timeout: 30000 });
    await expect(page.locator('#ptype')).toHaveValue('Apartment');
    await expect(page.locator('#bhk')).toHaveValue('2');
    await expect(page.locator('#furnished')).toHaveValue('Semi Furnished');
    await expect(page.locator('#facing')).toHaveValue('East');
    await expect(page.locator('#minArea')).toHaveValue('900');
    await expect(page.locator('#maxArea')).toHaveValue('1200');
    await expect(page.locator('#amenity')).toHaveValue(/gym/i);
    await expect(page.locator('#wantMetro')).toBeChecked();
    await expect(page.locator('#maxWalk')).toHaveValue('12');

    // Sort mapping ai_relevance -> relevance
    await expect(page.locator('#sort')).toHaveValue('relevance');

    // Count label should update (>= 0, just verify text format). We cannot assert exact number.
    await expect(page.locator('#count')).toContainText(/result/);

    // Cards render or empty state appears, but not blank
    const resultsHtml = await page.locator('#results').innerHTML();
    expect(resultsHtml.length).toBeGreaterThan(0);
  });
});

