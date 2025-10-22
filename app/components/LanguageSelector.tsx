"use client"
import {usePathname, useRouter} from 'next/navigation'

export default function LanguageSelector({ className }: { className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const currentSegment = pathname.split('/')[1]
  const current = ['en', 'ta', 'hi'].includes(currentSegment) ? currentSegment : 'en'

  return (
    <select
      aria-label="Select language"
      className={className}
      value={current}
      onChange={(e) => router.push(`/${e.target.value}`)}
    >
      <option value="en">English</option>
      <option value="ta">தமிழ்</option>
      <option value="hi">हिन्दी</option>
    </select>
  )
}
