# =============================================
# DOCUMENT PROCESSOR API ROUTES
# =============================================
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from services.document_processor import (
    upload_document,
    add_watermark,
    check_access,
    WatermarkRequest,
    get_supabase_client
)

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.post("/upload")
async def upload_document_route(
    file: UploadFile = File(...),
    property_id: Optional[str] = Form(None),
    document_type: str = Form("general"),
    access_level: str = Form("verified"),
    smartscore_required: int = Form(60),
    uploaded_by: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = None
):
    """Upload document endpoint"""
    return await upload_document(
        file=file,
        property_id=property_id,
        document_type=document_type,
        access_level=access_level,
        smartscore_required=smartscore_required,
        uploaded_by=uploaded_by,
        background_tasks=background_tasks
    )

@router.post("/watermark")
async def watermark_route(request: WatermarkRequest):
    """Add watermark endpoint"""
    return await add_watermark(request)

@router.get("/access-check")
async def access_check_route(document_id: str, user_id: str):
    """Check access endpoint"""
    return await check_access(document_id, user_id)

@router.get("/health")
async def health_route():
    return {"status": "healthy", "service": "Document Processor"}

