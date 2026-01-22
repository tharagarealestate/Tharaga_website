# =============================================
# AI CONTENT GENERATOR API ROUTES
# =============================================
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.ai_content_generator import (
    generate_content,
    ContentRequest,
    get_supabase_client
)

router = APIRouter(prefix="/api/ai-content", tags=["ai-content"])

@router.post("/generate")
async def generate_content_route(
    request: ContentRequest,
    background_tasks: BackgroundTasks = None
):
    """Generate AI content endpoint"""
    return await generate_content(request, background_tasks)

@router.get("/health")
async def health_route():
    return {"status": "healthy", "service": "AI Content Generator"}

