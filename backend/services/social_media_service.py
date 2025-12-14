# File: /backend/services/social_media_service.py
import os
import json
import re
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

class SocialMediaService:
    """
    Multi-platform social media integration
    Supports: Facebook, Instagram, LinkedIn, Twitter
    """
    
    def __init__(self):
        self.supabase = get_supabase_client()
        
        # Encryption for tokens
        encryption_key = os.getenv("ENCRYPTION_KEY")
        if encryption_key:
            try:
                self.cipher = Fernet(encryption_key.encode())
            except:
                # Generate new key if invalid
                self.cipher = Fernet(Fernet.generate_key())
        else:
            self.cipher = Fernet(Fernet.generate_key())
        
        # Platform API configs
        self.configs = {
            "facebook": {
                "api_url": "https://graph.facebook.com/v18.0",
                "app_id": os.getenv("FACEBOOK_APP_ID"),
                "app_secret": os.getenv("FACEBOOK_APP_SECRET")
            },
            "instagram": {
                "api_url": "https://graph.facebook.com/v18.0",
                "app_id": os.getenv("FACEBOOK_APP_ID"),
                "app_secret": os.getenv("FACEBOOK_APP_SECRET")
            },
            "linkedin": {
                "api_url": "https://api.linkedin.com/v2",
                "client_id": os.getenv("LINKEDIN_CLIENT_ID"),
                "client_secret": os.getenv("LINKEDIN_CLIENT_SECRET")
            },
            "twitter": {
                "api_url": "https://api.twitter.com/2",
                "api_key": os.getenv("TWITTER_API_KEY"),
                "api_secret": os.getenv("TWITTER_API_SECRET")
            }
        }
    
    async def create_and_post(
        self,
        property_id: str,
        social_account_id: str,
        template_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Main function to create and post property listing to social media
        """
        
        # Get property details
        property_data = self.supabase.table("properties")\
            .select("*, property_media(*)")\
            .eq("id", property_id)\
            .single()\
            .execute()
        
        if not property_data.data:
            raise ValueError("Property not found")
        
        prop = property_data.data
        
        # Get social account
        account = self.supabase.table("social_media_accounts")\
            .select("*")\
            .eq("id", social_account_id)\
            .single()\
            .execute()
        
        if not account.data:
            raise ValueError("Social account not found")
        
        acc = account.data
        platform = acc["platform"]
        
        # Get or create template
        tmpl = None
        if template_id:
            template = self.supabase.table("social_media_templates")\
                .select("*")\
                .eq("id", template_id)\
                .single()\
                .execute()
            tmpl = template.data if template.data else None
        
        # Generate post content
        post_content = await self._generate_post_content(
            prop,
            platform,
            tmpl
        )
        
        # Prepare media
        media_urls = await self._prepare_media(
            prop.get("property_media", []),
            platform,
            tmpl
        )
        
        # Create post record (pending)
        post_record = self.supabase.table("social_media_posts").insert({
            "property_id": property_id,
            "social_account_id": social_account_id,
            "platform": platform,
            "post_content": post_content["content"],
            "post_caption": post_content.get("caption"),
            "media_urls": media_urls,
            "hashtags": post_content.get("hashtags", []),
            "post_type": "new_listing",
            "status": "queued"
        }).execute()
        
        post_id = post_record.data[0]["id"]
        
        try:
            # Post to platform
            result = await self._post_to_platform(
                platform=platform,
                account=acc,
                content=post_content["content"],
                media_urls=media_urls,
                hashtags=post_content.get("hashtags", [])
            )
            
            # Update record with success
            self.supabase.table("social_media_posts").update({
                "status": "posted",
                "platform_post_id": result.get("post_id"),
                "post_url": result.get("post_url"),
                "posted_at": datetime.utcnow().isoformat()
            }).eq("id", post_id).execute()
            
            # Update account last successful post
            self.supabase.table("social_media_accounts").update({
                "last_successful_post": datetime.utcnow().isoformat(),
                "connection_status": "active"
            }).eq("id", social_account_id).execute()
            
            return {
                "success": True,
                "post_id": post_id,
                "platform_post_id": result.get("post_id"),
                "post_url": result.get("post_url")
            }
            
        except Exception as e:
            # Update record with failure
            self.supabase.table("social_media_posts").update({
                "status": "failed",
                "error_message": str(e),
                "failed_at": datetime.utcnow().isoformat(),
                "retry_count": post_record.data[0].get("retry_count", 0) + 1
            }).eq("id", post_id).execute()
            
            # Update account status if token issue
            if "token" in str(e).lower() or "auth" in str(e).lower():
                self.supabase.table("social_media_accounts").update({
                    "connection_status": "token_expired",
                    "error_message": str(e)
                }).eq("id", social_account_id).execute()
            
            raise
    
    async def _generate_post_content(
        self,
        property_data: Dict,
        platform: str,
        template: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate AI-optimized post content
        """
        
        # Character limits per platform
        limits = {
            "facebook": 63206,
            "instagram": 2200,
            "linkedin": 3000,
            "twitter": 280
        }
        
        max_length = limits.get(platform, 2000)
        
        # Build base content
        title = property_data.get("title", "")
        price = f"₹{property_data.get('price', 0):,}"
        location = property_data.get("location", "")
        bedrooms = property_data.get("bedrooms", "")
        area = property_data.get("area", "")
        description = property_data.get("description", "")[:200] if property_data.get("description") else ""
        property_id = property_data.get("id", "")
        
        # Use template if provided
        if template and template.get("content_template"):
            content = template["content_template"]
            # Replace template variables
            content = content.replace("{property_title}", title)
            content = content.replace("{price}", price)
            content = content.replace("{location}", location)
            content = content.replace("{bedrooms}", str(bedrooms))
            content = content.replace("{area}", str(area))
            content = content.replace("{description}", description)
            content = content.replace("{property_id}", str(property_id))
            
            # Use template hashtags if available
            hashtags = template.get("hashtag_template", [])
        else:
            # Default template
            content = f"""🏠 {title}

📍 Location: {location}
💰 Price: {price}
🛏️ {bedrooms}BHK | {area} sq.ft

{description}

✅ Zero Commission
✅ Direct from Builder
✅ Verified Listing

View details & book site visit: https://tharaga.co.in/properties/{property_id}

#RealEstate #Property #Chennai #ZeroCommission #NewListing"""
            
            hashtags = ["#RealEstate", "#Property", "#Chennai", "#ZeroCommission", "#NewListing"]
        
        # Truncate if needed
        if len(content) > max_length:
            content = content[:max_length-3] + "..."
        
        # Extract hashtags from content
        extracted_hashtags = self._extract_hashtags(content)
        if extracted_hashtags:
            hashtags = list(set(hashtags + extracted_hashtags))
        
        return {
            "content": content,
            "caption": content[:100] + "..." if len(content) > 100 else content,
            "hashtags": hashtags
        }
    
    async def _prepare_media(
        self,
        property_media: List[Dict],
        platform: str,
        template: Optional[Dict]
    ) -> List[str]:
        """
        Select and prepare media for posting
        """
        
        # Get image URLs
        images = [
            m["url"] for m in property_media 
            if m.get("media_type") == "image" and m.get("url")
        ]
        
        if not images:
            return []
        
        # Platform-specific limits
        max_images = {
            "facebook": 10,
            "instagram": 10,  # Carousel
            "linkedin": 9,
            "twitter": 4
        }
        
        limit = max_images.get(platform, 4)
        
        # Prioritize: primary image first, then by order
        primary = [m["url"] for m in property_media if m.get("is_primary") and m.get("url")]
        others = [m["url"] for m in property_media if not m.get("is_primary") and m.get("media_type") == "image" and m.get("url")]
        
        selected = (primary + others)[:limit]
        
        return selected
    
    async def _post_to_platform(
        self,
        platform: str,
        account: Dict,
        content: str,
        media_urls: List[str],
        hashtags: List[str]
    ) -> Dict[str, Any]:
        """
        Post to specific social media platform
        """
        
        if platform == "facebook":
            return await self._post_to_facebook(account, content, media_urls)
        elif platform == "instagram":
            return await self._post_to_instagram(account, content, media_urls)
        elif platform == "linkedin":
            return await self._post_to_linkedin(account, content, media_urls)
        elif platform == "twitter":
            return await self._post_to_twitter(account, content, media_urls)
        else:
            raise ValueError(f"Unsupported platform: {platform}")
    
    async def _post_to_facebook(
        self,
        account: Dict,
        content: str,
        media_urls: List[str]
    ) -> Dict[str, Any]:
        """
        Post to Facebook Page using Graph API
        """
        
        config = self.configs["facebook"]
        access_token = self._decrypt_token(account["access_token"])
        page_id = account["platform_account_id"]
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            
            if len(media_urls) == 0:
                # Text-only post
                response = await client.post(
                    f"{config['api_url']}/{page_id}/feed",
                    data={
                        "message": content,
                        "access_token": access_token
                    }
                )
            
            elif len(media_urls) == 1:
                # Single photo post
                response = await client.post(
                    f"{config['api_url']}/{page_id}/photos",
                    data={
                        "url": media_urls[0],
                        "caption": content,
                        "access_token": access_token
                    }
                )
            
            else:
                # Photo album/carousel
                # First, upload all photos
                photo_ids = []
                for url in media_urls:
                    upload_response = await client.post(
                        f"{config['api_url']}/{page_id}/photos",
                        data={
                            "url": url,
                            "published": "false",
                            "access_token": access_token
                        }
                    )
                    upload_data = upload_response.json()
                    if "id" in upload_data:
                        photo_ids.append({"media_fbid": upload_data["id"]})
                
                # Create album post
                response = await client.post(
                    f"{config['api_url']}/{page_id}/feed",
                    data={
                        "message": content,
                        "attached_media": json.dumps(photo_ids),
                        "access_token": access_token
                    }
                )
            
            response.raise_for_status()
            data = response.json()
            
            post_id = data.get("id", data.get("post_id", ""))
            
            return {
                "post_id": post_id,
                "post_url": f"https://facebook.com/{post_id.replace('_', '/posts/')}" if post_id else ""
            }
    
    async def _post_to_instagram(
        self,
        account: Dict,
        content: str,
        media_urls: List[str]
    ) -> Dict[str, Any]:
        """
        Post to Instagram Business Account via Facebook Graph API
        """
        
        config = self.configs["instagram"]
        access_token = self._decrypt_token(account["access_token"])
        ig_account_id = account["platform_account_id"]
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            
            if len(media_urls) == 1:
                # Single image post
                # Step 1: Create media container
                container_response = await client.post(
                    f"{config['api_url']}/{ig_account_id}/media",
                    data={
                        "image_url": media_urls[0],
                        "caption": content,
                        "access_token": access_token
                    }
                )
                
                container_response.raise_for_status()
                container_data = container_response.json()
                creation_id = container_data["id"]
                
                # Step 2: Publish media container
                publish_response = await client.post(
                    f"{config['api_url']}/{ig_account_id}/media_publish",
                    data={
                        "creation_id": creation_id,
                        "access_token": access_token
                    }
                )
                
                publish_response.raise_for_status()
                publish_data = publish_response.json()
                
                return {
                    "post_id": publish_data.get("id", ""),
                    "post_url": f"https://instagram.com/p/{publish_data.get('id', '')}"
                }
            
            else:
                # Carousel post
                # Step 1: Create containers for each image
                children_ids = []
                for url in media_urls:
                    container_response = await client.post(
                        f"{config['api_url']}/{ig_account_id}/media",
                        data={
                            "image_url": url,
                            "is_carousel_item": "true",
                            "access_token": access_token
                        }
                    )
                    container_data = container_response.json()
                    if "id" in container_data:
                        children_ids.append(container_data["id"])
                
                # Step 2: Create carousel container
                carousel_response = await client.post(
                    f"{config['api_url']}/{ig_account_id}/media",
                    data={
                        "media_type": "CAROUSEL",
                        "children": ",".join(children_ids),
                        "caption": content,
                        "access_token": access_token
                    }
                )
                
                carousel_data = carousel_response.json()
                carousel_id = carousel_data.get("id")
                
                # Step 3: Publish carousel
                publish_response = await client.post(
                    f"{config['api_url']}/{ig_account_id}/media_publish",
                    data={
                        "creation_id": carousel_id,
                        "access_token": access_token
                    }
                )
                
                publish_data = publish_response.json()
                
                return {
                    "post_id": publish_data.get("id", ""),
                    "post_url": f"https://instagram.com/p/{publish_data.get('id', '')}"
                }
    
    async def _post_to_linkedin(
        self,
        account: Dict,
        content: str,
        media_urls: List[str]
    ) -> Dict[str, Any]:
        """
        Post to LinkedIn Company Page
        """
        
        config = self.configs["linkedin"]
        access_token = self._decrypt_token(account["access_token"])
        org_id = account["platform_account_id"]
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            
            # LinkedIn Share API
            share_data = {
                "author": f"urn:li:organization:{org_id}",
                "lifecycleState": "PUBLISHED",
                "specificContent": {
                    "com.linkedin.ugc.ShareContent": {
                        "shareCommentary": {
                            "text": content
                        },
                        "shareMediaCategory": "NONE" if not media_urls else "IMAGE"
                    }
                },
                "visibility": {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            }
            
            # Add media if present (simplified - full implementation requires media upload)
            if media_urls:
                share_data["specificContent"]["com.linkedin.ugc.ShareContent"]["shareMediaCategory"] = "IMAGE"
            
            # Create share
            response = await client.post(
                f"{config['api_url']}/ugcPosts",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                    "X-Restli-Protocol-Version": "2.0.0"
                },
                json=share_data
            )
            
            response.raise_for_status()
            
            # Extract post ID from Location header
            location = response.headers.get("Location", "")
            post_id = location.split("/")[-1] if location else ""
            
            return {
                "post_id": post_id,
                "post_url": f"https://linkedin.com/feed/update/{post_id}" if post_id else ""
            }
    
    async def _post_to_twitter(
        self,
        account: Dict,
        content: str,
        media_urls: List[str]
    ) -> Dict[str, Any]:
        """
        Post to Twitter/X
        """
        
        config = self.configs["twitter"]
        access_token = self._decrypt_token(account["access_token"])
        
        # Twitter API v2 implementation
        async with httpx.AsyncClient(timeout=30.0) as client:
            
            tweet_data = {"text": content[:280]}  # Twitter character limit
            
            # Upload media if present (simplified - requires OAuth 1.0a for media)
            if media_urls:
                # Note: Full implementation requires OAuth 1.0a for media upload
                # This is a simplified version
                pass
            
            # Create tweet
            response = await client.post(
                f"{config['api_url']}/tweets",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json=tweet_data
            )
            
            response.raise_for_status()
            data = response.json()
            
            tweet_id = data.get("data", {}).get("id", "")
            
            return {
                "post_id": tweet_id,
                "post_url": f"https://twitter.com/i/web/status/{tweet_id}" if tweet_id else ""
            }
    
    def _extract_hashtags(self, content: str) -> List[str]:
        """Extract hashtags from content"""
        return re.findall(r'#\w+', content)
    
    def _encrypt_token(self, token: str) -> str:
        """Encrypt access token for storage"""
        try:
            return self.cipher.encrypt(token.encode()).decode()
        except:
            return token  # Return as-is if encryption fails
    
    def _decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt access token"""
        try:
            return self.cipher.decrypt(encrypted_token.encode()).decode()
        except:
            return encrypted_token  # Return as-is if decryption fails








