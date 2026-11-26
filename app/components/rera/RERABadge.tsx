/**
 * RERA Verification Badge Component
 * 
 * Displays RERA verification status with tooltip showing details
 * Used in property cards, detail pages, and builder profiles
 */

'use client';

import { Shield, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RERABadgeProps {
  verified: boolean;
  reraNumber?: string | null;
  status?: 'active' | 'expired' | 'suspended' | 'cancelled' | 'pending' | null;
  expiryDate?: string | null;
  complianceScore?: number | null;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'inline' | 'card';
  className?: string;
  onClick?: () => void;
}

export function RERABadge({
  verified,
  reraNumber,
  status = 'pending',
  expiryDate,
  complianceScore,
  showTooltip = true,
  size = 'md',
  variant = 'badge',
  className = '',
  onClick,
}: RERABadgeProps) {
  const [showTooltipState, setShowTooltipState] = useState(false);

  // Determine badge appearance
  const getBadgeConfig = () => {
    if (!verified || status === 'expired' || status === 'cancelled') {
      return {
        bgColor: 'bg-slate-500',
        textColor: 'text-white',
        icon: AlertCircle,
        label: 'RERA',
        tooltipTitle: 'RERA Not Verified',
        tooltipMessage: reraNumber 
          ? `RERA ${reraNumber} is not verified or has expired`
          : 'RERA verification pending',
      };
    }

    if (status === 'pending') {
      return {
        bgColor: 'bg-amber-500',
        textColor: 'text-white',
        icon: Clock,
        label: 'RERA Pending',
        tooltipTitle: 'RERA Verification Pending',
        tooltipMessage: reraNumber 
          ? `RERA ${reraNumber} verification is in progress`
          : 'RERA verification is pending',
      };
    }

    if (status === 'suspended') {
      return {
        bgColor: 'bg-red-500',
        textColor: 'text-white',
        icon: AlertCircle,
        label: 'RERA Suspended',
        tooltipTitle: 'RERA Suspended',
        tooltipMessage: reraNumber 
          ? `RERA ${reraNumber} has been suspended`
          : 'RERA registration is suspended',
      };
    }

    // Active and verified
    return {
      bgColor: 'bg-emerald-500',
      textColor: 'text-white',
      icon: CheckCircle2,
      label: 'RERA Verified',
      tooltipTitle: 'RERA Verified',
      tooltipMessage: reraNumber 
        ? `RERA ${reraNumber} is verified and active`
        : 'RERA verified',
    };
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'px-2 py-0.5',
      text: 'text-xs',
      icon: 'w-3 h-3',
      gap: 'gap-1',
    },
    md: {
      padding: 'px-2 py-1',
      text: 'text-xs',
      icon: 'w-3.5 h-3.5',
      gap: 'gap-1',
    },
    lg: {
      padding: 'px-3 py-1.5',
      text: 'text-sm',
      icon: 'w-4 h-4',
      gap: 'gap-1.5',
    },
  };

  const sizeStyles = sizeConfig[size];

  // Format expiry date
  const formatExpiryDate = (date: string | null | undefined): string | null => {
    if (!date) return null;
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return date;
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (date: string | null | undefined): number | null => {
    if (!date) return null;
    try {
      const expiry = new Date(date);
      const now = new Date();
      const diff = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  };

  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
  const formattedExpiry = formatExpiryDate(expiryDate);

  // Badge content
  const badgeContent = (
    <div
      className={`
        ${config.bgColor} ${config.textColor} 
        ${sizeStyles.padding} ${sizeStyles.text}
        font-bold rounded-full flex items-center ${sizeStyles.gap}
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:opacity-90' : ''}
        ${variant === 'card' ? 'shadow-lg' : ''}
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      <Icon className={sizeStyles.icon} />
      <span>{config.label}</span>
    </div>
  );

  // Inline variant
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center ${sizeStyles.gap} ${className}`}>
        <Icon className={`${sizeStyles.icon} ${config.textColor}`} />
        <span className={sizeStyles.text}>{config.label}</span>
      </span>
    );
  }

  // Card variant with enhanced styling
  if (variant === 'card') {
    return (
      <div className="relative">
        {badgeContent}
        {showTooltip && showTooltipState && (
          <Tooltip
            title={config.tooltipTitle}
            message={config.tooltipMessage}
            reraNumber={reraNumber}
            expiryDate={formattedExpiry}
            daysUntilExpiry={daysUntilExpiry}
            complianceScore={complianceScore}
            status={status}
          />
        )}
      </div>
    );
  }

  // Default badge variant
  return (
    <div className="relative">
      {badgeContent}
      {showTooltip && showTooltipState && (
        <Tooltip
          title={config.tooltipTitle}
          message={config.tooltipMessage}
          reraNumber={reraNumber}
          expiryDate={formattedExpiry}
          daysUntilExpiry={daysUntilExpiry}
          complianceScore={complianceScore}
          status={status}
        />
      )}
    </div>
  );
}

interface TooltipProps {
  title: string;
  message: string;
  reraNumber?: string | null;
  expiryDate?: string | null;
  daysUntilExpiry?: number | null;
  complianceScore?: number | null;
  status?: string | null;
}

function Tooltip({
  title,
  message,
  reraNumber,
  expiryDate,
  daysUntilExpiry,
  complianceScore,
  status,
}: TooltipProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64"
      >
        <div className="bg-slate-900 text-white rounded-lg shadow-xl border-2 border-amber-300 p-4 text-sm">
          <div className="font-semibold mb-2 text-amber-300">{title}</div>
          <div className="text-slate-200 mb-3">{message}</div>
          
          {reraNumber && (
            <div className="mb-2 pb-2 border-b border-slate-700">
              <div className="text-xs text-slate-400">RERA Number</div>
              <div className="font-mono text-slate-200">{reraNumber}</div>
            </div>
          )}

          {expiryDate && (
            <div className="mb-2 pb-2 border-b border-slate-700">
              <div className="text-xs text-slate-400">Expiry Date</div>
              <div className="text-slate-200">
                {expiryDate}
                {daysUntilExpiry !== null && (
                  <span className={`ml-2 ${
                    daysUntilExpiry <= 30 ? 'text-red-400' : 
                    daysUntilExpiry <= 90 ? 'text-amber-400' : 
                    'text-emerald-400'
                  }`}>
                    ({daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'})
                  </span>
                )}
              </div>
            </div>
          )}

          {complianceScore !== null && complianceScore !== undefined && (
            <div className="mb-2 pb-2 border-b border-slate-700">
              <div className="text-xs text-slate-400">Compliance Score</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      complianceScore >= 80 ? 'bg-emerald-500' :
                      complianceScore >= 60 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${complianceScore}%` }}
                  />
                </div>
                <span className="text-slate-200 text-xs">{complianceScore}%</span>
              </div>
            </div>
          )}

          {status && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Status</div>
                <div className={`text-slate-200 capitalize ${
                  status === 'active' ? 'text-emerald-400' :
                  status === 'expired' ? 'text-red-400' :
                  status === 'suspended' ? 'text-amber-400' :
                  'text-slate-400'
                }`}>
                  {status}
                </div>
              </div>
              {reraNumber && (
                <a
                  href={`https://www.tn-rera.in/search?rera_number=${reraNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 transition-colors"
                >
                  Verify <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="w-3 h-3 bg-slate-900 border-r-2 border-b-2 border-amber-300 transform rotate-45" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook to fetch RERA data for a property
 */
export async function getRERADataForProperty(propertyId: string) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('rera_registrations')
      .select('*')
      .eq('property_id', propertyId)
      .eq('verified', true)
      .or('verification_status.eq.verified,status.eq.active')
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      verified: data.verified || data.verification_status === 'verified',
      reraNumber: data.rera_number,
      status: data.status,
      expiryDate: data.expiry_date,
      complianceScore: data.compliance_score,
    };
  } catch (error) {
    console.error('Error fetching RERA data:', error);
    return null;
  }
}



