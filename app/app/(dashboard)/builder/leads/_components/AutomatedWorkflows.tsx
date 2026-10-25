'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  Play,
  Pause,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { openAILeadService } from '@/lib/services/openai-lead-service'

interface Workflow {
  id: string
  name: string
  description: string
  trigger: string
  action: string
  enabled: boolean
  last_run?: string
  success_count: number
  failure_count: number
}

interface AutomatedWorkflowsProps {
  leadId?: string
  leadData?: {
    score: number
    category: string
    last_activity?: string
    interactions_count: number
    conversion_probability?: number
  }
}

export function AutomatedWorkflows({ leadId, leadData }: AutomatedWorkflowsProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [recommendation, setRecommendation] = useState<any>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function fetchWorkflows() {
      try {
        const response = await fetch('/api/automation/workflows')
        if (response.ok) {
          const data = await response.json()
          setWorkflows(data.workflows || [])
        }
      } catch (err) {
        console.error('Error fetching workflows:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflows()
  }, [])

  useEffect(() => {
    if (leadData) {
      generateRecommendation()
    }
  }, [leadData])

  const generateRecommendation = async () => {
    if (!leadData) return

    setGenerating(true)
    try {
      const rec = await openAILeadService.generateWorkflowRecommendation(leadData)
      setRecommendation(rec)
    } catch (err) {
      console.error('Error generating recommendation:', err)
    } finally {
      setGenerating(false)
    }
  }

  const toggleWorkflow = async (workflowId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/automation/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })

      if (response.ok) {
        setWorkflows(workflows.map(w => 
          w.id === workflowId ? { ...w, enabled } : w
        ))
      }
    } catch (err) {
      console.error('Error toggling workflow:', err)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-1/3"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* AI Recommendation */}
      {recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-white">AI Workflow Recommendation</h3>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              recommendation.priority === 'high' ? 'bg-red-500/30 text-red-200' :
              recommendation.priority === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
              'bg-blue-500/30 text-blue-200'
            }`}>
              {recommendation.priority.toUpperCase()} PRIORITY
            </span>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-white mb-1">{recommendation.action}</h4>
            <p className="text-sm text-slate-300 mb-3">{recommendation.reason}</p>
            <div className="space-y-2">
              {recommendation.steps.map((step: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-xs font-semibold text-amber-200">
                    {index + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-amber-500/20">
            <div className="text-xs text-slate-400">
              Estimated Impact: <span className="text-amber-200 font-semibold">{recommendation.estimated_impact}</span> • 
              Confidence: <span className="text-amber-200 font-semibold">{Math.round(recommendation.confidence * 100)}%</span>
            </div>
            <button className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-lg text-amber-200 text-sm font-semibold transition-colors flex items-center gap-2">
              <Play className="w-4 h-4" />
              Execute
            </button>
          </div>
        </motion.div>
      )}

      {/* Active Workflows */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Automated Workflows</h3>
            <p className="text-sm text-slate-400">AI-powered automation for lead management</p>
          </div>
          <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm font-semibold transition-colors flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Manage
          </button>
        </div>

        {workflows.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No workflows configured</p>
            <button className="mt-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-200 text-sm font-semibold transition-colors">
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white">{workflow.name}</h4>
                      {workflow.enabled ? (
                        <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 rounded text-xs text-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-500/20 border border-slate-500/50 rounded text-xs text-slate-400">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{workflow.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Trigger: {workflow.trigger}</span>
                      <span>•</span>
                      <span>Action: {workflow.action}</span>
                      {workflow.last_run && (
                        <>
                          <span>•</span>
                          <span>Last run: {new Date(workflow.last_run).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    {(workflow.success_count > 0 || workflow.failure_count > 0) && (
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {workflow.success_count} success
                        </div>
                        {workflow.failure_count > 0 && (
                          <div className="flex items-center gap-1 text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            {workflow.failure_count} failed
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleWorkflow(workflow.id, !workflow.enabled)}
                    className={`ml-4 p-2 rounded-lg transition-colors ${
                      workflow.enabled
                        ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-200'
                        : 'bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-400'
                    }`}
                  >
                    {workflow.enabled ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

