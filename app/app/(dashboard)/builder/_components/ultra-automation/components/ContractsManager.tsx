/**
 * Contracts Manager Component
 * Complete contract management with status tracking and signatures
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Download,
  Eye,
  Signature,
  Calendar,
  User,
  Building2,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContracts } from '../hooks/useUltraAutomationData';
import { analyzeContracts, formatSmartDate } from '../utils/dataProcessing';
import { LoadingSpinner, GlassLoadingOverlay } from '@/components/ui/loading-spinner';
import { ErrorDisplay } from '../../ErrorDisplay';
import type { ApiError } from '../hooks/useUltraAutomationData';

const glassPrimary = 'bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]';
const glassSecondary = 'bg-white/[0.02] backdrop-blur-[12px] border border-white/[0.05] rounded-xl';

interface ContractsManagerProps {
  builderId?: string;
}

export function ContractsManager({ builderId }: ContractsManagerProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'signed' | 'expired'>('all');
  
  const { data, isLoading, error } = useContracts({
    builder_id: builderId,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  // Handle both array and object with isEmpty
  const contracts = Array.isArray(data) ? data : (data?.data || []);
  const isEmpty = !Array.isArray(data) && data?.isEmpty || (Array.isArray(data) && data.length === 0);

  // Analyze contracts
  const analysis = useMemo(() => {
    return analyzeContracts(contracts);
  }, [contracts]);

  if (isLoading) {
    return (
      <div className={glassPrimary + ' p-6'}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={glassSecondary + ' h-32 relative'}>
              <GlassLoadingOverlay />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && !error && isEmpty) {
    return (
      <div className={glassPrimary + ' p-6 text-center'}>
        <FileText className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-blue-400 mb-2">No Contracts Yet</h3>
        <p className="text-gray-400">
          Contracts will appear here once they are created and sent to clients.
        </p>
      </div>
    );
  }

  if (error) {
    const apiError = error as ApiError;
    return (
      <ErrorDisplay
        errorType={apiError.type || 'UNKNOWN_ERROR'}
        message={apiError.userMessage || apiError.message}
        technicalDetails={apiError.technicalDetails}
        onRetry={() => window.location.reload()}
        retryable={apiError.retryable !== false}
      />
    );
  }

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    draft: { icon: FileText, color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', label: 'Draft' },
    sent: { icon: Send, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Sent' },
    signed: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', label: 'Signed' },
    expired: { icon: AlertCircle, color: 'text-red-400 bg-red-400/10 border-red-400/20', label: 'Expired' },
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className={glassPrimary + ' p-6'}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Contracts</h3>
            <p className="text-sm text-gray-400">Manage contracts and track signatures</p>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'draft', 'sent', 'signed', 'expired'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                  statusFilter === filter
                    ? 'bg-gold-500/20 border-gold-500/40 text-gold-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(analysis.byStatus).map(([status, count]) => {
            const config = statusConfig[status] || statusConfig.draft;
            return (
              <StatCard
                key={status}
                icon={config.icon}
                label={config.label}
                value={count}
                color={config.color.split(' ')[0]}
              />
            );
          })}
          <StatCard
            icon={CheckCircle2}
            label="Signed This Month"
            value={analysis.signedThisMonth}
            color="text-emerald-400"
          />
        </div>

        {/* Urgent Alerts */}
        {(analysis.urgent.length > 0 || analysis.expiringSoon.length > 0) && (
          <div className="space-y-2">
            {analysis.urgent.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <span className="font-semibold text-orange-400">
                    {analysis.urgent.length} Urgent: Pending Signature
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  Contracts sent more than 7 days ago without signature
                </p>
              </div>
            )}
            {analysis.expiringSoon.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-yellow-400">
                    {analysis.expiringSoon.length} Draft Expiring Soon
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  Drafts created more than 14 days ago
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {contracts.length === 0 ? (
          <div className={glassPrimary + ' p-12 text-center'}>
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">No contracts found</p>
          </div>
        ) : (
          contracts.map((contract: any) => (
            <ContractCard key={contract.id} contract={contract} />
          ))
        )}
      </div>
    </div>
  );
}

function ContractCard({ contract }: { contract: any }) {
  const dateInfo = formatSmartDate(contract.created_at);
  const statusConfig: Record<string, { icon: any; color: string }> = {
    draft: { icon: FileText, color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
    sent: { icon: Send, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    signed: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
    expired: { icon: AlertCircle, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  };

  const config = statusConfig[contract.status] || statusConfig.draft;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={glassPrimary + ' p-6'}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StatusIcon className={cn('w-5 h-5', config.color.split(' ')[0])} />
            <h5 className="font-semibold text-white">
              Contract #{contract.id.slice(0, 8)}
            </h5>
            <span className={cn('px-3 py-1 rounded-lg border text-xs font-medium', config.color)}>
              {contract.status}
            </span>
          </div>
          {contract.journey?.lead && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <User className="w-4 h-4" />
              <span>{contract.journey.lead.lead_buyer_name || 'Unknown Lead'}</span>
            </div>
          )}
          {contract.journey?.property && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Building2 className="w-4 h-4" />
              <span>{contract.journey.property.title}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Created</div>
          <div className="text-sm text-white">{dateInfo.relative}</div>
          {contract.signed_at && (
            <>
              <div className="text-xs text-gray-400 mt-2 mb-1">Signed</div>
              <div className="text-sm text-emerald-400">
                {formatSmartDate(contract.signed_at).relative}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          {contract.status === 'sent' && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 hover:bg-blue-500/30 transition-all">
              <Signature className="w-4 h-4" />
              Track Signature
            </button>
          )}
          {contract.status === 'signed' && contract.file_path && (
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/30 transition-all">
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-all">
          <Eye className="w-4 h-4" />
          View Details
        </button>
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={glassSecondary + ' p-4'}>
      <Icon className={cn('w-6 h-6 mb-3', color)} />
      <div className={cn('text-2xl font-bold mb-1', color)}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

