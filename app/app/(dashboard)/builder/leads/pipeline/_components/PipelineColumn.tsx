"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { DollarSign, Timer } from "lucide-react";

import PipelineCard from "./PipelineCard";
import type { PipelineLead, StageConfig, StageSnapshot } from "./types";

interface PipelineColumnProps {
  stage: StageConfig;
  leads: PipelineLead[];
  stats?: StageSnapshot;
}

export default function PipelineColumn({
  stage,
  leads,
  stats,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const StageIcon = stage.icon;

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    cyan: "bg-cyan-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
  };
  const accentClass = colorMap[stage.color] || "bg-blue-500";

  const sortedLeads = useMemo(
    () =>
      [...leads].sort((a, b) => {
        const aDate = a.entered_stage_at ? new Date(a.entered_stage_at).getTime() : 0;
        const bDate = b.entered_stage_at ? new Date(b.entered_stage_at).getTime() : 0;
        return bDate - aDate;
      }),
    [leads]
  );

  const stageValue =
    typeof stats?.value === "number"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(stats.value)
      : "—";

  const avgDays =
    typeof stats?.avg_days === "number" && !Number.isNaN(stats.avg_days)
      ? `${Math.round(stats.avg_days)} days`
      : "—";

  return (
    <div className="flex w-[320px] flex-shrink-0 flex-col gap-4">
      <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/80 via-white/70 to-white/40 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${accentClass}`} />
          <h3 className="text-sm font-semibold text-gray-900">{stage.label}</h3>
          <span className="ml-auto inline-flex items-center rounded-full bg-gray-200/80 px-2 py-0.5 text-xs font-semibold text-gray-700">
            {leads.length}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-500">{stage.description}</p>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/60 px-3 py-2 text-xs text-gray-600 shadow-inner">
          <span className="inline-flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            {stageValue}
          </span>
          <span className="inline-flex items-center gap-1">
            <Timer className="h-3.5 w-3.5 text-indigo-500" />
            {avgDays}
          </span>
        </div>
      </div>

      <SortableContext items={sortedLeads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`min-h-[520px] rounded-3xl border border-dashed border-transparent bg-white/60 p-4 shadow-inner backdrop-blur transition ${
            isOver ? "border-primary-300 bg-primary-50/70" : ""
          }`}
        >
          <AnimatePresence initial={false}>
            {sortedLeads.length > 0
              ? sortedLeads.map((lead) => <SortableCard key={lead.id} lead={lead} />)
              : <EmptyPlaceholder stage={stage} />}
          </AnimatePresence>
        </div>
      </SortableContext>
    </div>
  );
}

function EmptyPlaceholder({ stage }: { stage: StageConfig }) {
  const StageIcon = stage.icon;
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white/80 text-center text-xs text-gray-400">
      <StageIcon className="h-5 w-5 text-gray-300" />
      <p>No leads in {stage.label}</p>
      <p className="max-w-[200px] text-[11px] leading-relaxed">
        Drag a lead into this column to start tracking progress.
      </p>
    </div>
  );
}

function SortableCard({ lead }: { lead: PipelineLead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });
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

