'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCw, Link2, Settings, Activity, Loader2, AlertCircle } from 'lucide-react';

export default function ZohoCRMIntegration() {
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [dataCenter, setDataCenter] = useState('in');
  const [error, setError] = useState('');
  
  const supabase = getSupabase();
  
  useEffect(() => {
    fetchConnection();
  }, []);
  
  // Fetch sync logs when connection is available
  useEffect(() => {
    if (connection?.id && connection?.status === 'active') {
      fetchSyncLogs();
    }
  }, [connection?.id, connection?.status]);
  
  const fetchConnection = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: builder } = await supabase
        .from('builders')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!builder) {
        setConnection(null);
        return;
      }
      
      // Query integrations table (matching ZohoClient implementation)
      const { data: conn, error: connError } = await supabase
        .from('integrations')
        .select('*')
        .eq('builder_id', builder.id)
        .eq('integration_type', 'crm')
        .eq('provider', 'zoho')
        .single();
      
      if (connError && connError.code !== 'PGRST116') {
        throw connError;
      }
      
      // Transform to match component expectations
      if (conn) {
        const config = conn.config as any || {};
        setConnection({
          ...conn,
          status: conn.is_active && conn.is_connected ? 'active' : 'disconnected',
          zoho_account_email: conn.crm_account_name || '',
          zoho_org_id: conn.crm_account_id || '',
          last_synced_at: conn.last_sync_at || null,
        });
      } else {
        setConnection(null);
      }
    } catch (err: any) {
      console.error('Error fetching connection:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSyncLogs = async () => {
    try {
      if (!connection?.id) return;
      
      // Query crm_sync_log table (matching ZohoClient implementation)
      const { data: logs } = await supabase
        .from('crm_sync_log')
        .select('*')
        .eq('integration_id', connection.id)
        .order('sync_completed_at', { ascending: false })
        .limit(50);
      
      // Transform to match component expectations
      const transformedLogs = (logs || []).map(log => ({
        ...log,
        created_at: log.sync_completed_at || log.sync_started_at,
        operation: log.sync_type,
        zoho_module: log.sync_direction === 'to_crm' ? 'Contacts' : 'Leads',
      }));
      
      setSyncLogs(transformedLogs);
    } catch (err) {
      console.error('Error fetching sync logs:', err);
    }
  };
  
  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError('');
      
      const response = await fetch('/api/crm/zoho/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_center: dataCenter })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Connection failed');
      }
      
      const { authorization_url } = await response.json();
      
      // Redirect to Zoho OAuth
      window.location.href = authorization_url;
      
    } catch (err: any) {
      setError(err.message);
      setConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
           if (!confirm('Are you sure you want to disconnect Zoho CRM? This will stop all automatic syncing.')) {
             return;
           }
           
           try {
             const { data: { user } } = await supabase.auth.getUser();
             if (!user) throw new Error('Not authenticated');
             
             const { data: builder } = await supabase
               .from('builders')
               .select('id')
               .eq('user_id', user.id)
               .single();
             
             if (!builder) throw new Error('Builder not found');
             
             // Update integrations table
             const { error: updateError } = await supabase
               .from('integrations')
               .update({ 
                 is_active: false,
                 is_connected: false 
               })
               .eq('builder_id', builder.id)
               .eq('integration_type', 'crm')
               .eq('provider', 'zoho');
             
             if (updateError) throw updateError;
             
             setConnection({ 
               ...connection, 
               status: 'disconnected',
               is_active: false,
               is_connected: false
             });
           } catch (err: any) {
             setError(err.message);
           }
         };
  
  const handleSync = async (syncType: string = 'incremental') => {
    try {
      setSyncing(true);
      setError('');
      
      const response = await fetch('/api/crm/zoho/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: connection.id,
          sync_type: syncType
        })
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      await fetchConnection();
      await fetchSyncLogs();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-slate-800/95 glow-border rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-300" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/95 glow-border rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100/10 rounded-lg">
              <Link2 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Zoho CRM Integration</h3>
              <p className="text-sm text-slate-400 mt-1">
                Sync your leads and deals with Zoho CRM for seamless customer management
              </p>
            </div>
          </div>
          
          {connection?.status === 'active' ? (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-slate-700/50 text-slate-300 border border-slate-600/50">
              Not Connected
            </span>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-100 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {!connection || connection.status !== 'active' ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              Connect your Zoho CRM account to start syncing leads and deals automatically.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Zoho Data Center</label>
              <select
                value={dataCenter}
                onChange={(e) => setDataCenter(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="com">United States (.com)</option>
                <option value="eu">Europe (.eu)</option>
                <option value="in">India (.in)</option>
                <option value="com.au">Australia (.com.au)</option>
                <option value="jp">Japan (.jp)</option>
              </select>
              <p className="text-xs text-slate-500">
                Select the data center where your Zoho CRM account is hosted
              </p>
            </div>
            
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Connect Zoho CRM
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Account</p>
                <p className="font-medium text-white">{connection.zoho_account_email}</p>
                <p className="text-xs text-slate-500 mt-2">Org ID: {connection.zoho_org_id}</p>
              </div>
              
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Last Sync</p>
                {connection.last_synced_at ? (
                  <>
                    <p className="font-medium text-white">
                      {new Date(connection.last_synced_at).toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleSync('incremental')}
                      disabled={syncing}
                      className="mt-2 px-3 py-1 text-xs bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20 transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {syncing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      Sync Now
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-slate-400 text-sm">Never synced</p>
                    <button
                      onClick={() => handleSync('full')}
                      disabled={syncing}
                      className="mt-2 px-3 py-1 text-xs bg-white/10 text-white rounded-lg hover:bg-white/20 border border-white/20 transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {syncing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      Initial Sync
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 text-sm bg-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/30 border border-rose-400/30 transition-all"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </motion.div>
      
      {connection?.status === 'active' && syncLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/95 glow-border rounded-lg p-6"
        >
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-300" />
            Recent Sync Logs
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {syncLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-400 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        {log.sync_type} - {log.operation}
                      </p>
                      <p className="text-xs text-slate-400">
                        {log.sync_direction} • {log.zoho_module}
                      </p>
                      {log.error_message && (
                        <p className="text-xs text-rose-400 mt-1">{log.error_message}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}






