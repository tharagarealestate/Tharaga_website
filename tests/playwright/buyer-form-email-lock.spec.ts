import { test, expect } from '@playwright/test';
test.skip(true, 'Skip buyer form tests in isolated CTA run');

test.describe('Buyer form email locking', () => {
  test('keeps cached email value on load and only unlocks after sign-out', async ({ page }) => {
    // Seed localStorage with a cached email to simulate header-provided cache
    await page.addInitScript(() => {
      try {
        localStorage.setItem('__tharaga_magic_continue', JSON.stringify({ user: { email: 'lockme@example.com' } }));
      } catch {}
    });

    await page.goto('/buyer-form/');

    // Visible input (name removed when locked), and hidden mirror used for submit
    const email = page.locator('#buyerForm input[type="email"]');
    const hidden = page.locator('#buyer-email-hidden');

    // Value should be present and field disabled/readonly due to lock
    await expect(email).toHaveAttribute('data-session-email', /lockme@example.com/i);
    await expect(email).toBeDisabled();
    await expect(hidden).toHaveJSProperty('value', 'lockme@example.com');

    // Simulate Supabase emitting a sign-out event and ensure unlock happens
    await page.evaluate(() => {
      const ev = new MessageEvent('message', { data: { type: 'THARAGA_AUTH_SIGNED_OUT_TEST' } });
      // we do not have direct access to supabase client in tests; trigger our
      // unlock path by dispatching a synthetic auth change the same as real one
      // by calling the onAuthStateChange callback isn't trivial, so emulate by
      // removing the cached item and firing storage to ensure no re-lock.
      try { localStorage.removeItem('__tharaga_magic_continue'); } catch {}
      window.dispatchEvent(new StorageEvent('storage', { key: '__tharaga_magic_continue' }));
      // Also broadcast a generic message that might carry email in real app; here none
      try {
        // No-op if channel unsupported
        // @ts-ignore
        const bc = 'BroadcastChannel' in window ? new BroadcastChannel('tharaga-auth') : null;
        bc && bc.postMessage({});
      } catch {}
    });

    // After our synthetic sign out pathway, the field should be enabled and editable
    await expect(email).not.toBeDisabled();
    await expect(email).toHaveAttribute('name', 'email');
  });
});

