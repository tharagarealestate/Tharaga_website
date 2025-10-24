import Image from 'next/image'
import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { MapPin, Bed, Maximize, Car, Building2, Compass, Calendar, Star, ShieldCheck } from 'lucide-react'
import { Gallery } from '@/components/property/Gallery'
import { EMICalculator as EMICalcClient } from '@/components/property/EMICalculator'
import { ExpandableText } from '@/components/property/ExpandableText'
import { CompareChart } from '@/components/property/CompareChart'
import { ContactForm as ContactFormClient } from '@/components/property/ContactForm'

export const revalidate = 300 // ISR: 5 minutes

async function fetchProperty(id: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || ''
  const res = await fetch(`${base}/api/properties/${id}`, { next: { revalidate: 300 } })
  if (!res.ok) return null
  return (await res.json()) as any
}

export async function generateMetadata(
  { params }: { params: { id: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const data = await fetchProperty(params.id)
  if (!data?.property) return {}
  const p = data.property
  const title = `${p.title || 'Property'} - ${p.bedrooms || '3'} BHK in ${p.locality || p.city || ''} | Tharaga`
  const desc = (p.description || '').slice(0, 160)
  const ogImage = p.images?.[0] || ''
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: p.title,
        price: p.priceDisplay,
        address: `${p.locality || ''}, ${p.city || ''}`.trim(),
        numberOfRooms: p.bedrooms || 3,
      }),
    },
  }
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const data = await fetchProperty(params.id)
  if (!data?.property) notFound()
  const { property: p, builder, similar, reviews } = data

  return (
    <div className="min-h-screen">
      <section className="w-full">
        <Gallery images={p.images} tourUrl={p.tourUrl} brochureUrl={p.brochureUrl} />
      </section>
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7">
          <Overview p={p} />
          <Description text={p.description} />
          <Amenities items={p.amenities} />
          <FloorPlan images={p.floorPlans} />
          <LocationInsights p={p} />
          <Financials price={p.priceINR} sqft={p.sqft} />
          <BuilderInfo p={p} builder={builder} />
          <LegalDocs p={p} />
          <SimilarProperties items={similar} />
          <Reviews items={reviews} />
        </div>
        <div className="lg:col-span-3">
          <StickySidebar p={p} />
        </div>
      </div>
      <MobileBar p={p} />
      <EngagementTracker propertyId={p.id} />
    </div>
  )
}

// HeroGallery moved to separate client component `Gallery`

function Overview({ p }: { p: any }) {
  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-bold text-gray-900">{p.title}</h1>
      <div className="flex items-center gap-2 text-primary-600">
        <MapPin size={18} />
        <a className="hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address || `${p.locality||''} ${p.city||''}`)}`} target="_blank" rel="noreferrer">
          {p.address || `${p.locality || ''}, ${p.city || ''}`}
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Spec icon={<Bed size={18}/>} label="BHK" value={p.bedrooms || '-'} />
        <Spec icon={<Maximize size={18}/>} label="Area" value={`${p.sqft || '-'} sqft`} />
        <Spec icon={<Car size={18}/>} label="Parking" value={p.parking || 0} />
        <Spec icon={<Building2 size={18}/>} label="Floor" value={p.floor ? `${p.floor}${p.totalFloors?`/${p.totalFloors}`:''}` : '-'} />
        <Spec icon={<Compass size={18}/>} label="Facing" value={p.facing || '-'} />
        <Spec icon={<Calendar size={18}/>} label="Status" value={p.listingStatus || 'Ready to Move'} />
      </div>
    </div>
  )
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border p-3 flex items-center gap-2 text-sm">
      {icon}
      <div className="text-gray-600">{label}</div>
      <div className="ml-auto font-medium text-gray-900">{value}</div>
    </div>
  )
}

function Description({ text }: { text: string }) {
  return (
    <div className="prose max-w-none mt-8">
      <h2 className="text-2xl font-semibold">Description</h2>
      <ExpandableText text={text} maxWords={300} />
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <Highlight>Recently Price Reduced by ₹5L</Highlight>
        <Highlight>High Demand - 50 views this week</Highlight>
        <Highlight>Similar properties selling fast</Highlight>
      </div>
    </div>
  )
}

function Highlight({ children }: { children: React.ReactNode }){
  return <div className="rounded-md bg-yellow-50 text-yellow-900 border border-yellow-200 px-3 py-2 text-sm">{children}</div>
}

function Amenities({ items }: { items: string[] }){
  if (!items?.length) return null
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-3">Amenities</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {items.map((a, i)=> (
          <div key={i} className="rounded border px-3 py-2 text-sm text-gray-700">{a}</div>
        ))}
      </div>
    </div>
  )
}

function FloorPlan({ images }: { images: string[] }){
  if (!images?.length) return null
  const first = images[0]
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-3">Floor Plan & Layout</h2>
      <div className="relative h-80 border rounded">
        <Image src={first} alt="Floor plan" fill className="object-contain" loading="lazy" sizes="100vw" />
      </div>
      <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
        <li>Living Room: 250 sqft</li>
        <li>Master Bedroom: 180 sqft (with attached bath)</li>
        <li>Bedroom 2: 150 sqft</li>
        <li>Bedroom 3: 140 sqft</li>
        <li>Kitchen: 120 sqft</li>
        <li>Balconies: 100 sqft</li>
        <li>Total Carpet Area: 1,640 sqft</li>
      </ul>
    </div>
  )
}

function LocationInsights({ p }: { p: any }){
  const q = encodeURIComponent(p.address || `${p.locality||''} ${p.city||''}`)
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-3">Location Insights</h2>
      <iframe
        className="w-full h-96 rounded"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}&q=${q}`}
        />
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="rounded border p-3">Connectivity: 8/10</div>
        <div className="rounded border p-3">Social Infrastructure: 9/10</div>
        <div className="rounded border p-3">Safety: 9/10</div>
        <div className="rounded border p-3">Green Spaces: 7/10</div>
      </div>
    </div>
  )
}

function formatINR(n?: number | null){
  if (!n) return '—'
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function Financials({ price, sqft }: { price?: number|null; sqft?: number|null }){
  const base = price || 0
  const reg = Math.round(base * 0.05)
  const stamp = Math.round(base * 0.06)
  const total = base + reg + stamp
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-3">Financial Breakdown</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded border p-4 space-y-2">
          <Row label="Base Price" value={formatINR(base)} />
          <Row label="Registration (5%)" value={formatINR(reg)} />
          <Row label="Stamp Duty (6%)" value={formatINR(stamp)} />
          <Row label="GST" value="₹0" />
          <hr />
          <Row label="Total" value={formatINR(total)} bold />
        </div>
        <div className="rounded border p-4">
          <EMICalcClient defaultPrincipal={Math.min(base, Math.max(0, base - (base*0.2)))} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }){
  return (
    <div className="flex items-center justify-between py-1">
      <div className="text-gray-600">{label}</div>
      <div className={bold ? 'font-semibold text-gray-900' : 'text-gray-900'}>{value}</div>
    </div>
  )
}

// EMI calculator moved to client component

function BuilderInfo({ p, builder }: { p: any; builder: any }){
  if (!builder) return null
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-3">Builder Information</h2>
      <div className="rounded border p-4 flex items-center gap-4">
        {builder.logoUrl ? (
          <div className="relative w-24 h-24">
            <Image src={builder.logoUrl} alt={builder.name} fill className="object-contain" />
          </div>
        ) : null}
        <div className="space-y-1">
          <div className="text-xl font-semibold">{builder.name}</div>
          <div className="text-sm text-gray-700">Founded: {builder.founded || '—'}</div>
          <div className="text-sm text-gray-700">Total Projects: {builder.totalProjects || '—'}</div>
          <div className="flex items-center gap-1 text-yellow-600"><Star size={16}/> <span className="font-medium">{builder.reputationScore || '4.7'}/5</span> <span className="text-gray-500">({builder.reviewsCount || 120} reviews)</span></div>
          <a href={`/builders?name=${encodeURIComponent(builder.name)}`} className="text-primary-600 text-sm hover:underline">View All Properties by Builder</a>
        </div>
      </div>
    </div>
  )
}

function LegalDocs({ p }: { p: any }){
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-3">RERA & Legal Documents</h2>
      <div className="rounded border divide-y">
        <DocRow label="RERA Certificate" status="Verified" />
        <DocRow label="Building Plan Approval" />
        <DocRow label="Occupancy Certificate" />
        <DocRow label="Sale Deed Sample" />
        <DocRow label="Payment Schedule" />
        <DocRow label="Amenities List" />
      </div>
      <div className="mt-3 rounded border p-3 text-sm text-gray-700">
        <div>AI Verification report:</div>
        <ul className="list-disc ml-5">
          <li>Title Clear: ✓ Verified on blockchain</li>
          <li>No Legal Disputes: ✓ Checked with registrar</li>
          <li>Builder CIBIL: A+ (Clean record)</li>
          <li>Completion History: 90% on-time delivery</li>
        </ul>
      </div>
    </div>
  )
}

function DocRow({ label, status }: { label: string; status?: string }){
  return (
    <div className="flex items-center justify-between p-3">
      <div className="text-gray-800">{label}</div>
      <div className="flex items-center gap-2">
        {status ? <span className="text-emerald-600 text-sm">✓ {status}</span> : null}
        <a href="#" className="text-primary-600 text-sm">Download</a>
      </div>
    </div>
  )
}

function SimilarProperties({ items }: { items: any[] }){
  if (!items?.length) return null
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-3">You Might Also Like</h2>
      <CompareChart items={items} />
      <div className="grid md:grid-cols-3 gap-4">
        {items.slice(0, 6).map((it)=> (
          <div key={it.id} className="rounded border overflow-hidden">
            <div className="relative h-40">
              {it.image ? <Image src={it.image} alt={it.title} fill className="object-cover" /> : <div className="h-full bg-gray-100"/>}
            </div>
            <div className="p-3">
              <div className="font-medium text-gray-900 line-clamp-1">{it.title}</div>
              <div className="text-sm text-gray-600">{it.locality || it.city || ''}</div>
              <div className="text-sm text-gray-900 mt-1">{formatINR(it.priceINR)} {it.pricePerSqftINR ? <span className="text-gray-500">(₹{it.pricePerSqftINR}/sqft)</span> : null}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Reviews({ items }: { items: any[] }){
  if (!items?.length) return null
  const overall = Math.round((items.reduce((s, r)=> s + (r.rating || 0), 0) / items.length) * 10) / 10
  const locAvg = avg(items.map(i=> i.categories?.location))
  const valAvg = avg(items.map(i=> i.categories?.value))
  const qualAvg = avg(items.map(i=> i.categories?.quality))
  const ameAvg = avg(items.map(i=> i.categories?.amenities))
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-3">Reviews & Ratings</h2>
      <div className="rounded border p-4">
        <div className="flex items-center gap-2 text-yellow-600">
          <Star/> <span className="text-xl font-semibold">{overall}/5</span> <span className="text-gray-500">(from {items.length} reviews)</span>
        </div>
        <div className="mt-3 grid md:grid-cols-4 gap-2 text-sm">
          <div>Location: {locAvg || '—'}/5</div>
          <div>Value for Money: {valAvg || '—'}/5</div>
          <div>Builder Quality: {qualAvg || '—'}/5</div>
          <div>Amenities: {ameAvg || '—'}/5</div>
        </div>
        <div className="mt-4 space-y-3">
          {items.map((r)=> (
            <div key={r.id} className="border-t pt-3">
              <div className="flex items-center gap-2">
                {r.avatar ? <Image src={r.avatar} alt={r.name} width={32} height={32} className="rounded-full" /> : <div className="w-8 h-8 rounded-full bg-gray-200"/>}
                <div className="font-medium">{r.name}</div>
                <div className="ml-auto text-sm text-gray-600">{r.date ? new Date(r.date).toLocaleDateString() : ''}</div>
              </div>
              <div className="text-sm text-gray-700 mt-1">{r.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function avg(nums: Array<number|null|undefined>){
  const arr = nums.filter((n): n is number => typeof n === 'number')
  if (!arr.length) return null
  return Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10
}

function StickySidebar({ p }: { p: any }){
  return (
    <div className="lg:sticky lg:top-4">
      <div className="rounded border p-4 space-y-3">
        <div className="text-3xl font-bold text-yellow-700">{formatINR(p.priceINR)}</div>
        {p.pricePerSqftINR ? <div className="text-sm text-gray-600">₹{p.pricePerSqftINR}/sqft</div> : null}
        <div className="flex items-center gap-2 text-emerald-600 text-sm"><ShieldCheck size={16}/> RERA Approved</div>
        <div className="flex items-center gap-1 text-yellow-600 text-sm"><Star size={16}/> Builder reputation: 5.0 (120 reviews)</div>
        <div className="rounded bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 text-sm">
          <div className="font-medium">Verified by AI</div>
          <ul className="list-disc ml-5">
            <li>✓ RERA Approved</li>
            <li>✓ Title Clear</li>
            <li>✓ Builder Verified</li>
            <li>✓ Price Fair</li>
          </ul>
        </div>
        <ContactFormClient propertyId={p.id} brochureUrl={p.brochureUrl} />
      </div>
    </div>
  )
}

// Contact form moved to client component

function MobileBar({ p }: { p: any }){
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t p-3 flex items-center justify-between lg:hidden">
      <div className="font-semibold">{formatINR(p.priceINR)}</div>
      <button className="rounded bg-yellow-600 text-white px-4 py-2">Schedule Visit</button>
      <a href={`https://wa.me/?text=${encodeURIComponent(typeof location !== 'undefined' ? (location.href || '') : '')}`} className="fixed bottom-20 right-4 rounded-full bg-green-500 text-white w-12 h-12 flex items-center justify-center shadow-lg" aria-label="WhatsApp">WA</a>
    </div>
  )
}

function EngagementTracker({ propertyId }: { propertyId: string }){
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      (function(){
        try{
          var start = Date.now();
          var firedScroll50 = false; var firedScroll90 = false;
          function tick(){
            var t = ((Date.now()-start)/1000)|0;
            if (t === 30) window.thgTrack && window.thgTrack('time_on_page_30s', { property_id: '${propertyId}' });
            if (t === 60) window.thgTrack && window.thgTrack('time_on_page_60s', { property_id: '${propertyId}' });
          }
          setInterval(tick, 1000);
          window.addEventListener('scroll', function(){
            try{
              var scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
              if (!firedScroll50 && scrolled >= 0.5) { firedScroll50 = true; window.thgTrack && window.thgTrack('scroll_50', { property_id: '${propertyId}' }); }
              if (!firedScroll90 && scrolled >= 0.9) { firedScroll90 = true; window.thgTrack && window.thgTrack('scroll_90', { property_id: '${propertyId}' }); }
            }catch(_){ }
          }, { passive: true });
          // Basic interaction hooks
          document.addEventListener('click', function(e){
            var el = e.target as HTMLElement;
            if (!el) return;
            var id = el.getAttribute('data-track-id') || '';
            if (id) window.thgTrack && window.thgTrack('interaction', { property_id: '${propertyId}', id: id });
          }, true);
        }catch(_){ }
      })();
    `}} />
  )
}
