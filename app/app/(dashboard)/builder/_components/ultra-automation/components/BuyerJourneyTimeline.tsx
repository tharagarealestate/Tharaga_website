/**
 * Buyer Journey Timeline Component
 * Displays complete buyer journey with email sequences, suggestions, and engagement
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBuyerJourney } from '../hooks/useUltraAutomationData';
import { formatSmartDate } from '../utils/dataProcessing';
import { LoadingSpinner, GlassLoadingOverlay } from '@/components/ui/loading-spinner';
import { builderGlassPanel, builderGlassSubPanel } from '../../builderGlassStyles';

interface BuyerJourneyTimelineProps {
  leadId?: string;
  journeyId?: string;
}

export function BuyerJourneyTimeline({ leadId, journeyId }: BuyerJourneyTimelineProps) {
  const { data, isLoading, error } = useBuyerJourney({ leadId, journeyId });

  const journey = data?.journey;
  const emailExecutions = data?.emailExecutions || [];
  const suggestions = data?.suggestions || [];
  const viewings = data?.viewings || [];
  const negotiations = data?.negotiations || [];
  const contracts = data?.contracts || [];

  // Merge all timeline events
  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      type: 'email' | 'suggestion' | 'viewing' | 'negotiation' | 'contract' | 'stage';
      timestamp: string;
      title: string;
      description: string;
      status: 'pending' | 'sent' | 'completed' | 'active' | 'cancelled';
      metadata?: any;
    }> = [];

    // Add email executions
    emailExecutions.forEach((email: any) => {
      events.push({
        id: `email-${email.id}`,
        type: 'email',
        timestamp: email.scheduled_at || email.sent_at || email.created_at,
        title: `Email: ${email.sequence?.name || 'Sequence Email'}`,
        description: email.subject || 'Email sent',
        status: email.status === 'sent' ? 'sent' : email.status === 'delivered' ? 'completed' : 'pending',
        metadata: email,
      });
    });

    // Add communication suggestions
    suggestions.forEach((suggestion: any) => {
      events.push({
        id: `suggestion-${suggestion.id}`,
        type: 'suggestion',
        timestamp: suggestion.created_at,
        title: 'AI Communication Suggestion',
        description: suggestion.suggestion_text?.substring(0, 100) || 'Communication suggestion',
        status: suggestion.status === 'used' ? 'completed' : 'pending',
        metadata: suggestion,
      });
    });

    // Add viewings
    viewings.forEach((viewing: any) => {
      events.push({
        id: `viewing-${viewing.id}`,
        type: 'viewing',
        timestamp: viewing.scheduled_at,
        title: `Property Viewing Scheduled`,
        description: viewing.property?.title || 'Viewing scheduled',
        status: viewing.status === 'completed' ? 'completed' : viewing.status === 'cancelled' ? 'cancelled' : 'active',
        metadata: viewing,
      });
    });

    // Add negotiations
    negotiations.forEach((negotiation: any) => {
      events.push({
        id: `negotiation-${negotiation.id}`,
        type: 'negotiation',
        timestamp: negotiation.created_at,
        title: 'Negotiation Started',
        description: `Price: ₹${negotiation.current_price?.toLocaleString() || 'N/A'}`,
        status: negotiation.status === 'completed' ? 'completed' : 'active',
        metadata: negotiation,
      });
    });

    // Add contracts
    contracts.forEach((contract: any) => {
      events.push({
        id: `contract-${contract.id}`,
        type: 'contract',
        timestamp: contract.created_at,
        title: `Contract ${contract.status}`,
        description: `Contract ${contract.status}`,
        status: contract.status === 'signed' ? 'completed' : contract.status === 'sent' ? 'sent' : 'pending',
        metadata: contract,
      });
    });

    // Add stage changes
    if (journey) {
      events.push({
        id: `stage-${journey.current_stage}`,
        type: 'stage',
        timestamp: journey.updated_at || journey.created_at,
        title: `Current Stage: ${journey.current_stage?.replace(/_/g, ' ').toUpperCase()}`,
        description: `Days in stage: ${journey.days_in_stage || 0}`,
        status: 'active',
        metadata: journey,
      });
    }

    // Sort by timestamp
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [emailExecutions, suggestions, viewings, negotiations, contracts, journey]);

  if (isLoading) {
    return (
      <div className={builderGlassPanel + ' p-6'}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={builderGlassSubPanel + ' h-20 relative'}>
              <GlassLoadingOverlay />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className={builderGlassPanel + ' p-6 text-center'}>
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-400">
          {error ? 'Failed to load buyer journey' : 'No buyer journey found for this lead'}
        </p>
      </div>
    );
  }

  const stageColors: Record<string, string> = {
    discovery: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    interest: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    evaluation: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    negotiation: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    decision: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    closed: 'text-green-400 bg-green-400/10 border-green-400/20',
  };

  return (
    <div className={builderGlassPanel + ' p-6 space-y-6'}>
      {/* Journey Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Buyer Journey</h3>
          <p className="text-sm text-gray-400">
            Lead: {journey.lead?.lead_buyer_name || 'Unknown'}
          </p>
        </div>
        <div className={cn(
          'px-4 py-2 rounded-lg border text-sm font-medium',
          stageColors[journey.current_stage] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'
        )}>
          {journey.current_stage?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
        </div>
      </div>

      {/* Journey Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Mail}
          label="Emails Sent"
          value={emailExecutions.filter((e: any) => e.status === 'sent' || e.status === 'delivered').length}
          color="text-blue-400"
        />
        <StatCard
          icon={MessageCircle}
          label="Suggestions"
          value={suggestions.length}
          color="text-purple-400"
        />
        <StatCard
          icon={Calendar}
          label="Viewings"
          value={viewings.filter((v: any) => v.status === 'scheduled' || v.status === 'completed').length}
          color="text-yellow-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Engagement"
          value={`${Math.round((journey.engagement_score || 0) * 100)}%`}
          color="text-emerald-400"
        />
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Timeline</h4>
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
          
          {/* Timeline Events */}
          <div className="space-y-6">
            {timelineEvents.map((event, index) => {
              const dateInfo = formatSmartDate(event.timestamp);
              const IconComponent = getEventIcon(event.type);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex gap-4"
                >
                  {/* Timeline Dot */}
                  <div className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2',
                    event.status === 'completed' || event.status === 'sent'
                      ? 'bg-emerald-500/20 border-emerald-500'
                      : event.status === 'active'
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-gray-500/20 border-gray-500'
                  )}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>

                  {/* Event Content */}
                  <div className={cn(builderGlassSubPanel, 'flex-1 p-4')}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="text-sm font-semibold text-white">{event.title}</h5>
                        <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                      </div>
                      <div className="text-xs text-gray-500">{dateInfo.relative}</div>
                    </div>
                    {event.metadata && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        {event.type === 'email' && (
                          <>
                            <Send className="w-3 h-3" />
                            <span>{event.metadata.status || 'Pending'}</span>
                          </>
                        )}
                        {event.type === 'viewing' && (
                          <>
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(event.timestamp).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white/[0.02] backdrop-blur-[12px] border border-white/[0.05] rounded-xl p-4">
      <Icon className={cn('w-5 h-5 mb-2', color)} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function getEventIcon(type: string) {
  switch (type) {
    case 'email':
      return Mail;
    case 'suggestion':
      return MessageCircle;
    case 'viewing':
      return Calendar;
    case 'negotiation':
      return ArrowRight;
    case 'contract':
      return CheckCircle2;
    case 'stage':
      return Clock;
    default:
      return AlertCircle;
  }
}

