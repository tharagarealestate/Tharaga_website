'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, User, Mail, Phone, Building, DollarSign, MapPin, Info } from 'lucide-react';

interface LeadCRMDetailsPanelProps {
  leadId: string | null;
  onClose: () => void;
}

export function LeadCRMDetailsPanel({ leadId, onClose }: LeadCRMDetailsPanelProps) {
  const [crmData, setCrmData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (leadId) {
      fetchCRMDetails(leadId);
    }
  }, [leadId]);

  const fetchCRMDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/crm/lead/${id}/details`);
      const json = await response.json();

      if (response.ok && json.success) {
        if (json.synced) {
          setCrmData(json.data);
        } else {
          setCrmData(null);
        }
      } else {
        setError(json.error || 'Failed to fetch CRM details');
      }
    } catch (err: any) {
      console.error('Failed to fetch CRM details:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const syncToZoho = async () => {
    if (!leadId) return;
    setSyncing(true);
    try {
      await fetch(`/api/crm/lead/${leadId}/sync`, { method: 'POST' });
      await fetchCRMDetails(leadId);
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (!leadId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 400, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full border-l border-slate-700 bg-slate-800/95 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">CRM Details</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={syncToZoho}
              disabled={syncing || loading}
              className="p-2 hover:bg-slate-700 rounded transition-colors disabled:opacity-50"
              title="Sync with Zoho CRM"
            >
              <RefreshCw className={`w-4 h-4 text-slate-300 ${syncing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && !crmData && (
            <div className="text-center py-8 space-y-4">
              <Info className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <p className="text-slate-400 mb-2">Not synced with Zoho CRM yet</p>
                <button
                  onClick={syncToZoho}
                  disabled={syncing}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded font-medium transition-colors disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          )}

          {!loading && crmData && (
            <>
              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Contact</h4>
                <div className="space-y-2 text-sm">
                  {crmData.Full_Name && (
                    <div className="flex items-center gap-2 text-slate-200">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{crmData.Full_Name}</span>
                    </div>
                  )}
                  {crmData.Email && (
                    <div className="flex items-center gap-2 text-slate-200">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{crmData.Email}</span>
                    </div>
                  )}
                  {crmData.Mobile && (
                    <div className="flex items-center gap-2 text-slate-200">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{crmData.Mobile}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Lead Info</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-slate-700/50 rounded">
                    <div className="text-slate-400 text-xs mb-1">Status</div>
                    <div className="text-white font-medium">{crmData.Lead_Status || 'New'}</div>
                  </div>
                  <div className="p-2 bg-slate-700/50 rounded">
                    <div className="text-slate-400 text-xs mb-1">Source</div>
                    <div className="text-white font-medium">{crmData.Lead_Source || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Budget & Preferences */}
              {(crmData.Budget_Min || crmData.Budget_Max || crmData.Property_Type || crmData.Preferred_Location) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Preferences</h4>
                  <div className="space-y-2 text-sm">
                    {(crmData.Budget_Min || crmData.Budget_Max) && (
                      <div className="flex items-center gap-2 text-slate-200">
                        <DollarSign className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>
                          {crmData.Budget_Min && crmData.Budget_Max
                            ? `₹${(crmData.Budget_Min / 10000000).toFixed(2)}Cr - ₹${(crmData.Budget_Max / 10000000).toFixed(2)}Cr`
                            : crmData.Budget_Max
                            ? `Up to ₹${(crmData.Budget_Max / 10000000).toFixed(2)}Cr`
                            : `From ₹${(crmData.Budget_Min / 10000000).toFixed(2)}Cr`}
                        </span>
                      </div>
                    )}
                    {crmData.Property_Type && (
                      <div className="flex items-center gap-2 text-slate-200">
                        <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{crmData.Property_Type}</span>
                      </div>
                    )}
                    {crmData.Preferred_Location && (
                      <div className="flex items-center gap-2 text-slate-200">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{crmData.Preferred_Location}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {crmData.Description && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Notes</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{crmData.Description}</p>
                </div>
              )}

              {/* Sync Status */}
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-sm text-green-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Synced with Zoho CRM</span>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
