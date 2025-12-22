'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Database, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  Send,
  Users,
  AlertCircle,
  BarChart3,
  Globe,
  Newspaper,
  Building2
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface CollectionStats {
  sources: number;
  insights_collected: number;
  insights_saved: number;
  errors: string[];
  timestamp: string;
  execution_time_ms?: number;
}

interface Insight {
  id: string;
  title: string;
  source_type: string;
  category: string;
  processed_at: string;
  sent_at: string | null;
  source_url: string;
}

interface Campaign {
  id: string;
  subject: string;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  sent_at: string;
}

export default function NewsletterMonitoringPage() {
  const router = useRouter();
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [recentInsights, setRecentInsights] = useState<Insight[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?next=/admin/newsletter');
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        router.push('/unauthorized');
        return;
      }

      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const supabase = getSupabase();

      const { data: insights } = await supabase
        .from('newsletter_insights')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(20)
        .neq('source_url', 'internal://collection-run');
      
      if (insights) setRecentInsights(insights as Insight[]);

      const { data: campaigns } = await supabase
        .from('newsletter_campaigns')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);
      
      if (campaigns) setRecentCampaigns(campaigns as Campaign[]);

      const { count } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (count !== null) setSubscribersCount(count);

      const { data: lastRunData } = await supabase
        .from('newsletter_insights')
        .select('metadata, processed_at')
        .eq('source_url', 'internal://collection-run')
        .order('processed_at', { ascending: false })
        .limit(1)
        .single();

      if (lastRunData?.metadata) {
        setStats(lastRunData.metadata as CollectionStats);
        setLastRun(lastRunData.processed_at);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const triggerCollection = async () => {
    try {
      setRefreshing(true);
      const apiKey = process.env.NEXT_PUBLIC_NEWSLETTER_API_KEY || '';
      
      const response = await fetch('/api/newsletter/collect-insights', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.ok) {
        alert(`Collection successful! Collected: ${result.insights_collected}, Saved: ${result.insights_saved}`);
        await loadDashboardData();
      } else {
        alert(`Collection failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'metro':
      case 'government':
        return <Building2 className="w-4 h-4" />;
      case 'rera':
        return <CheckCircle className="w-4 h-4" />;
      case 'real_estate_platform':
        return <Globe className="w-4 h-4" />;
      case 'google_alerts':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Newspaper className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'infrastructure':
        return 'bg-blue-500/20 text-blue-300';
      case 'market_trends':
        return 'bg-green-500/20 text-green-300';
      case 'regulations':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'property_deals':
        return 'bg-purple-500/20 text-purple-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto mt-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full mb-4">
                <Activity className="w-4 h-4 text-gold-300" />
                <span className="text-gold-300 text-sm font-medium">Real-Time Monitoring</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-2">
                Newsletter Automation Dashboard
              </h1>
              <p className="text-xl text-gray-300">
                Monitor Chennai market insights collection in real-time
              </p>
            </div>
            <button
              onClick={triggerCollection}
              disabled={refreshing}
              className="flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Collecting...' : 'Run Collection Now'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Database className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">{stats?.insights_saved || 0}</span>
              </div>
              <p className="text-white/70 text-sm">Total Insights Saved</p>
              <p className="text-white/50 text-xs mt-1">Last 24 hours</p>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold text-white">{stats?.sources || 0}</span>
              </div>
              <p className="text-white/70 text-sm">Data Sources Active</p>
              <p className="text-white/50 text-xs mt-1">20+ Chennai sources</p>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">{subscribersCount}</span>
              </div>
              <p className="text-white/70 text-sm">Active Subscribers</p>
              <p className="text-white/50 text-xs mt-1">Ready to receive</p>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-yellow-400" />
                <span className="text-lg font-bold text-white">
                  {lastRun ? new Date(lastRun).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </span>
              </div>
              <p className="text-white/70 text-sm">Last Collection</p>
              <p className="text-white/50 text-xs mt-1">
                {stats?.execution_time_ms ? `${(stats.execution_time_ms / 1000).toFixed(1)}s` : 'N/A'}
              </p>
            </div>
          </div>

          {stats?.errors && stats.errors.length > 0 && (
            <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-3xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-xl font-bold text-white">Collection Errors</h3>
              </div>
              <ul className="space-y-2">
                {stats.errors.map((error, idx) => (
                  <li key={idx} className="text-red-300 text-sm">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Eye className="w-6 h-6 text-gold-500" />
                  Recent Insights
                </h2>
                <span className="text-white/70 text-sm">{recentInsights.length} items</span>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {recentInsights.length === 0 ? (
                  <p className="text-white/50 text-center py-8">No insights collected yet</p>
                ) : (
                  recentInsights.map((insight) => (
                    <div key={insight.id} className="border-b border-white/10 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getSourceIcon(insight.source_type)}
                          <h3 className="text-white font-semibold text-sm line-clamp-2">
                            {insight.title}
                          </h3>
                        </div>
                        {insight.sent_at ? (
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(insight.category)}`}>
                          {insight.category}
                        </span>
                        <span className="text-white/50 text-xs">
                          {new Date(insight.processed_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Send className="w-6 h-6 text-gold-500" />
                  Campaign Performance
                </h2>
                <span className="text-white/70 text-sm">{recentCampaigns.length} campaigns</span>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {recentCampaigns.length === 0 ? (
                  <p className="text-white/50 text-center py-8">No campaigns sent yet</p>
                ) : (
                  recentCampaigns.map((campaign) => {
                    const openRate = campaign.sent_count > 0 
                      ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)
                      : '0';
                    const clickRate = campaign.sent_count > 0
                      ? ((campaign.clicked_count / campaign.sent_count) * 100).toFixed(1)
                      : '0';

                    return (
                      <div key={campaign.id} className="border-b border-white/10 pb-4 last:border-0">
                        <h3 className="text-white font-semibold mb-3 line-clamp-2">
                          {campaign.subject}
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-white/50 text-xs">Sent</p>
                            <p className="text-white font-bold">{campaign.sent_count}</p>
                          </div>
                          <div>
                            <p className="text-white/50 text-xs">Open Rate</p>
                            <p className="text-white font-bold">{openRate}%</p>
                          </div>
                          <div>
                            <p className="text-white/50 text-xs">Click Rate</p>
                            <p className="text-white font-bold">{clickRate}%</p>
                          </div>
                        </div>
                        <p className="text-white/50 text-xs mt-2">
                          {new Date(campaign.sent_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-gold-500" />
              Data Source Status (20+ Sources)
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                'CMRL (Metro)', 'RERA Tamil Nadu', 'Chennai Corporation', 'TNHB',
                'MagicBricks', '99acres', 'CommonFloor', 'Housing.com',
                'Times of India', 'The Hindu', 'Economic Times', 'DT Next',
                'PropTiger', 'SquareYards', 'Chennai Port', 'Airport Updates',
                'Google Alerts', 'RSS Feeds', 'Local News', 'TN Infrastructure'
              ].map((source) => (
                <div
                  key={source}
                  className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-white/80 text-sm">{source}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




