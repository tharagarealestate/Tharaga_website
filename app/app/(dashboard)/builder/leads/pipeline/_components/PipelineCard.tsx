"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  Eye,
  Mail,
  MessageCircle,
  Phone,
  Star,
  TrendingUp,
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

  const scoreColor = getScoreBadgeColor(lead.lead_score);
  const categoryLabel = getCategoryLabel(lead.lead_category);
  const lastSeen = lead.last_activity_at
    ? `Last seen ${formatDistanceToNow(new Date(lead.last_activity_at), {
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
      className={`cursor-grab rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md ${
        isDragging ? "rotate-3" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-gray-900">
            {lead.lead_name || "Unnamed Lead"}
          </h4>
          {lead.lead_email ? (
            <p className="truncate text-xs text-gray-600">{lead.lead_email}</p>
          ) : null}
        </div>
        <span
          className={`${scoreColor} flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-white`}
        >
          <Star className="h-3 w-3" />
          {lead.lead_score.toFixed(1)}
        </span>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-700">
        <span>{categoryLabel}</span>
        {lead.days_in_stage && lead.days_in_stage > 7 ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
            <Clock className="h-3 w-3" />
            {lead.days_in_stage}d
          </span>
        ) : null}
      </div>

      {lead.deal_value ? (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-emerald-50 p-2 text-sm">
          <div className="flex items-center gap-2 font-semibold text-emerald-900">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            {formatCurrency(Number(lead.deal_value))}
          </div>
          {probability !== null ? (
            <span className="text-xs font-medium text-emerald-700">
              {probability}% probability
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mb-3 space-y-2 text-xs">
        {lastSeen ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Eye className="h-3 w-3" />
            <span>{lastSeen}</span>
          </div>
        ) : null}
        {followUpDate ? (
          <div className="flex items-center gap-2 rounded bg-orange-50 px-2 py-1 text-orange-600">
            <Calendar className="h-3 w-3" />
            <span>Follow up: {followUpDate.toLocaleDateString()}</span>
          </div>
        ) : null}
        {expectedClose ? (
          <div className="flex items-center gap-2 text-blue-600">
            <TrendingUp className="h-3 w-3" />
            <span>Expected close: {expectedClose.toLocaleDateString()}</span>
          </div>
        ) : null}
      </div>

      {lead.notes ? (
        <div className="mb-3 line-clamp-2 rounded bg-gray-50 p-2 text-xs text-gray-700">
          {lead.notes}
        </div>
      ) : null}

      <div className="flex items-center gap-2 border-t border-gray-100 pt-3 text-xs font-medium">
        {lead.lead_phone ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              window.location.href = `tel:${lead.lead_phone}`;
            }}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-50 px-2 py-1.5 text-blue-600 transition-colors hover:bg-blue-100"
          >
            <Phone className="h-3 w-3" />
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
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-purple-50 px-2 py-1.5 text-purple-600 transition-colors hover:bg-purple-100"
          >
            <Mail className="h-3 w-3" />
            Email
          </button>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            // Placeholder for opening detail modal.
          }}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5 text-gray-600 transition-colors hover:bg-gray-100"
        >
          <MessageCircle className="h-3 w-3" />
          View
        </button>
      </div>

      {overdueFollowUp ? (
        <div className="mt-2 flex items-center gap-2 rounded bg-red-50 px-2 py-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span className="font-medium">Overdue follow-up!</span>
        </div>
      ) : null}
    </motion.div>
  );
});

export default PipelineCard;

function getScoreBadgeColor(score: number) {
  if (score >= 9) return "bg-red-500";
  if (score >= 7) return "bg-orange-500";
  if (score >= 5) return "bg-blue-500";
  return "bg-gray-400";
}

function getCategoryLabel(category?: string | null) {
  if (!category) return "Lead";
  const normalized = category.toLowerCase();
  const map: Record<string, string> = {
    "hot lead": "🔥 Hot",
    hot: "🔥 Hot",
    "warm lead": "☀️ Warm",
    warm: "☀️ Warm",
    "developing lead": "🌱 Developing",
    developing: "🌱 Developing",
    "cold lead": "❄️ Cold",
    cold: "❄️ Cold",
    "low quality": "💤 Low",
    low: "💤 Low",
    "low_quality": "💤 Low",
  };
  return map[normalized] || category;
}

