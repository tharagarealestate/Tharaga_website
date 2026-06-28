"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  Flame,
  Mail,
  MessageCircle,
  Phone,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import type { PipelineLead } from "./types";

interface PipelineCardProps {
  lead: PipelineLead;
  isDragging?: boolean;
}

const PipelineCard = memo(function PipelineCard({
  lead,
  isDragging = false,
}: PipelineCardProps) {
  const probability = typeof lead.probability === "number" ? lead.probability : null;

  const formatCurrency = useMemo(
    () => (amount: number) => {
      if (!Number.isFinite(amount)) return "₹0";
      if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
      if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
      return `₹${amount.toFixed(0)}`;
    },
    []
  );

  const scoreStyles = getScoreStyles(lead.lead_score);
  const categoryInfo = getCategoryInfo(lead.lead_category);
  const lastSeen = lead.last_activity_at
    ? `${formatDistanceToNow(new Date(lead.last_activity_at), {
        addSuffix: true,
      })}`
    : null;

  const followUpDate = lead.next_followup_date
    ? new Date(lead.next_followup_date)
    : null;
  const expectedClose = lead.expected_close_date
    ? new Date(lead.expected_close_date)
    : null;

  const overdueFollowUp =
    followUpDate && followUpDate < new Date(new Date().toDateString());

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`cursor-grab rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-slate-900/95 p-4 shadow-lg backdrop-blur-sm transition-all hover:border-slate-600/50 hover:shadow-xl ${
        isDragging ? "rotate-3 shadow-2xl ring-2 ring-amber-500/50" : ""
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-white">
            {lead.lead_name || "Unnamed Lead"}
          </h4>
          {lead.lead_email ? (
            <p className="truncate text-xs text-slate-400">{lead.lead_email}</p>
          ) : null}
        </div>
        <motion.span
          whileHover={{ scale: 1.1 }}
          className={`${scoreStyles.bg} ${scoreStyles.border} flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${scoreStyles.text} shadow-sm`}
        >
          <Star className="h-3 w-3" />
          {lead.lead_score.toFixed(1)}
        </motion.span>
      </div>

      {/* Category & Days Badge */}
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex items-center gap-1.5 rounded-lg ${categoryInfo.bg} ${categoryInfo.border} border px-2.5 py-1 text-xs font-medium ${categoryInfo.text}`}>
          {categoryInfo.icon}
          {categoryInfo.label}
        </span>
        {lead.days_in_stage && lead.days_in_stage > 7 ? (
          <span className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-xs text-amber-400">
            <Clock className="h-3 w-3" />
            {lead.days_in_stage}d
          </span>
        ) : null}
      </div>

      {/* Deal Value */}
      {lead.deal_value ? (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5">
          <div className="flex items-center gap-2 font-semibold text-emerald-400">
            <div className="p-1 rounded-lg bg-emerald-500/20">
              <DollarSign className="h-4 w-4" />
            </div>
            {formatCurrency(Number(lead.deal_value))}
          </div>
          {probability !== null ? (
            <span className="text-xs font-medium text-emerald-500/80">
              {probability}% win
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Info Section */}
      <div className="mb-3 space-y-2 text-xs">
        {lastSeen ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Eye className="h-3 w-3" />
            <span>Active {lastSeen}</span>
          </div>
        ) : null}
        {followUpDate ? (
          <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
            overdueFollowUp
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
          }`}>
            <Calendar className="h-3 w-3" />
            <span>Follow up: {followUpDate.toLocaleDateString()}</span>
            {overdueFollowUp && <AlertCircle className="h-3 w-3 ml-auto" />}
          </div>
        ) : null}
        {expectedClose ? (
          <div className="flex items-center gap-2 text-blue-400">
            <TrendingUp className="h-3 w-3" />
            <span>Close: {expectedClose.toLocaleDateString()}</span>
          </div>
        ) : null}
      </div>

      {/* Notes */}
      {lead.notes ? (
        <div className="mb-3 line-clamp-2 rounded-lg bg-slate-700/30 border border-slate-700/50 p-2.5 text-xs text-slate-300">
          {lead.notes}
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 border-t border-slate-700/50 pt-3">
        {lead.lead_phone ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              window.location.href = `tel:${lead.lead_phone}`;
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 px-2 py-2 text-xs font-medium text-blue-400 transition-all hover:bg-blue-500/20 hover:scale-105 active:scale-95"
          >
            <Phone className="h-3.5 w-3.5" />
            Call
          </button>
        ) : null}
        {lead.lead_email ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              window.location.href = `mailto:${lead.lead_email}`;
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 px-2 py-2 text-xs font-medium text-purple-400 transition-all hover:bg-purple-500/20 hover:scale-105 active:scale-95"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            // Placeholder for opening detail modal.
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 px-2 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          View
        </button>
      </div>

      {/* Overdue Alert */}
      {overdueFollowUp && !followUpDate ? (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-2.5 py-1.5 text-xs text-red-400"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="font-medium">Overdue follow-up!</span>
        </motion.div>
      ) : null}
    </motion.div>
  );
});

export default PipelineCard;

function getScoreStyles(score: number) {
  if (score >= 9) return {
    bg: "bg-gradient-to-r from-red-500/20 to-orange-500/20",
    border: "border-red-500/40",
    text: "text-red-400"
  };
  if (score >= 7) return {
    bg: "bg-gradient-to-r from-orange-500/20 to-amber-500/20",
    border: "border-orange-500/40",
    text: "text-orange-400"
  };
  if (score >= 5) return {
    bg: "bg-gradient-to-r from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/40",
    text: "text-blue-400"
  };
  return {
    bg: "bg-slate-700/50",
    border: "border-slate-600/50",
    text: "text-slate-400"
  };
}

function getCategoryInfo(category?: string | null) {
  if (!category) return {
    label: "Lead",
    icon: <Sparkles className="h-3 w-3" />,
    bg: "bg-slate-700/50",
    border: "border-slate-600/50",
    text: "text-slate-300"
  };

  const normalized = category.toLowerCase();

  const categoryMap: Record<string, {
    label: string;
    icon: React.ReactNode;
    bg: string;
    border: string;
    text: string;
  }> = {
    "hot lead": {
      label: "Hot",
      icon: <Flame className="h-3 w-3" />,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400"
    },
    "hot": {
      label: "Hot",
      icon: <Flame className="h-3 w-3" />,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400"
    },
    "warm lead": {
      label: "Warm",
      icon: <Sun className="h-3 w-3" />,
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      text: "text-orange-400"
    },
    "warm": {
      label: "Warm",
      icon: <Sun className="h-3 w-3" />,
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      text: "text-orange-400"
    },
    "developing lead": {
      label: "Developing",
      icon: <Zap className="h-3 w-3" />,
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-400"
    },
    "developing": {
      label: "Developing",
      icon: <Zap className="h-3 w-3" />,
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-400"
    },
    "cold lead": {
      label: "Cold",
      icon: <Snowflake className="h-3 w-3" />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-400"
    },
    "cold": {
      label: "Cold",
      icon: <Snowflake className="h-3 w-3" />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-400"
    },
    "low quality": {
      label: "Low",
      icon: <Sparkles className="h-3 w-3" />,
      bg: "bg-slate-700/50",
      border: "border-slate-600/50",
      text: "text-slate-400"
    },
    "low": {
      label: "Low",
      icon: <Sparkles className="h-3 w-3" />,
      bg: "bg-slate-700/50",
      border: "border-slate-600/50",
      text: "text-slate-400"
    },
    "low_quality": {
      label: "Low",
      icon: <Sparkles className="h-3 w-3" />,
      bg: "bg-slate-700/50",
      border: "border-slate-600/50",
      text: "text-slate-400"
    },
  };

  return categoryMap[normalized] || {
    label: category,
    icon: <Sparkles className="h-3 w-3" />,
    bg: "bg-slate-700/50",
    border: "border-slate-600/50",
    text: "text-slate-300"
  };
}
