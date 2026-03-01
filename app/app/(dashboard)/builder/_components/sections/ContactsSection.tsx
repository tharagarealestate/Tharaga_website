"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  List,
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { BuilderPageWrapper } from '../BuilderPageWrapper'
import { StandardStatsCard } from '../design-system/StandardStatsCard'
import { StandardSearchBar } from '../design-system/StandardSearchBar'
import { StandardActionButton } from '../design-system/StandardActionButton'

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

  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list')

  return (
    <BuilderPageWrapper 
      title="Contacts" 
      description="Manage your contact database, track interactions, and build relationships"
      noContainer
    >
      <div className="space-y-6">
        {/* Tabs - Design System (matching leads page) */}
        <div className="flex gap-2 border-b glow-border pb-2 overflow-x-auto">
          {[
            { id: 'list', label: 'All Contacts', icon: List },
            { id: 'add', label: 'Add Contact', icon: Plus },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'add') {
                    // TODO: Add contact modal
                  } else {
                    setActiveTab(tab.id as 'list' | 'add')
                  }
                }}
                className={`px-6 py-3 font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-amber-300 border-b-2 border-amber-300'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content - Design System Container (matching leads page) */}
        <AnimatePresence mode="wait">
          {activeTab === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 sm:p-8 space-y-6">
                {/* Stats - EXACT from leads page design */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StandardStatsCard
                    title="Total"
                    value={stats.total}
                    icon={<Users className="w-5 h-5" />}
                  />
                  <StandardStatsCard
                    title="Hot"
                    value={stats.hot}
                    icon={<TrendingUp className="w-5 h-5" />}
                  />
                  <StandardStatsCard
                    title="Warm"
                    value={stats.warm}
                    icon={<Star className="w-5 h-5" />}
                  />
                  <StandardStatsCard
                    title="Developing"
                    value={stats.developing}
                    icon={<Building2 className="w-5 h-5" />}
                  />
                  <StandardStatsCard
                    title="Cold"
                    value={stats.cold}
                    icon={<Users className="w-5 h-5" />}
                  />
                </div>

                {/* Search and Filters - EXACT from leads page design */}
                <div className="bg-slate-800/95 glow-border rounded-lg p-6">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <StandardSearchBar
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                    />
                    <div className="flex gap-3 w-full lg:w-auto">
                      {['all', 'hot', 'warm', 'developing', 'cold'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all glow-border ${
                            categoryFilter === cat
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-800/95 text-slate-200 hover:bg-slate-700/50'
                          }`}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contacts List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto"></div>
                    <p className="text-slate-400 mt-4">Loading contacts...</p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No contacts found</h3>
                    <p className="text-slate-400 mb-6">
                      {searchQuery || categoryFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Start by adding your first contact'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-6 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/30 hover:glow-border rounded-lg transition-all duration-300"
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BuilderPageWrapper>
  )
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    hot: 'bg-red-500/20 text-red-300 border-red-500/50',
    warm: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    developing: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    cold: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    low: 'bg-gray-700/20 text-gray-300 border-gray-600/50',
  }
  return colors[category] || colors.developing
}

