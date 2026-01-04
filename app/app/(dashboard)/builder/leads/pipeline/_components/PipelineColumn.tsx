"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, TrendingUp, DollarSign, Clock } from "lucide-react";

import PipelineCard from "./PipelineCard";
import type { PipelineLead, StageConfig, StageSnapshot } from "./types";

interface PipelineColumnProps {
  stage: StageConfig;
  leads: PipelineLead[];
  stats?: StageSnapshot;
}

const COLOR_MAP: Record<
  string,
  { bg: string; border: string; text: string; badge: string }
> = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-600",
  },
  cyan: {
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    badge: "bg-cyan-600",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    badge: "bg-purple-600",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-600",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-600",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    badge: "bg-violet-600",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    badge: "bg-indigo-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-600",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-600",
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
    <div
      ref={setNodeRef}
      className={`flex max-h-[calc(100vh-300px)] w-80 flex-shrink-0 flex-col transition-all duration-200 ${
        isOver ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
    >
      <div className={`${colors.bg} ${colors.border} border-2 rounded-t-2xl p-4`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StageIcon className={`h-5 w-5 ${colors.text}`} />
            <h3 className={`font-bold ${colors.text}`}>{stage.label}</h3>
          </div>
          <span className={`${colors.badge} rounded-full px-2 py-1 text-sm font-bold text-white`}>
            {leads.length}
          </span>
        </div>
        <p className="mb-3 text-xs text-gray-600">{stage.description}</p>

        {stats && stats.count > 0 ? (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <StageStat icon={TrendingUp} label="Count" value={stats.count} />
            <StageStat
              icon={DollarSign}
              label="Value"
              value={formatCurrency(stats.value)}
            />
            <StageStat
              icon={Clock}
              label="Days"
              value={Math.round(stats.avg_days)}
            />
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto border-x-2 border-b-2 border-gray-200 bg-gray-50 p-3 rounded-b-2xl">
        <SortableContext
          items={sortedLeads.map((lead) => lead.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {sortedLeads.length > 0 ? (
              sortedLeads.map((lead) => <SortableCard key={lead.id} lead={lead} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <StageIcon className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500">No leads in this stage</p>
                {stage.id === "new" ? (
                  <button
                    type="button"
                    className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Lead
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function StageStat({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-white/70 p-2">
      <div className="mb-1 flex items-center gap-1 text-gray-600">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <p className="font-bold text-gray-900">{value}</p>
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PipelineCard lead={lead} isDragging={isDragging} />
    </div>
  );
}

