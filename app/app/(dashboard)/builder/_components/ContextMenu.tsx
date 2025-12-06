"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type WorkflowKey = "attract" | "qualify" | "move" | "close" | "operate"

interface ContextMenuProps {
  leadSummary?: {
    total?: number
    hot?: number
  }
}

function getWorkflowFromPath(pathname: string): WorkflowKey {
  if (pathname.startsWith("/builder/properties") || pathname.startsWith("/builder/ai-content")) {
    return "attract"
  }
  if (pathname.startsWith("/builder/leads") || pathname.startsWith("/builder/communications") || pathname.startsWith("/builder/messaging")) {
    return "qualify"
  }
  if (pathname.startsWith("/builder/analytics") || pathname.startsWith("/builder/workflows")) {
    return "move"
  }
  if (pathname.startsWith("/builder/revenue")) {
    return "close"
  }
  if (pathname.startsWith("/builder/settings") || pathname.startsWith("/behavior-tracking")) {
    return "operate"
  }
  return "operate"
}

export function ContextMenu({ leadSummary }: ContextMenuProps) {
  const pathname = usePathname()
  const workflow = getWorkflowFromPath(pathname || "")

  const totalLeads = leadSummary?.total
  const hotLeads = leadSummary?.hot

  return (
    <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 lg:px-6 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Left: High level summary */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          <span className="font-semibold text-slate-800">
            {workflow === "attract" && "Attract: Your properties and visibility"}
            {workflow === "qualify" && "Qualify: Leads and conversations"}
            {workflow === "move" && "Move: Pipeline & performance"}
            {workflow === "close" && "Close: Revenue & payments"}
            {workflow === "operate" && "Operate: Settings & operations"}
          </span>
          {typeof totalLeads === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-slate-600">
              Leads: <span className="font-semibold text-slate-900">{totalLeads}</span>
              {typeof hotLeads === "number" && hotLeads > 0 && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800">
                  Hot: <span className="font-semibold">{hotLeads}</span>
                </span>
              )}
            </span>
          )}
        </div>

        {/* Right: Quick filters / actions (UI only, no behaviour change) */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 overflow-hidden">
            <button
              type="button"
              className={cn(
                "px-3 py-1.5 transition-colors",
                "text-slate-600 hover:bg-slate-100"
              )}
            >
              Active
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Inactive
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Archived
            </button>
          </div>
          <div className="inline-flex rounded-full border border-gold-400/60 bg-gold-50/60 overflow-hidden">
            <button
              type="button"
              className="px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-primary-900 bg-gold-400/90 hover:bg-gold-400 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-[11px] sm:text-xs text-amber-900/80 hover:bg-gold-100 transition-colors"
            >
              Publish
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-[11px] sm:text-xs text-amber-900/80 hover:bg-gold-100 transition-colors"
            >
              Optimize
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


