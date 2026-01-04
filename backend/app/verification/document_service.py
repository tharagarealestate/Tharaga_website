"""
Document Upload and Verification Service
Handles document uploads, SHA256 hashing, and PDF generation
"""
import hashlib
import io
from typing import Dict, Any, Optional, BinaryIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT


class DocumentVerificationService:
    """
    Service for document upload, hashing, and audit PDF generation
    """
    
    # Legal disclaimer text (exact copy as required)
    LEGAL_DISCLAIMER = (
        "Legal disclaimer: The information and verification artifacts provided on this page "
        "are automated snapshots of public records and uploaded documents as of the timestamp shown. "
        "These artifacts are intended for informational purposes only and do not constitute legal advice, "
        "title insurance, or a guarantee of property ownership or transferability. For formal legal "
        "confirmation and title transfer, consult a licensed property lawyer or the appropriate government registry."
    )
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
    
    def compute_sha256_hash(self, file_content: bytes) -> str:
        """Compute SHA256 hash of file content"""
        return hashlib.sha256(file_content).hexdigest()
    
    async def generate_audit_pdf(
        self,
        property_id: str,
        property_data: Dict[str, Any],
        documents: list[Dict[str, Any]],
        rera_snapshot: Optional[Dict[str, Any]] = None,
        risk_flags: list[Dict[str, Any]] = None
    ) -> bytes:
        """
        Generate one-page audit PDF with:
        - Property summary
        - Uploaded documents (name, type, uploader, timestamp, SHA256)
        - RERA snapshot (if present)
        - Risk flags summary
        - Legal disclaimer
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        
        story = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#6e0d25'),  # Tharaga wine color
            spaceAfter=12,
            alignment=TA_CENTER
        )
        story.append(Paragraph("Property Verification Audit Report", title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Property Summary
        story.append(Paragraph("<b>Property Summary</b>", styles['Heading2']))
        property_info = [
            ['Property ID:', property_id],
            ['Title:', property_data.get('title', 'N/A')],
            ['Location:', f"{property_data.get('locality', '')}, {property_data.get('city', '')}"],
            ['Price:', f"₹{property_data.get('price_inr', 0):,.0f}" if property_data.get('price_inr') else 'N/A'],
        ]
        prop_table = Table(property_info, colWidths=[2*inch, 4*inch])
        prop_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(prop_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Documents Section
        story.append(Paragraph("<b>Uploaded Documents</b>", styles['Heading2']))
        if documents:
            doc_data = [['Document Name', 'Type', 'Uploaded By', 'Upload Date', 'SHA256 Hash']]
            for doc in documents:
                doc_data.append([
                    doc.get('document_name', 'N/A'),
                    doc.get('document_type', 'N/A'),
                    doc.get('uploader_name', 'N/A'),
                    doc.get('uploaded_at', 'N/A')[:10] if doc.get('uploaded_at') else 'N/A',
                    doc.get('sha256_hash', 'N/A')[:16] + '...'  # Truncate for display
                ])
            doc_table = Table(doc_data, colWidths=[1.5*inch, 1*inch, 1*inch, 1*inch, 1.5*inch])
            doc_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6e0d25')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            story.append(doc_table)
        else:
            story.append(Paragraph("No documents uploaded", styles['Normal']))
        story.append(Spacer(1, 0.2*inch))
        
        # RERA Snapshot Section
        if rera_snapshot:
            story.append(Paragraph("<b>RERA Verification Snapshot</b>", styles['Heading2']))
            rera_info = [
                ['RERA ID:', rera_snapshot.get('rera_id', 'N/A')],
                ['State:', rera_snapshot.get('state', 'N/A')],
                ['Project Name:', rera_snapshot.get('project_name', 'N/A')],
                ['Developer:', rera_snapshot.get('developer_name', 'N/A')],
                ['Status:', rera_snapshot.get('status', 'N/A')],
                ['Snapshot Hash:', rera_snapshot.get('snapshot_hash', 'N/A')[:16] + '...'],
                ['Collected At:', rera_snapshot.get('collected_at', 'N/A')[:19] if rera_snapshot.get('collected_at') else 'N/A'],
                ['Data Source:', rera_snapshot.get('data_source', 'N/A')],
            ]
            rera_table = Table(rera_info, colWidths=[2*inch, 4*inch])
            rera_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.grey),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
            ]))
            story.append(rera_table)
            story.append(Spacer(1, 0.2*inch))
        
        # Risk Flags Summary
        if risk_flags:
            story.append(Paragraph("<b>Risk Flags Summary</b>", styles['Heading2']))
            flags_text = []
            for flag in risk_flags:
                severity = flag.get('severity', 'medium').upper()
                title = flag.get('title', 'Unknown')
                flags_text.append(f"• [{severity}] {title}")
            story.append(Paragraph("<br/>".join(flags_text), styles['Normal']))
            story.append(Spacer(1, 0.2*inch))
        
        # Legal Disclaimer
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#666666'),
            leading=10,
            alignment=TA_LEFT,
            spaceBefore=0.2*inch,
            borderWidth=1,
            borderColor=colors.grey,
            borderPadding=6,
            backColor=colors.HexColor('#f5f5f5')
        )
        story.append(Paragraph(self.LEGAL_DISCLAIMER, disclaimer_style))
        
        # Generate PDF
        doc.build(story)
        buffer.seek(0)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

