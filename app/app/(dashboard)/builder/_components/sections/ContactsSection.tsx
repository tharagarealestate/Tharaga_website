"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  Star,
  TrendingUp,
  Building2,
  Tag,
  MoreVertical,
  Plus,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { SectionWrapper } from './SectionWrapper'
import { builderDesignSystem, getBadgeClassName } from '../design-system'
import { StandardPageWrapper, EmptyState, LoadingState } from '../StandardPageWrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { motion } from 'framer-motion'

interface Contact {
  id: string
  name: string
  email: string
  phone: string | null
  category: 'hot' | 'warm' | 'developing' | 'cold' | 'low'
  score: number
  last_interaction: string | null
  total_interactions: number
  properties_viewed: number
  budget_min?: number | null
  budget_max?: number | null
  preferred_location?: string | null
  notes?: string | null
  tags?: string[]
  created_at: string
}

interface ContactsSectionProps {
  onNavigate?: (section: string) => void
}

export function ContactsSection({ onNavigate }: ContactsSectionProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())

  const supabase = getSupabase()

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get builder profile
      const { data: builder } = await supabase
        .from('builders')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!builder) return

      // Fetch leads as contacts
      const { data: leads, error } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          email,
          phone,
          score,
          category,
          budget_min,
          budget_max,
          preferred_location,
          created_at,
          lead_scores (
            score,
            category,
            last_interaction_at
          )
        `)
        .eq('builder_id', builder.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Transform leads to contacts
      const transformedContacts: Contact[] = (leads || []).map((lead: any) => ({
        id: lead.id,
        name: lead.name || lead.email?.split('@')[0] || 'Unknown',
        email: lead.email,
        phone: lead.phone,
        category: lead.category || lead.lead_scores?.[0]?.category || 'developing',
        score: lead.score || lead.lead_scores?.[0]?.score || 5,
        last_interaction: lead.lead_scores?.[0]?.last_interaction_at || null,
        total_interactions: 0, // TODO: Calculate from interactions table
        properties_viewed: 0, // TODO: Calculate from user_behavior
        budget_min: lead.budget_min,
        budget_max: lead.budget_max,
        preferred_location: lead.preferred_location,
        created_at: lead.created_at,
      }))

      setContacts(transformedContacts)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery)
    
    const matchesCategory = categoryFilter === 'all' || contact.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Use design system badge colors

  const stats = {
    total: contacts.length,
    hot: contacts.filter(c => c.category === 'hot').length,
    warm: contacts.filter(c => c.category === 'warm').length,
    developing: contacts.filter(c => c.category === 'developing').length,
    cold: contacts.filter(c => c.category === 'cold').length,
  }

  return (
    <SectionWrapper>
      <StandardPageWrapper
        title="Contacts"
        subtitle="Manage your contact database, track interactions, and build relationships."
        icon={<Users className={builderDesignSystem.cards.icon} />}
        actionButton={{
          label: 'Add Contact',
          onClick: () => {/* TODO: Add contact modal */},
          icon: <Plus className="w-4 h-4" />,
        }}
      >
        {/* Stats Cards - Custom 5-column grid */}
        <motion.div
          initial={builderDesignSystem.animations.content.initial}
          animate={builderDesignSystem.animations.content.animate}
          transition={builderDesignSystem.animations.content.transition}
          className="grid grid-cols-2 sm:grid-cols-5 gap-4 w-full"
        >
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Hot', value: stats.hot, color: 'text-red-300' },
            { label: 'Warm', value: stats.warm, color: 'text-orange-300' },
            { label: 'Developing', value: stats.developing, color: 'text-blue-300' },
            { label: 'Cold', value: stats.cold, color: 'text-gray-300' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              {...builderDesignSystem.animations.statCard(index)}
            >
              <GlassCard {...builderDesignSystem.cards.statCard.props}>
                <div className="text-sm text-slate-400 mb-1">{stat.label}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters - EXACT card style */}
        <GlassCard {...builderDesignSystem.cards.sectionCard.props}>
          <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-amber-300/25 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400/50 transition-all"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'hot', 'warm', 'developing', 'cold'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      categoryFilter === cat
                        ? 'bg-amber-500 text-white'
                        : 'px-4 py-2 text-slate-300 rounded-lg hover:bg-slate-800/60 hover:text-white transition-all'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Contacts List */}
        {loading ? (
          <LoadingState message="Loading contacts..." />
        ) : filteredContacts.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="No contacts found"
            description={searchQuery || categoryFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Start by adding your first contact'}
            actionButton={!searchQuery && categoryFilter === 'all' ? {
              label: 'Add Your First Contact',
              onClick: () => {/* TODO: Add contact modal */},
            } : undefined}
          />
        ) : (
          <div className={builderDesignSystem.spacing.card}>
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                {...builderDesignSystem.animations.item(index)}
              >
                <GlassCard
                  {...builderDesignSystem.cards.sectionCard.props}
                  className="p-6 hover:border-amber-300/40 transition-all"
                >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{contact.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {contact.email}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(contact.category)}`}>
                        {contact.category.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Score: {contact.score.toFixed(1)}
                      </span>
                      {contact.preferred_location && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {contact.preferred_location}
                        </span>
                      )}
                    </div>
                    {(contact.budget_min || contact.budget_max) && (
                      <div className="text-sm text-slate-300 mb-2">
                        Budget: ₹{contact.budget_min?.toLocaleString('en-IN') || '0'} - ₹{contact.budget_max?.toLocaleString('en-IN') || '∞'}
                      </div>
                    )}
                    {contact.last_interaction && (
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Last interaction: {new Date(contact.last_interaction).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
                      <MoreVertical className="h-5 w-5 text-slate-400" />
                    </button>
                  </div>
                </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </StandardPageWrapper>
    </SectionWrapper>
  )
}

function getCategoryColor(category: string) {
  return getBadgeClassName(category as 'hot' | 'warm' | 'developing' | 'cold')
}

