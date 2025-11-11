"use client"

import StaticHeaderHTML from './StaticHeaderHTML'

/**
 * HEADER IS NOW SHOWN ON ALL PAGES
 * The header from index.html is now displayed consistently across the entire website
 * No conditional hiding - it's truly static and fixed throughout
 */
export default function ConditionalHeader() {
  // ALWAYS show header on ALL pages - no exceptions
  // This matches the original index.html behavior where header was always visible
  return <StaticHeaderHTML />
}





