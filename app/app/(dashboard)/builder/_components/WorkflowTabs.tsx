"use client"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

type WorkflowKey = "attract" | "qualify" | "move" | "close" | "operate"

const WORKFLOW_CONFIG: {
  key: WorkflowKey
  label: string
  icon: string
  href: string
}[] = [
  { key: "attract", label: "ATTRACT", icon: "🎯", href: "/builder/properties" },
  { key: "qualify", label: "QUALIFY", icon: "🔥", href: "/builder/leads" },
  { key: "move", label: "MOVE", icon: "📊", href: "/builder/leads/pipeline" },
  { key: "close", label: "CLOSE", icon: "💰", href: "/builder/revenue" },
  { key: "operate", label: "OPERATE", icon: "⚙️", href: "/builder/settings" },
]

function getActiveWorkflow(pathname: string): WorkflowKey {
  // Check most specific routes first to avoid multiple tabs being active
  if (pathname.startsWith("/builder/leads/pipeline")) {
    return "move"
  }
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
  // Default: overview falls under operate / general operations
  return "operate"
}

export function WorkflowTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const active = getActiveWorkflow(pathname || "")

  return (
    <div className="h-[56px] border-b border-slate-200 bg-slate-50/80 backdrop-blur-md flex items-stretch px-2 lg:px-6 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style jsx>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="flex gap-2 sm:gap-4 items-stretch mx-auto min-w-max">
        {WORKFLOW_CONFIG.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => router.push(tab.href)}
              className={cn(
                "relative inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap rounded-none border-b-2 transition-colors duration-200 min-h-[44px] touch-manipulation",
                isActive
                  ? "border-gold-500 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-200"
              )}
            >
              <span className="text-sm sm:text-base md:text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-[10px]">{tab.label.slice(0, 3)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}


