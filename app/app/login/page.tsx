"use client"
import { useEffect } from 'react'

export default function LoginPage(){
  useEffect(() => {
    try {
      const next = new URLSearchParams(window.location.search).get('next') || '/'
      // Prefer the durable auth modal present on most pages
      const open = (window as any).THG_OPEN_AUTH as undefined | ((opts?: any) => void)
      if (typeof open === 'function') {
        open({ next })
        return
      }
      // Fallback: redirect to hosted auth page with return URL
      const base = (window as any).DURABLE_AUTH_URL || 'https://auth.tharaga.co.in/login_signup_glassdrop/'
      const url = new URL(base)
      url.searchParams.set('next', next)
      window.location.href = url.toString()
    } catch {
      // Final fallback: go home
      window.location.href = '/'
    }
  }, [])

  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Redirecting to sign in…</h1>
      <p className="mt-2 text-sm text-gray-600">If nothing happens, <a className="text-primary-600 underline" href="/">go back home</a>.</p>
    </main>
  )
}
