"use client"

import * as React from 'react'
import Image from 'next/image'
import Breadcrumb from '@/components/Breadcrumb'
import { listSaved, removeItem } from '@/lib/saved'

export default function SavedPage(){
  const [rows, setRows] = React.useState(() => listSaved())
  function del(id: string){
    removeItem(id)
    setRows(listSaved())
  }
  return (
    <>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Saved Properties' }
      ]} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold text-plum mb-4">Saved properties</h1>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-plum/10 bg-brandWhite p-4">Nothing saved yet. Tap “Save” on recommendations or listings.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rows.map(r => (
            <div key={r.property_id} className="rounded-xl border border-plum/10 bg-brandWhite overflow-hidden">
              <div className="relative h-40 w-full bg-plum/10">
                <Image src={r.image_url} alt={r.title} fill sizes="320px" className="object-cover" />
              </div>
              <div className="p-3 space-y-1">
                <div className="font-medium leading-snug line-clamp-2">{r.title}</div>
                {r.specs && (
                  <div className="text-sm text-plum/70">
                    {[r.specs.bedrooms?`${r.specs.bedrooms} BHK`:null, r.specs.bathrooms?`${r.specs.bathrooms} Bath`:null, r.specs.area_sqft?`${Math.round(r.specs.area_sqft)} sqft`:null, r.specs.location||null].filter(Boolean).join(' • ')}
                  </div>
                )}
                <div className="flex gap-2">
                  <a className="rounded-lg border px-3 py-1 text-sm" href="/property-listing/">Open listings</a>
                  <button className="rounded-lg border px-3 py-1 text-sm" onClick={()=>del(r.property_id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </main>
    </>
  )
}
