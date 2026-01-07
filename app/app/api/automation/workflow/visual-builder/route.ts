/**
 * VISUAL WORKFLOW BUILDER API
 * 
 * Advanced workflow automation with visual drag-and-drop builder
 * Enables builders to create complex automation workflows without coding
 * 
 * Features:
 * - Visual workflow designer
 * - Pre-built templates
 * - AI-powered workflow suggestions
 * - Real-time testing
 * - Performance analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 300

interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'webhook'
  config: Record<string, any>
  position?: { x: number; y: number }
  connections?: string[]
}

interface WorkflowDefinition {
  name: string
  description?: string
  nodes: WorkflowNode[]
  is_active: boolean
  category: string
}

/**
 * Validate workflow definition
 */
function validateWorkflow(workflow: WorkflowDefinition): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!workflow.name) {
    errors.push('Workflow name is required')
  }

  if (!workflow.nodes || workflow.nodes.length === 0) {
    errors.push('Workflow must have at least one node')
  }

  // Check for trigger node
  const hasTrigger = workflow.nodes.some(n => n.type === 'trigger')
  if (!hasTrigger) {
    errors.push('Workflow must have at least one trigger node')
  }

  // Check for action node
  const hasAction = workflow.nodes.some(n => n.type === 'action')
  if (!hasAction) {
    errors.push('Workflow must have at least one action node')
  }

  // Validate node connections
  const nodeIds = new Set(workflow.nodes.map(n => n.id))
  workflow.nodes.forEach(node => {
    if (node.connections) {
      node.connections.forEach(connId => {
        if (!nodeIds.has(connId)) {
          errors.push(`Node ${node.id} references non-existent connection ${connId}`)
        }
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Generate AI-powered workflow suggestions
 */
async function generateWorkflowSuggestions(
  builderId: string,
  context: { propertyCount?: number; leadCount?: number; avgResponseTime?: number }
): Promise<WorkflowDefinition[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!openaiApiKey) {
    // Return default suggestions
    return [
      {
        name: 'Hot Lead Follow-up',
        description: 'Automatically follow up with high-scoring leads',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            config: { trigger_type: 'lead_score_threshold', threshold: 80 },
          },
          {
            id: 'action-1',
            type: 'action',
            config: { action_type: 'send_email', template: 'hot_lead_followup' },
            connections: ['trigger-1'],
          },
        ],
        is_active: false,
        category: 'lead_nurture',
      },
    ]
  }

  try {
    const prompt = `Generate 3 workflow automation suggestions for a real estate builder:

Context:
- Properties: ${context.propertyCount || 0}
- Leads: ${context.leadCount || 0}
- Avg Response Time: ${context.avgResponseTime || 0} hours

Generate workflows that:
1. Automate lead nurturing
2. Improve response times
3. Increase conversion rates

Return as JSON array of workflow definitions with nodes.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in real estate automation workflows. Generate practical, actionable workflow suggestions.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const content = data.choices[0]?.message?.content || ''

      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch (e) {
        console.error('Failed to parse AI suggestions:', e)
      }
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
  }

  // Fallback
  return []
}

/**
 * POST /api/automation/workflow/visual-builder
 * Create or update visual workflow
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { builder_id, workflow, action } = body

    if (!builder_id || !workflow) {
      return NextResponse.json(
        { success: false, error: 'Missing builder_id or workflow' },
        { status: 400 }
      )
    }

    // Validate workflow
    const validation = validateWorkflow(workflow)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid workflow', errors: validation.errors },
        { status: 400 }
      )
    }

    if (action === 'create') {
      // Create new workflow
      const { data, error } = await supabase
        .from('workflow_templates')
        .insert({
          builder_id,
          name: workflow.name,
          description: workflow.description,
          trigger_type: workflow.nodes.find(n => n.type === 'trigger')?.config?.trigger_type || 'manual',
          trigger_config: workflow.nodes.find(n => n.type === 'trigger')?.config || {},
          actions: workflow.nodes.filter(n => n.type === 'action').map(n => n.config),
          conditions: workflow.nodes.filter(n => n.type === 'condition').map(n => n.config),
          is_active: workflow.is_active,
          category: workflow.category || 'custom',
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create workflow: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        workflow_id: data.id,
        message: 'Workflow created successfully',
      })
    } else if (action === 'update') {
      // Update existing workflow
      const { workflow_id } = body
      if (!workflow_id) {
        return NextResponse.json(
          { success: false, error: 'Missing workflow_id for update' },
          { status: 400 }
        )
      }

      const { error } = await supabase
        .from('workflow_templates')
        .update({
          name: workflow.name,
          description: workflow.description,
          trigger_type: workflow.nodes.find(n => n.type === 'trigger')?.config?.trigger_type,
          trigger_config: workflow.nodes.find(n => n.type === 'trigger')?.config || {},
          actions: workflow.nodes.filter(n => n.type === 'action').map(n => n.config),
          conditions: workflow.nodes.filter(n => n.type === 'condition').map(n => n.config),
          is_active: workflow.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflow_id)
        .eq('builder_id', builder_id)

      if (error) {
        throw new Error(`Failed to update workflow: ${error.message}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Workflow updated successfully',
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "create" or "update"' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Visual Workflow Builder Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process workflow',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/automation/workflow/visual-builder/suggestions
 * Get AI-powered workflow suggestions
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const builder_id = searchParams.get('builder_id')

    if (!builder_id) {
      return NextResponse.json(
        { success: false, error: 'Missing builder_id' },
        { status: 400 }
      )
    }

    // Get builder context
    const [propertiesResult, leadsResult] = await Promise.all([
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('builder_id', builder_id),
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('builder_id', builder_id),
    ])

    const context = {
      propertyCount: propertiesResult.count || 0,
      leadCount: leadsResult.count || 0,
      avgResponseTime: 2, // Would calculate from actual data
    }

    const suggestions = await generateWorkflowSuggestions(builder_id, context)

    return NextResponse.json({
      success: true,
      suggestions,
    })
  } catch (error: any) {
    console.error('Workflow Suggestions Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate suggestions',
        details: error.message,
      },
      { status: 500 }
    )
  }
}



