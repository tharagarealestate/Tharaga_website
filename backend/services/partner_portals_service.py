# File: /backend/services/partner_portals_service.py
import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import httpx
from supabase import create_client, Client
from cryptography.fernet import Fernet

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Lazy initialization of Supabase client"""
    global _supabase_client
    if _supabase_client is None:
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE")
        
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE must be set")
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client

class PartnerPortalsService:
    """
    Integration with major Indian property portals
    Supports: 99acres, MagicBricks, Housing.com, CommonFloor, NoBroker
    """
    
    def __init__(self):
        self.supabase = get_supabase_client()
        
        # Encryption for tokens
        encryption_key = os.getenv("ENCRYPTION_KEY")
        if encryption_key:
            try:
                self.cipher = Fernet(encryption_key.encode())
            except:
                self.cipher = Fernet(Fernet.generate_key())
        else:
            self.cipher = Fernet(Fernet.generate_key())
        
        # Portal-specific API configurations
        self.portal_apis = {
            "99acres": {
                "base_url": "https://api.99acres.com/v1",
                "auth_type": "api_key",
                "rate_limit": 60,
                "endpoints": {
                    "create": "/listings",
                    "update": "/listings/{id}",
                    "delete": "/listings/{id}",
                    "get": "/listings/{id}"
                }
            },
            "magicbricks": {
                "base_url": "https://api.magicbricks.com/v2",
                "auth_type": "oauth",
                "rate_limit": 100,
                "endpoints": {
                    "create": "/properties",
                    "update": "/properties/{id}",
                    "delete": "/properties/{id}/deactivate",
                    "get": "/properties/{id}"
                }
            },
            "housing": {
                "base_url": "https://api.housing.com/v3",
                "auth_type": "bearer",
                "rate_limit": 120,
                "endpoints": {
                    "create": "/property/create",
                    "update": "/property/update/{id}",
                    "delete": "/property/delete/{id}",
                    "get": "/property/{id}"
                }
            },
            "commonfloor": {
                "base_url": "https://api.commonfloor.com/v1",
                "auth_type": "api_key",
                "rate_limit": 60,
                "endpoints": {
                    "create": "/listings/create",
                    "update": "/listings/update",
                    "delete": "/listings/delete",
                    "get": "/listings/get"
                }
            },
            "nobroker": {
                "base_url": "https://api.nobroker.in/v1",
                "auth_type": "api_key",
                "rate_limit": 80,
                "endpoints": {
                    "create": "/property/post",
                    "update": "/property/update",
                    "delete": "/property/deactivate",
                    "get": "/property/details"
                }
            }
        }
    
    async def sync_property_to_portal(
        self,
        property_id: str,
        portal_account_id: str,
        sync_type: str = "create"
    ) -> Dict[str, Any]:
        """
        Main function to sync property to partner portal
        """
        
        start_time = datetime.utcnow()
        sync_id = None
        
        try:
            # Get property details
            property_data = self.supabase.table("properties")\
                .select("*, property_media(*)")\
                .eq("id", property_id)\
                .single()\
                .execute()
            
            if not property_data.data:
                raise ValueError("Property not found")
            
            prop = property_data.data
            
            # Get portal account
            account = self.supabase.table("builder_portal_accounts")\
                .select("*, partner_portals!inner(*)")\
                .eq("id", portal_account_id)\
                .single()\
                .execute()
            
            if not account.data:
                raise ValueError("Portal account not found")
            
            acc = account.data
            portal_name = acc["partner_portals"]["portal_name"]
            
            # Check if already synced (for updates)
            existing_sync = None
            if sync_type == "update":
                existing = self.supabase.table("syndicated_listings")\
                    .select("*")\
                    .eq("property_id", property_id)\
                    .eq("portal_account_id", portal_account_id)\
                    .eq("status", "synced")\
                    .execute()
                
                if existing.data and len(existing.data) > 0:
                    existing_sync = existing.data[0]
                    sync_id = existing_sync["id"]
            
            # Transform property data for portal format
            transformed_data = await self._transform_for_portal(
                prop,
                portal_name
            )
            
            # Validate data
            validation_errors = await self._validate_portal_data(
                transformed_data,
                portal_name
            )
            
            if validation_errors:
                raise ValueError(f"Validation failed: {', '.join(validation_errors)}")
            
            # Create or get syndication record
            if existing_sync:
                # Update status to queued
                self.supabase.table("syndicated_listings")\
                    .update({
                        "status": "queued",
                        "mapped_data": transformed_data,
                        "queued_at": start_time.isoformat()
                    })\
                    .eq("id", sync_id)\
                    .execute()
            else:
                sync_record = self.supabase.table("syndicated_listings").insert({
                    "property_id": property_id,
                    "portal_account_id": portal_account_id,
                    "portal_id": acc["portal_id"],
                    "status": "queued",
                    "sync_type": sync_type,
                    "mapped_data": transformed_data
                }).execute()
                
                sync_id = sync_record.data[0]["id"]
            
            # Perform actual API call to portal
            if sync_type == "create":
                result = await self._create_listing_on_portal(
                    portal_name,
                    acc,
                    transformed_data
                )
            elif sync_type == "update":
                result = await self._update_listing_on_portal(
                    portal_name,
                    acc,
                    existing_sync["portal_listing_id"],
                    transformed_data
                )
            else:
                raise ValueError(f"Unsupported sync type: {sync_type}")
            
            # Calculate duration
            duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            # Update syndication record with success
            self.supabase.table("syndicated_listings").update({
                "status": "synced",
                "portal_listing_id": result.get("listing_id"),
                "portal_listing_url": result.get("listing_url"),
                "synced_at": datetime.utcnow().isoformat(),
                "last_updated_at": datetime.utcnow().isoformat(),
                "error_message": None,
                "retry_count": 0
            }).eq("id", sync_id).execute()
            
            # Log success
            self.supabase.table("syndication_logs").insert({
                "syndicated_listing_id": sync_id,
                "event_type": "sync_success",
                "portal_name": portal_name,
                "request_payload": transformed_data,
                "response_payload": result,
                "http_status_code": 200,
                "duration_ms": duration_ms
            }).execute()
            
            # Update account stats
            self.supabase.table("builder_portal_accounts").update({
                "listings_used": acc.get("listings_used", 0) + (1 if sync_type == "create" else 0),
                "total_listings_synced": acc.get("total_listings_synced", 0) + 1,
                "successful_syncs": acc.get("successful_syncs", 0) + 1,
                "last_sync_at": datetime.utcnow().isoformat()
            }).eq("id", portal_account_id).execute()
            
            return {
                "success": True,
                "sync_id": sync_id,
                "portal_listing_id": result.get("listing_id"),
                "portal_listing_url": result.get("listing_url"),
                "duration_ms": duration_ms
            }
            
        except Exception as e:
            # Log failure
            duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            if sync_id:
                retry_count = existing_sync.get("retry_count", 0) + 1 if existing_sync else 0
                
                self.supabase.table("syndicated_listings").update({
                    "status": "failed",
                    "error_message": str(e),
                    "failed_at": datetime.utcnow().isoformat(),
                    "retry_count": retry_count
                }).eq("id", sync_id).execute()
                
                self.supabase.table("syndication_logs").insert({
                    "syndicated_listing_id": sync_id,
                    "event_type": "sync_failed",
                    "portal_name": portal_name if 'portal_name' in locals() else "unknown",
                    "error_message": str(e),
                    "duration_ms": duration_ms
                }).execute()
            
            # Update account error
            if 'portal_account_id' in locals():
                self.supabase.table("builder_portal_accounts").update({
                    "failed_syncs": acc.get("failed_syncs", 0) + 1,
                    "last_error": str(e)
                }).eq("id", portal_account_id).execute()
            
            raise
    
    async def _transform_for_portal(
        self,
        property_data: Dict,
        portal_name: str
    ) -> Dict[str, Any]:
        """
        Transform Tharaga property data to portal-specific format
        """
        
        # Get portal
        portal = self.supabase.table("partner_portals")\
            .select("*")\
            .eq("portal_name", portal_name)\
            .single()\
            .execute()
        
        if not portal.data:
            raise ValueError(f"Portal {portal_name} not found")
        
        portal_config = portal.data
        
        # Get field mappings
        mappings = self.supabase.table("portal_field_mappings")\
            .select("*")\
            .eq("portal_id", portal_config["id"])\
            .execute()
        
        transformed = {}
        
        # Apply mappings
        for mapping in mappings.data or []:
            tharaga_field = mapping["tharaga_field"]
            portal_field = mapping["portal_field"]
            
            # Get value from property data
            value = self._get_nested_value(property_data, tharaga_field)
            
            if value is not None:
                # Apply transformation rule if exists
                if mapping.get("transformation_rule"):
                    value = self._apply_transformation(
                        value,
                        mapping["transformation_rule"]
                    )
                
                transformed[portal_field] = value
        
        # Add portal-specific required fields
        if portal_name == "99acres":
            transformed = self._add_99acres_fields(transformed, property_data)
        elif portal_name == "magicbricks":
            transformed = self._add_magicbricks_fields(transformed, property_data)
        elif portal_name == "housing":
            transformed = self._add_housing_fields(transformed, property_data)
        
        return transformed
    
    def _add_99acres_fields(self, data: Dict, prop: Dict) -> Dict:
        """Add 99acres-specific fields"""
        
        data.update({
            "propertyType": self._map_property_type_99acres(prop.get("property_type", "apartment")),
            "furnishingStatus": "SEMI_FURNISHED",
            "ageOfProperty": "LESS_THAN_5_YEARS",
            "facing": "EAST",
            "floorNumber": prop.get("floor_number", 1),
            "totalFloors": prop.get("total_floors", 5),
            "propertyFor": "SALE",
            "possessionStatus": "READY_TO_MOVE"
        })
        
        return data
    
    def _add_magicbricks_fields(self, data: Dict, prop: Dict) -> Dict:
        """Add MagicBricks-specific fields"""
        
        data.update({
            "propertySubType": self._map_property_subtype_mb(prop.get("property_type", "apartment")),
            "furnishing": "SEMI_FURNISHED",
            "constructionStatus": "READY_TO_MOVE",
            "facing": "East",
            "ownership": "FREEHOLD"
        })
        
        return data
    
    def _add_housing_fields(self, data: Dict, prop: Dict) -> Dict:
        """Add Housing.com-specific fields"""
        
        data.update({
            "property_type": self._map_property_type_housing(prop.get("property_type", "apartment")),
            "furnish_type": "SEMI_FURNISHED",
            "construction_status": "COMPLETED",
            "possession_by": datetime.utcnow().strftime("%Y-%m"),
            "transaction_type": "NEW_PROPERTY"
        })
        
        return data
    
    def _map_property_type_99acres(self, prop_type: str) -> str:
        """Map to 99acres property types"""
        mapping = {
            "apartment": "APARTMENT",
            "independent_house": "INDEPENDENT_HOUSE",
            "villa": "VILLA",
            "plot": "RESIDENTIAL_LAND"
        }
        return mapping.get(prop_type, "APARTMENT")
    
    def _map_property_subtype_mb(self, prop_type: str) -> str:
        """Map to MagicBricks subtypes"""
        mapping = {
            "apartment": "APARTMENT",
            "independent_house": "INDEPENDENT_HOUSE",
            "villa": "VILLA",
            "plot": "RESIDENTIAL_PLOT"
        }
        return mapping.get(prop_type, "APARTMENT")
    
    def _map_property_type_housing(self, prop_type: str) -> str:
        """Map to Housing.com types"""
        mapping = {
            "apartment": "apartment",
            "independent_house": "independent_house",
            "villa": "villa",
            "plot": "plot"
        }
        return mapping.get(prop_type, "apartment")
    
    def _get_nested_value(self, data: Dict, path: str) -> Any:
        """Get nested value from dict using dot notation"""
        keys = path.split('.')
        value = data
        
        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
            else:
                return None
        
        return value
    
    def _apply_transformation(self, value: Any, rule: Dict) -> Any:
        """Apply transformation rule to value"""
        
        rule_type = rule.get("type")
        
        if rule_type == "multiply":
            return value * rule.get("factor", 1)
        elif rule_type == "divide":
            return value / rule.get("divisor", 1) if rule.get("divisor", 1) != 0 else value
        elif rule_type == "map":
            return rule.get("mapping", {}).get(str(value), value)
        elif rule_type == "format":
            return rule.get("template", "{}").format(value)
        elif rule_type == "concat":
            return rule.get("prefix", "") + str(value) + rule.get("suffix", "")
        
        return value
    
    async def _validate_portal_data(
        self,
        data: Dict,
        portal_name: str
    ) -> List[str]:
        """Validate data against portal requirements"""
        
        errors = []
        
        # Get portal config
        portal = self.supabase.table("partner_portals")\
            .select("required_fields")\
            .eq("portal_name", portal_name)\
            .single()\
            .execute()
        
        if portal.data and portal.data.get("required_fields"):
            required = portal.data["required_fields"]
            
            for field in required:
                if field not in data or not data[field]:
                    errors.append(f"Missing required field: {field}")
        
        return errors
    
    async def _create_listing_on_portal(
        self,
        portal_name: str,
        account: Dict,
        listing_data: Dict
    ) -> Dict[str, Any]:
        """
        Create listing on partner portal via API
        Note: This is a placeholder implementation
        Actual API calls require portal-specific credentials and endpoints
        """
        
        api_config = self.portal_apis.get(portal_name)
        if not api_config:
            raise ValueError(f"No API config for {portal_name}")
        
        # In production, this would make actual API calls
        # For now, simulate successful response
        access_token = self._decrypt_token(account.get("access_token", "")) if account.get("access_token") else ""
        
        # Simulate API response
        listing_id = f"{portal_name}_{account.get('portal_account_id', '')}_{datetime.utcnow().timestamp()}"
        listing_url = self._build_listing_url(listing_id, portal_name, {})
        
        return {
            "listing_id": listing_id,
            "listing_url": listing_url,
            "response": {"status": "success"}
        }
    
    async def _update_listing_on_portal(
        self,
        portal_name: str,
        account: Dict,
        portal_listing_id: str,
        listing_data: Dict
    ) -> Dict[str, Any]:
        """
        Update existing listing on portal
        """
        
        # Simulate update
        listing_url = self._build_listing_url(portal_listing_id, portal_name, {})
        
        return {
            "listing_id": portal_listing_id,
            "listing_url": listing_url,
            "response": {"status": "updated"}
        }
    
    def _build_listing_url(
        self,
        listing_id: str,
        portal_name: str,
        response: Dict
    ) -> str:
        """Build public listing URL"""
        
        base_urls = {
            "99acres": "https://www.99acres.com/property-detail/",
            "magicbricks": "https://www.magicbricks.com/property-for-sale/",
            "housing": "https://housing.com/in/buy/",
            "commonfloor": "https://www.commonfloor.com/property/",
            "nobroker": "https://www.nobroker.in/property/sale/",
            "indiaproperty": "https://www.indiaproperty.com/property/"
        }
        
        return base_urls.get(portal_name, "") + listing_id
    
    def _encrypt_token(self, token: str) -> str:
        """Encrypt access token"""
        try:
            return self.cipher.encrypt(token.encode()).decode()
        except:
            return token
    
    def _decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt access token"""
        try:
            return self.cipher.decrypt(encrypted_token.encode()).decode()
        except:
            return encrypted_token
    
    async def sync_portal_metrics(
        self,
        syndicated_listing_id: str
    ) -> Dict[str, Any]:
        """
        Sync performance metrics from portal back to Tharaga
        """
        
        # Get syndicated listing
        listing = self.supabase.table("syndicated_listings")\
            .select("*, builder_portal_accounts!inner(*, partner_portals!inner(*))")\
            .eq("id", syndicated_listing_id)\
            .single()\
            .execute()
        
        if not listing.data:
            return {"error": "Listing not found"}
        
        sync_data = listing.data
        portal_name = sync_data["builder_portal_accounts"]["partner_portals"]["portal_name"]
        portal_listing_id = sync_data["portal_listing_id"]
        
        # Fetch metrics from portal (simulated)
        metrics = {
            "views": 0,
            "contacts": 0,
            "favorites": 0
        }
        
        # Update syndicated listing with metrics
        self.supabase.table("syndicated_listings").update({
            "portal_views": metrics.get("views", 0),
            "portal_contacts": metrics.get("contacts", 0),
            "portal_favorites": metrics.get("favorites", 0),
            "last_metrics_sync": datetime.utcnow().isoformat()
        }).eq("id", syndicated_listing_id).execute()
        
        return metrics








