'use client';

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
import type { RecommendationItem } from '@/types/recommendations';
import { PageWrapper } from '@/components/ui/PageWrapper';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionWrapper } from '@/components/ui/SectionWrapper';
import { GlassCard } from '@/components/ui/glass-card';
import { StatsCard } from '@/components/ui/StatsCard';
import { DESIGN_TOKENS } from '@/lib/design-system';

const RecommendationsCarousel = dynamic(
  () => import('@/features/recommendations/RecommendationsCarousel').then((m) => m.RecommendationsCarousel),
  { ssr: false }
);

type SavedItem = {
  property_id: string;
  title: string;
  image_url: string;
  specs?: {
    bedrooms?: number | null;
    area_sqft?: number | null;
  };
  saved_at: number;
};

function BuyerDashboardContent() {
  const [greeting, setGreeting] = useState('Good Evening');
  const [userName, setUserName] = useState('Buyer');
  const [recs, setRecs] = useState<RecommendationItem[]>([]);
  const [recError, setRecError] = useState<string | null>(null);
  const [user, setUser] = useState<any>({ id: 'verified', email: 'buyer@tharaga.co.in' });
  const [savedProperties, setSavedProperties] = useState<SavedItem[]>([]);
  const router = useRouter();

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // ADVANCED SECURITY: Enhanced auth check with role verification
  useEffect(() => {
    // Only run in browser (prevent SSR errors)
    if (typeof window === 'undefined') return;

    async function checkAuthAndRole() {
      try {
        const supabase = getSupabase();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          // User not authenticated - redirect to home and show login modal
          console.log('[Buyer] User not authenticated, redirecting to home');
          if (typeof window !== 'undefined') {
            window.location.href = '/';
            // Trigger login modal on homepage
            setTimeout(() => {
              if (window.__thgOpenAuthModal) {
                window.__thgOpenAuthModal({ next: '/my-dashboard' });
              } else if (window.showLoginPromptModal) {
                window.showLoginPromptModal();
              }
            }, 100);
          }
          return;
        }

        // ADVANCED: Verify user has buyer role or is admin owner
        const userEmail = user.email || '';
        const isAdminOwner = userEmail === 'tharagarealestate@gmail.com';
        
        if (!isAdminOwner) {
          // Check if user has buyer role
          try {
            const { data: roles, error: rolesError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'buyer');

            if (rolesError || !roles || roles.length === 0) {
              // User doesn't have buyer role - redirect to home
              console.log('[Buyer] User does not have buyer role, redirecting');
              if (typeof window !== 'undefined') {
                window.location.href = '/?error=unauthorized&message=You need buyer role to access Buyer Dashboard';
              }
              return;
            }
          } catch (roleError) {
            console.error('[Buyer] Role check error:', roleError);
            // On error, redirect to home for security
            if (typeof window !== 'undefined') {
              window.location.href = '/?error=unauthorized&message=Unable to verify buyer role';
            }
            return;
          }
        }

        // User is authenticated and has buyer role (or is admin owner)
        setUser(user);
        const name = user.user_metadata?.full_name || user.email || 'Buyer';
        setUserName(name.split(' ')[0].split('@')[0]);
      } catch (err) {
        console.error('[Buyer] Auth check failed:', err);
        // On error, redirect to home for security
        if (typeof window !== 'undefined') {
          window.location.href = '/?error=auth_error';
        }
      }
    }

    checkAuthAndRole();
  }, []);

  // Load saved properties from Supabase
  useEffect(() => {
    if (!user?.id) {
      setSavedProperties([]);
      return;
    }

    async function loadSavedProperties() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from('user_favorites')
          .select(`
            *,
            property:properties (
              id, title, locality, city, images, bhk_type, carpet_area, sqft
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Map Supabase data to SavedItem format
        const mapped: SavedItem[] = (data || []).map((fav: any) => {
          const prop = fav.property;
          if (!prop) return null;

          const imageUrl = Array.isArray(prop.images) 
            ? (prop.images[0] || '/placeholder-property.jpg')
            : (prop.images || '/placeholder-property.jpg');

          return {
            property_id: prop.id || fav.property_id,
            title: prop.title || `${prop.locality || ''}, ${prop.city || ''}`.trim() || 'Property',
            image_url: typeof imageUrl === 'string' ? imageUrl : '/placeholder-property.jpg',
            specs: {
              bedrooms: prop.bhk_type || null,
              area_sqft: prop.carpet_area || prop.sqft || null,
            },
            saved_at: fav.created_at ? new Date(fav.created_at).getTime() : Date.now(),
          };
        }).filter(Boolean) as SavedItem[];

        setSavedProperties(mapped);
      } catch (err) {
        console.error('[Buyer Dashboard] Error loading saved properties:', err);
        setSavedProperties([]);
      }
    }

    loadSavedProperties();
  }, [user?.id]);

  // Load recommendations after user is authenticated
  useEffect(() => {
    // Wait for user to be loaded
    if (!user?.id) {
      setRecs([]);
      setRecError(null);
      return;
    }

    async function loadRecommendations() {
      try {
        setRecError(null);
        const sid =
          typeof document !== 'undefined'
            ? document.cookie.match(/(?:^|; )thg_sid=([^;]+)/)?.[1]
            : null;
        
        // Use user_id from authenticated user instead of just session_id
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            session_id: sid, 
            user_id: user.id,
            num_results: 6 
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Buyer Dashboard] Recommendations API error:', response.status, errorText);
          setRecError('Failed to load recommendations');
          setRecs([]);
          return;
        }

        const data = await response.json();
        if (data?.items && Array.isArray(data.items)) {
          setRecs(data.items);
        } else {
          setRecs([]);
        }
      } catch (err) {
        console.error('[Buyer Dashboard] Error loading recommendations:', err);
        setRecError('Failed to load recommendations');
        setRecs([]);
      }
    }

    loadRecommendations();
  }, [user?.id]);

  const savedCount = savedProperties.length;

  // Render immediately - NO blocking loading state (matches admin dashboard pattern)
  return (
    <PageWrapper>
      <main className="flex min-h-screen w-full mx-auto flex-col gap-12 px-6 pb-16 pt-12 sm:px-8 lg:px-12 xl:px-16 overflow-x-hidden">
        {/* Container with proper constraints and overflow handling */}
        <div className="w-full max-w-[1920px] mx-auto">
        <HeroSection greeting={greeting} name={userName} savedCount={savedCount} />

        <SectionWrapper noPadding>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 w-full desktop-grid-item">
            <StatsCard icon={TrendingUp} label="Live Listings" value="12k+" delay={0.1} />
            <StatsCard icon={Shield} label="Zero Brokerage" value="100%" delay={0.15} />
            <StatsCard icon={Award} label="Avg. Satisfaction" value="4.9★" delay={0.2} />
            <StatsCard icon={Zap} label="AI Match Score" value="92%" delay={0.25} />
          </div>
        </SectionWrapper>

        <QuickActions savedCount={savedCount} />

        <RecommendationsSection recs={recs} error={recError} userId={user?.id} />

        <SavedPropertiesSection saved={savedProperties} userId={user?.id} />

        <UpcomingVisitsSection />

        <TrustIndicatorsSection />
        </div>
      </main>
    </PageWrapper>
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
      className="relative overflow-hidden"
    >
      <GlassCard variant="dark" glow border className="px-6 py-10 sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between">
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
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 w-full desktop-grid-item">
      {cards.map((card) => (
        <Link key={card.label} href={card.href} className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 desktop-grid-item">
          <div className="relative flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-3xl border-2 border-amber-300 bg-slate-800/95 p-6 transition-transform duration-200 hover:-translate-y-1 desktop-card min-w-0">
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

function RecommendationsSection({ recs, error, userId }: { recs: RecommendationItem[]; error: string | null; userId?: string }) {
  return (
    <SectionWrapper noPadding>
      <GlassCard variant="dark" glow border className="p-6 sm:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-6"
        >
      <SectionHeader
        title="Perfect matches for you"
        subtitle={`AI-powered recommendations based on your preferences${userId ? ' and search history' : ''}. Each property shows a personalized match score.`}
        icon={<Sparkles className="h-5 w-5 text-emerald-200" />}
        action={{
          label: 'View all properties',
          href: '/property-listing',
        }}
      />
      {recs.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300/30 bg-slate-800/50 p-3 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>
              Match scores are calculated using AI analysis of your preferences, search history, and property features.
            </span>
          </div>
        </div>
      )}
      <Suspense fallback={<GlassCard variant="dark" glow border className="p-8 text-center"><div className={DESIGN_TOKENS.colors.text.primary}>Loading recommendations…</div></GlassCard>}>
        <RecommendationsCarousel items={recs} isLoading={!recs.length && !error} error={error} />
      </Suspense>
        </motion.div>
      </GlassCard>
    </SectionWrapper>
  );
}

// ============================================================
// SAVED PROPERTIES
// ============================================================

function SavedPropertiesSection({ saved, userId }: { saved: SavedItem[]; userId?: string }) {
  return (
    <SectionWrapper noPadding>
      <GlassCard variant="dark" glow border className="p-6 sm:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
      <SectionHeader
        title="Your curated shortlist"
        subtitle="Easily compare features, track price changes, and take the next step. Click any property to see detailed market analysis."
        icon={<Bookmark className="h-5 w-5 text-rose-200" />}
        action={{
          label: 'Manage saved homes',
          href: '/saved',
        }}
      />

      {saved.length === 0 ? (
        <GlassCard variant="dark" glow border className="flex flex-col items-center gap-3 p-10">
          <Bookmark className={`h-12 w-12 ${DESIGN_TOKENS.colors.text.muted}`} />
          <p className={`text-lg font-medium ${DESIGN_TOKENS.colors.text.primary}`}>Save properties to build your personal watchlist</p>
          <p className={`text-sm ${DESIGN_TOKENS.colors.text.muted}`}>Tap the heart icon on any property to bookmark it for later.</p>
          <PrimaryActionButton href="/property-listing" icon={<Search className="h-4 w-4" />}>
            Discover properties
          </PrimaryActionButton>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 w-full desktop-grid-item desktop-overflow-prevention">
          {saved.slice(0, 4).map((item, index) => (
            <motion.div
              key={item.property_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`group relative overflow-hidden rounded-2xl border ${DESIGN_TOKENS.colors.border.default} ${DESIGN_TOKENS.colors.background.card} ${DESIGN_TOKENS.effects.transition} hover:-translate-y-1 desktop-card min-w-0 max-w-full`}
            >
              <Link href={`/properties/${item.property_id}`} className="flex h-full flex-col">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
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
        </motion.div>
      </GlassCard>
    </SectionWrapper>
  );
}

// ============================================================
// UPCOMING VISITS
// ============================================================

function UpcomingVisitsSection() {
  return (
    <SectionWrapper noPadding>
      <GlassCard variant="dark" glow border className="p-6 sm:p-8 space-y-4">
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
          <GlassCard key={item.title} variant="dark" glow border className="p-6">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${DESIGN_TOKENS.colors.background.card}`}>{item.icon}</div>
            <div>
              <h3 className={`font-display text-xl ${DESIGN_TOKENS.colors.text.primary}`}>{item.title}</h3>
              <p className={`mt-2 text-sm ${DESIGN_TOKENS.colors.text.secondary}`}>{item.description}</p>
            </div>
            <ArrowRight className={`mt-2 h-4 w-4 ${DESIGN_TOKENS.colors.text.muted}`} />
          </GlassCard>
        ))}
      </div>
      </GlassCard>
    </SectionWrapper>
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
  // This component is now replaced by StatsCard in the main render
  // Keeping for backward compatibility if used elsewhere
  return (
    <GlassCard variant="dark" glow border className="p-6">
      <div className="flex flex-col gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${DESIGN_TOKENS.colors.background.card}`}>{icon}</div>
        <div className={`text-4xl font-bold ${DESIGN_TOKENS.colors.text.primary}`}>{value}</div>
        <div className={`text-sm uppercase tracking-[0.3em] ${DESIGN_TOKENS.colors.text.muted}`}>{label}</div>
      </div>
    </GlassCard>
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
    <GlassCard variant="dark" glow border className="p-4">
      <div className={`flex items-center justify-between text-xs uppercase tracking-[0.28em] ${DESIGN_TOKENS.colors.text.muted}`}>
        {title}
        {icon}
      </div>
      <div className={`text-2xl font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{value}</div>
      <p className={`text-sm ${DESIGN_TOKENS.colors.text.secondary}`}>{caption}</p>
    </GlassCard>
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
        {icon && <div className={`rounded-2xl ${DESIGN_TOKENS.colors.background.card} p-3`}>{icon}</div>}
        <div>
          <h2 className={`font-display text-2xl ${DESIGN_TOKENS.colors.text.primary}`}>{title}</h2>
          <p className={`mt-1 text-sm ${DESIGN_TOKENS.colors.text.secondary}`}>{subtitle}</p>
        </div>
      </div>
      {action && (
        <Link
          href={action.href}
          className={`group inline-flex items-center gap-2 rounded-full border-2 ${DESIGN_TOKENS.effects.border.amberClass} ${DESIGN_TOKENS.colors.background.card} px-4 py-2 text-sm font-medium ${DESIGN_TOKENS.colors.text.primary} ${DESIGN_TOKENS.effects.transition} hover:border-amber-400 hover:bg-slate-700/80`}
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
      className={`inline-flex items-center gap-2 rounded-full border ${DESIGN_TOKENS.colors.border.default} ${DESIGN_TOKENS.colors.background.card} px-6 py-3 text-sm font-semibold ${DESIGN_TOKENS.colors.text.primary} ${DESIGN_TOKENS.effects.transition} hover:border-amber-300/50 hover:bg-slate-700/50`}
    >
      {icon}
      {children}
    </Link>
  );
}

/**
 * My Dashboard - Advanced Buyer Dashboard
 *
 * Consolidated dashboard with all improvements:
 * - Light gold borders (border-2 border-amber-300)
 * - Clear text (text-white, text-slate-200)
 * - Solid backgrounds (bg-slate-800/95, bg-slate-900/95)
 * - Simplified loading (no popup animations)
 * - Proper UX psychology-based layout
 */
export default function MyDashboardPage() {
  return <BuyerDashboardContent />
}
