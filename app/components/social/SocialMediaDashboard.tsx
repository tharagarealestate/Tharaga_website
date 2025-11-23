// File: /app/components/social/SocialMediaDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Share2, Facebook, Instagram, Linkedin, Twitter, 
  TrendingUp, Eye, Heart, MessageCircle, Repeat2,
  ExternalLink, Plus, Settings, RefreshCw, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import clsx from 'clsx';

interface SocialMediaDashboardProps {
  propertyId: string;
}

interface SocialPost {
  id: string;
  platform: string;
  post_content: string;
  post_url?: string;
  status: string;
  posted_at?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  reach: number;
  engagement_rate: number;
  media_urls?: string[];
}

interface SocialAccount {
  id: string;
  platform: string;
  platform_account_name: string;
  connection_status: string;
  is_active: boolean;
  auto_post_enabled: boolean;
}

const PLATFORM_CONFIG = {
  facebook: { icon: Facebook, color: 'from-blue-600 to-blue-700', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' },
  instagram: { icon: Instagram, color: 'from-pink-600 to-purple-600', bgColor: 'bg-pink-500/20', textColor: 'text-pink-400' },
  linkedin: { icon: Linkedin, color: 'from-blue-700 to-blue-800', bgColor: 'bg-blue-600/20', textColor: 'text-blue-400' },
  twitter: { icon: Twitter, color: 'from-blue-400 to-blue-500', bgColor: 'bg-blue-400/20', textColor: 'text-blue-300' }
};

export default function SocialMediaDashboard({ propertyId }: SocialMediaDashboardProps) {
  const supabase = createClientComponentClient();
  
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  
  useEffect(() => {
    loadData();
    subscribeToUpdates();
  }, [propertyId]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load analytics
      const analyticsResponse = await fetch(`/api/social-media/analytics/${propertyId}`);
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
        setPosts(analyticsData.data.posts || []);
      }
      
      // Load connected accounts
      const { data: accountsData } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('is_active', true)
        .order('platform');
      
      setAccounts(accountsData || []);
      
    } catch (error) {
      console.error('Failed to load social media data:', error);
      toast.error('Failed to load social media data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`social-media-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_media_posts',
          filter: `property_id=eq.${propertyId}`
        },
        () => {
          loadData(); // Reload on changes
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  };
  
  const handlePostToSocial = async (accountId: string) => {
    setIsPosting(true);
    
    try {
      const response = await fetch('/api/social-media/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          social_account_id: accountId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Post queued successfully! It will be published shortly.');
        setTimeout(() => loadData(), 3000);
      } else {
        throw new Error(data.error || 'Failed to post');
      }
    } catch (error) {
      console.error('Post to social media failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post to social media');
    } finally {
      setIsPosting(false);
    }
  };
  
  const getPlatformIcon = (platform: string) => {
    const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
    return config ? config.icon : Share2;
  };
  
  const getPlatformColor = (platform: string) => {
    const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
    return config ? config.color : 'from-gray-500 to-gray-600';
  };
  
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'posted': 'bg-green-500/20 text-green-400 border-green-500/30',
      'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'queued': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'failed': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-300">Loading social media data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-primary-300">Total Posts</span>
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{analytics.total_posts || 0}</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-primary-300">Total Reach</span>
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{analytics.total_reach || 0}</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-primary-300">Total Engagement</span>
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{analytics.total_engagement || 0}</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-primary-300">Avg. Engagement</span>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {analytics.total_posts > 0 
                ? ((analytics.total_engagement / analytics.total_posts) || 0).toFixed(0)
                : 0}
            </div>
          </div>
        </div>
      )}
      
      {/* Connected Accounts */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-lg text-white group relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        
        <div className="relative p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-primary-200 flex items-center gap-2">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
              Connected Social Accounts
            </h3>
            <Button
              onClick={loadData}
              variant="invisible"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-primary-300">
              <Share2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base mb-4">No social media accounts connected</p>
              <Button className="bg-primary-600 hover:bg-primary-700 text-white min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />
                Connect Account
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {accounts.map((account) => {
                const Icon = getPlatformIcon(account.platform);
                const isConnected = account.connection_status === 'active';
                
                return (
                  <div
                    key={account.id}
                    className={clsx(
                      "bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border transition-all",
                      isConnected ? "border-white/20 hover:border-white/30" : "border-red-500/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={clsx(
                        "p-2 rounded-lg bg-gradient-to-br",
                        getPlatformColor(account.platform)
                      )}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <Badge className={clsx(
                        "text-xs",
                        isConnected ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
                      )}>
                        {isConnected ? 'Active' : 'Disconnected'}
                      </Badge>
                    </div>
                    
                    <h4 className="text-sm sm:text-base font-semibold text-white mb-1">
                      {account.platform_account_name || account.platform}
                    </h4>
                    <p className="text-xs text-primary-300 mb-3 capitalize">{account.platform}</p>
                    
                    <Button
                      onClick={() => handlePostToSocial(account.id)}
                      disabled={!isConnected || isPosting}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white min-h-[44px] text-sm sm:text-base disabled:opacity-50"
                    >
                      {isPosting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 mr-2" />
                          Post Now
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Posts */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-lg text-white group relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        
        <div className="relative p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-primary-200 flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
            Recent Posts ({posts.length})
          </h3>
          
          {posts.length === 0 ? (
            <div className="text-center py-12 text-primary-300">
              <Share2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No posts yet. Connect accounts and post to get started!</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <AnimatePresence>
                {posts.map((post) => {
                  const Icon = getPlatformIcon(post.platform);
                  
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={clsx(
                            "p-2 rounded-lg bg-gradient-to-br flex-shrink-0",
                            getPlatformColor(post.platform)
                          )}>
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm sm:text-base font-semibold text-white capitalize">{post.platform}</span>
                              <Badge className={clsx("text-xs", getStatusColor(post.status))}>
                                {post.status}
                              </Badge>
                            </div>
                            
                            <p className="text-xs sm:text-sm text-primary-200 mb-3 line-clamp-2 break-words">
                              {post.post_content}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-primary-300">
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{post.likes_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{post.comments_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Repeat2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{post.shares_count || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{post.reach || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {post.post_url && (
                          <a
                            href={post.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <ExternalLink className="w-4 h-4 text-white" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



