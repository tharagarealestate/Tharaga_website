/**
 * RERA Compliance Dashboard
 * 
 * Comprehensive dashboard for builders to:
 * - View all RERA registrations
 * - Monitor expiry dates
 * - View compliance alerts
 * - Verify new RERA numbers
 * - Track verification history
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Plus,
  RefreshCw,
  ExternalLink,
  Calendar,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { RERABadge } from '@/components/rera/RERABadge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface RERARegistration {
  id: string;
  rera_number: string;
  rera_state: string;
  project_name: string | null;
  promoter_name: string | null;
  registration_date: string | null;
  expiry_date: string | null;
  status: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending' | null;
  verified: boolean;
  verification_status: string;
  compliance_score: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RERAAlert {
  id: string;
  alert_type: string;
  alert_priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  action_required: string | null;
  read: boolean;
  resolved: boolean;
  created_at: string;
}

export default function RERACompliancePage() {
  const [registrations, setRegistrations] = useState<RERARegistration[]>([]);
  const [alerts, setAlerts] = useState<RERAAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    expired: 0,
    expiringSoon: 0,
    alerts: 0,
  });
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    reraNumber: '',
    state: 'Tamil Nadu',
    projectName: '',
    promoterName: '',
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get user's builder profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: builderProfile } = await supabase
        .from('builder_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!builderProfile) return;

      // Load RERA registrations
      const { data: reraData, error: reraError } = await supabase
        .from('rera_registrations')
        .select('*')
        .eq('builder_id', builderProfile.id)
        .order('created_at', { ascending: false });

      if (!reraError && reraData) {
        setRegistrations(reraData);
      }

      // Load alerts
      const { data: alertData, error: alertError } = await supabase
        .from('rera_alerts')
        .select('*')
        .eq('builder_id', builderProfile.id)
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (!alertError && alertData) {
        setAlerts(alertData);
      }

      // Calculate stats
      const total = reraData?.length || 0;
      const verified = reraData?.filter(r => r.verified || r.verification_status === 'verified').length || 0;
      const pending = reraData?.filter(r => r.verification_status === 'pending').length || 0;
      const expired = reraData?.filter(r => r.status === 'expired').length || 0;
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringSoon = reraData?.filter(r => {
        if (!r.expiry_date) return false;
        const expiry = new Date(r.expiry_date);
        return expiry <= thirtyDaysFromNow && expiry > new Date() && r.status === 'active';
      }).length || 0;

      setStats({
        total,
        verified,
        pending,
        expired,
        expiringSoon,
        alerts: alertData?.length || 0,
      });

    } catch (error) {
      console.error('Error loading RERA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyForm.reraNumber) {
      alert('Please enter a RERA number');
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('/api/rera/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rera_number: verifyForm.reraNumber,
          state: verifyForm.state,
          project_name: verifyForm.projectName,
          promoter_name: verifyForm.promoterName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.verified 
          ? 'RERA verified successfully!' 
          : 'RERA verification is pending. You will be notified once complete.');
        setShowVerifyModal(false);
        setVerifyForm({ reraNumber: '', state: 'Tamil Nadu', projectName: '', promoterName: '' });
        loadData();
      } else {
        alert(result.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const markAlertRead = async (alertId: string) => {
    await supabase
      .from('rera_alerts')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', alertId);
    
    loadData();
  };

  const getDaysUntilExpiry = (expiryDate: string | null): number | null => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const now = new Date();
    return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-700 rounded w-1/4"></div>
            <div className="h-64 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">RERA Compliance</h1>
            <p className="text-slate-400">Manage and monitor your RERA registrations</p>
          </div>
          <button
            onClick={() => setShowVerifyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Verify RERA
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard
            icon={Shield}
            label="Total"
            value={stats.total}
            color="text-blue-400"
          />
          <StatCard
            icon={CheckCircle2}
            label="Verified"
            value={stats.verified}
            color="text-emerald-400"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={stats.pending}
            color="text-amber-400"
          />
          <StatCard
            icon={XCircle}
            label="Expired"
            value={stats.expired}
            color="text-red-400"
          />
          <StatCard
            icon={AlertTriangle}
            label="Expiring Soon"
            value={stats.expiringSoon}
            color="text-orange-400"
          />
          <StatCard
            icon={FileText}
            label="Alerts"
            value={stats.alerts}
            color="text-purple-400"
          />
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 rounded-xl glow-border p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              Active Alerts
            </h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-2 ${
                    alert.alert_priority === 'critical' ? 'border-red-500 bg-red-500/10' :
                    alert.alert_priority === 'high' ? 'border-orange-500 bg-orange-500/10' :
                    alert.alert_priority === 'medium' ? 'border-amber-500 bg-amber-500/10' :
                    'border-slate-600 bg-slate-700/50'
                  } ${!alert.read ? 'ring-2 ring-amber-300' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{alert.title}</h3>
                      <p className="text-slate-300 text-sm mb-2">{alert.message}</p>
                      {alert.action_required && (
                        <p className="text-amber-400 text-sm font-medium">
                          Action Required: {alert.action_required}
                        </p>
                      )}
                    </div>
                    {!alert.read && (
                      <button
                        onClick={() => markAlertRead(alert.id)}
                        className="px-3 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* RERA Registrations Table */}
        <div className="bg-slate-800 rounded-xl glow-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">RERA Registrations</h2>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No RERA registrations yet</p>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                Verify Your First RERA
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-3 text-slate-300">RERA Number</th>
                    <th className="text-left p-3 text-slate-300">Project</th>
                    <th className="text-left p-3 text-slate-300">Status</th>
                    <th className="text-left p-3 text-slate-300">Expiry</th>
                    <th className="text-left p-3 text-slate-300">Compliance</th>
                    <th className="text-left p-3 text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg) => {
                    const daysUntilExpiry = getDaysUntilExpiry(reg.expiry_date);
                    return (
                      <tr key={reg.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="p-3">
                          <div className="font-mono text-white">{reg.rera_number}</div>
                          <div className="text-xs text-slate-400">{reg.rera_state}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-white">{reg.project_name || 'N/A'}</div>
                          {reg.promoter_name && (
                            <div className="text-xs text-slate-400">{reg.promoter_name}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <RERABadge
                            verified={reg.verified}
                            reraNumber={reg.rera_number}
                            status={reg.status}
                            size="sm"
                            variant="inline"
                          />
                        </td>
                        <td className="p-3">
                          {reg.expiry_date ? (
                            <div>
                              <div className="text-white text-sm">
                                {format(new Date(reg.expiry_date), 'MMM dd, yyyy')}
                              </div>
                              {daysUntilExpiry !== null && (
                                <div className={`text-xs ${
                                  daysUntilExpiry <= 0 ? 'text-red-400' :
                                  daysUntilExpiry <= 30 ? 'text-amber-400' :
                                  'text-emerald-400'
                                }`}>
                                  {daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="p-3">
                          {reg.compliance_score !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-700 rounded-full h-2 w-20">
                                <div
                                  className={`h-2 rounded-full ${
                                    reg.compliance_score >= 80 ? 'bg-emerald-500' :
                                    reg.compliance_score >= 60 ? 'bg-amber-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${reg.compliance_score}%` }}
                                />
                              </div>
                              <span className="text-white text-sm">{reg.compliance_score}%</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="p-3">
                          <a
                            href={`https://www.tn-rera.in/search?rera_number=${reg.rera_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm"
                          >
                            Verify <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl glow-border p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Verify RERA Number</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2">RERA Number *</label>
                <input
                  type="text"
                  value={verifyForm.reraNumber}
                  onChange={(e) => setVerifyForm({ ...verifyForm, reraNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg glow-border focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="TN/01/Building/0001/2016"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">State</label>
                <select
                  value={verifyForm.state}
                  onChange={(e) => setVerifyForm({ ...verifyForm, state: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg glow-border focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option>Tamil Nadu</option>
                  <option>Karnataka</option>
                  <option>Maharashtra</option>
                  <option>Gujarat</option>
                  <option>Delhi</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Project Name (Optional)</label>
                <input
                  type="text"
                  value={verifyForm.projectName}
                  onChange={(e) => setVerifyForm({ ...verifyForm, projectName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg glow-border focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2">Promoter Name (Optional)</label>
                <input
                  type="text"
                  value={verifyForm.promoterName}
                  onChange={(e) => setVerifyForm({ ...verifyForm, promoterName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg glow-border focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={verifying || !verifyForm.reraNumber}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-slate-800 rounded-xl glow-border p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-6 h-6 ${color}`} />
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}



