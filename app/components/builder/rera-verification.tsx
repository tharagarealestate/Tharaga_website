'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  FileText,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Award
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { PremiumButton } from '@/components/ui/premium-button';
import { cn } from '@/lib/utils';

interface ReraVerificationProps {
  initialReraNumber?: string;
  builderId?: string;
  onVerificationComplete?: (result: any) => void;
}

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'pending' | 'failed';

export function ReraVerification({ 
  initialReraNumber = '',
  builderId,
  onVerificationComplete 
}: ReraVerificationProps) {
  const [reraNumber, setReraNumber] = useState(initialReraNumber);
  const [state, setState] = useState('Tamil Nadu');
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const states = [
    'Tamil Nadu',
    'Karnataka',
    'Maharashtra',
    'Gujarat',
    'Telangana',
    'Kerala',
    'Andhra Pradesh',
    'West Bengal',
    'Rajasthan',
    'Delhi',
  ];

  const handleVerify = async (forceRefresh = false) => {
    if (!reraNumber.trim()) {
      return;
    }

    setStatus('verifying');
    if (forceRefresh) setIsRefreshing(true);

    try {
      const response = await fetch('/api/rera/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reraNumber: reraNumber.trim(),
          state,
          type: 'builder',
          builderId,
          forceRefresh,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);
      
      if (data.verified) {
        setStatus('verified');
      } else if (data.verificationMethod === 'manual') {
        setStatus('pending');
      } else {
        setStatus('failed');
      }

      onVerificationComplete?.(data);
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const statusConfig = {
    idle: {
      icon: Shield,
      color: 'text-gray-400',
      bg: 'bg-gray-400/10',
      border: 'border-gray-400/20',
    },
    verifying: {
      icon: RefreshCw,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    verified: {
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20',
    },
    pending: {
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
    },
    failed: {
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/20',
    },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <GlassCard variant="light" className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#0F52BA] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              RERA Verification
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Verify your RERA registration status
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              RERA Registration Number
            </label>
            <input
              type="text"
              value={reraNumber}
              onChange={e => setReraNumber(e.target.value.toUpperCase())}
              placeholder="e.g., TN/29/Building/0123/2024"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              disabled={status === 'verifying'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              State
            </label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              disabled={status === 'verifying'}
            >
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <PremiumButton
            variant="primary"
            onClick={() => handleVerify(false)}
            loading={status === 'verifying' && !isRefreshing}
            disabled={!reraNumber.trim()}
            icon={<Shield className="w-4 h-4" />}
          >
            Verify RERA
          </PremiumButton>
          
          {result && (
            <PremiumButton
              variant="outline"
              onClick={() => handleVerify(true)}
              loading={isRefreshing}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </PremiumButton>
          )}
        </div>
      </GlassCard>

      {/* Status & Results */}
      <AnimatePresence mode="wait">
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard 
              variant={status === 'verified' ? 'gold' : status === 'failed' ? 'dark' : 'light'}
              className={cn('p-6', currentStatus.border, 'border')}
            >
              {/* Status Header */}
              <div className="flex items-center gap-4 mb-6">
                <motion.div
                  className={cn('w-14 h-14 rounded-xl flex items-center justify-center', currentStatus.bg)}
                  animate={status === 'verifying' ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: status === 'verifying' ? Infinity : 0, ease: 'linear' }}
                >
                  <StatusIcon className={cn('w-7 h-7', currentStatus.color)} />
                </motion.div>
                <div>
                  <h3 className={cn('text-lg font-bold', currentStatus.color)}>
                    {status === 'verifying' && 'Verifying...'}
                    {status === 'verified' && 'RERA Verified'}
                    {status === 'pending' && 'Verification Pending'}
                    {status === 'failed' && 'Verification Failed'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {status === 'verifying' && 'Checking official records...'}
                    {status === 'verified' && `Confidence: ${Math.round((result?.confidence || 0) * 100)}%`}
                    {status === 'pending' && 'Queued for manual review (24-48 hours)'}
                    {status === 'failed' && (result?.error || 'Could not verify registration')}
                  </p>
                </div>
              </div>

              {/* Verified Data */}
              {status === 'verified' && result?.data && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column - Main Info */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/10">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <Building2 className="w-4 h-4" />
                        Registered Name
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {result.data.registeredName}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/10">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <FileText className="w-4 h-4" />
                        Promoter
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {result.data.promoterName}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {result.data.promoterType}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/10">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                        <MapPin className="w-4 h-4" />
                        Registered Address
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {result.data.registeredAddress}
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Status & Contact */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/10">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <Calendar className="w-4 h-4" />
                          Registration Date
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(result.data.registrationDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/10">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <Calendar className="w-4 h-4" />
                          Expiry Date
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(result.data.expiryDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/10">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <TrendingUp className="w-4 h-4" />
                          Compliance Score
                        </div>
                        <p className={cn(
                          'font-bold text-2xl',
                          result.data.complianceScore >= 80 ? 'text-green-400' :
                          result.data.complianceScore >= 60 ? 'text-amber-400' : 'text-red-400'
                        )}>
                          {result.data.complianceScore}%
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/10">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          Complaints
                        </div>
                        <p className={cn(
                          'font-bold text-2xl',
                          result.data.complaintsCount === 0 ? 'text-green-400' :
                          result.data.complaintsCount <= 2 ? 'text-amber-400' : 'text-red-400'
                        )}>
                          {result.data.complaintsCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Badge for Verified Status */}
              {status === 'verified' && (
                <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-[#0F52BA]/20 border border-[#D4AF37]/30">
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-[#D4AF37]" />
                    <div>
                      <p className="font-semibold text-white">Tharaga Verified Builder</p>
                      <p className="text-sm text-gray-400">
                        This badge will be displayed on your profile
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-400/20 text-green-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Active
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}








