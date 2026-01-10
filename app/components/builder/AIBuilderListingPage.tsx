"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  TrendingUp,
  Users,
  Home,
  Star,
  Award,
  Eye,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

interface BuilderMetrics {
  engagement_score: number;
  quality_score: number;
  performance_score: number;
  overall_ranking_score: number;
  total_property_views: number;
  total_leads_received: number;
  conversion_rate: number;
  active_properties_count: number;
}

interface RankedBuilder {
  id: string;
  name: string;
  logo_url?: string;
  reputation_score?: number;
  total_projects?: number;
  reviews_count?: number;
  metrics: BuilderMetrics;
  ranking_position: number;
}

export function AIBuilderListingPage() {
  const [builders, setBuilders] = useState<RankedBuilder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'ranking' | 'engagement' | 'quality' | 'performance'>('ranking');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(0);

  useEffect(() => {
    loadBuilders();
  }, [cityFilter, minScore, sortBy]);

  const loadBuilders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cityFilter) params.append('city', cityFilter);
      if (minScore > 0) params.append('min_score', minScore.toString());

      const response = await fetch(`/api/builders/ranking?${params.toString()}`);
      const data = await response.json();

      if (data.builders) {
        // Sort based on selected criteria
        let sorted = [...data.builders];
        switch (sortBy) {
          case 'engagement':
            sorted.sort((a, b) => (b.metrics?.engagement_score || 0) - (a.metrics?.engagement_score || 0));
            break;
          case 'quality':
            sorted.sort((a, b) => (b.metrics?.quality_score || 0) - (a.metrics?.quality_score || 0));
            break;
          case 'performance':
            sorted.sort((a, b) => (b.metrics?.performance_score || 0) - (a.metrics?.performance_score || 0));
            break;
          default:
            // Already sorted by overall ranking
            break;
        }
        setBuilders(sorted);
      }
    } catch (error) {
      console.error('Error loading builders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
          🥇
        </div>
      );
    } else if (position === 2) {
      return (
        <div className="absolute -top-2 -right-2 bg-gray-300 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
          🥈
        </div>
      );
    } else if (position === 3) {
      return (
        <div className="absolute -top-2 -right-2 bg-orange-300 text-orange-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
          🥉
        </div>
      );
    }
    return null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const filteredBuilders = builders.filter((builder) =>
    builder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award className="w-8 h-8" />
          Top Builders
        </h1>
        <p className="text-gray-600 mt-1">
          AI-powered rankings based on engagement, quality, and performance metrics
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search builders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ranking">Overall Ranking</option>
            <option value="engagement">Engagement Score</option>
            <option value="quality">Quality Score</option>
            <option value="performance">Performance Score</option>
          </select>
          <input
            type="text"
            placeholder="Filter by city..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Min Score"
            min="0"
            max="100"
            value={minScore}
            onChange={(e) => setMinScore(parseFloat(e.target.value) || 0)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-32"
          />
        </div>
      </div>

      {/* Builders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuilders.map((builder) => (
          <motion.div
            key={builder.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition relative"
          >
            {getRankBadge(builder.ranking_position)}

            {/* Builder Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {builder.logo_url ? (
                  <img
                    src={builder.logo_url}
                    alt={builder.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold truncate">{builder.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {builder.reputation_score && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-gray-600">
                        {builder.reputation_score.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {builder.reviews_count && (
                    <span className="text-sm text-gray-500">
                      ({builder.reviews_count} reviews)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ranking Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Score</span>
                <span
                  className={`text-2xl font-bold ${getScoreColor(
                    builder.metrics?.overall_ranking_score || 0
                  )}`}
                >
                  {Math.round(builder.metrics?.overall_ranking_score || 0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${getScoreBgColor(
                    builder.metrics?.overall_ranking_score || 0
                  )} ${getScoreColor(builder.metrics?.overall_ranking_score || 0).replace(
                    'text-',
                    'bg-'
                  )}`}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${builder.metrics?.overall_ranking_score || 0}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Engagement</div>
                <div className="text-sm font-semibold text-blue-600">
                  {Math.round(builder.metrics?.engagement_score || 0)}
                </div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Quality</div>
                <div className="text-sm font-semibold text-green-600">
                  {Math.round(builder.metrics?.quality_score || 0)}
                </div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Performance</div>
                <div className="text-sm font-semibold text-purple-600">
                  {Math.round(builder.metrics?.performance_score || 0)}
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Home className="w-4 h-4" />
                  <span>Properties</span>
                </div>
                <span className="font-medium">
                  {builder.metrics?.active_properties_count || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-4 h-4" />
                  <span>Views</span>
                </div>
                <span className="font-medium">
                  {builder.metrics?.total_property_views || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Leads</span>
                </div>
                <span className="font-medium">
                  {builder.metrics?.total_leads_received || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Conversion</span>
                </div>
                <span className="font-medium">
                  {builder.metrics?.conversion_rate
                    ? `${builder.metrics.conversion_rate.toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <Link
              href={`/builders/${builder.id}`}
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View Builder Profile
            </Link>
          </motion.div>
        ))}
      </div>

      {filteredBuilders.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No builders found</p>
        </div>
      )}
    </div>
  );
}





































