"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Target,
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
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    []
  );

  const probability = typeof lead.probability === "number" ? lead.probability : 0;
  const stageAge = lead.entered_stage_at
    ? formatDistanceToNow(new Date(lead.entered_stage_at), { addSuffix: true })
    : "—";
  const lastTouch = lead.last_activity_at
    ? formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true })
    : "No activity yet";

  const dealValue =
    typeof lead.deal_value === "number"
      ? currencyFormatter.format(lead.deal_value)
      : "—";

  return (
    <motion.div
      layout
      layoutId={lead.id}
      initial={{ opacity: 0.85, y: 12 }}
      animate={{ opacity: isDragging ? 0.75 : 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`rounded-2xl border border-white/20 bg-white/80 p-4 shadow-lg shadow-black/5 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
        isDragging ? "ring-2 ring-primary-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {lead.lead_name || "Unknown lead"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {lead.lead_email ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {lead.lead_email}
              </span>
            ) : null}
            {lead.lead_phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {lead.lead_phone}
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
          {lead.lead_score.toFixed(1)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <Badge
          icon={DollarSign}
          label="Deal Value"
          value={dealValue}
          tone="emerald"
        />
        <Badge
          icon={Target}
          label="Win Probability"
          value={`${probability}%`}
          tone="purple"
        />
        <Badge icon={Activity} label="Category" value={lead.lead_category} />
        <Badge icon={Clock} label="In Stage" value={stageAge} tone="amber" />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>
            Next follow-up:{" "}
            {lead.next_followup_date
              ? new Date(lead.next_followup_date).toLocaleDateString()
              : "Not scheduled"}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          Last activity: {lastTouch}
        </div>
        {lead.notes ? (
          <p className="mt-2 text-gray-600">
            <span className="font-medium text-gray-800">Notes:</span>{" "}
            {lead.notes}
          </p>
        ) : null}
        {lead.loss_reason ? (
          <p className="mt-2 text-red-600">
            <span className="font-medium text-red-700">Lost:</span>{" "}
            {lead.loss_reason}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
});

export default PipelineCard;

interface BadgeProps {
  icon: any;
  label: string;
  value: string;
  tone?: "emerald" | "purple" | "amber" | "blue";
}

function Badge({ icon: Icon, label, value, tone = "blue" }: BadgeProps) {
  const toneClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-white/60 p-2 shadow-sm">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={`text-sm font-semibold ${toneClasses[tone]}`}>{value}</span>
    </div>
  );
}

