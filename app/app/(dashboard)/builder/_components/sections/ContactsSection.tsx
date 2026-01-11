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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hot': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'warm': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'developing': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'cold': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const stats = {
    total: contacts.length,
    hot: contacts.filter(c => c.category === 'hot').length,
    warm: contacts.filter(c => c.category === 'warm').length,
    developing: contacts.filter(c => c.category === 'developing').length,
    cold: contacts.filter(c => c.category === 'cold').length,
  }

  return (
    <SectionWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Contacts</h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl">
              Manage your contact database, track interactions, and build relationships.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white hover:bg-slate-700 transition-all flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white hover:bg-slate-700 transition-all flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Contact
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/95 glow-border rounded-lg p-4 border border-slate-700/50"
          >
            <div className="text-sm text-slate-400 mb-1">Total</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/95 glow-border rounded-lg p-4 border border-slate-700/50"
          >
            <div className="text-sm text-slate-400 mb-1">Hot</div>
            <div className="text-2xl font-bold text-red-300">{stats.hot}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/95 glow-border rounded-lg p-4 border border-slate-700/50"
          >
            <div className="text-sm text-slate-400 mb-1">Warm</div>
            <div className="text-2xl font-bold text-orange-300">{stats.warm}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/95 glow-border rounded-lg p-4 border border-slate-700/50"
          >
            <div className="text-sm text-slate-400 mb-1">Developing</div>
            <div className="text-2xl font-bold text-blue-300">{stats.developing}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/95 glow-border rounded-lg p-4 border border-slate-700/50"
          >
            <div className="text-sm text-slate-400 mb-1">Cold</div>
            <div className="text-2xl font-bold text-gray-300">{stats.cold}</div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/95 glow-border rounded-lg p-4 border border-slate-700/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
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
          <div className="bg-slate-800/95 glow-border rounded-lg p-12 text-center border border-slate-700/50">
            <RefreshCw className="h-8 w-8 animate-spin text-amber-300 mx-auto mb-4" />
            <p className="text-slate-400">Loading contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-slate-800/95 glow-border rounded-lg p-12 text-center border border-slate-700/50">
            <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No contacts found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || categoryFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start by adding your first contact'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <button className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all">
                Add Your First Contact
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/95 glow-border rounded-lg p-6 border border-slate-700/50 hover:border-amber-300/25 transition-all"
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SectionWrapper>
  )
}

