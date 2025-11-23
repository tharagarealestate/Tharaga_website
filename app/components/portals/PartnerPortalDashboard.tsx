// File: /app/components/portals/PartnerPortalDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  ExternalLink, CheckCircle, XCircle, Clock, AlertTriangle, 
  Eye, Users, TrendingUp, RefreshCw, Plus, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import clsx from 'clsx';

interface PartnerPortalDashboardProps {
  propertyId: string;
}

interface SyndicatedListing {
  id: string;
  portal_listing_id?: string;
  portal_listing_url?: string;
  status: string;
  sync_type: string;
  portal_views: number;
  portal_contacts: number;
  portal_favorites: number;
  synced_at?: string;
  error_message?: string;
  partner_portals?: {
    portal_display_name: string;
    portal_name: string;
  };
  properties?: {
    title: string;
    price: number;
    location: string;
  };
}

interface PortalAccount {
  id: string;
  portal_id: string;
  connection_status: string;
  is_active: boolean;
  auto_sync_enabled: boolean;
  listings_used: number;
  listings_quota?: number;
  successful_syncs: number;
  failed_syncs: number;
  last_sync_at?: string;
  partner_portals?: {
    portal_display_name: string;
    portal_name: string;
  };
}

const PORTAL_COLORS: Record<string, string> = {
  '99acres': 'from-blue-600 to-blue-700',
  'magicbricks': 'from-orange-600 to-orange-700',
  'housing': 'from-green-600 to-green-700',
  'commonfloor': 'from-purple-600 to-purple-700',
  'nobroker': 'from-red-600 to-red-700',
  'indiaproperty': 'from-indigo-600 to-indigo-700'
};

export default function PartnerPortalDashboard({ propertyId }: PartnerPortalDashboardProps) {
  const supabase = createClientComponentClient();
  
  const [portalAccounts, setPortalAccounts] = useState<PortalAccount[]>([]);
  const [syncedListings, setSyncedListings] = useState<SyndicatedListing[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => {
    loadData();
    subscribeToUpdates();
  }, [propertyId]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load analytics
      const analyticsResponse = await fetch(`/api/portals/analytics/${propertyId}`);
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
        setSyncedListings(analyticsData.data.portal_breakdown || []);
      }
      
      // Load portal accounts for this builder
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: accounts } = await supabase
          .from('builder_portal_accounts')
          .select('*, partner_portals!inner(*)')
          .eq('builder_id', user.id)
          .order('created_at');
        
        setPortalAccounts(accounts || []);
      }
      
    } catch (error) {
      console.error('Failed to load portal data:', error);
      toast.error('Failed to load portal data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`portal-syndication-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'syndicated_listings',
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
  
  const handleSyncToPortal = async (portalAccountId: string) => {
    setIsSyncing(true);
    
    try {
      const response = await fetch('/api/portals/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          portal_account_id: portalAccountId,
          sync_type: 'create'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Portal sync queued! It will be processed shortly.');
        setTimeout(() => loadData(), 3000);
      } else {
        throw new Error(data.error || 'Failed to sync');
      }
    } catch (error) {
      console.error('Portal sync failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to sync to portal');
    } finally {
      setIsSyncing(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string; icon: any }> = {
      synced: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Synced', icon: CheckCircle },
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending', icon: Clock },
      queued: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Queued', icon: Clock },
      failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed', icon: XCircle }
    };
    
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={clsx("text-xs flex items-center gap-1", config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };
  
  const getPortalColor = (portalName: string) => {
    return PORTAL_COLORS[portalName] || 'from-gray-500 to-gray-600';
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-300">Loading portal data...</p>
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
              <span className="text-xs sm:text-sm text-primary-300">Total Portals</span>
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{analytics.total_portals || 0}</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-primary-300">Total Views</span>
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {(analytics.total_views || 0).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-primary-300">Total Contacts</span>
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {(analytics.total_contacts || 0).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-primary-300">Success Rate</span>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gold-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {portalAccounts.length > 0
                ? ((portalAccounts.reduce((sum, a) => sum + (a.successful_syncs || 0), 0) /
                   Math.max(portalAccounts.reduce((sum, a) => sum + (a.successful_syncs || 0) + (a.failed_syncs || 0), 1), 1)) * 100).toFixed(0)
                : 0}%
            </div>
          </div>
        </div>
      )}
      
      {/* Connected Portals */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-lg text-white group relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        
        <div className="relative p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-primary-200 flex items-center gap-2">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
              Connected Partner Portals
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
          
          {portalAccounts.length === 0 ? (
            <div className="text-center py-8 text-primary-300">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base mb-4">No partner portals connected</p>
              <Button className="bg-primary-600 hover:bg-primary-700 text-white min-h-[44px]">
                <Plus className="w-4 h-4 mr-2" />
                Connect Portal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {portalAccounts.map((account) => {
                const portalName = account.partner_portals?.portal_name || '';
                const isConnected = account.connection_status === 'active';
                
                return (
                  <div
                    key={account.id}
                    className={clsx(
                      "bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border transition-all",
                      isConnected ? "border-white/20 hover:border-white/30" : "border-red-500/30"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-semibold text-white truncate">
                          {account.partner_portals?.portal_display_name || portalName}
                        </h4>
                        <p className="text-xs text-primary-300 mt-1">
                          {account.listings_used || 0} / {account.listings_quota || '∞'} listings
                        </p>
                      </div>
                      <Badge className={clsx(
                        "text-xs flex-shrink-0",
                        isConnected ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
                      )}>
                        {isConnected ? 'Active' : 'Disconnected'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-xs sm:text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-primary-300">Synced:</span>
                        <span className="font-medium text-white">{account.successful_syncs || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-primary-300">Failed:</span>
                        <span className="font-medium text-red-400">{account.failed_syncs || 0}</span>
                      </div>
                      {account.last_sync_at && (
                        <div className="text-xs text-primary-400">
                          Last sync: {new Date(account.last_sync_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleSyncToPortal(account.id)}
                      disabled={!isConnected || isSyncing}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white min-h-[44px] text-sm sm:text-base disabled:opacity-50"
                    >
                      {isSyncing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Sync Now
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
      
      {/* Synced Listings */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 shadow-lg text-white group relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        
        <div className="relative p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-primary-200 flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-400" />
            Syndicated Listings ({syncedListings.length})
          </h3>
          
          {syncedListings.length === 0 ? (
            <div className="text-center py-12 text-primary-300">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No listings synced yet. Connect portals and sync to get started!</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <AnimatePresence>
                {syncedListings.map((listing) => {
                  const portalName = listing.partner_portals?.portal_name || '';
                  
                  return (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={clsx(
                            "p-2 rounded-lg bg-gradient-to-br flex-shrink-0",
                            getPortalColor(portalName)
                          )}>
                            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-sm sm:text-base font-semibold text-white capitalize">
                                {listing.partner_portals?.portal_display_name || portalName}
                              </span>
                              {getStatusBadge(listing.status)}
                            </div>
                            
                            {listing.properties && (
                              <p className="text-xs sm:text-sm text-primary-200 mb-2">
                                {listing.properties.title} • {listing.properties.location}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-primary-300">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{listing.portal_views?.toLocaleString() || 0} views</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{listing.portal_contacts?.toLocaleString() || 0} contacts</span>
                              </div>
                              {listing.synced_at && (
                                <div className="text-xs text-primary-400">
                                  Synced: {new Date(listing.synced_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            
                            {listing.error_message && (
                              <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                                {listing.error_message}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {listing.portal_listing_url && (
                          <a
                            href={listing.portal_listing_url}
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



