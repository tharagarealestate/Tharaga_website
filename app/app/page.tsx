import { redirect } from 'next/navigation'

// Single source of truth for the homepage: use the static
// Netlify homepage at /index.html so both Render (Next.js)
// and Netlify render the exact same design and behavior.
export default function Home() {
  redirect('/index.html')
}

