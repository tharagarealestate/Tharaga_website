"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  DollarSign,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { getSupabase } from "@/lib/supabase";
import { BuilderPageWrapper } from "../../../_components/BuilderPageWrapper";

import PipelineColumn from "./PipelineColumn";
import PipelineCard from "./PipelineCard";
import type {
  PipelineLead,
  PipelineStage,
  PipelineStats,
  StageConfig,
} from "./types";

const INITIAL_STAGE_STATE: Record<PipelineStage, PipelineLead[]> = {
  new: [],
  contacted: [],
  qualified: [],
  site_visit_scheduled: [],
  site_visit_completed: [],
  negotiation: [],
  offer_made: [],
  closed_won: [],
  closed_lost: [],
};

const STAGE_CONFIG: StageConfig[] = [
  {
    id: "new",
    label: "New Leads",
    color: "blue",
    icon: Users,
    description: "Fresh leads awaiting first contact",
    order: 1,
  },
  {
    id: "contacted",
    label: "Contacted",
    color: "cyan",
    icon: Eye,
    description: "Initial contact made",
    order: 2,
  },
  {
    id: "qualified",
    label: "Qualified",
    color: "purple",
    icon: CheckCircle2,
    description: "Budget and interest verified",
    order: 3,
  },
  {
    id: "site_visit_scheduled",
    label: "Visit Scheduled",
    color: "orange",
    icon: Clock,
    description: "Site visit appointment set",
    order: 4,
  },
  {
    id: "site_visit_completed",
    label: "Visit Completed",
    color: "amber",
    icon: Target,
    description: "Site visit completed",
    order: 5,
  },
  {
    id: "negotiation",
    label: "Negotiation",
    color: "violet",
    icon: TrendingUp,
    description: "Price and terms discussion",
    order: 6,
  },
  {
    id: "offer_made",
    label: "Offer Made",
    color: "indigo",
    icon: DollarSign,
    description: "Formal offer presented",
    order: 7,
  },
  {
    id: "closed_won",
    label: "Closed Won",
    color: "emerald",
    icon: CheckCircle2,
    description: "Deal successfully closed",
    order: 8,
  },
  {
    id: "closed_lost",
    label: "Closed Lost",
    color: "red",
    icon: XCircle,
    description: "Opportunity lost",
    order: 9,
  },
];

const STAGE_ORDER = STAGE_CONFIG.reduce<Record<PipelineStage, number>>(
  (acc, stage) => {
    acc[stage.id] = stage.order;
    return acc;
  },
  {
    new: 1,
    contacted: 2,
    qualified: 3,
    site_visit_scheduled: 4,
    site_visit_completed: 5,
    negotiation: 6,
    offer_made: 7,
    closed_won: 8,
    closed_lost: 9,
  }
);

export default function LeadPipelineKanban() {
  const supabase = useMemo(() => getSupabase(), []);
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] =
    useState<Record<PipelineStage, PipelineLead[]>>(INITIAL_STAGE_STATE);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<PipelineLead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScore, setFilterScore] = useState<number | null>(null);
  const [showClosedStages, setShowClosedStages] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUser(data.user ?? null);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const fetchPipelineData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // CRITICAL FIX: Use API endpoint instead of direct Supabase query
      // This ensures admin email bypass and proper authentication flow
      const response = await fetch('/api/leads/pipeline');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to fetch pipeline data');
      }

      // API returns flat array of pipeline items
      const data = result.data;

      // Normalize data from API response
      const normalized: PipelineLead[] =
        data?.map((item: any) => {
          const stage = (item.stage || "new") as PipelineStage;
          const leadData = Array.isArray(item.lead) ? item.lead[0] : item.lead;
          const leadUser = leadData?.user;
          const leadScore = leadData?.score;

          return {
            id: item.id,
            lead_id: item.lead_id,
            builder_id: user.id, // Use current user ID
            stage,
            stage_order: item.stage_order ?? STAGE_ORDER[stage],
            entered_stage_at: item.entered_stage_at || item.created_at,
            days_in_stage: item.days_in_stage || 0,
            deal_value: item.deal_value ? Number(item.deal_value) : null,
            expected_close_date: item.expected_close_date,
            probability: item.probability ? Number(item.probability) : null,
            last_activity_at: item.last_activity_at || leadData?.last_activity,
            last_activity_type: item.last_activity_type,
            next_followup_date: item.next_followup_date,
            notes: item.notes,
            loss_reason: item.loss_reason,
            loss_details: item.loss_details,
            created_at: item.created_at,
            updated_at: item.updated_at,
            closed_at: item.closed_at,
            lead_email: leadUser?.email ?? "",
            lead_name: leadUser?.full_name || leadUser?.email || "Unidentified Lead",
            lead_phone: leadUser?.phone ?? null,
            lead_score: leadScore ? Number(leadScore) : 0,
            lead_category: leadData?.category ?? "Cold Lead",
            total_views: 0,
            last_activity: item.last_activity_at || leadData?.last_activity,
          };
        }) ?? [];

      const grouped = STAGE_CONFIG.reduce(
        (acc, stage) => {
          acc[stage.id] = normalized.filter((lead) => lead.stage === stage.id);
          return acc;
        },
        { ...INITIAL_STAGE_STATE }
      );

      setLeads(grouped);
      calculateStats(normalized);
    } catch (err: any) {
      console.error("Error fetching pipeline", err);
      toast.error("Failed to load pipeline data");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user?.id) {
      fetchPipelineData();
    }
  }, [user, fetchPipelineData]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("lead-pipeline-kanban")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_pipeline",
          filter: `builder_id=eq.${user.id}`,
        },
        () => {
          fetchPipelineData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, fetchPipelineData]);

  const calculateStats = (pipelineData: PipelineLead[]) => {
    const total_leads = pipelineData.length;
    const total_value = pipelineData.reduce(
      (sum, lead) => sum + (lead.deal_value || 0),
      0
    );
    const weighted_value = pipelineData.reduce((sum, lead) => {
      const probability = lead.probability ?? 0;
      return sum + (lead.deal_value || 0) * (probability / 100);
    }, 0);
    const avg_deal_size = total_leads > 0 ? total_value / total_leads : 0;

    const closedWon = pipelineData.filter((l) => l.stage === "closed_won").length;
    const closedTotal = pipelineData.filter((l) =>
      ["closed_won", "closed_lost"].includes(l.stage)
    ).length;
    const conversion_rate =
      closedTotal > 0 ? (closedWon / closedTotal) * 100 : 0;

    const closedDeals = pipelineData.filter(
      (l) => l.stage === "closed_won" && l.closed_at
    );
    const avg_days_to_close =
      closedDeals.length > 0
        ? closedDeals.reduce((sum, lead) => {
            const created = new Date(lead.created_at).getTime();
            const closed = new Date(lead.closed_at as string).getTime();
            return sum + Math.max(0, (closed - created) / 86400000);
          }, 0) / closedDeals.length
        : 0;

    const stages = STAGE_CONFIG.reduce<PipelineStats["stages"]>((acc, stage) => {
      const stageLeads = pipelineData.filter((l) => l.stage === stage.id);
      acc[stage.id] = {
        count: stageLeads.length,
        value: stageLeads.reduce(
          (sum, lead) => sum + (lead.deal_value || 0),
          0
        ),
        avg_days:
          stageLeads.length > 0
            ? stageLeads.reduce(
                (sum, lead) => sum + (lead.days_in_stage || 0),
                0
              ) / stageLeads.length
            : 0,
      };
      return acc;
    }, {} as PipelineStats["stages"]);

    setStats({
      total_leads,
      total_value,
      weighted_value,
      avg_deal_size,
      conversion_rate,
      avg_days_to_close,
      stages,
    });
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (!active?.id) return;
    const allLeads = Object.values(leads).flat();
    const lead = allLeads.find((item) => item.id === active.id);
    if (lead) {
      setDragging(lead);
    }
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over?.id) return;

    const leadId = String(active.id);
    const overId = String(over.id);
    let targetStage: PipelineStage | null = null;

    if (Object.prototype.hasOwnProperty.call(STAGE_ORDER, overId)) {
      targetStage = overId as PipelineStage;
    } else {
      const containingStage = Object.entries(leads).find(([, arr]) =>
        arr.some((item) => item.id === overId)
      );
      if (containingStage) {
        targetStage = containingStage[0] as PipelineStage;
      }
    }

    if (!targetStage) return;

    const currentEntry = Object.entries(leads).find(([stageId, arr]) =>
      arr.some((item) => item.id === leadId)
    );
    if (!currentEntry) return;

    const [currentStage, currentLeads] = currentEntry as [
      PipelineStage,
      PipelineLead[]
    ];
    if (currentStage === targetStage) return;

    const lead = currentLeads.find((item) => item.id === leadId);
    if (!lead) return;

    setLeads((prev) => ({
      ...prev,
      [currentStage]: prev[currentStage].filter((item) => item.id !== leadId),
      [targetStage]: [{ ...lead, stage: targetStage }, ...prev[targetStage]],
    }));

    try {
      const response = await fetch("/api/leads/update-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline_id: leadId,
          new_stage: targetStage,
          notes: `Moved from ${currentStage} to ${targetStage}`,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(
        `Lead moved to ${
          STAGE_CONFIG.find((stage) => stage.id === targetStage)?.label ??
          targetStage
        }`,
        {
          description: `${lead.lead_name} updated successfully`,
        }
      );
      fetchPipelineData();
    } catch (err) {
      console.error("Failed to update lead stage", err);
      setLeads((prev) => ({
        ...prev,
        [targetStage]: prev[targetStage].filter((item) => item.id !== leadId),
        [currentStage]: [lead, ...prev[currentStage]],
      }));
      toast.error("Failed to update lead stage");
    }
  };

  const getFilteredLeads = useCallback(
    (stageLeads: PipelineLead[]) =>
      stageLeads.filter((lead) => {
        const matchesSearch =
          searchQuery === "" ||
          lead.lead_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.lead_email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesScore =
          filterScore === null || lead.lead_score >= filterScore;
        return matchesSearch && matchesScore;
      }),
    [filterScore, searchQuery]
  );

  const formatCurrency = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    []
  );

  if (loading) {
    return (
      <BuilderPageWrapper title="Lead Pipeline" description="Drag & drop to move leads through your sales process">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            <p className="text-slate-300">Loading pipeline…</p>
          </div>
        </div>
      </BuilderPageWrapper>
    );
  }

  const visibleStages = showClosedStages
    ? STAGE_CONFIG
    : STAGE_CONFIG.filter(
        (stage) => stage.id !== "closed_won" && stage.id !== "closed_lost"
      );

  return (
    <BuilderPageWrapper title="Lead Pipeline" description="Drag & drop to move leads through your sales process" noContainer={true}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex gap-3">
              <button
                onClick={fetchPipelineData}
                className="flex items-center gap-2 rounded-lg border border-slate-600 bg-gradient-to-br from-slate-800/95 to-slate-900/95 px-4 py-2 text-white transition-colors hover:bg-slate-700/50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-slate-600 bg-gradient-to-br from-slate-800/95 to-slate-900/95 px-4 py-2 text-white transition-colors hover:bg-slate-700/50">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

        {stats ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatsCard label="Total Leads" value={stats.total_leads} icon={Users} color="blue" />
            <StatsCard
              label="Pipeline Value"
              value={formatCurrency.format(stats.total_value)}
              icon={DollarSign}
              color="emerald"
            />
            <StatsCard
              label="Weighted Value"
              value={formatCurrency.format(stats.weighted_value)}
              icon={TrendingUp}
              color="purple"
            />
            <StatsCard
              label="Avg Deal Size"
              value={formatCurrency.format(stats.avg_deal_size)}
              icon={Target}
              color="amber"
            />
            <StatsCard
              label="Conversion Rate"
              value={`${stats.conversion_rate.toFixed(1)}%`}
              icon={BarChart3}
              color="indigo"
            />
            <StatsCard
              label="Avg Days to Close"
              value={Math.round(stats.avg_days_to_close)}
              icon={Clock}
              color="orange"
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name or email…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800/50 py-2 pl-10 pr-4 text-white placeholder:text-slate-400 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <select
            value={filterScore ?? ""}
            onChange={(event) =>
              setFilterScore(
                event.target.value ? Number(event.target.value) : null
              )
            }
            className="rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="">All Scores</option>
            <option value="7">Score 7+ (Warm & Hot)</option>
            <option value="9">Score 9+ (Hot Only)</option>
          </select>
          <button
            onClick={() => setShowClosedStages((value) => !value)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
              showClosedStages
                ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                : "border-slate-600 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
            }`}
          >
            <Filter className="h-4 w-4" />
            {showClosedStages ? "Hide" : "Show"} Closed
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}>
          {visibleStages.map((stage) => {
            const stageLeads = getFilteredLeads(leads[stage.id]);
            const stageStats = stats?.stages[stage.id];
            return (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                leads={stageLeads}
                stats={stageStats}
              />
            );
          })}
        </div>
        <DragOverlay>
          {dragging ? (
            <motion.div className="rotate-3 opacity-90">
              <PipelineCard lead={dragging} isDragging />
            </motion.div>
          ) : null}
        </DragOverlay>
      </DndContext>
      </div>
    </BuilderPageWrapper>
  );
}

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: any;
  color: "blue" | "emerald" | "purple" | "amber" | "indigo" | "orange";
}

function StatsCard({ label, value, icon: Icon, color }: StatsCardProps) {
  const colorClasses: Record<StatsCardProps["color"], { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-gradient-to-br from-blue-500/20 to-blue-600/20", text: "text-blue-400", border: "border-blue-400/30" },
    emerald: { bg: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/20", text: "text-emerald-400", border: "border-emerald-400/30" },
    purple: { bg: "bg-gradient-to-br from-purple-500/20 to-purple-600/20", text: "text-purple-400", border: "border-purple-400/30" },
    amber: { bg: "bg-gradient-to-br from-amber-500/20 to-amber-600/20", text: "text-amber-400", border: "border-amber-400/30" },
    indigo: { bg: "bg-gradient-to-br from-indigo-500/20 to-indigo-600/20", text: "text-indigo-400", border: "border-indigo-400/30" },
    orange: { bg: "bg-gradient-to-br from-orange-500/20 to-orange-600/20", text: "text-orange-400", border: "border-orange-400/30" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl p-4"
    >
      <div className="mb-2 flex items-center gap-3">
        <div className={`rounded-lg p-2 border ${colorClasses[color].bg} ${colorClasses[color].border}`}>
          <Icon className={`h-4 w-4 ${colorClasses[color].text}`} />
        </div>
      </div>
      <p className="mb-1 text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-300">{label}</p>
    </motion.div>
  );
}


