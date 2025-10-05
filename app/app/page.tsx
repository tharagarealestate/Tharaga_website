import { redirect } from 'next/navigation'

export default function Home() {
  // Serve the static, psychology‑informed homepage built at /index.html
  redirect('/index.html')
}

