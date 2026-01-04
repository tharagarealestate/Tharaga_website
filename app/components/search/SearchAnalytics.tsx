'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Search, Clock, MapPin } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface PopularSearch {
  id: string;
  search_term: string;
  search_count: number;
  click_through_rate?: number;
}

interface RecentSearch {
  id: string;
  query_text?: string;
  query_type: string;
  searched_at: string;
  filters?: any;
}

interface TopLocation {
  location: string;
  count: number;
}

export function SearchAnalytics() {
  const supabase = getSupabase();
  const [analytics, setAnalytics] = useState({
    totalSearches: 0,
    popularSearches: [] as PopularSearch[],
    recentSearches: [] as RecentSearch[],
    topLocations: [] as TopLocation[]
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get popular searches
      const { data: popular, error: popularError } = await supabase
        .from('popular_searches')
        .select('*')
        .order('search_count', { ascending: false })
        .limit(5);

      if (popularError) {
        console.error('Error loading popular searches:', popularError);
      }

      // Get user's recent searches
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: recent, error: recentError } = await supabase
          .from('search_history')
          .select('*')
          .eq('user_id', user.id)
          .order('searched_at', { ascending: false })
          .limit(10);

        if (recentError) {
          console.error('Error loading recent searches:', recentError);
        }

        setAnalytics({
          totalSearches: recent?.length || 0,
          popularSearches: popular || [],
          recentSearches: recent || [],
          topLocations: extractTopLocations(recent || [])
        });
      } else {
        // Show popular searches even if not logged in
        setAnalytics({
          totalSearches: 0,
          popularSearches: popular || [],
          recentSearches: [],
          topLocations: []
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const extractTopLocations = (searches: RecentSearch[]): TopLocation[] => {
    const locations: Record<string, number> = {};
    
    searches.forEach(search => {
      if (search.filters?.city) {
        locations[search.filters.city] = (locations[search.filters.city] || 0) + 1;
      }
      if (search.filters?.area) {
        locations[search.filters.area] = (locations[search.filters.area] || 0) + 1;
      }
    });

    return Object.entries(locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));
  };

  const formatSearchQuery = (search: RecentSearch): string => {
    if (search.query_text) {
      return search.query_text;
    }
    if (search.filters) {
      const parts: string[] = [];
      if (search.filters.city) parts.push(search.filters.city);
      if (search.filters.area) parts.push(search.filters.area);
      if (search.filters.bhk_type) parts.push(search.filters.bhk_type);
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
    return 'Filter search';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Popular Searches */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="font-bold text-slate-900">Trending Searches</h3>
        </div>
        <div className="space-y-2">
          {analytics.popularSearches.length > 0 ? (
            analytics.popularSearches.map((search) => (
              <div key={search.id} className="text-sm">
                <div className="font-medium text-slate-900">{search.search_term}</div>
                <div className="text-xs text-slate-500">{search.search_count} searches</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">No trending searches yet</div>
          )}
        </div>
      </div>

      {/* Recent Searches */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-[#1e40af]" />
          <h3 className="font-bold text-slate-900">Recent Searches</h3>
        </div>
        <div className="space-y-2">
          {analytics.recentSearches.length > 0 ? (
            analytics.recentSearches.slice(0, 5).map((search) => (
              <div key={search.id} className="text-sm text-slate-700">
                {formatSearchQuery(search)}
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">No recent searches</div>
          )}
        </div>
      </div>

      {/* Top Locations */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900">Top Locations</h3>
        </div>
        <div className="space-y-2">
          {analytics.topLocations.length > 0 ? (
            analytics.topLocations.map((loc, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{loc.location}</span>
                <span className="text-slate-500">{loc.count}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">No location data</div>
          )}
        </div>
      </div>

      {/* Search Stats */}
      <div className="bg-gradient-to-br from-[#D4AF37] to-[#1e40af] rounded-xl shadow-sm p-6 text-white">
        <Search className="w-8 h-8 mb-3 opacity-80" />
        <div className="text-3xl font-bold mb-1">{analytics.totalSearches}</div>
        <div className="text-sm opacity-90">Total Searches</div>
      </div>
    </div>
  );
}
























































