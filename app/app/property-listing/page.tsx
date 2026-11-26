import { redirect } from 'next/navigation'

/** The portfolio now lives at /properties. */
export default function PropertyListingRedirect() {
  redirect('/properties')
}
