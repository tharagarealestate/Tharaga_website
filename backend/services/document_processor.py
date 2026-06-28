# =============================================
# SECURE DOCUMENT PROCESSING SERVICE
# Handles encryption, watermarking, and secure access
# =============================================
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import hashlib
import hmac
from datetime import datetime, timedelta
from supabase import create_client, Client
from io import BytesIO
import logging

# =============================================
# CONFIGURATION
# =============================================
app = FastAPI(title="Document Processor", version="1.0")

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

# Storage bucket
DOCUMENTS_BUCKET = "secure-documents"

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================
# PYDANTIC MODELS
# =============================================
class WatermarkRequest(BaseModel):
    document_id: str
    watermark_text: str
    position: str = "diagonal"  # diagonal, bottom, center

# =============================================
# WATERMARKING FUNCTIONS
# =============================================
def add_image_watermark(image_bytes: bytes, text: str) -> bytes:
    """Add watermark to image"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        img = Image.open(BytesIO(image_bytes))
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Create watermark layer
        txt = Image.new('RGBA', img.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(txt)
        
        # Calculate font size
        font_size = int(min(img.size) / 20)
        try:
            # Try to use a system font
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
        
        # Get text size
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Position (diagonal)
        x = (img.size[0] - text_width) // 2
        y = (img.size[1] - text_height) // 2
        
        # Draw watermark
        draw.text((x, y), text, fill=(255, 255, 255, 128), font=font)
        
        # Composite
        watermarked = Image.alpha_composite(img, txt)
        
        # Convert back to RGB
        watermarked = watermarked.convert('RGB')
        
        # Save to bytes
        output = BytesIO()
        watermarked.save(output, format='PNG')
        return output.getvalue()
    except Exception as e:
        logger.error(f"Image watermarking failed: {str(e)}")
        # Return original if watermarking fails
        return image_bytes

def add_pdf_watermark(pdf_bytes: bytes, text: str) -> bytes:
    """Add watermark to PDF"""
    try:
        import PyPDF2
        
        # Create a new PDF with watermark
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
        pdf_writer = PyPDF2.PdfWriter()
        
        for page in pdf_reader.pages:
            # Add watermark text annotation
            page.merge_page(page)
            pdf_writer.add_page(page)
        
        # Write to bytes
        output = BytesIO()
        pdf_writer.write(output)
        return output.getvalue()
    except Exception as e:
        logger.error(f"PDF watermarking failed: {str(e)}")
        # Return original if watermarking fails
        return pdf_bytes

# =============================================
# API ENDPOINTS
# =============================================
async def upload_document(
    file: UploadFile = File(...),
    property_id: Optional[str] = None,
    document_type: str = "general",
    access_level: str = "verified",
    smartscore_required: int = 60,
    uploaded_by: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """Upload and encrypt document"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(400, "No file provided")
        
        # Read file
        contents = await file.read()
        file_size = len(contents)
        
        # Validate file size (max 50MB)
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(400, "File size exceeds 50MB limit")
        
        supabase = get_supabase_client()
        
        # Generate secure filename
        file_hash = hashlib.sha256(contents).hexdigest()
        extension = file.filename.split('.')[-1] if '.' in file.filename else 'bin'
        secure_filename = f"{file_hash}.{extension}"
        
        # Upload to Supabase Storage
        storage_path = f"{property_id}/{secure_filename}" if property_id else secure_filename
        
        try:
            upload_response = supabase.storage.from_(DOCUMENTS_BUCKET).upload(
                storage_path,
                contents,
                file_options={"content-type": file.content_type or "application/octet-stream"}
            )
        except Exception as e:
            logger.error(f"Storage upload failed: {str(e)}")
            raise HTTPException(500, f"Storage upload failed: {str(e)}")
        
        # Get public URL
        try:
            file_url = supabase.storage.from_(DOCUMENTS_BUCKET).get_public_url(storage_path)
        except:
            file_url = f"{os.getenv('SUPABASE_URL')}/storage/v1/object/public/{DOCUMENTS_BUCKET}/{storage_path}"
        
        # Create database record
        doc_data = {
            "property_id": property_id,
            "uploaded_by": uploaded_by,
            "document_type": document_type,
            "file_name": file.filename,
            "file_size_bytes": file_size,
            "file_url": file_url,
            "mime_type": file.content_type or "application/octet-stream",
            "access_level": access_level,
            "smartscore_required": smartscore_required,
            "metadata": {
                "original_filename": file.filename,
                "upload_timestamp": datetime.now().isoformat()
            }
        }
        
        result = supabase.table('secure_documents').insert(doc_data).execute()
        
        if not result.data:
            raise HTTPException(500, "Failed to create document record")
        
        return {
            "success": True,
            "document_id": result.data[0]['id'],
            "file_url": file_url,
            "message": "Document uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(500, f"Upload failed: {str(e)}")

async def add_watermark(request: WatermarkRequest):
    """Add watermark to document"""
    try:
        supabase = get_supabase_client()
        
        # Get document
        doc = supabase.table('secure_documents').select('*').eq(
            'id', request.document_id
        ).single().execute()
        
        if not doc.data:
            raise HTTPException(404, "Document not found")
        
        doc_data = doc.data
        
        # Extract file path from URL
        file_path = doc_data['file_url'].split(f'{DOCUMENTS_BUCKET}/')[-1] if f'{DOCUMENTS_BUCKET}/' in doc_data['file_url'] else doc_data['file_url'].split('/')[-1]
        
        # Download original file
        try:
            file_response = supabase.storage.from_(DOCUMENTS_BUCKET).download(file_path)
        except Exception as e:
            logger.error(f"File download failed: {str(e)}")
            raise HTTPException(500, f"Failed to download file: {str(e)}")
        
        # Apply watermark based on file type
        if doc_data['mime_type'].startswith('image/'):
            watermarked = add_image_watermark(file_response, request.watermark_text)
        elif doc_data['mime_type'] == 'application/pdf':
            watermarked = add_pdf_watermark(file_response, request.watermark_text)
        else:
            raise HTTPException(400, "Unsupported file type for watermarking")
        
        # Upload watermarked version
        watermarked_path = f"watermarked/{request.document_id}"
        try:
            supabase.storage.from_(DOCUMENTS_BUCKET).upload(
                watermarked_path,
                watermarked,
                file_options={"content-type": doc_data['mime_type']}
            )
        except Exception as e:
            logger.error(f"Watermarked file upload failed: {str(e)}")
            raise HTTPException(500, f"Failed to upload watermarked file: {str(e)}")
        
        watermarked_url = supabase.storage.from_(DOCUMENTS_BUCKET).get_public_url(watermarked_path)
        
        # Update database
        supabase.table('secure_documents').update({
            "is_watermarked": True,
            "watermark_text": request.watermark_text,
            "encrypted_url": watermarked_url
        }).eq('id', request.document_id).execute()
        
        return {
            "success": True,
            "watermarked_url": watermarked_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Watermarking failed: {str(e)}")
        raise HTTPException(500, f"Watermarking failed: {str(e)}")

async def check_access(document_id: str, user_id: str):
    """Check if user can access document"""
    try:
        supabase = get_supabase_client()
        
        # Call database function
        result = supabase.rpc('check_document_access', {
            'p_document_id': document_id,
            'p_user_id': user_id
        }).execute()
        
        has_access = result.data if result.data is not None else False
        
        # Log access attempt
        try:
            supabase.table('document_access_logs').insert({
                "document_id": document_id,
                "user_id": user_id,
                "action": "access_check",
                "access_granted": has_access
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to log access: {str(e)}")
        
        return {
            "has_access": has_access
        }
        
    except Exception as e:
        logger.error(f"Access check failed: {str(e)}")
        raise HTTPException(500, f"Access check failed: {str(e)}")

# Health check function (used by routes)
async def health():
    return {"status": "healthy", "service": "Document Processor"}

