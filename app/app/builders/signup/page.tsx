import { redirect } from 'next/navigation'

/**
 * /builders/signup — Canonical builder signup entry point used in marketing CTAs.
 * Forwards to /auth/signup which opens the AuthModal on the Sign-up tab.
 */
export default function BuildersSignupPage() {
  redirect('/auth/signup')
}
