'use client'

import { openAuthModal } from '@/components/auth/AuthModal'
import { currentAuthUser } from '@/lib/useAuthUser'

type Router = { push: (href: string) => void }

/**
 * Opening a property: signed-in visitors go straight in; everyone else gets the sign-in
 * container first, with the option to just preview the public summary.
 */
export function openProperty(router: Router, m: { slug: string; name: string }) {
  const href = `/properties/${m.slug}`
  if (currentAuthUser()) return router.push(href)
  openAuthModal(href, {
    title: `Sign in to view ${m.name}`,
    body: 'Photos, videos, the site plan and key facts are shared with signed-in buyers. One tap with Google — no forms.',
    preview: { label: 'Just preview the summary →', href },
  })
}

/** Saving to the shortlist needs an account so it follows the buyer to every device. */
export function requireSignInToSave(name?: string): boolean {
  if (currentAuthUser()) return true
  openAuthModal(undefined, {
    title: name ? `Sign in to save ${name}` : 'Sign in to save properties',
    body: 'Your shortlist is kept in your account and follows you to every device.',
  })
  return false
}
