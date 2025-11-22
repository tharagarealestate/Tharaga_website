# =============================================
# WORKFLOW AUTOMATION ENGINE
# Real-time workflow processing and execution
# =============================================
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
import asyncio
import json
import logging
from enum import Enum

# =============================================
# CONFIGURATION
# =============================================
app = FastAPI(title="Tharaga Workflow Engine", version="1.0")

# Supabase connection - lazy initialization
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Lazy initialization of Supabase client"""
    global _supabase_client
    if _supabase_client is None:
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client

# Twilio for WhatsApp/SMS
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER")
TWILIO_SMS_NUMBER = os.getenv("TWILIO_SMS_NUMBER")

# Resend for Email
RESEND_API_KEY = os.getenv("RESEND_API_KEY")

# AI Service
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================
# EXTERNAL SERVICE CLIENTS (Optional)
# =============================================
twilio_client = None
resend = None
openai = None

try:
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        from twilio.rest import Client as TwilioClient
        twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("Twilio client initialized")
except Exception as e:
    logger.warning(f"Twilio not available: {e}")

try:
    if RESEND_API_KEY:
        import resend
        resend.api_key = RESEND_API_KEY
        logger.info("Resend client initialized")
except Exception as e:
    logger.warning(f"Resend not available: {e}")

try:
    if OPENAI_API_KEY:
        import openai
        openai.api_key = OPENAI_API_KEY
        logger.info("OpenAI client initialized")
except Exception as e:
    logger.warning(f"OpenAI not available: {e}")

# =============================================
# PYDANTIC MODELS
# =============================================
class TriggerType(str, Enum):
    LEAD_CREATED = "lead_created"
    SCORE_CHANGE = "score_change"
    BEHAVIOR = "behavior"
    TIME_BASED = "time_based"
    MANUAL = "manual"

class ActionType(str, Enum):
    SEND_WHATSAPP = "send_whatsapp"
    SEND_SMS = "send_sms"
    SEND_EMAIL = "send_email"
    UPDATE_LEAD = "update_lead"
    CREATE_TASK = "create_task"
    WAIT = "wait"

class ExecuteWorkflowRequest(BaseModel):
    workflow_id: str
    lead_id: int  # BIGINT in database
    trigger_type: TriggerType
    trigger_payload: Dict[str, Any] = Field(default_factory=dict)
    force_execute: bool = False

class ProcessActionsRequest(BaseModel):
    execution_id: str

# =============================================
# WORKFLOW ENGINE CLASS
# =============================================
class WorkflowEngine:
    """Core workflow automation engine"""
    
    def __init__(self):
        self.supabase = None
    
    def _get_supabase(self):
        """Get Supabase client"""
        if self.supabase is None:
            self.supabase = get_supabase_client()
        return self.supabase
    
    # =============================================
    # WORKFLOW EXECUTION
    # =============================================
    
    async def execute_workflow(
        self,
        workflow_id: str,
        lead_id: int,
        trigger_type: str,
        trigger_payload: Dict[str, Any] = None,
        force_execute: bool = False
    ) -> Dict[str, Any]:
        """
        Execute a workflow for a specific lead
        """
        try:
            logger.info(f"Executing workflow {workflow_id} for lead {lead_id}")
            
            supabase = self._get_supabase()
            
            # Fetch workflow template
            workflow_result = supabase.table('workflow_templates').select(
                '*'
            ).eq('id', workflow_id).single().execute()
            
            if not workflow_result.data:
                raise HTTPException(404, "Workflow not found")
            
            workflow = workflow_result.data
            
            if not workflow['is_active'] and not force_execute:
                logger.warning(f"Workflow {workflow_id} is inactive")
                return {"status": "skipped", "reason": "Workflow inactive"}
            
            # Fetch lead data with related info
            lead_result = supabase.table('leads').select(
                '*, properties:property_id(*, builders(*)), profiles:buyer_id(*)'
            ).eq('id', lead_id).single().execute()
            
            if not lead_result.data:
                raise HTTPException(404, "Lead not found")
            
            lead = lead_result.data
            
            # Evaluate conditions
            if not force_execute:
                conditions_result = supabase.rpc(
                    'evaluate_workflow_conditions',
                    {
                        'p_workflow_id': workflow_id,
                        'p_lead_id': lead_id
                    }
                ).execute()
                
                conditions_met = conditions_result.data if conditions_result.data else True
                
                if not conditions_met:
                    logger.info(f"Conditions not met for workflow {workflow_id}")
                    return {"status": "skipped", "reason": "Conditions not met"}
            
            # Create execution record using Supabase function
            execution_result = supabase.rpc(
                'create_workflow_execution',
                {
                    'p_workflow_id': workflow_id,
                    'p_lead_id': lead_id,
                    'p_trigger_type': trigger_type,
                    'p_trigger_payload': json.dumps(trigger_payload or {})
                }
            ).execute()
            
            execution_id = execution_result.data
            
            if not execution_id:
                return {"status": "skipped", "reason": "Conditions not met"}
            
            logger.info(f"Created execution {execution_id}")
            
            # Process actions asynchronously
            asyncio.create_task(self._process_actions(execution_id, lead))
            
            return {
                "status": "created",
                "execution_id": execution_id,
                "workflow_name": workflow['name']
            }
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {str(e)}")
            raise HTTPException(500, f"Execution failed: {str(e)}")
    
    # =============================================
    # ACTION PROCESSING
    # =============================================
    
    async def _process_actions(self, execution_id: str, lead_data: Dict):
        """
        Process all actions for a workflow execution
        """
        try:
            supabase = self._get_supabase()
            
            # Update execution status
            supabase.table('workflow_executions').update({
                'status': 'running',
                'started_at': datetime.now().isoformat()
            }).eq('id', execution_id).execute()
            
            # Fetch pending actions
            actions_result = supabase.table('workflow_actions').select(
                '*'
            ).eq('execution_id', execution_id).order('scheduled_for').execute()
            
            actions = actions_result.data or []
            
            for action in actions:
                try:
                    # Wait for scheduled time
                    scheduled_time = datetime.fromisoformat(action['scheduled_for'].replace('Z', '+00:00'))
                    now = datetime.now(scheduled_time.tzinfo)
                    
                    if scheduled_time > now:
                        delay_seconds = (scheduled_time - now).total_seconds()
                        logger.info(f"Waiting {delay_seconds}s for action {action['id']}")
                        await asyncio.sleep(delay_seconds)
                    
                    # Execute action
                    await self._execute_action(action, lead_data)
                    
                except Exception as e:
                    logger.error(f"Action {action['id']} failed: {str(e)}")
                    
                    # Mark action as failed
                    supabase.table('workflow_actions').update({
                        'status': 'failed',
                        'error_message': str(e),
                        'completed_at': datetime.now().isoformat()
                    }).eq('id', action['id']).execute()
            
            # Update execution status
            completed_actions = supabase.table('workflow_actions').select(
                'status'
            ).eq('execution_id', execution_id).execute()
            
            all_completed = all(
                a['status'] in ['completed', 'failed', 'skipped']
                for a in (completed_actions.data or [])
            )
            
            if all_completed:
                completed_count = len([a for a in completed_actions.data if a['status'] == 'completed'])
                failed_count = len([a for a in completed_actions.data if a['status'] == 'failed'])
                
                supabase.table('workflow_executions').update({
                    'status': 'completed',
                    'completed_at': datetime.now().isoformat(),
                    'actions_completed': completed_count,
                    'actions_failed': failed_count
                }).eq('id', execution_id).execute()
                
                logger.info(f"Workflow execution {execution_id} completed")
            
        except Exception as e:
            logger.error(f"Action processing failed: {str(e)}")
            
            # Mark execution as failed
            supabase = self._get_supabase()
            supabase.table('workflow_executions').update({
                'status': 'failed',
                'error_message': str(e),
                'completed_at': datetime.now().isoformat()
            }).eq('id', execution_id).execute()
    
    async def _execute_action(self, action: Dict, lead_data: Dict):
        """
        Execute a single workflow action
        """
        action_type = action['action_type']
        action_config = action.get('action_config', {})
        
        logger.info(f"Executing action {action['id']}: {action_type}")
        
        supabase = self._get_supabase()
        
        # Update action status
        supabase.table('workflow_actions').update({
            'status': 'running',
            'started_at': datetime.now().isoformat()
        }).eq('id', action['id']).execute()
        
        try:
            result = None
            
            if action_type == 'send_whatsapp':
                result = await self._send_whatsapp(action, lead_data)
            elif action_type == 'send_sms':
                result = await self._send_sms(action, lead_data)
            elif action_type == 'send_email':
                result = await self._send_email(action, lead_data)
            elif action_type == 'update_lead':
                result = await self._update_lead(action, lead_data)
            elif action_type == 'create_task':
                result = await self._create_task(action, lead_data)
            elif action_type == 'wait':
                delay_minutes = action_config.get('duration_minutes', 5)
                await asyncio.sleep(delay_minutes * 60)
                result = {"status": "waited"}
            else:
                raise ValueError(f"Unknown action type: {action_type}")
            
            # Mark action as completed
            supabase.table('workflow_actions').update({
                'status': 'completed',
                'result': json.dumps(result),
                'completed_at': datetime.now().isoformat()
            }).eq('id', action['id']).execute()
            
            logger.info(f"Action {action['id']} completed successfully")
            
        except Exception as e:
            logger.error(f"Action execution failed: {str(e)}")
            
            # Mark action as failed
            supabase.table('workflow_actions').update({
                'status': 'failed',
                'error_message': str(e),
                'completed_at': datetime.now().isoformat()
            }).eq('id', action['id']).execute()
            
            raise
    
    # =============================================
    # MESSAGE SENDING METHODS
    # =============================================
    
    async def _send_whatsapp(self, action: Dict, lead_data: Dict) -> Dict:
        """Send WhatsApp message via Twilio"""
        if not twilio_client:
            raise ValueError("Twilio client not available")
        
        try:
            config = action.get('action_config', {})
            template_id = config.get('message_template_id')
            
            supabase = self._get_supabase()
            
            # Fetch template
            template_result = supabase.table('message_templates').select(
                '*'
            ).eq('id', template_id).single().execute()
            
            if not template_result.data:
                raise ValueError("Message template not found")
            
            template = template_result.data
            
            # Get recipient phone from lead
            recipient_phone = lead_data.get('phone')
            if not recipient_phone:
                # Try to get from profile
                if lead_data.get('profiles'):
                    recipient_phone = lead_data['profiles'].get('phone')
            
            if not recipient_phone:
                raise ValueError("Recipient phone number not found")
            
            # Format phone for WhatsApp
            if not recipient_phone.startswith('+'):
                recipient_phone = '+91' + recipient_phone.lstrip('0')
            
            # Generate/personalize message
            body_template = template.get('body_template') or template.get('body', '')
            message_body = self._personalize_template(body_template, lead_data)
            
            # Send via Twilio
            from_number = f'whatsapp:{TWILIO_WHATSAPP_NUMBER or "+1234567890"}'
            message = twilio_client.messages.create(
                from_=from_number,
                to=f'whatsapp:{recipient_phone}',
                body=message_body
            )
            
            # Create delivery record
            delivery_data = {
                'action_id': action['id'],
                'channel': 'whatsapp',
                'recipient_id': lead_data.get('buyer_id'),
                'recipient_phone': recipient_phone,
                'message_template_id': template_id,
                'body': message_body,
                'status': 'sent',
                'provider': 'twilio',
                'provider_message_id': message.sid,
                'sent_at': datetime.now().isoformat()
            }
            
            delivery_result = supabase.table('message_deliveries').insert(delivery_data).execute()
            
            # Update action with external ID
            supabase.table('workflow_actions').update({
                'external_message_id': message.sid,
                'external_status': message.status
            }).eq('id', action['id']).execute()
            
            logger.info(f"WhatsApp sent: {message.sid}")
            
            return {
                "status": "sent",
                "message_sid": message.sid,
                "delivery_id": delivery_result.data[0]['id'] if delivery_result.data else None,
                "recipient": recipient_phone
            }
            
        except Exception as e:
            logger.error(f"WhatsApp send failed: {str(e)}")
            raise
    
    async def _send_sms(self, action: Dict, lead_data: Dict) -> Dict:
        """Send SMS via Twilio"""
        if not twilio_client:
            raise ValueError("Twilio client not available")
        
        try:
            config = action.get('action_config', {})
            template_id = config.get('message_template_id')
            
            supabase = self._get_supabase()
            
            # Fetch template
            template_result = supabase.table('message_templates').select(
                '*'
            ).eq('id', template_id).single().execute()
            
            if not template_result.data:
                raise ValueError("Message template not found")
            
            template = template_result.data
            
            # Get recipient phone
            recipient_phone = lead_data.get('phone')
            if not recipient_phone and lead_data.get('profiles'):
                recipient_phone = lead_data['profiles'].get('phone')
            
            if not recipient_phone:
                raise ValueError("Recipient phone number not found")
            
            if not recipient_phone.startswith('+'):
                recipient_phone = '+91' + recipient_phone.lstrip('0')
            
            # Generate/personalize message
            body_template = template.get('body_template') or template.get('body', '')
            message_body = self._personalize_template(body_template, lead_data)
            
            # Send via Twilio
            from_number = TWILIO_SMS_NUMBER or "+1234567890"
            message = twilio_client.messages.create(
                from_=from_number,
                to=recipient_phone,
                body=message_body
            )
            
            # Create delivery record
            delivery_data = {
                'action_id': action['id'],
                'channel': 'sms',
                'recipient_id': lead_data.get('buyer_id'),
                'recipient_phone': recipient_phone,
                'message_template_id': template_id,
                'body': message_body,
                'status': 'sent',
                'provider': 'twilio',
                'provider_message_id': message.sid,
                'sent_at': datetime.now().isoformat()
            }
            
            delivery_result = supabase.table('message_deliveries').insert(delivery_data).execute()
            
            logger.info(f"SMS sent: {message.sid}")
            
            return {
                "status": "sent",
                "message_sid": message.sid,
                "delivery_id": delivery_result.data[0]['id'] if delivery_result.data else None
            }
            
        except Exception as e:
            logger.error(f"SMS send failed: {str(e)}")
            raise
    
    async def _send_email(self, action: Dict, lead_data: Dict) -> Dict:
        """Send email via Resend"""
        if not resend:
            raise ValueError("Resend client not available")
        
        try:
            config = action.get('action_config', {})
            template_id = config.get('email_template_id') or config.get('message_template_id')
            
            supabase = self._get_supabase()
            
            # Fetch template
            template_result = supabase.table('message_templates').select(
                '*'
            ).eq('id', template_id).single().execute()
            
            if not template_result.data:
                raise ValueError("Email template not found")
            
            template = template_result.data
            
            # Get recipient email
            recipient_email = lead_data.get('email')
            if not recipient_email and lead_data.get('profiles'):
                recipient_email = lead_data['profiles'].get('email')
            
            if not recipient_email:
                raise ValueError("Recipient email not found")
            
            # Generate/personalize content
            body_template = template.get('body_template') or template.get('body', '')
            email_body = self._personalize_template(body_template, lead_data)
            
            subject_template = template.get('subject', 'Property Inquiry Follow-up')
            subject = self._personalize_template(subject_template, lead_data)
            
            # Get builder info for sender
            property_data = lead_data.get('properties', {})
            builder_data = property_data.get('builders', {}) if isinstance(property_data.get('builders'), dict) else {}
            
            from_email = 'noreply@tharaga.co.in'
            from_name = builder_data.get('name') or builder_data.get('company_name') or 'Tharaga'
            
            # Send via Resend
            email_response = resend.Emails.send({
                "from": f"{from_name} <{from_email}>",
                "to": recipient_email,
                "subject": subject,
                "html": email_body if template.get('format') == 'html' else f"<p>{email_body}</p>"
            })
            
            # Create delivery record
            delivery_data = {
                'action_id': action['id'],
                'channel': 'email',
                'recipient_id': lead_data.get('buyer_id'),
                'recipient_email': recipient_email,
                'message_template_id': template_id,
                'subject': subject,
                'body': email_body,
                'status': 'sent',
                'provider': 'resend',
                'provider_message_id': email_response.get('id'),
                'sent_at': datetime.now().isoformat()
            }
            
            delivery_result = supabase.table('message_deliveries').insert(delivery_data).execute()
            
            logger.info(f"Email sent: {email_response.get('id')}")
            
            return {
                "status": "sent",
                "email_id": email_response.get('id'),
                "delivery_id": delivery_result.data[0]['id'] if delivery_result.data else None
            }
            
        except Exception as e:
            logger.error(f"Email send failed: {str(e)}")
            raise
    
    async def _update_lead(self, action: Dict, lead_data: Dict) -> Dict:
        """Update lead fields"""
        try:
            config = action.get('action_config', {})
            updates = config.get('updates', {})
            
            supabase = self._get_supabase()
            supabase.table('leads').update(updates).eq(
                'id', lead_data['id']
            ).execute()
            
            return {"status": "updated", "fields": list(updates.keys())}
            
        except Exception as e:
            logger.error(f"Lead update failed: {str(e)}")
            raise
    
    async def _create_task(self, action: Dict, lead_data: Dict) -> Dict:
        """Create task for builder"""
        try:
            config = action.get('action_config', {})
            
            supabase = self._get_supabase()
            
            # Check if tasks table exists
            title_template = config.get('title', 'Follow up with lead')
            title = self._personalize_template(title_template, lead_data)
            
            description_template = config.get('description', '')
            description = self._personalize_template(description_template, lead_data) if description_template else ''
            
            task_data = {
                'builder_id': lead_data.get('builder_id'),
                'lead_id': lead_data['id'],
                'title': title,
                'description': description,
                'priority': config.get('priority', 'medium'),
                'status': 'pending',
                'due_date': (datetime.now() + timedelta(days=config.get('due_in_days', 1))).isoformat(),
                'created_at': datetime.now().isoformat()
            }
            
            # Try to insert into tasks table (may not exist)
            try:
                task_result = supabase.table('tasks').insert(task_data).execute()
                task_id = task_result.data[0]['id'] if task_result.data else None
            except Exception:
                # Tasks table might not exist, create in automation_queue instead
                task_result = supabase.table('automation_queue').insert({
                    'job_type': 'follow_up_task',
                    'job_data': task_data,
                    'status': 'pending',
                    'priority': 'normal',
                    'scheduled_for': datetime.now().isoformat()
                }).execute()
                task_id = task_result.data[0]['id'] if task_result.data else None
            
            return {"status": "created", "task_id": task_id}
            
        except Exception as e:
            logger.error(f"Task creation failed: {str(e)}")
            raise
    
    # =============================================
    # HELPER METHODS
    # =============================================
    
    def _personalize_template(self, template: str, lead_data: Dict) -> str:
        """Replace template variables with actual data"""
        if not template:
            return ""
        
        # Get property data
        property_data = lead_data.get('properties', {})
        profile_data = lead_data.get('profiles', {})
        
        # Get builder info
        builder_data = property_data.get('builders', {}) if isinstance(property_data.get('builders'), dict) else {}
        
        # Available variables
        lead_name = lead_data.get('name') or profile_data.get('full_name', 'there')
        first_name = lead_name.split()[0] if lead_name else 'there'
        
        variables = {
            'lead_name': lead_name,
            'first_name': first_name,
            'property_title': property_data.get('title', 'the property'),
            'property_type': property_data.get('property_type', 'property'),
            'property_price': f"₹{property_data.get('price_inr', property_data.get('price', 0)):,.0f}",
            'builder_name': builder_data.get('name') or builder_data.get('company_name', 'Builder'),
            'smartscore': str(lead_data.get('smartscore_v2', lead_data.get('score', 0))),
            'priority_tier': lead_data.get('priority_tier', 'Developing'),
            'next_action': lead_data.get('next_best_action', 'Contact us'),
            'location': property_data.get('locality') or property_data.get('city', 'the area'),
            'bedrooms': str(property_data.get('bedrooms', 'N/A')),
            'area_sqft': str(property_data.get('sqft') or property_data.get('area_sqft', 'N/A'))
        }
        
        # Replace variables
        result = template
        for key, value in variables.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        
        return result
    
    async def _generate_ai_message(self, template: Dict, lead_data: Dict) -> str:
        """Generate personalized message using AI (fallback to template)"""
        if not openai:
            return self._personalize_template(template.get('body_template') or template.get('body', ''), lead_data)
        
        try:
            # Build prompt
            prompt_template = template.get('ai_prompt_template', '')
            tone = template.get('tone', 'professional')
            
            # Personalize prompt
            prompt = self._personalize_template(prompt_template, lead_data)
            
            # Add context
            context = f"""
You are writing a {tone} message for a real estate platform.
Lead Details:
- Name: {lead_data.get('name', 'Customer')}
- SmartScore: {lead_data.get('smartscore_v2', lead_data.get('score', 0))}/100
- Priority: {lead_data.get('priority_tier', 'Developing')}
- Interested in: {lead_data.get('properties', {}).get('title', 'property')}

Generate a personalized {template.get('channel', 'message')} message. Keep it concise (max 160 chars for SMS, 300 for WhatsApp, 500 for email).
"""
            
            # Call OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": context},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            generated_text = response.choices[0].message.content.strip()
            
            logger.info(f"AI message generated: {len(generated_text)} chars")
            return generated_text
            
        except Exception as e:
            logger.error(f"AI generation failed: {str(e)}")
            # Fallback to template
            return self._personalize_template(template.get('body_template') or template.get('body', ''), lead_data)

# =============================================
# INITIALIZE ENGINE
# =============================================
workflow_engine = WorkflowEngine()

# =============================================
# API ENDPOINTS
# =============================================
@app.post("/api/workflows/execute")
async def execute_workflow(request: ExecuteWorkflowRequest):
    """Execute a workflow for a lead"""
    result = await workflow_engine.execute_workflow(
        workflow_id=request.workflow_id,
        lead_id=request.lead_id,
        trigger_type=request.trigger_type.value,
        trigger_payload=request.trigger_payload,
        force_execute=request.force_execute
    )
    return result

@app.post("/api/workflows/process-pending")
async def process_pending_actions(background_tasks: BackgroundTasks):
    """Process all pending workflow actions (called by cron)"""
    try:
        supabase = get_supabase_client()
        
        # Fetch pending actions due now
        actions_result = supabase.table('workflow_actions').select(
            '*, workflow_executions!inner(*), leads!inner(*)'
        ).eq('status', 'pending').lte(
            'scheduled_for', datetime.now().isoformat()
        ).limit(100).execute()
        
        if not actions_result.data or len(actions_result.data) == 0:
            return {"status": "no_pending_actions"}
        
        # Group by execution
        executions = {}
        for action in actions_result.data:
            exec_id = action['execution_id']
            if exec_id not in executions:
                executions[exec_id] = {
                    'execution': action['workflow_executions'],
                    'actions': []
                }
            executions[exec_id]['actions'].append(action)
        
        # Process each execution
        for exec_id, data in executions.items():
            lead_data = data['execution'].get('leads', {})
            background_tasks.add_task(
                workflow_engine._process_actions,
                exec_id,
                lead_data
            )
        
        return {
            "status": "processing",
            "executions_queued": len(executions),
            "actions_total": len(actions_result.data)
        }
        
    except Exception as e:
        logger.error(f"Pending actions processing failed: {str(e)}")
        raise HTTPException(500, str(e))

@app.get("/api/workflows/{workflow_id}/stats")
async def get_workflow_stats(workflow_id: str):
    """Get workflow execution statistics"""
    try:
        supabase = get_supabase_client()
        
        # Fetch workflow
        workflow = supabase.table('workflow_templates').select(
            '*'
        ).eq('id', workflow_id).single().execute()
        
        if not workflow.data:
            raise HTTPException(404, "Workflow not found")
        
        # Fetch recent executions
        executions = supabase.table('workflow_executions').select(
            'status, created_at, execution_time_ms'
        ).eq('workflow_template_id', workflow_id).order(
            'created_at', desc=True
        ).limit(100).execute()
        
        # Calculate stats
        total = len(executions.data or [])
        completed = len([e for e in (executions.data or []) if e['status'] == 'completed'])
        failed = len([e for e in (executions.data or []) if e['status'] == 'failed'])
        
        return {
            "workflow_id": workflow_id,
            "total_executions": total,
            "success_rate": (completed / total * 100) if total > 0 else 0,
            "completed": completed,
            "failed": failed,
            "avg_execution_time_ms": workflow.data.get('avg_execution_time_ms', 0)
        }
        
    except Exception as e:
        logger.error(f"Stats fetch failed: {str(e)}")
        raise HTTPException(500, str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Workflow Engine",
        "version": "1.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

