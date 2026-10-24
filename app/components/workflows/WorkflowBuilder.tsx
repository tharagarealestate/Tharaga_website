'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Clock, 
  Filter, 
  Zap,
  Plus,
  Trash2,
  Save,
  Play,
  AlertCircle,
  Check,
  X,
  Settings,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/SelectGroup';
import { TextArea } from '@/components/ui/TextArea';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

// =============================================
// TYPES
// =============================================
interface WorkflowAction {
  id: string;
  type: 'send_email' | 'send_whatsapp' | 'send_sms' | 'wait' | 'update_lead' | 'notify_team';
  config: Record<string, any>;
  order: number;
}

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: any;
  logic?: 'AND' | 'OR';
}

interface WorkflowTemplate {
  id?: string;
  name: string;
  description: string;
  trigger_type: 'lead_created' | 'score_change' | 'behavior_detected' | 'time_based' | 'manual';
  trigger_config: Record<string, any>;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  is_active: boolean;
  priority: number;
}

interface MessageTemplate {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp' | 'sms';
  subject?: string;
  content: string;
}

// =============================================
// ACTION CARD COMPONENT
// =============================================
interface ActionCardProps {
  action: WorkflowAction;
  index: number;
  onUpdate: (id: string, config: Record<string, any>) => void;
  onDelete: (id: string) => void;
  messageTemplates: MessageTemplate[];
}

function ActionCard({ action, index, onUpdate, onDelete, messageTemplates }: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [config, setConfig] = useState(action.config);
  
  const actionIcons = {
    send_email: Mail,
    send_whatsapp: MessageSquare,
    send_sms: Phone,
    wait: Clock,
    update_lead: Settings,
    notify_team: AlertCircle
  };
  
  const actionColors = {
    send_email: 'from-blue-500 to-blue-600',
    send_whatsapp: 'from-green-500 to-green-600',
    send_sms: 'from-purple-500 to-purple-600',
    wait: 'from-amber-500 to-amber-600',
    update_lead: 'from-cyan-500 to-cyan-600',
    notify_team: 'from-pink-500 to-pink-600'
  };
  
  const actionLabels = {
    send_email: 'Send Email',
    send_whatsapp: 'Send WhatsApp',
    send_sms: 'Send SMS',
    wait: 'Wait / Delay',
    update_lead: 'Update Lead',
    notify_team: 'Notify Team'
  };
  
  const Icon = actionIcons[action.type];
  
  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(action.id, newConfig);
  };
  
  return (
    <div className="group relative">
      {/* Glassmorphic Card */}
      <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 hover:shadow-2xl hover:-translate-y-2">
        {/* Shimmer Effect on Hover */}
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
        
        {/* Header */}
        <div className="relative z-10 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Icon Badge */}
            <div className={`bg-gradient-to-br ${actionColors[action.type]} p-3 rounded-xl shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            
            {/* Action Info */}
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-white font-semibold text-sm">
                  {actionLabels[action.type]}
                </h4>
                <Badge tone="default" className="bg-white/20 text-white border-white/30 text-xs">
                  Step {index + 1}
                </Badge>
              </div>
              <p className="text-white/60 text-xs mt-0.5">
                {action.type === 'wait' 
                  ? `Delay for ${config.duration || 0} ${config.unit || 'minutes'}`
                  : config.template_id 
                    ? 'Template configured' 
                    : 'Configure action'}
              </p>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="invisible"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            <Button
              variant="invisible"
              size="sm"
              onClick={() => onDelete(action.id)}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Expanded Config */}
        {isExpanded && (
          <div className="relative z-10 px-4 pb-4 space-y-3">
            <div className="h-px bg-white/10" />
            
            {/* MESSAGE ACTIONS CONFIG */}
            {(action.type === 'send_email' || action.type === 'send_whatsapp' || action.type === 'send_sms') && (
              <div className="space-y-3">
                {/* Template Selection */}
                <div>
                  <label className="text-white/80 text-xs font-medium mb-1.5 block">
                    Message Template
                  </label>
                  <Select
                    value={config.template_id || ''}
                    onChange={(e) => handleConfigChange('template_id', e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                  >
                    <option value="">Select template...</option>
                    {messageTemplates
                      .filter(t => t.channel === (
                        action.type === 'send_email' ? 'email' : 
                        action.type === 'send_sms' ? 'sms' : 'whatsapp'
                      ))
                      .map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                  </Select>
                </div>
                
                {/* AI Personalization */}
                <div className="flex items-center justify-between">
                  <label className="text-white/80 text-xs font-medium">
                    AI Personalization
                  </label>
                  <Switch
                    checked={config.use_ai_personalization || false}
                    onCheckedChange={(checked) => handleConfigChange('use_ai_personalization', checked)}
                  />
                </div>
              </div>
            )}
            
            {/* WAIT ACTION CONFIG */}
            {action.type === 'wait' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/80 text-xs font-medium mb-1.5 block">
                    Duration
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={config.duration || 1}
                    onChange={(e) => handleConfigChange('duration', parseInt(e.target.value))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-xs font-medium mb-1.5 block">
                    Unit
                  </label>
                  <Select
                    value={config.unit || 'minutes'}
                    onChange={(e) => handleConfigChange('unit', e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </Select>
                </div>
              </div>
            )}
            
            {/* UPDATE LEAD CONFIG */}
            {action.type === 'update_lead' && (
              <div className="space-y-3">
                <div>
                  <label className="text-white/80 text-xs font-medium mb-1.5 block">
                    Field to Update
                  </label>
                  <Select
                    value={config.field || ''}
                    onChange={(e) => handleConfigChange('field', e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                  >
                    <option value="">Select field...</option>
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="assigned_to">Assigned To</option>
                    <option value="tags">Tags</option>
                  </Select>
                </div>
                <div>
                  <label className="text-white/80 text-xs font-medium mb-1.5 block">
                    New Value
                  </label>
                  <Input
                    value={config.value || ''}
                    onChange={(e) => handleConfigChange('value', e.target.value)}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="Enter new value..."
                  />
                </div>
              </div>
            )}
            
            {/* NOTIFY TEAM CONFIG */}
            {action.type === 'notify_team' && (
              <div>
                <label className="text-white/80 text-xs font-medium mb-1.5 block">
                  Notification Message
                </label>
                <TextArea
                  value={config.message || ''}
                  onChange={(e) => handleConfigChange('message', e.target.value)}
                  className="bg-white/5 border-white/20 text-white min-h-[80px]"
                  placeholder="Enter notification message..."
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Connection Line to Next Action */}
      <div className="flex justify-center py-2">
        <div className="w-px h-6 bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </div>
  );
}

// =============================================
// CONDITION BUILDER COMPONENT
// =============================================
interface ConditionBuilderProps {
  conditions: WorkflowCondition[];
  onChange: (conditions: WorkflowCondition[]) => void;
}

function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const addCondition = () => {
    onChange([
      ...conditions,
      {
        field: 'smartscore',
        operator: 'greater_than',
        value: '',
        logic: 'AND'
      }
    ]);
  };
  
  const updateCondition = (index: number, updates: Partial<WorkflowCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onChange(newConditions);
  };
  
  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };
  
  return (
    <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="bg-gold-500/20 border border-gold-500/30 rounded-lg p-2">
            <Filter className="w-4 h-4 text-gold-500" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">Conditions</h4>
            <p className="text-white/60 text-xs">When should this workflow run?</p>
          </div>
        </div>
        <Button
          variant="invisible"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <>
          <div className="h-px bg-white/10 mb-3" />
          
          {/* Conditions List */}
          <div className="space-y-3">
            {conditions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-white/60 text-sm mb-3">No conditions set - workflow runs for all leads</p>
                <Button
                  onClick={addCondition}
                  size="sm"
                  variant="secondary"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Condition
                </Button>
              </div>
            ) : (
              <>
                {conditions.map((condition, index) => (
                  <div key={index} className="space-y-2">
                    {index > 0 && (
                      <div className="flex items-center justify-center">
                        <Select
                          value={condition.logic || 'AND'}
                          onChange={(e) => updateCondition(index, { logic: e.target.value as 'AND' | 'OR' })}
                          className="w-20 h-8 bg-white/5 border-white/20 text-white text-xs"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-12 gap-2">
                      {/* Field */}
                      <div className="col-span-4">
                        <Select
                          value={condition.field}
                          onChange={(e) => updateCondition(index, { field: e.target.value })}
                          className="bg-white/5 border-white/20 text-white text-xs"
                        >
                          <option value="smartscore">SmartScore</option>
                          <option value="status">Status</option>
                          <option value="priority">Priority</option>
                          <option value="source">Source</option>
                          <option value="budget">Budget</option>
                          <option value="location">Location</option>
                        </Select>
                      </div>
                      {/* Operator */}
                      <div className="col-span-3">
                        <Select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
                          className="bg-white/5 border-white/20 text-white text-xs"
                        >
                          <option value="equals">=</option>
                          <option value="not_equals">≠</option>
                          <option value="greater_than">&gt;</option>
                          <option value="less_than">&lt;</option>
                          <option value="contains">Contains</option>
                        </Select>
                      </div>
                      {/* Value */}
                      <div className="col-span-4">
                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(index, { value: e.target.value })}
                          className="bg-white/5 border-white/20 text-white text-xs"
                          placeholder="Value..."
                        />
                      </div>
                      {/* Delete */}
                      <div className="col-span-1">
                        <Button
                          variant="invisible"
                          size="sm"
                          onClick={() => removeCondition(index)}
                          className="h-full w-full p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={addCondition}
                  size="sm"
                  variant="secondary"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Condition
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// =============================================
// MAIN WORKFLOW BUILDER
// =============================================
function WorkflowBuilder() {
  const [workflow, setWorkflow] = useState<WorkflowTemplate>({
    name: '',
    description: '',
    trigger_type: 'lead_created',
    trigger_config: {},
    conditions: [],
    actions: [],
    is_active: false,
    priority: 50
  });
  
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const supabase = getSupabase();
  
  // =============================================
  // LOAD MESSAGE TEMPLATES
  // =============================================
  useEffect(() => {
    loadMessageTemplates();
  }, []);
  
  const loadMessageTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setMessageTemplates(data || []);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load message templates');
    }
  };
  
  // =============================================
  // DRAG AND DROP HANDLERS
  // =============================================
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(workflow.actions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order numbers
    const reorderedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));
    
    setWorkflow({ ...workflow, actions: reorderedItems });
  };
  
  // =============================================
  // ACTION HANDLERS
  // =============================================
  const addAction = (type: WorkflowAction['type']) => {
    const newAction: WorkflowAction = {
      id: `action-${Date.now()}`,
      type,
      config: {},
      order: workflow.actions.length
    };
    
    setWorkflow({
      ...workflow,
      actions: [...workflow.actions, newAction]
    });
  };
  
  const updateAction = (id: string, config: Record<string, any>) => {
    setWorkflow({
      ...workflow,
      actions: workflow.actions.map(action =>
        action.id === id ? { ...action, config } : action
      )
    });
  };
  
  const deleteAction = (id: string) => {
    setWorkflow({
      ...workflow,
      actions: workflow.actions
        .filter(action => action.id !== id)
        .map((action, index) => ({ ...action, order: index }))
    });
  };
  
  // =============================================
  // VALIDATION
  // =============================================
  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];
    
    // Basic validation
    if (!workflow.name.trim()) {
      errors.push('Workflow name is required');
    }
    
    if (workflow.actions.length === 0) {
      errors.push('At least one action is required');
    }
    
    // Validate each action
    workflow.actions.forEach((action, index) => {
      if (action.type === 'send_email' || action.type === 'send_whatsapp' || action.type === 'send_sms') {
        if (!action.config.template_id) {
          errors.push(`Action ${index + 1}: Message template is required`);
        }
      }
      
      if (action.type === 'wait') {
        if (!action.config.duration || action.config.duration < 1) {
          errors.push(`Action ${index + 1}: Valid duration is required`);
        }
      }
      
      if (action.type === 'update_lead') {
        if (!action.config.field || !action.config.value) {
          errors.push(`Action ${index + 1}: Field and value are required`);
        }
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [workflow]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      validateWorkflow();
    }, 500);
    return () => clearTimeout(timer);
  }, [workflow, validateWorkflow]);
  
  // =============================================
  // SAVE WORKFLOW
  // =============================================
  const saveWorkflow = async () => {
    if (!validateWorkflow()) {
      toast.error('Please fix validation errors');
      return;
    }
    
    setIsSaving(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to save workflows');
        return;
      }
      
      const { data, error } = await supabase
        .from('workflow_templates')
        .insert([{
          builder_id: user.id,
          name: workflow.name,
          description: workflow.description,
          category: 'lead_nurture',
          trigger_type: workflow.trigger_type,
          trigger_config: workflow.trigger_config || {},
          actions: workflow.actions.map(a => ({
            type: a.type,
            delay_minutes: a.config.delay_minutes || 0,
            message_template_id: a.config.template_id,
            config: a.config
          })),
          conditions: workflow.conditions,
          is_active: workflow.is_active,
          priority: workflow.priority,
          created_by: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Workflow saved successfully!');
      
      // Reset form
      setWorkflow({
        name: '',
        description: '',
        trigger_type: 'lead_created',
        trigger_config: {},
        conditions: [],
        actions: [],
        is_active: false,
        priority: 50
      });
    } catch (error: any) {
      console.error('Save failed:', error);
      toast.error('Failed to save workflow: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-6">
      {/* Animated Background Elements */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
        <div 
          className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow' 
          style={{ animationDelay: '1s' }} 
        />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Workflow Builder
              </h1>
              <p className="text-white/60">
                Create automated workflows for lead nurturing
              </p>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={saveWorkflow}
                disabled={isSaving || validationErrors.length > 0}
                variant="primary"
                className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-primary-950 shadow-lg"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Workflow
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Validation Status */}
          {validationErrors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-semibold mb-2">Validation Errors</h4>
                  <ul className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-red-300 text-sm">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {validationErrors.length === 0 && workflow.actions.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-400" />
                <p className="text-green-400 font-semibold">Workflow is valid and ready to save!</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar - Workflow Settings */}
          <div className="col-span-4 space-y-6">
            
            {/* Basic Info */}
            <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6">
              <h3 className="text-white font-semibold mb-4">Basic Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm font-medium mb-2 block">
                    Workflow Name *
                  </label>
                  <Input
                    value={workflow.name}
                    onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="e.g., Welcome New Leads"
                  />
                </div>
                
                <div>
                  <label className="text-white/80 text-sm font-medium mb-2 block">
                    Description
                  </label>
                  <TextArea
                    value={workflow.description}
                    onChange={(e) => setWorkflow({ ...workflow, description: e.target.value })}
                    className="bg-white/5 border-white/20 text-white min-h-[80px]"
                    placeholder="Describe what this workflow does..."
                  />
                </div>
                
                <div>
                  <label className="text-white/80 text-sm font-medium mb-2 block">
                    Trigger Type
                  </label>
                  <Select
                    value={workflow.trigger_type}
                    onChange={(e) => setWorkflow({ ...workflow, trigger_type: e.target.value as any })}
                    className="bg-white/5 border-white/20 text-white"
                  >
                    <option value="lead_created">When Lead Created</option>
                    <option value="score_change">When Score Changes</option>
                    <option value="behavior_detected">On Behavior Detected</option>
                    <option value="time_based">Time-Based (Schedule)</option>
                    <option value="manual">Manual Trigger</option>
                  </Select>
                </div>
                
                <div>
                  <label className="text-white/80 text-sm font-medium mb-2 block">
                    Priority (1-100)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={workflow.priority}
                    onChange={(e) => setWorkflow({ ...workflow, priority: parseInt(e.target.value) })}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <label className="text-white/80 text-sm font-medium">
                    Active Status
                  </label>
                  <Switch
                    checked={workflow.is_active}
                    onCheckedChange={(checked) => setWorkflow({ ...workflow, is_active: checked })}
                  />
                </div>
              </div>
            </div>
            
            {/* Conditions */}
            <ConditionBuilder
              conditions={workflow.conditions}
              onChange={(conditions) => setWorkflow({ ...workflow, conditions })}
            />
            
            {/* Add Action Buttons */}
            <div className="relative h-full rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6">
              <h3 className="text-white font-semibold mb-4">Add Actions</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => addAction('send_email')}
                  variant="secondary"
                  className="bg-white/5 border-white/20 text-white hover:bg-blue-500/20 hover:border-blue-500/40"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  onClick={() => addAction('send_whatsapp')}
                  variant="secondary"
                  className="bg-white/5 border-white/20 text-white hover:bg-green-500/20 hover:border-green-500/40"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  onClick={() => addAction('send_sms')}
                  variant="secondary"
                  className="bg-white/5 border-white/20 text-white hover:bg-purple-500/20 hover:border-purple-500/40"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  SMS
                </Button>
                <Button
                  onClick={() => addAction('wait')}
                  variant="secondary"
                  className="bg-white/5 border-white/20 text-white hover:bg-amber-500/20 hover:border-amber-500/40"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Wait
                </Button>
                <Button
                  onClick={() => addAction('update_lead')}
                  variant="secondary"
                  className="bg-white/5 border-white/20 text-white hover:bg-cyan-500/20 hover:border-cyan-500/40"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Update
                </Button>
                <Button
                  onClick={() => addAction('notify_team')}
                  variant="secondary"
                  className="bg-white/5 border-white/20 text-white hover:bg-pink-500/20 hover:border-pink-500/40"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Notify
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right - Workflow Canvas */}
          <div className="col-span-8">
            <div className="bg-white/5 backdrop-blur-lg backdrop-saturate-180 border border-white/20 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6 min-h-[600px]">
              
              {workflow.actions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20">
                  <div className="bg-gold-500/20 border border-gold-500/30 rounded-full p-6 mb-6">
                    <Zap className="w-12 h-12 text-gold-500" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    Start Building Your Workflow
                  </h3>
                  <p className="text-white/60 text-center max-w-md mb-6">
                    Add actions from the left sidebar to create your automated workflow.
                    Actions will execute in order from top to bottom.
                  </p>
                  <Button
                    onClick={() => addAction('send_email')}
                    variant="primary"
                    className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-primary-950"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Action
                  </Button>
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="actions">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-0"
                      >
                        {workflow.actions.map((action, index) => (
                          <Draggable
                            key={action.id}
                            draggableId={action.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <ActionCard
                                  action={action}
                                  index={index}
                                  onUpdate={updateAction}
                                  onDelete={deleteAction}
                                  messageTemplates={messageTemplates}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkflowBuilder;
