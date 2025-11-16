"""
RERA Verification Service
Fetches and parses RERA project pages with cryptographic hashing
"""
import hashlib
import re
from typing import Dict, Any, Optional
from datetime import datetime
import httpx
from bs4 import BeautifulSoup


class RERAVerificationService:
    """
    Service for fetching and verifying RERA project information
    Produces machine-readable snapshots with cryptographic hashes
    """
    
    # Tamil Nadu RERA portal URL pattern
    TN_RERA_BASE_URL = "https://rera.tn.gov.in"
    
    # State RERA portal mappings
    STATE_RERA_PORTALS = {
        'TN': 'https://rera.tn.gov.in',
        'KA': 'https://rera.karnataka.gov.in',
        'MH': 'https://maharera.mahaonline.gov.in',
        # Add more as needed
    }
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.timeout = 30.0
    
    async def fetch_rera_snapshot(
        self, 
        rera_id: str, 
        state: Optional[str] = None,
        project_name: Optional[str] = None,
        developer_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch RERA project page and create snapshot
        
        Returns:
            Dict with parsed_fields, raw_html, snapshot_hash, source_url, etc.
        """
        # Determine state from RERA ID if not provided
        if not state:
            state = self._guess_state_from_rera_id(rera_id)
        
        state = state.upper() if state else 'TN'  # Default to Tamil Nadu for Chennai
        
        # Get portal URL
        portal_url = self.STATE_RERA_PORTALS.get(state, self.TN_RERA_BASE_URL)
        
        # For now, use synthetic data if real scraping not available
        # In production, this would scrape the actual RERA portal
        use_synthetic = self.config.get('USE_SYNTHETIC_RERA', True)
        
        if use_synthetic:
            return self._create_synthetic_snapshot(rera_id, state, project_name, developer_name, portal_url)
        
        # Real scraping would go here
        return await self._scrape_rera_portal(rera_id, state, portal_url)
    
    def _guess_state_from_rera_id(self, rera_id: str) -> Optional[str]:
        """Guess state from RERA ID format"""
        rera_upper = rera_id.upper()
        if rera_upper.startswith('TN'):
            return 'TN'
        elif rera_upper.startswith('KA'):
            return 'KA'
        elif rera_upper.startswith('MH'):
            return 'MH'
        return None
    
    async def _scrape_rera_portal(
        self, 
        rera_id: str, 
        state: str, 
        portal_url: str
    ) -> Dict[str, Any]:
        """
        Scrape RERA portal (requires approval and CAPTCHA handling)
        Mark as SYNTHETIC if scraping fails
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                # Construct search URL (format depends on portal)
                search_url = f"{portal_url}/search"  # Placeholder
                
                response = await client.get(search_url, params={'rera_id': rera_id})
                
                if response.status_code == 200:
                    html_content = response.text
                    soup = BeautifulSoup(html_content, 'html.parser')
                    
                    # Parse RERA details (structure varies by portal)
                    parsed_fields = self._parse_rera_html(soup, rera_id)
                    
                    # Create hash
                    snapshot_hash = hashlib.sha256(html_content.encode('utf-8')).hexdigest()
                    
                    return {
                        'rera_id': rera_id,
                        'state': state,
                        'raw_html': html_content,
                        'parsed_fields': parsed_fields,
                        'snapshot_hash': snapshot_hash,
                        'source_url': search_url,
                        'data_source': 'RERA_PORTAL',
                        'collected_at': datetime.now().isoformat(),
                    }
        except Exception as e:
            # Fallback to synthetic on error
            print(f"RERA scraping error: {e}")
            return self._create_synthetic_snapshot(rera_id, state, None, None, portal_url)
    
    def _parse_rera_html(self, soup: BeautifulSoup, rera_id: str) -> Dict[str, Any]:
        """Parse RERA HTML to extract structured fields"""
        parsed = {
            'rera_id': rera_id,
            'project_name': None,
            'developer_name': None,
            'registration_number': None,
            'status': None,
            'expiry_date': None,
        }
        
        # Extract project name
        project_elem = soup.find(string=re.compile(r'project|project name', re.I))
        if project_elem:
            parsed['project_name'] = project_elem.get_text(strip=True)
        
        # Extract developer
        developer_elem = soup.find(string=re.compile(r'developer|promoter', re.I))
        if developer_elem:
            parsed['developer_name'] = developer_elem.get_text(strip=True)
        
        # Extract registration number
        reg_elem = soup.find(string=re.compile(r'registration|reg\.?\s*no', re.I))
        if reg_elem:
            parsed['registration_number'] = reg_elem.get_text(strip=True)
        
        # Extract status
        status_elem = soup.find(string=re.compile(r'status|active|expired', re.I))
        if status_elem:
            parsed['status'] = status_elem.get_text(strip=True)
        
        return parsed
    
    def _create_synthetic_snapshot(
        self,
        rera_id: str,
        state: str,
        project_name: Optional[str],
        developer_name: Optional[str],
        portal_url: str
    ) -> Dict[str, Any]:
        """
        Create synthetic RERA snapshot for testing
        Clearly marked as SYNTHETIC
        """
        # Create synthetic HTML
        synthetic_html = f"""
        <html>
        <head><title>RERA Project {rera_id}</title></head>
        <body>
            <div class="rera-info">
                <h1>RERA Project Information</h1>
                <p><strong>RERA ID:</strong> {rera_id}</p>
                <p><strong>State:</strong> {state}</p>
                <p><strong>Project Name:</strong> {project_name or 'Not Available'}</p>
                <p><strong>Developer:</strong> {developer_name or 'Not Available'}</p>
                <p><strong>Status:</strong> Active</p>
                <p><strong>NOTE:</strong> This is a SYNTHETIC snapshot for testing purposes.</p>
            </div>
        </body>
        </html>
        """
        
        # Create hash
        snapshot_hash = hashlib.sha256(synthetic_html.encode('utf-8')).hexdigest()
        
        parsed_fields = {
            'rera_id': rera_id,
            'state': state,
            'project_name': project_name,
            'developer_name': developer_name,
            'registration_number': rera_id,
            'status': 'Active',
            'expiry_date': None,
        }
        
        return {
            'rera_id': rera_id,
            'state': state,
            'project_name': project_name,
            'developer_name': developer_name,
            'registration_number': rera_id,
            'status': 'Active',
            'raw_html': synthetic_html,
            'parsed_fields': parsed_fields,
            'snapshot_hash': snapshot_hash,
            'source_url': portal_url,
            'data_source': 'SYNTHETIC',
            'collected_at': datetime.now().isoformat(),
        }





