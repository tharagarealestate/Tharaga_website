import { redirect } from 'next/navigation'

/**
 * /trial-signup is deprecated.
 * Builder sign-up / sign-in now flows through /builder → BuilderAuthGate → AuthModal.
 */
export default function TrialSignupPage() {
  redirect('/builder')
}
