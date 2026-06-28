# =============================================
# AI MESSAGE GENERATION SERVICE
# Personalized message generation with GPT-4
# =============================================
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
import os
import json
import logging
from supabase import create_client, Client

# =============================================
# CONFIGURATION
# =============================================
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

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================
# PYDANTIC MODELS
# =============================================
class MessageGenerationRequest(BaseModel):
    lead_id: str
    channel: Literal["whatsapp", "sms", "email"]
    message_type: Literal[
        "welcome", "follow_up", "property_match", 
        "site_visit_reminder", "hot_lead_alert", 
        "engagement_boost", "conversion_push"
    ]
    tone: Literal["professional", "friendly", "casual", "formal", "persuasive"] = "professional"
    include_cta: bool = True
    max_length: Optional[int] = None  # Character limit
    custom_context: Optional[Dict[str, Any]] = None

class MessageVariant(BaseModel):
    variant_id: str
    content: str
    subject: Optional[str] = None
    tone_score: float  # 0-1, how well it matches requested tone
    engagement_prediction: float  # 0-1, predicted engagement
    word_count: int
    character_count: int

class GeneratedMessage(BaseModel):
    variants: List[MessageVariant]
    lead_context: Dict[str, Any]
    generation_metadata: Dict[str, Any]
    recommended_variant: str

# =============================================
# AI MESSAGE GENERATOR CLASS
# =============================================
class AIMessageGenerator:
    """Advanced AI message generation with personalization"""
    
    def __init__(self):
        # OpenAI client (lazy initialization)
        self.openai = None
        if OPENAI_API_KEY:
            try:
                import openai
                openai.api_key = OPENAI_API_KEY
                self.openai = openai
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.warning(f"OpenAI not available: {e}")
        
        # Message type templates and prompts
        self.message_prompts = {
            "welcome": {
                "system": "You are a welcoming real estate assistant creating a warm first impression.",
                "user_template": """Create a {tone} welcome message for a new lead who just inquired about:

Property: {property_title}
Location: {location}
Price: {price}

Lead Details:
- Name: {lead_name}
- SmartScore: {smartscore}/100
- Buying Urgency: {buying_urgency}

Make them feel valued and excited. {cta_instruction}"""
            },
            "follow_up": {
                "system": "You are a persistent but respectful real estate follow-up specialist.",
                "user_template": """Create a {tone} follow-up message for:

Lead: {lead_name}
Last interaction: {days_since_last_contact} days ago
Property: {property_title}
Their interest level: {priority_tier}

{context_details}

Re-engage them without being pushy. {cta_instruction}"""
            },
            "property_match": {
                "system": "You are an enthusiastic property matcher highlighting perfect fits.",
                "user_template": """Create a {tone} message about a perfect property match:

New Property: {property_title}
Location: {location}
Price: {price}
Match Reasons: {match_reasons}

For: {lead_name}
Their preferences: {preferences}

Show excitement about the match. {cta_instruction}"""
            },
            "site_visit_reminder": {
                "system": "You are a helpful assistant sending site visit reminders.",
                "user_template": """Create a {tone} site visit reminder:

Property: {property_title}
Date: {visit_date}
Time: {visit_time}
Address: {visit_address}

Lead: {lead_name}

Include directions hint and what to bring. {cta_instruction}"""
            },
            "hot_lead_alert": {
                "system": "You are an urgent real estate assistant capitalizing on high interest.",
                "user_template": """Create a {tone} message for a HOT lead (score: {smartscore}/100):

Lead: {lead_name}
High interest in: {property_title}
Recent actions: {recent_behaviors}

Create urgency without being too aggressive. {cta_instruction}"""
            },
            "engagement_boost": {
                "system": "You are a re-engagement specialist winning back inactive leads.",
                "user_template": """Create a {tone} re-engagement message for:

Lead: {lead_name}
Last active: {days_inactive} days ago
Previous interest: {property_title}

New developments:
{new_updates}

Win them back with value. {cta_instruction}"""
            },
            "conversion_push": {
                "system": "You are a conversion specialist creating final push messages.",
                "user_template": """Create a {tone} conversion message for:

Lead: {lead_name}
Viewing property: {property_title}
Visit completed: {visit_date}
Conversion probability: {conversion_probability}%

Push for decision with limited-time offer or incentive. {cta_instruction}"""
            }
        }
        
        # Channel constraints
        self.channel_limits = {
            "sms": 160,
            "whatsapp": 1000,
            "email": 3000
        }
    
    # =============================================
    # MAIN GENERATION METHOD
    # =============================================
    
    async def generate_message(
        self,
        request: MessageGenerationRequest
    ) -> GeneratedMessage:
        """Generate personalized message with multiple variants"""
        try:
            logger.info(f"Generating {request.message_type} message for lead {request.lead_id}")
            
            # Fetch lead context
            lead_context = await self._fetch_lead_context(request.lead_id)
            
            # Get message prompt template
            prompt_config = self.message_prompts.get(request.message_type)
            if not prompt_config:
                raise ValueError(f"Unknown message type: {request.message_type}")
            
            # Determine character limit
            max_length = request.max_length or self.channel_limits.get(request.channel, 1000)
            
            # Generate multiple variants (A/B testing)
            variants = []
            
            # Variant 1: Requested tone
            variant_1 = await self._generate_variant(
                prompt_config,
                lead_context,
                request.tone,
                request.channel,
                max_length,
                request.include_cta,
                request.custom_context
            )
            variants.append(variant_1)
            
            # Variant 2: Alternative tone (for A/B testing)
            alternative_tones = {
                "professional": "friendly",
                "friendly": "casual",
                "casual": "friendly",
                "formal": "professional",
                "persuasive": "friendly"
            }
            alt_tone = alternative_tones.get(request.tone, "friendly")
            
            variant_2 = await self._generate_variant(
                prompt_config,
                lead_context,
                alt_tone,
                request.channel,
                max_length,
                request.include_cta,
                request.custom_context,
                variant_id="variant_2"
            )
            variants.append(variant_2)
            
            # Analyze variants and recommend best
            recommended = self._recommend_variant(variants, lead_context)
            
            # Save generation to database for analytics
            await self._save_generation_log(
                request.lead_id,
                request.message_type,
                variants,
                recommended
            )
            
            return GeneratedMessage(
                variants=variants,
                lead_context=lead_context,
                generation_metadata={
                    "message_type": request.message_type,
                    "channel": request.channel,
                    "generated_at": datetime.now().isoformat(),
                    "model": "gpt-4" if self.openai else "fallback",
                    "total_variants": len(variants)
                },
                recommended_variant=recommended
            )
            
        except Exception as e:
            logger.error(f"Message generation failed: {str(e)}")
            raise
    
    # =============================================
    # VARIANT GENERATION
    # =============================================
    
    async def _generate_variant(
        self,
        prompt_config: Dict,
        lead_context: Dict,
        tone: str,
        channel: str,
        max_length: int,
        include_cta: bool,
        custom_context: Optional[Dict] = None,
        variant_id: str = "variant_1"
    ) -> MessageVariant:
        """Generate a single message variant"""
        
        # Build CTA instruction
        cta_instruction = ""
        if include_cta:
            cta_map = {
                "whatsapp": "End with a WhatsApp-friendly CTA (e.g., 'Reply YES to schedule a visit')",
                "sms": "End with a brief SMS CTA (e.g., 'Text VISIT for details')",
                "email": "End with an email CTA button/link (e.g., 'Schedule Your Visit Today')"
            }
            cta_instruction = cta_map.get(channel, "Include a clear call-to-action")
        else:
            cta_instruction = "Do not include a call-to-action"
        
        # Merge context
        full_context = {**lead_context, **(custom_context or {})}
        full_context['tone'] = tone
        full_context['cta_instruction'] = cta_instruction
        
        # Format prompt
        system_prompt = prompt_config['system']
        user_prompt = prompt_config['user_template'].format(**full_context)
        
        # Add length constraint
        user_prompt += f"\n\nIMPORTANT: Keep message under {max_length} characters. Be concise and impactful."
        
        # Generate with OpenAI or fallback
        response = await self._call_openai(
            system_prompt,
            user_prompt,
            max_tokens=max_length // 2,  # Rough token estimate
            temperature=0.7
        )
        
        content = response['content']
        
        # Generate subject line for email
        subject = None
        if channel == "email":
            subject = await self._generate_subject_line(content, tone, lead_context)
        
        # Calculate scores
        tone_score = self._calculate_tone_match(content, tone)
        engagement_prediction = self._predict_engagement(
            content,
            lead_context,
            channel
        )
        
        return MessageVariant(
            variant_id=variant_id,
            content=content,
            subject=subject,
            tone_score=tone_score,
            engagement_prediction=engagement_prediction,
            word_count=len(content.split()),
            character_count=len(content)
        )
    
    async def _call_openai(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """Call OpenAI API with retry logic"""
        if not self.openai:
            # Fallback to template-based generation
            lead_name = "there"
            if "Lead:" in user_prompt:
                try:
                    lead_name = user_prompt.split("Lead:")[1].split()[0]
                except:
                    pass
            return {
                "content": f"Hello {lead_name}! We have an exciting property update for you. Reply YES to learn more.",
                "tokens_used": 0,
                "model": "fallback"
            }
        
        try:
            response = self.openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                presence_penalty=0.6,  # Encourage diversity
                frequency_penalty=0.3
            )
            
            return {
                "content": response.choices[0].message.content.strip(),
                "tokens_used": response.usage.total_tokens,
                "model": response.model
            }
            
        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}")
            # Fallback to template-based generation
            lead_name = "there"
            if "Lead:" in user_prompt:
                try:
                    lead_name = user_prompt.split("Lead:")[1].split()[0]
                except:
                    pass
            return {
                "content": f"Hello {lead_name}! We have an exciting property update for you. Reply YES to learn more.",
                "tokens_used": 0,
                "model": "fallback"
            }
    
    async def _generate_subject_line(
        self,
        email_body: str,
        tone: str,
        lead_context: Dict
    ) -> str:
        """Generate compelling email subject line"""
        if not self.openai:
            return f"Update about {lead_context.get('property_title', 'your property')}"
        
        try:
            prompt = f"""Based on this email content, create a compelling subject line (max 60 chars):

Email: {email_body[:200]}...
Tone: {tone}
Lead name: {lead_context.get('lead_name', 'Customer')}
Property: {lead_context.get('property_title', 'property')}

Create an attention-grabbing subject line that matches the tone."""
            
            response = await self._call_openai(
                "You are an email marketing expert creating subject lines.",
                prompt,
                max_tokens=50,
                temperature=0.8
            )
            
            subject = response['content'].strip('"').strip()
            
            # Ensure under 60 chars
            if len(subject) > 60:
                subject = subject[:57] + "..."
            
            return subject
            
        except Exception as e:
            logger.error(f"Subject generation failed: {str(e)}")
            return f"Update about {lead_context.get('property_title', 'your property')}"
    
    # =============================================
    # CONTEXT FETCHING
    # =============================================
    
    async def _fetch_lead_context(self, lead_id: str) -> Dict[str, Any]:
        """Fetch comprehensive lead context for personalization"""
        try:
            supabase = get_supabase_client()
            
            # Fetch lead with all relations
            lead_result = supabase.table('leads').select(
                '''
                *,
                properties!inner(
                    *
                ),
                profiles!buyer_id(
                    full_name,
                    email,
                    phone
                )
                '''
            ).eq('id', lead_id).single().execute()
            
            if not lead_result.data:
                raise ValueError(f"Lead {lead_id} not found")
            
            lead = lead_result.data
            
            # Fetch recent behaviors
            buyer_id = lead.get('buyer_id')
            behaviors = []
            if buyer_id:
                behaviors_result = supabase.table('behavior_tracking').select(
                    'behavior_type, created_at'
                ).eq('user_id', buyer_id).order(
                    'created_at', desc=True
                ).limit(10).execute()
                behaviors = behaviors_result.data or []
            
            # Fetch site visits
            visits_result = supabase.table('site_visits').select(
                '*'
            ).eq('buyer_id', buyer_id).order(
                'scheduled_at', desc=True
            ).limit(1).execute() if buyer_id else None
            
            latest_visit = visits_result.data[0] if visits_result and visits_result.data else None
            
            # Calculate days since last contact
            last_interaction = behaviors[0]['created_at'] if behaviors else lead.get('created_at', datetime.now().isoformat())
            try:
                last_dt = datetime.fromisoformat(last_interaction.replace('Z', '+00:00'))
                days_since_last = (datetime.now() - last_dt.replace(tzinfo=None)).days
            except:
                days_since_last = 0
            
            # Build context
            profile = lead.get('profiles', {})
            property_data = lead.get('properties', {})
            
            context = {
                # Lead info
                "lead_id": lead_id,
                "lead_name": profile.get('full_name', 'there'),
                "first_name": profile.get('full_name', 'there').split()[0] if profile.get('full_name') else 'there',
                "email": profile.get('email', ''),
                "phone": profile.get('phone', ''),
                
                # Property info
                "property_title": property_data.get('title', 'property'),
                "property_type": property_data.get('property_type', 'property'),
                "location": property_data.get('location', 'location'),
                "price": f"₹{property_data.get('price', 0):,.0f}" if property_data.get('price') else "N/A",
                "bedrooms": property_data.get('bedrooms', 'N/A'),
                "area_sqft": property_data.get('area_sqft', 'N/A'),
                
                # Lead scoring
                "smartscore": lead.get('ai_score', 0) or lead.get('smartscore_v2', 0) or 0,
                "priority_tier": lead.get('priority_tier', 'Developing'),
                "conversion_probability": f"{(lead.get('conversion_probability', 0) * 100):.1f}" if lead.get('conversion_probability') else "0",
                "predicted_value": f"₹{lead.get('predicted_ltv', 0):,.0f}" if lead.get('predicted_ltv') else "₹0",
                
                # Engagement
                "buying_urgency": "exploring",
                "days_since_last_contact": days_since_last,
                "days_inactive": days_since_last,
                "recent_behaviors": ", ".join([b['behavior_type'].replace('_', ' ') for b in behaviors[:5]]) if behaviors else "",
                
                # Site visit info
                "has_visit": latest_visit is not None,
                "visit_date": latest_visit.get('scheduled_at') if latest_visit else None,
                "visit_time": latest_visit.get('scheduled_at') if latest_visit else None,
                "visit_address": property_data.get('address', ''),
                "visit_status": latest_visit.get('status') if latest_visit else None,
                
                # Match reasons (for property match messages)
                "match_reasons": self._calculate_match_reasons(lead),
                
                # New updates (for re-engagement)
                "new_updates": self._get_new_updates(lead),
                
                # Preferences
                "preferences": "any property type",
                "budget_range": "Not specified"
            }
            
            return context
            
        except Exception as e:
            logger.error(f"Context fetch failed: {str(e)}")
            raise
    
    def _calculate_match_reasons(self, lead: Dict) -> str:
        """Calculate why property matches lead preferences"""
        reasons = []
        
        property_data = lead.get('properties', {})
        lead_budget = lead.get('budget', 0)
        property_price = property_data.get('price', 0)
        
        if lead_budget and property_price:
            if abs(property_price - lead_budget) / lead_budget < 0.1:
                reasons.append("Perfect budget match")
            elif property_price < lead_budget:
                reasons.append("Within budget")
        
        return ", ".join(reasons) if reasons else "Great match for your needs"
    
    def _get_new_updates(self, lead: Dict) -> str:
        """Get new updates about property or area"""
        updates = []
        property_data = lead.get('properties', {})
        updates.append(f"New pricing available for {property_data.get('title', 'the property')}")
        updates.append("Virtual tour now available")
        updates.append("Limited-time booking incentives")
        return "\n- ".join(updates)
    
    # =============================================
    # SCORING & ANALYSIS
    # =============================================
    
    def _calculate_tone_match(self, content: str, target_tone: str) -> float:
        """Calculate how well content matches target tone"""
        tone_indicators = {
            "professional": ["pleased", "opportunity", "details", "regarding", "assistance"],
            "friendly": ["excited", "great", "amazing", "happy", "wonderful"],
            "casual": ["hey", "cool", "awesome", "check out", "totally"],
            "formal": ["hereby", "respectfully", "cordially", "esteemed", "distinguished"],
            "persuasive": ["limited", "exclusive", "don't miss", "act now", "only"]
        }
        
        indicators = tone_indicators.get(target_tone, [])
        content_lower = content.lower()
        
        matches = sum(1 for indicator in indicators if indicator in content_lower)
        score = min(matches / len(indicators), 1.0) if indicators else 0.5
        
        return score
    
    def _predict_engagement(
        self,
        content: str,
        lead_context: Dict,
        channel: str
    ) -> float:
        """Predict engagement probability based on content and context"""
        score = 0.5  # Base score
        
        # Length optimization
        content_length = len(content)
        optimal_lengths = {"sms": 120, "whatsapp": 300, "email": 500}
        optimal = optimal_lengths.get(channel, 300)
        
        if abs(content_length - optimal) < optimal * 0.2:
            score += 0.15
        
        # Personalization check
        if lead_context.get('lead_name', '') in content:
            score += 0.1
        if lead_context.get('property_title', '') in content:
            score += 0.1
        
        # CTA presence
        cta_keywords = ["reply", "click", "schedule", "visit", "book", "call", "whatsapp"]
        if any(keyword in content.lower() for keyword in cta_keywords):
            score += 0.15
        
        # Urgency indicators
        urgency_words = ["limited", "today", "now", "soon", "hurry", "exclusive"]
        if any(word in content.lower() for word in urgency_words):
            score += 0.1
        
        # Lead score boost
        smartscore = lead_context.get('smartscore', 0)
        if smartscore >= 70:
            score += 0.1
        
        return min(score, 1.0)
    
    def _recommend_variant(
        self,
        variants: List[MessageVariant],
        lead_context: Dict
    ) -> str:
        """Recommend best variant based on scores and context"""
        TONE_WEIGHT = 0.4
        ENGAGEMENT_WEIGHT = 0.6
        
        best_variant = None
        best_score = 0
        
        for variant in variants:
            weighted_score = (
                variant.tone_score * TONE_WEIGHT +
                variant.engagement_prediction * ENGAGEMENT_WEIGHT
            )
            
            # Boost for hot leads - prefer persuasive content
            if lead_context.get('smartscore', 0) >= 80:
                if 'limited' in variant.content.lower() or 'exclusive' in variant.content.lower():
                    weighted_score += 0.1
            
            if weighted_score > best_score:
                best_score = weighted_score
                best_variant = variant.variant_id
        
        return best_variant or variants[0].variant_id
    
    # =============================================
    # ANALYTICS & LOGGING
    # =============================================
    
    async def _save_generation_log(
        self,
        lead_id: str,
        message_type: str,
        variants: List[MessageVariant],
        recommended_variant: str
    ):
        """Save generation for analytics and improvement"""
        try:
            supabase = get_supabase_client()
            supabase.table('ai_message_generations').insert({
                'lead_id': lead_id,
                'message_type': message_type,
                'variants': json.dumps([v.dict() for v in variants]),
                'recommended_variant': recommended_variant,
                'generated_at': datetime.now().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"Generation log save failed: {str(e)}")

# =============================================
# INITIALIZE GENERATOR
# =============================================
ai_message_generator = AIMessageGenerator()

# =============================================
# HELPER FUNCTION FOR EXTERNAL USE
# =============================================
async def generate_personalized_message(
    lead_id: str,
    message_type: str,
    channel: str,
    tone: str = "professional",
    include_cta: bool = True
) -> str:
    """Convenience function to generate and return recommended message"""
    request = MessageGenerationRequest(
        lead_id=lead_id,
        channel=channel,
        message_type=message_type,
        tone=tone,
        include_cta=include_cta
    )
    
    result = await ai_message_generator.generate_message(request)
    
    # Return recommended variant
    recommended = next(
        v for v in result.variants
        if v.variant_id == result.recommended_variant
    )
    
    return recommended.content

