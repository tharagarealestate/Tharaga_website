"use client"
import React from 'react'

export function ExpandableText({ text, maxWords = 300 }: { text: string; maxWords?: number }){
  const words = (text || '').trim().split(/\s+/)
  const needsCollapse = words.length > maxWords
  const [expanded, setExpanded] = React.useState(false)
  const shown = needsCollapse && !expanded ? words.slice(0, maxWords).join(' ') + '…' : text
  return (
    <div>
      <p>{shown}</p>
      {needsCollapse && (
        <button type="button" onClick={()=>setExpanded(e=>!e)} className="mt-2 text-primary-600 text-sm">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
