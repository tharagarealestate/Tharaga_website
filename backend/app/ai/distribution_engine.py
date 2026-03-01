"""
Smart Listing Distribution Engine
Auto-match new listings to qualified buyers in real-time
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import logging
from supabase import create_client

logger = logging.getLogger(__name__)


class SmartDistributionEngine:
    """Main distribution orchestrator for matching listings to buyers"""
    
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
        
        self.supabase = create_client(supabase_url, supabase_key)
        
    async def distribute_listing(self, listing_id: str) -> Dict[str, Any]:
        """
        Main distribution orchestrator
        1. Find all qualified buyers
        2. Calculate match scores
        3. Filter by threshold
        4. Batch send via preferred channels
        """
        try:
            # Get listing details
            listing_response = self.supabase.table("properties").select("*").eq("id", listing_id).single().execute()
            
            if not listing_response.data:
                return {"error": "Listing not found", "success": False}
            
            listing = listing_response.data
            
            # Check if listing is active and verified
            if listing.get("listing_status") != "active" or not listing.get("is_verified"):
                return {
                    "error": "Listing must be active and verified to distribute",
                    "success": False
                }
            
            # Get all active buyers with preferences
            # First, get all buyer_profiles
            buyers_response = self.supabase.table("buyer_profiles")\
                .select("*, profiles!inner(*)")\
                .execute()
            
            matched_buyers = []
            
            for buyer_profile in buyers_response.data:
                buyer_user_id = buyer_profile.get("user_id")
                if not buyer_user_id:
                    continue
                
                # Check if buyer has active match preferences
                prefs_response = self.supabase.table("buyer_match_preferences")\
                    .select("*")\
                    .eq("buyer_id", buyer_user_id)\
                    .eq("active", True)\
                    .maybe_single()\
                    .execute()
                
                # Skip if preferences exist but inactive, or use defaults if no preferences
                if prefs_response.data and not prefs_response.data.get("active", True):
                    continue
                
                # Calculate match score using DB function
                try:
                    score_result = self.supabase.rpc(
                        "calculate_match_score",
                        {
                            "p_listing_id": listing_id,
                            "p_buyer_id": buyer_user_id
                        }
                    ).execute()
                    
                    if score_result.data and len(score_result.data) > 0:
                        match_score = float(score_result.data[0].get("match_score", 0))
                        match_factors = score_result.data[0].get("match_factors", {})
                        
                        # Get buyer's minimum threshold (default 70)
                        min_score = 70.0
                        if prefs_response.data:
                            min_score = float(prefs_response.data.get("min_match_score", 70.0))
                        
                        if match_score >= min_score:
                            profile = buyer_profile.get("profiles", {})
                            matched_buyers.append({
                                "buyer_id": buyer_user_id,
                                "buyer_email": profile.get("email"),
                                "buyer_phone": profile.get("phone"),
                                "match_score": match_score,
                                "match_factors": match_factors,
                                "preferred_channels": prefs_response.data.get("preferred_channels", ["email"]) if prefs_response.data else ["email"],
                                "notification_frequency": prefs_response.data.get("notification_frequency", "instant") if prefs_response.data else "instant"
                            })
                except Exception as e:
                    logger.error(f"Error calculating match score for buyer {buyer_user_id}: {e}")
                    continue
            
            # Sort by match score (highest first)
            matched_buyers.sort(key=lambda x: x["match_score"], reverse=True)
            
            # Batch process by notification frequency
            instant_buyers = [b for b in matched_buyers if b["notification_frequency"] == "instant"]
            daily_buyers = [b for b in matched_buyers if b["notification_frequency"] == "daily_digest"]
            
            distribution_results = {
                "listing_id": listing_id,
                "total_matches": len(matched_buyers),
                "instant_sent": 0,
                "daily_queued": len(daily_buyers),
                "channels_used": {}
            }
            
            # Send instant notifications
            for buyer in instant_buyers:
                for channel in buyer["preferred_channels"]:
                    try:
                        await self._send_notification(
                            channel=channel,
                            buyer=buyer,
                            listing=listing,
                            match_score=buyer["match_score"],
                            match_factors=buyer["match_factors"]
                        )
                        distribution_results["instant_sent"] += 1
                        distribution_results["channels_used"][channel] = distribution_results["channels_used"].get(channel, 0) + 1
                    except Exception as e:
                        logger.error(f"Error sending notification via {channel} to {buyer['buyer_id']}: {e}")
            
            # Log all distributions
            distribution_records = []
            for buyer in matched_buyers:
                is_instant = buyer in instant_buyers
                distribution_records.append({
                    "listing_id": listing_id,
                    "buyer_id": buyer["buyer_id"],
                    "match_score": buyer["match_score"],
                    "match_factors": buyer["match_factors"],
                    "distribution_channel": ",".join(buyer["preferred_channels"]),
                    "conversion_status": "sent" if is_instant else "queued",
                    "sent_at": datetime.now().isoformat() if is_instant else None
                })
            
            if distribution_records:
                self.supabase.table("listing_distributions").insert(distribution_records).execute()
            
            distribution_results["success"] = True
            return distribution_results
            
        except Exception as e:
            logger.error(f"Error in distribute_listing: {e}", exc_info=True)
            return {"error": str(e), "success": False}
    
    async def _send_notification(
        self, 
        channel: str, 
        buyer: Dict, 
        listing: Dict, 
        match_score: float,
        match_factors: Dict
    ):
        """Send notification via specific channel with AI-generated content"""
        
        # Generate personalized message using AI
        message_content = await self._generate_personalized_message(
            buyer=buyer,
            listing=listing,
            match_score=match_score,
            match_factors=match_factors
        )
        
        if channel == "email":
            await self._send_email(buyer["buyer_email"], message_content, listing)
        elif channel == "whatsapp":
            await self._send_whatsapp(buyer["buyer_phone"], message_content, listing)
        elif channel == "sms":
            await self._send_sms(buyer["buyer_phone"], message_content, listing)
    
    async def _generate_personalized_message(
        self,
        buyer: Dict,
        listing: Dict,
        match_score: float,
        match_factors: Dict
    ) -> Dict[str, str]:
        """
        Generate AI-powered personalized message
        Uses local Ollama for cost-free generation (can be enhanced later)
        """
        
        # Build context from match factors
        top_factors = sorted(
            match_factors.items(),
            key=lambda x: x[1] if isinstance(x[1], (int, float)) else 0,
            reverse=True
        )[:3]
        
        factor_highlights = ", ".join([
            f"{factor.replace('_', ' ').title()}: {score:.0f}%"
            for factor, score in top_factors
            if isinstance(score, (int, float))
        ])
        
        # Simple template-based generation (can be enhanced with Ollama)
        subject = f"🏠 Perfect Match Alert: {listing.get('title', 'New Property')} - {match_score:.0f}% Match!"
        
        price = listing.get('price') or listing.get('price_inr') or 0
        price_str = f"₹{price:,.0f}" if price > 0 else "Price on request"
        
        bedrooms = listing.get('bedrooms') or 0
        area = listing.get('sqft') or listing.get('area') or 'N/A'
        location = listing.get('location') or listing.get('locality') or listing.get('city') or 'Location'
        
        body = f"""Hi there!

We found a property that matches your preferences with a {match_score:.0f}% compatibility score!

📍 {listing.get('title', 'New Property')}
💰 {price_str}
📐 {bedrooms}BHK, {area} sq.ft
📍 Location: {location}

🎯 Why it's perfect for you: {factor_highlights}

{listing.get('description', '')[:200]}...

View full details and schedule a visit: https://tharaga.co.in/properties/{listing.get('id')}

This is an exclusive match based on your search history and preferences.

Best regards,
Tharaga Team
"""
        
        return {"subject": subject, "body": body}
    
    async def _send_email(self, email: str, content: Dict, listing: Dict):
        """Integrate with existing Resend API via Next.js endpoint"""
        try:
            try:
                import httpx
            except ImportError:
                logger.warning("httpx not available, skipping email send")
                return
            
            api_url = os.getenv("NEXT_PUBLIC_API_URL") or os.getenv("FRONTEND_URL", "http://localhost:3000")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{api_url}/api/messaging/send",
                    json={
                        "to": email,
                        "subject": content["subject"],
                        "body": content["body"],
                        "type": "email"
                    }
                )
                if response.status_code != 200:
                    logger.error(f"Email sending failed: {response.text}")
        except Exception as e:
            logger.error(f"Error sending email: {e}")
    
    async def _send_whatsapp(self, phone: str, content: Dict, listing: Dict):
        """Integrate with existing Twilio WhatsApp via Next.js endpoint"""
        if not phone:
            return
        
        try:
            try:
                import httpx
            except ImportError:
                logger.warning("httpx not available, skipping WhatsApp send")
                return
            
            api_url = os.getenv("NEXT_PUBLIC_API_URL") or os.getenv("FRONTEND_URL", "http://localhost:3000")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{api_url}/api/messaging/whatsapp",
                    json={
                        "to": phone,
                        "body": content["body"]
                    }
                )
                if response.status_code != 200:
                    logger.error(f"WhatsApp sending failed: {response.text}")
        except Exception as e:
            logger.error(f"Error sending WhatsApp: {e}")
    
    async def _send_sms(self, phone: str, content: Dict, listing: Dict):
        """Integrate with existing Twilio SMS via Next.js endpoint"""
        if not phone:
            return
        
        try:
            try:
                import httpx
            except ImportError:
                logger.warning("httpx not available, skipping SMS send")
                return
            
            api_url = os.getenv("NEXT_PUBLIC_API_URL") or os.getenv("FRONTEND_URL", "http://localhost:3000")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{api_url}/api/messaging/sms",
                    json={
                        "to": phone,
                        "body": content["body"][:160]  # SMS length limit
                    }
                )
                if response.status_code != 200:
                    logger.error(f"SMS sending failed: {response.text}")
        except Exception as e:
            logger.error(f"Error sending SMS: {e}")

