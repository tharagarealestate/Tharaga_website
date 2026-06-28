# =============================================
# AI CONTENT GENERATION SERVICE
# Generates property descriptions, emails, social posts using GPT-4
# =============================================
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from supabase import create_client, Client
import logging
import json

# =============================================
# CONFIGURATION
# =============================================
app = FastAPI(title="AI Content Generator", version="1.0")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
openai = None

if OPENAI_API_KEY:
    try:
        import openai
        openai.api_key = OPENAI_API_KEY
        logger.info("OpenAI client initialized")
    except Exception as e:
        logger.warning(f"OpenAI not available: {e}")

# =============================================
# PYDANTIC MODELS
# =============================================
class ContentRequest(BaseModel):
    property_id: str
    content_types: List[str]
    tone: str = "professional"
    language: str = "en"
    model: str = "gpt-4"
    variants: int = 1  # For A/B testing

# =============================================
# CONTENT GENERATION FUNCTIONS
# =============================================
async def generate_single_content(
    property_data: Dict,
    content_type: str,
    tone: str,
    language: str,
    model: str
) -> Dict[str, Any]:
    """Generate single piece of content"""
    
    if not openai:
        # Fallback content
        return {
            "text": f"Property: {property_data.get('title', 'Property')} in {property_data.get('location', 'Location')}",
            "structured": None,
            "prompt": "Fallback generation",
            "quality_score": 50
        }
    
    # Build prompt based on content type
    prompts = {
        'description': f"""
Write a compelling property description for the following property.
Make it engaging, highlight key features, and use {tone} tone.
Language: {language}

Property Details:
- Type: {property_data.get('property_type', 'Property')}
- Location: {property_data.get('location', property_data.get('locality', 'Location'))}
- Size: {property_data.get('sqft', property_data.get('size_sqft', 'N/A'))} sq ft
- Bedrooms: {property_data.get('bedrooms', 'N/A')}
- Bathrooms: {property_data.get('bathrooms', 'N/A')}
- Price: ₹{property_data.get('price', property_data.get('price_inr', 0)):,.0f}
- Amenities: {', '.join(property_data.get('amenities', [])) if isinstance(property_data.get('amenities'), list) else 'N/A'}

Write 150-200 words.
""",
        'highlights': f"""
Create 5-7 bullet point highlights for this property.
Make each point concise and impactful. Use {tone} tone.

Property Details:
- Type: {property_data.get('property_type', 'Property')}
- Location: {property_data.get('location', property_data.get('locality', 'Location'))}
- Size: {property_data.get('sqft', property_data.get('size_sqft', 'N/A'))} sq ft
- Bedrooms: {property_data.get('bedrooms', 'N/A')}
- Price: ₹{property_data.get('price', property_data.get('price_inr', 0)):,.0f}

Return as JSON array of strings.
""",
        'email_subject': f"""
Create 3 compelling email subject lines to promote this property.
Make them attention-grabbing but not salesy. Use {tone} tone.

Property: {property_data.get('property_type', 'Property')} in {property_data.get('location', property_data.get('locality', 'Location'))}
Price: ₹{property_data.get('price', property_data.get('price_inr', 0)):,.0f}

Return as JSON array.
""",
        'whatsapp': f"""
Write a WhatsApp message to share this property with a potential buyer.
Keep it under 200 characters, friendly, and include key details.

Property: {property_data.get('property_type', 'Property')}
Location: {property_data.get('location', property_data.get('locality', 'Location'))}
Price: ₹{property_data.get('price', property_data.get('price_inr', 0)):,.0f}
Size: {property_data.get('sqft', property_data.get('size_sqft', 'N/A'))} sq ft
""",
        'social': f"""
Create an Instagram/Facebook post caption for this property.
Make it engaging, use relevant hashtags, and {tone} tone.

Property: {property_data.get('property_type', 'Property')}
Location: {property_data.get('location', property_data.get('locality', 'Location'))}
Price: ₹{property_data.get('price', property_data.get('price_inr', 0)):,.0f}
""",
        'faq': f"""
Generate 5 frequently asked questions and answers about this property.
Cover pricing, location, amenities, possession, and documentation.

Property Details:
{json.dumps(property_data, indent=2)}

Return as JSON array of objects with "question" and "answer" keys.
"""
    }
    
    prompt = prompts.get(content_type, prompts['description'])
    
    try:
        # Call OpenAI
        response = openai.ChatCompletion.create(
            model=model if model in ['gpt-4', 'gpt-3.5-turbo'] else 'gpt-3.5-turbo',
            messages=[
                {"role": "system", "content": f"You are a professional real estate content writer with {tone} tone."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        content_text = response.choices[0].message.content
        
        # Parse structured content if JSON
        structured = None
        if content_type in ['highlights', 'email_subject', 'faq']:
            try:
                structured = json.loads(content_text)
            except:
                # Try to extract JSON from text
                try:
                    import re
                    json_match = re.search(r'\[.*\]|\{.*\}', content_text, re.DOTALL)
                    if json_match:
                        structured = json.loads(json_match.group())
                except:
                    pass
        
        return {
            "text": content_text,
            "structured": structured,
            "prompt": prompt,
            "quality_score": 80
        }
    except Exception as e:
        logger.error(f"OpenAI generation failed: {str(e)}")
        # Fallback
        return {
            "text": f"Property: {property_data.get('title', 'Property')} in {property_data.get('location', 'Location')}",
            "structured": None,
            "prompt": prompt,
            "quality_score": 50
        }

# =============================================
# API ENDPOINTS
# =============================================
async def generate_content(request: ContentRequest, background_tasks: BackgroundTasks):
    """Generate AI content for property"""
    try:
        supabase = get_supabase_client()
        
        # Fetch property data
        property_data = supabase.table('properties').select('*').eq(
            'id', request.property_id
        ).single().execute()
        
        if not property_data.data:
            raise HTTPException(404, "Property not found")
        
        prop = property_data.data
        
        results = []
        
        for content_type in request.content_types:
            for variant_num in range(request.variants):
                try:
                    content = await generate_single_content(
                        prop, content_type, request.tone, request.language, request.model
                    )
                    
                    # Save to database
                    saved = supabase.table('ai_generated_content').insert({
                        "property_id": request.property_id,
                        "content_type": content_type,
                        "content_text": content['text'],
                        "content_json": content.get('structured'),
                        "model_used": request.model,
                        "prompt_used": content['prompt'],
                        "tone": request.tone,
                        "language": request.language,
                        "variant_group": f"{content_type}-{variant_num}",
                        "quality_score": content.get('quality_score', 75)
                    }).execute()
                    
                    results.append({
                        "content_type": content_type,
                        "variant": variant_num,
                        "content_id": saved.data[0]['id'] if saved.data else None,
                        "content": content['text']
                    })
                    
                except Exception as e:
                    logger.error(f"Generation failed for {content_type}: {str(e)}")
                    results.append({
                        "content_type": content_type,
                        "variant": variant_num,
                        "error": str(e)
                    })
        
        return {
            "success": True,
            "property_id": request.property_id,
            "generated_count": len([r for r in results if 'error' not in r]),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Content generation failed: {str(e)}")
        raise HTTPException(500, f"Content generation failed: {str(e)}")

# Health check function (used by routes)
async def health():
    return {"status": "healthy", "service": "AI Content Generator"}

