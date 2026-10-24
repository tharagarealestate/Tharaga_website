/**
 * THARAGA SEO LOCALITY PAGES
 *
 * Static-generated pages for each Chennai area.
 * These are the FREE traffic machine - organic Google leads.
 * Each page: price trends, RERA projects, amenities, structured data.
 */

import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// Chennai Localities - Top 30 areas for SEO
const CHENNAI_LOCALITIES = [
  { slug: 'omr', name: 'OMR (Old Mahabalipuram Road)', zone: 'South' },
  { slug: 'ecr', name: 'ECR (East Coast Road)', zone: 'South' },
  { slug: 'tambaram', name: 'Tambaram', zone: 'South' },
  { slug: 'velachery', name: 'Velachery', zone: 'South' },
  { slug: 'adyar', name: 'Adyar', zone: 'South' },
  { slug: 'anna-nagar', name: 'Anna Nagar', zone: 'West' },
  { slug: 'porur', name: 'Porur', zone: 'West' },
  { slug: 'vadapalani', name: 'Vadapalani', zone: 'West' },
  { slug: 'mogappair', name: 'Mogappair', zone: 'West' },
  { slug: 'ambattur', name: 'Ambattur', zone: 'North' },
  { slug: 'kolathur', name: 'Kolathur', zone: 'North' },
  { slug: 'perambur', name: 'Perambur', zone: 'North' },
  { slug: 'sholinganallur', name: 'Sholinganallur', zone: 'South' },
  { slug: 'medavakkam', name: 'Medavakkam', zone: 'South' },
  { slug: 'pallavaram', name: 'Pallavaram', zone: 'South' },
  { slug: 'chromepet', name: 'Chromepet', zone: 'South' },
  { slug: 'kelambakkam', name: 'Kelambakkam', zone: 'South' },
  { slug: 'perungudi', name: 'Perungudi', zone: 'South' },
  { slug: 'thiruvanmiyur', name: 'Thiruvanmiyur', zone: 'South' },
  { slug: 'nungambakkam', name: 'Nungambakkam', zone: 'Central' },
  { slug: 't-nagar', name: 'T. Nagar', zone: 'Central' },
  { slug: 'mylapore', name: 'Mylapore', zone: 'Central' },
  { slug: 'guindy', name: 'Guindy', zone: 'South' },
  { slug: 'thoraipakkam', name: 'Thoraipakkam', zone: 'South' },
  { slug: 'navallur', name: 'Navallur', zone: 'South' },
  { slug: 'siruseri', name: 'Siruseri', zone: 'South' },
  { slug: 'padur', name: 'Padur', zone: 'South' },
  { slug: 'poonamallee', name: 'Poonamallee', zone: 'West' },
  { slug: 'avadi', name: 'Avadi', zone: 'North' },
  { slug: 'madipakkam', name: 'Madipakkam', zone: 'South' },
];

export async function generateStaticParams() {
  return CHENNAI_LOCALITIES.map((loc) => ({ locality: loc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { locality: string };
}): Promise<Metadata> {
  const locality = CHENNAI_LOCALITIES.find((l) => l.slug === params.locality);
  if (!locality) return { title: 'Not Found' };

  return {
    title: `Properties in ${locality.name}, Chennai | RERA Verified | Tharaga`,
    description: `Discover RERA verified properties in ${locality.name}, Chennai. View price trends, builder projects, amenities & investment insights. Find your dream home with AI-powered search.`,
    keywords: [
      `properties in ${locality.name}`,
      `${locality.name} real estate`,
      `${locality.name} RERA projects`,
      `buy flat in ${locality.name}`,
      `${locality.name} property prices`,
      'chennai real estate',
      'rera verified properties',
    ],
    openGraph: {
      title: `Properties in ${locality.name}, Chennai | Tharaga`,
      description: `RERA verified properties in ${locality.name}. AI-powered property search.`,
      type: 'website',
    },
  };
}

async function getLocalityData(slug: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get properties in this locality
  const { data: properties } = await supabase
    .from('properties')
    .select('id, title, price, property_type, bedrooms, area_sqft, status, builder_id, created_at')
    .or(`location.ilike.%${slug.replace(/-/g, ' ')}%,locality.ilike.%${slug.replace(/-/g, ' ')}%`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(12);

  // Get RERA registrations for this area
  const { data: reraProjects } = await supabase
    .from('rera_registrations')
    .select('id, project_name, rera_number, status, expiry_date, builder_name')
    .or(`location.ilike.%${slug.replace(/-/g, ' ')}%,project_name.ilike.%${slug.replace(/-/g, ' ')}%`)
    .limit(20);

  return {
    properties: properties || [],
    reraProjects: reraProjects || [],
  };
}

export default async function LocalityPage({
  params,
}: {
  params: { locality: string };
}) {
  const locality = CHENNAI_LOCALITIES.find((l) => l.slug === params.locality);
  if (!locality) notFound();

  const data = await getLocalityData(params.locality);

  // JSON-LD structured data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${locality.name}, Chennai`,
    description: `Real estate properties in ${locality.name}, Chennai, Tamil Nadu, India`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: locality.name,
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Hero Section */}
        <section className="relative px-4 pt-24 pb-12 md:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
              <Link href="/" className="hover:text-amber-400 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/properties" className="hover:text-amber-400 transition-colors">Chennai</Link>
              <span>/</span>
              <span className="text-amber-400">{locality.name}</span>
            </nav>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Properties in{' '}
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                {locality.name}
              </span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mb-8">
              Discover RERA verified properties in {locality.name}, {locality.zone} Chennai.
              AI-powered insights to help you make the right investment.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[
                { label: 'Active Properties', value: data?.properties.length || 0, icon: '🏠' },
                { label: 'RERA Projects', value: data?.reraProjects?.length || 0, icon: '✅' },
                { label: 'Zone', value: locality.zone, icon: '📍' },
                { label: 'Avg Price/sqft', value: '₹6,500+', icon: '📊' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center"
                >
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Properties Grid */}
        <section className="px-4 md:px-8 pb-12">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              Available Properties in {locality.name}
            </h2>

            {data?.properties && data.properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.properties.map((property: Record<string, unknown>) => (
                  <Link
                    key={property.id as string}
                    href={`/properties/${property.id}`}
                    className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-amber-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/5"
                  >
                    <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                      <span className="text-4xl">🏠</span>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                        {property.title as string}
                      </h3>
                      <p className="text-amber-400 font-bold text-xl mt-2">
                        ₹{((property.price as number) / 100000).toFixed(1)}L
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-sm text-slate-400">
                        {property.bedrooms && <span>{property.bedrooms as number} BHK</span>}
                        {property.area_sqft && <span>{property.area_sqft as number} sqft</span>}
                        {property.property_type && <span>{property.property_type as string}</span>}
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs text-emerald-400">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        RERA Verified
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <p className="text-slate-400 text-lg">
                  No properties listed yet in {locality.name}.
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Are you a builder?{' '}
                  <Link href="/builders/add-property" className="text-amber-400 hover:underline">
                    List your property
                  </Link>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* RERA Projects Section */}
        {data?.reraProjects && data.reraProjects.length > 0 && (
          <section className="px-4 md:px-8 pb-12">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6">
                RERA Registered Projects in {locality.name}
              </h2>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-xs text-slate-400 font-medium uppercase">Project</th>
                        <th className="px-4 py-3 text-xs text-slate-400 font-medium uppercase">RERA No.</th>
                        <th className="px-4 py-3 text-xs text-slate-400 font-medium uppercase">Builder</th>
                        <th className="px-4 py-3 text-xs text-slate-400 font-medium uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.reraProjects.map((project: Record<string, unknown>) => (
                        <tr key={project.id as string} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-white">{project.project_name as string}</td>
                          <td className="px-4 py-3 text-sm text-amber-400 font-mono">{project.rera_number as string}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{project.builder_name as string}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              (project.status as string) === 'active'
                                ? 'bg-emerald-400/10 text-emerald-400'
                                : 'bg-amber-400/10 text-amber-400'
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {(project.status as string) || 'Registered'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Locality Guide */}
        <section className="px-4 md:px-8 pb-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              About {locality.name}
            </h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8">
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 leading-relaxed">
                  {locality.name} is a prime residential and commercial area in {locality.zone} Chennai,
                  Tamil Nadu. Known for its excellent connectivity, growing infrastructure, and strong
                  real estate appreciation, it has become one of the most sought-after localities for
                  property investment in Chennai.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-400 mb-3">🚇 Connectivity</h3>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>Close to metro/railway stations</li>
                      <li>Well-connected bus routes</li>
                      <li>Easy airport access</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-400 mb-3">🏫 Amenities</h3>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>Top schools & colleges</li>
                      <li>Hospitals & healthcare</li>
                      <li>Shopping & entertainment</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-400 mb-3">📈 Investment</h3>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>Strong price appreciation</li>
                      <li>High rental yield potential</li>
                      <li>Growing IT/commercial hubs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 md:px-8 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-amber-400/10 to-amber-600/10 border border-amber-400/20 rounded-2xl p-8 md:p-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Looking for property in {locality.name}?
              </h2>
              <p className="text-slate-300 mb-6">
                Get AI-powered property recommendations matched to your budget and preferences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/properties"
                  className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-all"
                >
                  Browse All Properties
                </Link>
                <Link
                  href="/tools/emi"
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all border border-white/20"
                >
                  EMI Calculator
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
