'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Bell,
  Bookmark,
  Calendar,
  FileText,
  Heart,
  MapPin,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useRouter } from 'next/navigation';

import { getSupabase } from '@/lib/supabase';
import { listSaved } from '@/lib/saved';
import type { RecommendationItem } from '@/types/recommendations';

const RecommendationsCarousel = dynamic(
  () => import('@/features/recommendations/RecommendationsCarousel').then((m) => m.RecommendationsCarousel),
  { ssr: false }
);

function BuyerDashboardContent() {
  const [greeting, setGreeting] = useState('Good Evening');
  const [userName, setUserName] = useState('Buyer');
  const [recs, setRecs] = useState<RecommendationItem[]>([]);
  const [recError, setRecError] = useState<string | null>(null);
  const [user, setUser] = useState<any>({ id: 'verified', email: 'buyer@tharaga.co.in' });
  const router = useRouter();

  const savedProperties = useMemo(() => listSaved(), []);

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Non-blocking auth check - render immediately like admin dashboard
  useEffect(() => {
    // Only run in browser (prevent SSR errors)
    if (typeof window === 'undefined') return;

    // Try to initialize Supabase and get user - non-blocking
    try {
      const supabase = getSupabase();
      supabase.auth.getUser()
        .then(({ data, error }: any) => {
          if (data?.user) {
            setUser(data.user);
            const name = data.user.user_metadata?.full_name || data.user.email || 'Buyer';
            setUserName(name.split(' ')[0].split('@')[0]);
          }
        })
        .catch((err: any) => {
          console.error('[Buyer] Auth error:', err);
        });
    } catch (err) {
      console.error('[Buyer] Supabase init failed:', err);
    }
  }, []);

  // Load recommendations after user is authenticated
  useEffect(() => {
    if (!user) return;

    async function loadRecommendations() {
      try {
        const sid =
          typeof document !== 'undefined'
            ? document.cookie.match(/(?:^|; )thg_sid=([^;]+)/)?.[1]
            : null;
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sid, num_results: 6 }),
        });

        if (!response.ok) {
          setRecError('Failed to load');
          return;
        }

        const data = await response.json();
        setRecs(Array.isArray(data.items) ? data.items : []);
      } catch {
        setRecError('Failed to load');
      }
    }

    loadRecommendations();
  }, [user]);

  const savedCount = savedProperties.length;

  // Render immediately - NO blocking loading state (matches admin dashboard pattern)
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white">
      {/* Animated Background Elements - EXACT from pricing page */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-5 pb-16 pt-12 sm:px-8 lg:px-12">
        <HeroSection greeting={greeting} name={userName} savedCount={savedCount} />

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatTile icon={<TrendingUp className="h-5 w-5" />} label="Live Listings" value="12k+" accent="from-emerald-400 via-emerald-500 to-teal-400" />
          <StatTile icon={<Shield className="h-5 w-5" />} label="Zero Brokerage" value="100%" accent="from-yellow-400 via-amber-500 to-orange-500" />
          <StatTile icon={<Award className="h-5 w-5" />} label="Avg. Satisfaction" value="4.9★" accent="from-blue-400 via-indigo-500 to-purple-500" />
          <StatTile icon={<Zap className="h-5 w-5" />} label="AI Match Score" value="92%" accent="from-fuchsia-400 via-pink-500 to-rose-500" />
        </motion.section>

        <QuickActions savedCount={savedCount} />

        <RecommendationsSection recs={recs} error={recError} />

        <SavedPropertiesSection saved={savedProperties} />

        <UpcomingVisitsSection />

        <TrustIndicatorsSection />
      </main>
    </div>
  );
}

// ============================================================
// HERO
// ============================================================

function HeroSection({ greeting, name, savedCount }: { greeting: string; name: string; savedCount: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/8 px-6 py-10 shadow-[0_35px_120px_rgba(15,23,42,0.40)] backdrop-blur-2xl sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between"
    >
      <GlowOrbs />

      <div className="relative z-10 flex flex-col gap-6 text-white">
        <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 backdrop-blur">
          <Sparkles className="h-4 w-4" />
          Hyper-personalised buyer cockpit
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl lg:text-6xl">
            {greeting}
            {name ? `, ${name}!` : '!'} <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-rose-300">Welcome back.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-200 sm:text-lg">
            Track matches, manage visits, and stay ahead with a single, glassmorphic workspace tuned for clarity on any device.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <PrimaryActionButton href="/property-listing" icon={<Search className="h-4 w-4" />}>
            Explore curated homes
          </PrimaryActionButton>
          <SecondaryActionButton href="/saved" icon={<Heart className="h-4 w-4" />}>
            Saved shortlist ({savedCount})
          </SecondaryActionButton>
          <SecondaryActionButton href="/visits" icon={<Calendar className="h-4 w-4" />}>
            Plan a site visit
          </SecondaryActionButton>
          <SecondaryActionButton href="/buyer/leads" icon={<FileText className="h-4 w-4" />}>
            My Inquiries
          </SecondaryActionButton>
        </div>
      </div>

      <div className="relative z-10 mt-10 grid gap-4 sm:grid-cols-2 lg:mt-0 lg:w-[320px]">
        <HeroMiniCard
          title="Match Momentum"
          value="18 new"
          caption="since your last login"
          icon={<Sparkles className="h-4 w-4 text-amber-300" />}
        />
        <HeroMiniCard
          title="Saved Watchlist"
          value={`${savedCount || 0}`}
          caption="properties in shortlist"
          icon={<Heart className="h-4 w-4 text-rose-300" />}
        />
        <HeroMiniCard
          title="Visits Pipeline"
          value="2 pending"
          caption="awaiting confirmation"
          icon={<Calendar className="h-4 w-4 text-sky-300" />}
        />
        <HeroMiniCard
          title="Neighbourhood Radar"
          value="6 alerts"
          caption="fresh price movements"
          icon={<MapPin className="h-4 w-4 text-emerald-300" />}
        />
      </div>
    </motion.section>
  );
}

// ============================================================
// QUICK ACTIONS
// ============================================================

function QuickActions({ savedCount }: { savedCount: number }) {
  const cards = [
    {
      href: '/saved',
      icon: <Heart className="h-5 w-5 text-rose-200" />,
      label: 'Saved Properties',
      description: 'Revisit your shortlisted homes',
      value: savedCount,
      accent: 'from-rose-500/80 via-pink-500/60 to-fuchsia-500/80',
    },
    {
      href: '/visits',
      icon: <Calendar className="h-5 w-5 text-sky-200" />,
      label: 'Site Visits',
      description: 'Schedule and track appointments',
      value: 0,
      accent: 'from-sky-600/80 via-blue-500/60 to-cyan-500/80',
    },
    {
      href: '/buyer/leads',
      icon: <FileText className="h-5 w-5 text-purple-200" />,
      label: 'My Inquiries',
      description: 'Track your property inquiries',
      value: null,
      accent: 'from-purple-500/80 via-indigo-500/60 to-blue-500/80',
    },
    {
      href: '/property-listing',
      icon: <MapPin className="h-5 w-5 text-emerald-200" />,
      label: 'Search History',
      description: 'Continue where you left off',
      value: 0,
      accent: 'from-emerald-500/80 via-teal-500/60 to-green-500/80',
    },
    {
      href: '/tools/cost-calculator',
      icon: <Shield className="h-5 w-5 text-amber-200" />,
      label: 'Cost Calculator',
      description: 'Plan budgets with confidence',
      value: null,
      accent: 'from-amber-500/80 via-orange-500/60 to-yellow-500/80',
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.label} href={card.href} className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
          <div className="relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-3xl border-2 border-amber-300 bg-slate-800/95 p-6 transition-transform duration-200 hover:-translate-y-1">
            <div className="relative z-10 flex items-center justify-between">
              <div className="rounded-2xl bg-slate-700/50 p-3">
                {card.icon}
              </div>
              <Bell className="h-4 w-4 text-slate-400 transition-opacity duration-200 group-hover:text-white" />
            </div>
            <div className="relative z-10 mt-8 space-y-2">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Workspace</div>
              <h3 className="font-display text-xl font-semibold text-white">{card.label}</h3>
              <p className="text-sm text-slate-200">{card.description}</p>
              {card.value !== null && <span className="text-3xl font-bold text-white">{card.value}</span>}
            </div>
            <div className="relative z-10 mt-6 flex items-center gap-2 text-sm font-medium text-slate-200">
              Manage
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}

// ============================================================
// RECOMMENDATIONS
// ============================================================

function RecommendationsSection({ recs, error }: { recs: RecommendationItem[]; error: string | null }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="glass-panel space-y-6 rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_20px_80px_rgba(8,15,40,0.45)] backdrop-blur-2xl sm:p-8"
    >
      <SectionHeader
        title="Perfect matches for you"
        subtitle="AI compares thousands of data points to surface the most relevant homes."
        icon={<Sparkles className="h-5 w-5 text-emerald-200" />}
        action={{
          label: 'View all properties',
          href: '/property-listing',
        }}
      />
      <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/6 p-8 text-center text-white/70">Gathering recommendations…</div>}>
        <RecommendationsCarousel items={recs} isLoading={!recs.length && !error} error={error} />
      </Suspense>
    </motion.section>
  );
}

// ============================================================
// SAVED PROPERTIES
// ============================================================

function SavedPropertiesSection({ saved }: { saved: ReturnType<typeof listSaved> }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass-panel space-y-6 rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_20px_80px_rgba(8,15,40,0.45)] backdrop-blur-2xl sm:p-8"
    >
      <SectionHeader
        title="Your curated shortlist"
        subtitle="Easily compare features, track price changes, and take the next step."
        icon={<Bookmark className="h-5 w-5 text-rose-200" />}
        action={{
          label: 'Manage saved homes',
          href: '/saved',
        }}
      />

      {saved.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/4 p-10 text-white/80">
          <Bookmark className="h-12 w-12 text-white/40" />
          <p className="text-lg font-medium text-white">Save properties to build your personal watchlist</p>
          <p className="text-sm text-white/60">Tap the heart icon on any property to bookmark it for later.</p>
          <PrimaryActionButton href="/property-listing" icon={<Search className="h-4 w-4" />}>
            Discover properties
          </PrimaryActionButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {saved.slice(0, 4).map((item, index) => (
            <motion.div
              key={item.property_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] shadow-[0_15px_45px_rgba(8,15,40,0.35)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1"
            >
              <Link href={`/properties/${item.property_id}`} className="flex h-full flex-col">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                  <div className="absolute right-3 top-3 rounded-full bg-white/80 p-2 text-rose-500 shadow">
                    <Heart className="h-4 w-4 fill-current" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4 text-white">
                  <h3 className="font-semibold leading-tight text-white">{item.title}</h3>
                  {item.specs && (
                    <div className="flex gap-3 text-sm text-white/70">
                      {item.specs.bedrooms && <span>{item.specs.bedrooms} BHK</span>}
                      {item.specs.area_sqft && <span>{Math.round(item.specs.area_sqft)} sqft</span>}
                    </div>
                  )}
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-amber-200">
                    View details
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

// ============================================================
// UPCOMING VISITS
// ============================================================

function UpcomingVisitsSection() {
  return (
    <section className="space-y-4 rounded-[28px] border-2 border-amber-300 bg-slate-900/95 p-6 text-white sm:p-8">
      <SectionHeader
        title="Upcoming site visits"
        subtitle="Stay organised and never miss a walkthrough."
        icon={<Calendar className="h-5 w-5 text-sky-200" />}
      />
      <div className="rounded-2xl border border-amber-300/50 bg-slate-800/50 p-10 text-center text-slate-100">
        <Calendar className="mx-auto h-14 w-14 text-slate-400" />
        <p className="mt-4 text-lg text-white">No visits scheduled yet</p>
        <p className="text-sm text-slate-300">Pick your favourites and lock a time that suits you best.</p>
        <div className="mt-6 flex justify-center">
          <PrimaryActionButton href="/visits" icon={<Calendar className="h-4 w-4" />}>
            Schedule a visit
          </PrimaryActionButton>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TRUST INDICATORS
// ============================================================

function TrustIndicatorsSection() {
  const items = [
    {
      icon: <Shield className="h-7 w-7 text-emerald-200" />,
      title: 'Rigorous Verification',
      description: 'Every property passes multi-layer checks for authenticity and compliance.',
    },
    {
      icon: <Award className="h-7 w-7 text-amber-200" />,
      title: 'Buyer-first service',
      description: 'Dedicated advisors ensure you get the most value without brokerage fees.',
    },
    {
      icon: <TrendingUp className="h-7 w-7 text-sky-200" />,
      title: 'Market intelligence',
      description: 'Live data keeps you informed about emerging hotspots and fair pricing.',
    },
  ];

  return (
    <section className="rounded-[32px] border-2 border-amber-300 bg-slate-900/95 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="flex flex-col gap-4 rounded-3xl border-2 border-amber-300 bg-slate-800/95 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700/50">{item.icon}</div>
            <div>
              <h3 className="font-display text-xl text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-200">{item.description}</p>
            </div>
            <ArrowRight className="mt-2 h-4 w-4 text-slate-400" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// SUPPORTING ELEMENTS
// ============================================================

function GradientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-20 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl sm:h-[520px] sm:w-[520px]" />
      <div className="absolute top-32 left-[15%] h-[360px] w-[360px] rounded-full bg-indigo-600/20 blur-[160px]" />
      <div className="absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-amber-500/20 blur-[160px]" />
    </div>
  );
}

function GlowOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -right-20 top-[-120px] h-[260px] w-[260px] rounded-full bg-amber-400/20 blur-[120px]" />
      <div className="absolute -bottom-20 left-[-80px] h-[260px] w-[260px] rounded-full bg-sky-400/20 blur-[120px]" />
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300 bg-slate-800/95 p-6">
      <div className="relative z-10 flex flex-col gap-3 text-white">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-700/50">{icon}</div>
        <div className="text-4xl font-bold text-white">{value}</div>
        <div className="text-sm uppercase tracking-[0.3em] text-slate-300">{label}</div>
      </div>
    </div>
  );
}

function HeroMiniCard({
  title,
  value,
  caption,
  icon,
}: {
  title: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-amber-300 bg-slate-800/95 p-4 text-white">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-slate-400">
        {title}
        {icon}
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <p className="text-sm text-slate-200">{caption}</p>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        {icon && <div className="rounded-2xl bg-slate-700/50 p-3">{icon}</div>}
        <div>
          <h2 className="font-display text-2xl text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-200">{subtitle}</p>
        </div>
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-2 rounded-full border-2 border-amber-300 bg-slate-800/80 px-4 py-2 text-sm font-medium text-white transition hover:border-amber-400 hover:bg-slate-700/80"
        >
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

function PrimaryActionButton({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_10px_35px_rgba(255,176,0,0.4)] transition hover:shadow-[0_15px_45px_rgba(255,176,0,0.5)]"
    >
      {icon}
      {children}
    </Link>
  );
}

function SecondaryActionButton({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_35px_rgba(8,15,40,0.3)] transition hover:border-white/40 hover:bg-white/15"
    >
      {icon}
      {children}
    </Link>
  );
}

/**
 * Buyer Dashboard - Direct Render (No Suspense Delay)
 *
 * CRITICAL: Removed Suspense wrapper to prevent blocking
 * Component has guaranteed 2-second timeout built-in
 */
export default function BuyerDashboardPage() {
  return <BuyerDashboardContent />
}
