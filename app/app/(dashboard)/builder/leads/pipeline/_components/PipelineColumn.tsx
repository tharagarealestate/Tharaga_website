"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Plus, TrendingUp, DollarSign, Clock, Sparkles } from "lucide-react";

import PipelineCard from "./PipelineCard";
import type { PipelineLead, StageConfig, StageSnapshot } from "./types";

interface PipelineColumnProps {
  stage: StageConfig;
  leads: PipelineLead[];
  stats?: StageSnapshot;
}

// Modern dark theme color palette
const COLOR_MAP: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    badge: string;
    headerBg: string;
    iconBg: string;
    glow: string;
  }
> = {
  blue: {
    bg: "bg-gradient-to-br from-blue-500/10 to-blue-600/5",
    border: "border-blue-500/30",
    text: "text-blue-400",
    badge: "bg-gradient-to-r from-blue-500 to-blue-600",
    headerBg: "from-blue-500/20 via-blue-600/10 to-transparent",
    iconBg: "bg-blue-500/20 border-blue-500/30",
    glow: "ring-blue-500/50",
  },
  cyan: {
    bg: "bg-gradient-to-br from-cyan-500/10 to-cyan-600/5",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    badge: "bg-gradient-to-r from-cyan-500 to-cyan-600",
    headerBg: "from-cyan-500/20 via-cyan-600/10 to-transparent",
    iconBg: "bg-cyan-500/20 border-cyan-500/30",
    glow: "ring-cyan-500/50",
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-500/10 to-purple-600/5",
    border: "border-purple-500/30",
    text: "text-purple-400",
    badge: "bg-gradient-to-r from-purple-500 to-purple-600",
    headerBg: "from-purple-500/20 via-purple-600/10 to-transparent",
    iconBg: "bg-purple-500/20 border-purple-500/30",
    glow: "ring-purple-500/50",
  },
  orange: {
    bg: "bg-gradient-to-br from-orange-500/10 to-orange-600/5",
    border: "border-orange-500/30",
    text: "text-orange-400",
    badge: "bg-gradient-to-r from-orange-500 to-orange-600",
    headerBg: "from-orange-500/20 via-orange-600/10 to-transparent",
    iconBg: "bg-orange-500/20 border-orange-500/30",
    glow: "ring-orange-500/50",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/30",
    text: "text-amber-400",
    badge: "bg-gradient-to-r from-amber-500 to-amber-600",
    headerBg: "from-amber-500/20 via-amber-600/10 to-transparent",
    iconBg: "bg-amber-500/20 border-amber-500/30",
    glow: "ring-amber-500/50",
  },
  violet: {
    bg: "bg-gradient-to-br from-violet-500/10 to-violet-600/5",
    border: "border-violet-500/30",
    text: "text-violet-400",
    badge: "bg-gradient-to-r from-violet-500 to-violet-600",
    headerBg: "from-violet-500/20 via-violet-600/10 to-transparent",
    iconBg: "bg-violet-500/20 border-violet-500/30",
    glow: "ring-violet-500/50",
  },
  indigo: {
    bg: "bg-gradient-to-br from-indigo-500/10 to-indigo-600/5",
    border: "border-indigo-500/30",
    text: "text-indigo-400",
    badge: "bg-gradient-to-r from-indigo-500 to-indigo-600",
    headerBg: "from-indigo-500/20 via-indigo-600/10 to-transparent",
    iconBg: "bg-indigo-500/20 border-indigo-500/30",
    glow: "ring-indigo-500/50",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    badge: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    headerBg: "from-emerald-500/20 via-emerald-600/10 to-transparent",
    iconBg: "bg-emerald-500/20 border-emerald-500/30",
    glow: "ring-emerald-500/50",
  },
  red: {
    bg: "bg-gradient-to-br from-red-500/10 to-red-600/5",
    border: "border-red-500/30",
    text: "text-red-400",
    badge: "bg-gradient-to-r from-red-500 to-red-600",
    headerBg: "from-red-500/20 via-red-600/10 to-transparent",
    iconBg: "bg-red-500/20 border-red-500/30",
    glow: "ring-red-500/50",
  },
};

export default function PipelineColumn({
  stage,
  leads,
  stats,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const StageIcon = stage.icon;
  const colors = COLOR_MAP[stage.color] || COLOR_MAP.blue;

  const sortedLeads = useMemo(
    () =>
      [...leads].sort((a, b) => {
        const aDate = a.entered_stage_at
          ? new Date(a.entered_stage_at).getTime()
          : 0;
        const bDate = b.entered_stage_at
          ? new Date(b.entered_stage_at).getTime()
          : 0;
        return bDate - aDate;
      }),
    [leads]
  );

  const formatCurrency = (amount: number): string => {
    if (!Number.isFinite(amount)) return "₹0";
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}K`;
    }
    return `₹${amount.toFixed(0)}`;
  };

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex max-h-[calc(100vh-300px)] w-80 flex-shrink-0 flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
        isOver
          ? `ring-2 ${colors.glow} ring-offset-2 ring-offset-slate-900 scale-[1.02]`
          : ""
      }`}
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Modern Header */}
      <div className={`${colors.bg} border ${colors.border} backdrop-blur-xl p-4 relative overflow-hidden`}>
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.headerBg} pointer-events-none`} />

        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${colors.iconBg} border backdrop-blur-sm`}>
                <StageIcon className={`h-5 w-5 ${colors.text}`} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{stage.label}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{stage.description}</p>
              </div>
            </div>
            <motion.span
              key={leads.length}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`${colors.badge} rounded-full px-3 py-1.5 text-sm font-bold text-white shadow-lg`}
            >
              {leads.length}
            </motion.span>
          </div>

          {stats && stats.count > 0 ? (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <StageStat icon={TrendingUp} label="Count" value={stats.count} color={colors.text} />
              <StageStat
                icon={DollarSign}
                label="Value"
                value={formatCurrency(stats.value)}
                color={colors.text}
              />
              <StageStat
                icon={Clock}
                label="Avg Days"
                value={Math.round(stats.avg_days)}
                color={colors.text}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 overflow-y-auto border-x border-b border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-3 rounded-b-2xl">
        <SortableContext
          items={sortedLeads.map((lead) => lead.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {sortedLeads.length > 0 ? (
              sortedLeads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SortableCard lead={lead} />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className={`p-4 rounded-2xl ${colors.iconBg} border mb-4`}>
                  <StageIcon className={`h-8 w-8 ${colors.text} opacity-50`} />
                </div>
                <p className="text-sm text-slate-400 mb-1">No leads in this stage</p>
                <p className="text-xs text-slate-500">Drag leads here or add new ones</p>
                {stage.id === "new" ? (
                  <button
                    type="button"
                    className={`mt-4 flex items-center gap-2 rounded-xl ${colors.badge} px-4 py-2.5 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-lg active:scale-95`}
                  >
                    <Plus className="h-4 w-4" />
                    Add Lead
                  </button>
                ) : null}
              </motion.div>
            )}
          </div>
        </SortableContext>
      </div>
    </motion.div>
  );
}

function StageStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-2">
      <div className="mb-1 flex items-center gap-1 text-slate-400 text-[10px]">
        <Icon className={`h-3 w-3 ${color}`} />
        <span>{label}</span>
      </div>
      <p className="font-bold text-white text-sm">{value}</p>
    </div>
  );
}

function SortableCard({ lead }: { lead: PipelineLead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : ''}`}
    >
      <PipelineCard lead={lead} isDragging={isDragging} />
    </div>
  );
}
