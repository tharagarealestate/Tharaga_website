'use client';

import { useEffect, useState } from 'react';
import { Heart, Search, Eye, Calendar, Clock } from 'lucide-react';

interface BuyerAnalyticsData {
  totalSearches: number;
  propertiesViewed: number;
  savedProperties: number;
  siteVisitsBooked: number;
  avgSessionDuration: number;
  searchHistory: Array<{ query_text?: string; searched_at: string }>;
  viewHistory: Array<{ property?: { title: string }; view_duration: number; viewed_at: string }>;
}

export function BuyerAnalytics({ buyerId }: { buyerId: string }) {
  const [analytics, setAnalytics] = useState<BuyerAnalyticsData>({
    totalSearches: 0,
    propertiesViewed: 0,
    savedProperties: 0,
    siteVisitsBooked: 0,
    avgSessionDuration: 0,
    searchHistory: [],
    viewHistory: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!buyerId) return;
    loadAnalytics();
  }, [buyerId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/buyer/${buyerId}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <Search className="w-8 h-8 text-blue-600 mb-4" />
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {analytics.totalSearches}
          </div>
          <div className="text-sm text-slate-600">Searches</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <Eye className="w-8 h-8 text-purple-600 mb-4" />
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {analytics.propertiesViewed}
          </div>
          <div className="text-sm text-slate-600">Properties Viewed</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <Heart className="w-8 h-8 text-red-600 mb-4" />
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {analytics.savedProperties}
          </div>
          <div className="text-sm text-slate-600">Saved</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <Calendar className="w-8 h-8 text-emerald-600 mb-4" />
          <div className="text-3xl font-bold text-slate-900 mb-1">
            {analytics.siteVisitsBooked}
          </div>
          <div className="text-sm text-slate-600">Site Visits</div>
        </div>
      </div>

      {/* Average Session Duration */}
      <div className="bg-gradient-to-br from-[#D4AF37] to-[#1e40af] rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm mb-2 opacity-90">Average Session Duration</div>
            <div className="text-3xl font-bold">
              {formatDuration(analytics.avgSessionDuration)}
            </div>
          </div>
          <Clock className="w-12 h-12 opacity-75" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Searches */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Searches</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {analytics.searchHistory.length > 0 ? (
              analytics.searchHistory.slice(0, 10).map((search, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Search className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {search.query_text || 'Filter search'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(search.searched_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No searches yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recently Viewed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recently Viewed</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {analytics.viewHistory.length > 0 ? (
              analytics.viewHistory.slice(0, 10).map((view, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Eye className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {view.property?.title || 'Property'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatDuration(view.view_duration)} • {new Date(view.viewed_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No views yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

