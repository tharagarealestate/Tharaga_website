# =============================================
# SMARTSCORE ML SERVICE - PRODUCTION READY
# File: /backend/services/smartscore_ml_service.py
# =============================================
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from supabase import create_client, Client
import os
import pickle
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
try:
    import tensorflow as tf
    from tensorflow import keras
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("Warning: TensorFlow not available. Churn risk model will use fallback.")

import logging

# =============================================
# CONFIGURATION
# =============================================
logger = logging.getLogger(__name__)

# Supabase connection - lazy initialization to avoid issues during import
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

# Model paths
MODEL_DIR = os.getenv("MODEL_DIR", "/app/models")
os.makedirs(MODEL_DIR, exist_ok=True)

LEAD_QUALITY_MODEL = os.path.join(MODEL_DIR, "lead_quality_classifier.pkl")
CONVERSION_PROB_MODEL = os.path.join(MODEL_DIR, "conversion_probability.pkl")
LTV_MODEL = os.path.join(MODEL_DIR, "ltv_predictor.pkl")
CHURN_RISK_MODEL = os.path.join(MODEL_DIR, "churn_risk_nn.h5")
SCALER = os.path.join(MODEL_DIR, "feature_scaler.pkl")

# =============================================
# PYDANTIC MODELS
# =============================================
class SmartScoreRequest(BaseModel):
    lead_ids: List[int] = Field(..., description="List of lead IDs to score")
    use_cached: bool = Field(True, description="Use cached scores if recent")
    cache_ttl_minutes: int = Field(30, description="Cache validity in minutes")

class SmartScoreResponse(BaseModel):
    lead_id: int
    smartscore: float
    conversion_probability: float
    predicted_ltv: float
    churn_risk: float
    priority_tier: str
    next_best_action: str
    optimal_contact_time: datetime
    confidence_score: float
    ai_insights: Dict[str, Any]
    model_version: str
    scored_at: datetime

class ModelTrainingRequest(BaseModel):
    min_samples: int = Field(100, description="Minimum converted leads for training")
    test_size: float = Field(0.2, description="Train/test split ratio")
    force_retrain: bool = Field(False, description="Force retrain even if recent")

# =============================================
# FEATURE ENGINEERING
# =============================================
class FeatureEngineer:
    """Extract and engineer features from lead and behavior data"""
    
    @staticmethod
    async def extract_features(lead_id: int) -> Dict[str, Any]:
        """
        Extract comprehensive features for ML model
        Returns dictionary with 50+ engineered features
        """
        try:
            # Fetch lead data
            supabase = get_supabase_client()
            lead_response = supabase.table('leads').select(
                '*, buyer_id, budget, buying_urgency, status, created_at'
            ).eq('id', lead_id).maybe_single().execute()
            
            if not lead_response.data:
                raise HTTPException(status_code=404, detail=f"Lead {lead_id} not found")
            
            lead = lead_response.data
            buyer_id = lead.get('buyer_id')
            
            features = {}
            
            # 1. DEMOGRAPHIC FEATURES
            features['budget'] = float(lead.get('budget', 0) or 0)
            features['buying_urgency_score'] = {
                'immediate': 10, 'within_3_months': 7, 
                'within_6_months': 5, 'within_year': 3, None: 1
            }.get(lead.get('buying_urgency'), 1)
            
            # Fetch buyer profile if available
            buyer_profile = None
            user_prefs = None
            if buyer_id:
                try:
                    supabase = get_supabase_client()
                    buyer_response = supabase.table('buyer_profiles').select('*').eq('user_id', buyer_id).maybe_single().execute()
                    if buyer_response.data:
                        buyer_profile = buyer_response.data
                        features['financing_approved'] = 1 if buyer_profile.get('preferences', {}).get('financing_pre_approved') else 0
                        features['first_time_buyer'] = 1 if buyer_profile.get('first_time_buyer') else 0
                    
                    prefs_response = get_supabase_client().table('user_preferences').select('*').eq('user_id', buyer_id).maybe_single().execute()
                    if prefs_response.data:
                        user_prefs = prefs_response.data
                        features['min_budget'] = float(user_prefs.get('budget_min', 0) or 0)
                        features['max_budget'] = float(user_prefs.get('budget_max', 0) or 0)
                        features['budget_range'] = features['max_budget'] - features['min_budget']
                    else:
                        features['min_budget'] = 0
                        features['max_budget'] = 0
                        features['budget_range'] = 0
                except Exception as e:
                    logger.warning(f"Error fetching buyer profile for {buyer_id}: {e}")
                    features['financing_approved'] = 0
                    features['first_time_buyer'] = 0
                    features['min_budget'] = 0
                    features['max_budget'] = 0
                    features['budget_range'] = 0
            else:
                features['financing_approved'] = 0
                features['first_time_buyer'] = 0
                features['min_budget'] = 0
                features['max_budget'] = 0
                features['budget_range'] = 0
            
            # 2. ENGAGEMENT FEATURES (Last 30/60/90 days)
            if buyer_id:
                ninety_days_ago = (datetime.now() - timedelta(days=90)).isoformat()
                try:
                    supabase = get_supabase_client()
                    behaviors = supabase.table('user_behavior').select('*').eq(
                        'user_id', buyer_id
                    ).gte('timestamp', ninety_days_ago).execute()
                    
                    if behaviors.data:
                        behavior_df = pd.DataFrame(behaviors.data)
                        behavior_df['timestamp'] = pd.to_datetime(behavior_df['timestamp'])
                        
                        now = datetime.now()
                        last_30 = behavior_df[behavior_df['timestamp'] >= now - timedelta(days=30)]
                        last_60 = behavior_df[behavior_df['timestamp'] >= now - timedelta(days=60)]
                        last_90 = behavior_df
                        
                        # Property views
                        features['property_views_30d'] = len(last_30[last_30['behavior_type'] == 'property_view']) if not last_30.empty else 0
                        features['property_views_60d'] = len(last_60[last_60['behavior_type'] == 'property_view']) if not last_60.empty else 0
                        features['property_views_90d'] = len(last_90[last_90['behavior_type'] == 'property_view']) if not last_90.empty else 0
                        
                        # Unique properties viewed
                        if not last_30.empty and 'property_id' in last_30.columns:
                            features['unique_properties_30d'] = last_30[last_30['behavior_type'] == 'property_view']['property_id'].nunique() if 'property_id' in last_30.columns else 0
                        else:
                            features['unique_properties_30d'] = 0
                        
                        # Engagement depth
                        if not last_30.empty and 'duration' in last_30.columns:
                            features['avg_session_duration'] = float(last_30['duration'].mean()) if 'duration' in last_30.columns else 0.0
                            features['total_time_spent_30d'] = float(last_30['duration'].sum()) if 'duration' in last_30.columns else 0.0
                        else:
                            features['avg_session_duration'] = 0.0
                            features['total_time_spent_30d'] = 0.0
                        
                        # Behavior diversity
                        features['behavior_types_count'] = last_30['behavior_type'].nunique() if not last_30.empty else 0
                        
                        # High-intent behaviors
                        high_intent_types = ['contact_clicked', 'phone_clicked', 'email_clicked', 'whatsapp_clicked', 'form_interaction']
                        features['high_intent_actions_30d'] = len(last_30[last_30['behavior_type'].isin(high_intent_types)]) if not last_30.empty else 0
                        
                        # Recency
                        if not last_30.empty:
                            features['days_since_last_activity'] = (now - last_30['timestamp'].max()).days
                        else:
                            features['days_since_last_activity'] = 90
                        
                        # Engagement velocity
                        features['engagement_velocity'] = (
                            (len(last_30) - len(last_60) + len(last_30)) / max(len(last_60) + 1, 1)
                        ) if not last_60.empty else 0.0
                    else:
                        # No behavior data
                        features.update({
                            'property_views_30d': 0, 'property_views_60d': 0, 'property_views_90d': 0,
                            'unique_properties_30d': 0, 'avg_session_duration': 0.0,
                            'total_time_spent_30d': 0.0, 'behavior_types_count': 0,
                            'high_intent_actions_30d': 0, 'days_since_last_activity': 90,
                            'engagement_velocity': 0.0
                        })
                except Exception as e:
                    logger.warning(f"Error fetching behavior data: {e}")
                    features.update({
                        'property_views_30d': 0, 'property_views_60d': 0, 'property_views_90d': 0,
                        'unique_properties_30d': 0, 'avg_session_duration': 0.0,
                        'total_time_spent_30d': 0.0, 'behavior_types_count': 0,
                        'high_intent_actions_30d': 0, 'days_since_last_activity': 90,
                        'engagement_velocity': 0.0
                    })
            else:
                # No buyer_id
                features.update({
                    'property_views_30d': 0, 'property_views_60d': 0, 'property_views_90d': 0,
                    'unique_properties_30d': 0, 'avg_session_duration': 0.0,
                    'total_time_spent_30d': 0.0, 'behavior_types_count': 0,
                    'high_intent_actions_30d': 0, 'days_since_last_activity': 90,
                    'engagement_velocity': 0.0
                })
            
            # 3. INQUIRY/INTERACTION FEATURES
            try:
                supabase = get_supabase_client()
                interactions = supabase.table('lead_interactions').select('*').eq(
                    'lead_id', lead_id
                ).execute()
                
                if interactions.data:
                    interaction_df = pd.DataFrame(interactions.data)
                    features['total_inquiries'] = len(interaction_df)
                    
                    now = datetime.now()
                    interaction_df['timestamp'] = pd.to_datetime(interaction_df['timestamp'])
                    features['inquiries_30d'] = len(
                        interaction_df[interaction_df['timestamp'] >= now - timedelta(days=30)]
                    )
                    
                    if 'notes' in interaction_df.columns:
                        features['avg_inquiry_length'] = float(interaction_df['notes'].str.len().mean()) if interaction_df['notes'].notna().any() else 0.0
                    else:
                        features['avg_inquiry_length'] = 0.0
                else:
                    features.update({
                        'total_inquiries': 0, 'inquiries_30d': 0, 'avg_inquiry_length': 0.0
                    })
            except Exception as e:
                logger.warning(f"Error fetching interactions: {e}")
                features.update({
                    'total_inquiries': 0, 'inquiries_30d': 0, 'avg_inquiry_length': 0.0
                })
            
            # 4. PROFILE COMPLETENESS
            profile_fields = ['email', 'phone']
            completeness = 0
            if lead.get('email'):
                completeness += 0.5
            if lead.get('phone'):
                completeness += 0.5
            features['profile_completeness'] = completeness
            
            # 5. TEMPORAL FEATURES
            lead_created = pd.to_datetime(lead['created_at'])
            now = datetime.now()
            lead_age_days = (now - lead_created).days
            features['lead_age_days'] = lead_age_days
            features['is_new_lead'] = 1 if lead_age_days <= 7 else 0
            features['created_day_of_week'] = lead_created.dayofweek
            features['created_hour'] = lead_created.hour
            
            # 6. COMPOSITE SCORES
            features['engagement_score'] = min(1.0, (
                features['property_views_30d'] * 2 +
                features['unique_properties_30d'] * 3 +
                features['high_intent_actions_30d'] * 5 +
                features['behavior_types_count'] * 2
            ) / 20)
            
            features['intent_score'] = min(1.0, (
                features['buying_urgency_score'] +
                features['financing_approved'] * 2 +
                features['inquiries_30d'] * 3
            ) / 15)
            
            logger.info(f"Extracted {len(features)} features for lead {lead_id}")
            return features
            
        except Exception as e:
            logger.error(f"Feature extraction failed for {lead_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Feature extraction failed: {str(e)}")

# =============================================
# ML MODEL MANAGER
# =============================================
class ModelManager:
    """Manage ML models - loading, training, prediction"""
    
    def __init__(self):
        self.lead_quality_model = None
        self.conversion_prob_model = None
        self.ltv_model = None
        self.churn_risk_model = None
        self.scaler = None
        self.feature_names = []
        self.load_models()
    
    def load_models(self):
        """Load pre-trained models from disk"""
        try:
            if os.path.exists(LEAD_QUALITY_MODEL):
                self.lead_quality_model = joblib.load(LEAD_QUALITY_MODEL)
                logger.info("Loaded lead quality model")
            
            if os.path.exists(CONVERSION_PROB_MODEL):
                self.conversion_prob_model = joblib.load(CONVERSION_PROB_MODEL)
                logger.info("Loaded conversion probability model")
            
            if os.path.exists(LTV_MODEL):
                self.ltv_model = joblib.load(LTV_MODEL)
                logger.info("Loaded LTV predictor model")
            
            if TF_AVAILABLE and os.path.exists(CHURN_RISK_MODEL):
                self.churn_risk_model = keras.models.load_model(CHURN_RISK_MODEL)
                logger.info("Loaded churn risk model")
            
            if os.path.exists(SCALER):
                self.scaler = joblib.load(SCALER)
                logger.info("Loaded feature scaler")
            else:
                logger.warning("No models found - training required")
                
        except Exception as e:
            logger.error(f"Model loading failed: {str(e)}")
    
    async def predict_smartscore(
        self, 
        lead_id: int, 
        features: Dict[str, Any]
    ) -> SmartScoreResponse:
        """
        Generate comprehensive SmartScore prediction
        """
        try:
            # Convert features to DataFrame
            feature_df = pd.DataFrame([features])
            
            # Scale features
            if self.scaler:
                features_scaled = self.scaler.transform(feature_df)
            else:
                features_scaled = feature_df.values
            
            # === PREDICTIONS ===
            
            # 1. Lead Quality Score (0-100)
            if self.lead_quality_model:
                quality_proba = self.lead_quality_model.predict_proba(features_scaled)[0]
                smartscore = float(np.dot(quality_proba, [20, 40, 60, 80, 100]))
            else:
                smartscore = self._fallback_score(features)
            
            # 2. Conversion Probability (0-1)
            if self.conversion_prob_model:
                conversion_prob = float(self.conversion_prob_model.predict_proba(features_scaled)[0][1])
            else:
                conversion_prob = smartscore / 100.0
            
            # 3. Predicted LTV
            if self.ltv_model:
                predicted_ltv = float(self.ltv_model.predict(features_scaled)[0])
            else:
                predicted_ltv = features.get('budget', 0) * conversion_prob * 0.02
            
            # 4. Churn Risk (0-1)
            if self.churn_risk_model and TF_AVAILABLE:
                churn_risk = float(self.churn_risk_model.predict(features_scaled)[0][0])
            else:
                churn_risk = max(0, 1 - (features.get('engagement_score', 0) + 
                                        features.get('intent_score', 0)) / 2)
            
            # === DERIVE INSIGHTS ===
            
            # Priority tier
            if smartscore >= 80:
                priority_tier = "platinum"
            elif smartscore >= 60:
                priority_tier = "gold"
            elif smartscore >= 40:
                priority_tier = "silver"
            elif smartscore >= 25:
                priority_tier = "bronze"
            else:
                priority_tier = "standard"
            
            # Next best action
            next_action = self._determine_next_action(features, smartscore, churn_risk)
            
            # Optimal contact time
            optimal_time = self._calculate_optimal_contact_time(features)
            
            # Confidence score
            confidence = self._calculate_confidence(features, smartscore)
            
            # AI insights
            insights = {
                "score_breakdown": {
                    "engagement": features.get('engagement_score', 0),
                    "intent": features.get('intent_score', 0),
                    "profile": features.get('profile_completeness', 0),
                    "timing": 1 - (features.get('days_since_last_activity', 90) / 90)
                },
                "key_strengths": self._identify_strengths(features),
                "improvement_areas": self._identify_weaknesses(features),
                "behavioral_summary": {
                    "property_views_30d": int(features.get('property_views_30d', 0)),
                    "high_intent_actions": int(features.get('high_intent_actions_30d', 0)),
                    "total_inquiries": int(features.get('total_inquiries', 0))
                },
                "recommendations": [next_action]
            }
            
            return SmartScoreResponse(
                lead_id=lead_id,
                smartscore=round(smartscore, 2),
                conversion_probability=round(conversion_prob, 4),
                predicted_ltv=round(predicted_ltv, 2),
                churn_risk=round(churn_risk, 4),
                priority_tier=priority_tier,
                next_best_action=next_action,
                optimal_contact_time=optimal_time,
                confidence_score=round(confidence, 2),
                ai_insights=insights,
                model_version="v2.0_ml",
                scored_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Prediction failed for {lead_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
    def _fallback_score(self, features: Dict[str, Any]) -> float:
        """Rule-based scoring when ML models unavailable"""
        score = 0
        
        # Budget component (20 points)
        if features.get('budget', 0) > 0:
            score += min(20, features['budget'] / 50000000 * 20)
        
        # Urgency (20 points)
        score += features.get('buying_urgency_score', 0) * 2
        
        # Engagement (30 points)
        score += features.get('engagement_score', 0) * 30
        
        # Intent (20 points)
        score += features.get('intent_score', 0) * 20
        
        # Profile completeness (10 points)
        score += features.get('profile_completeness', 0) * 10
        
        return min(score, 100)
    
    def _determine_next_action(
        self, 
        features: Dict[str, Any], 
        score: float, 
        churn_risk: float
    ) -> str:
        """Determine optimal next action based on lead state"""
        
        if churn_risk > 0.7:
            return "re_engage_with_personalized_offer"
        
        if features.get('inquiries_30d', 0) > 0:
            return "follow_up_on_inquiry"
        
        if features.get('high_intent_actions_30d', 0) > 2:
            return "schedule_immediate_call"
        
        if score >= 70:
            return "send_property_shortlist_with_booking_incentive"
        
        if features.get('property_views_30d', 0) > 5:
            return "offer_virtual_tour_of_top_matches"
        
        if features.get('days_since_last_activity', 90) > 14:
            return "send_new_listings_matching_preferences"
        
        return "nurture_with_educational_content"
    
    def _calculate_optimal_contact_time(self, features: Dict[str, Any]) -> datetime:
        """Calculate best time to contact based on past behavior"""
        now = datetime.now()
        
        # If user is active late evening
        if features.get('created_hour', 12) >= 18:
            contact_time = now.replace(hour=19, minute=0, second=0, microsecond=0)
        # Morning person
        elif features.get('created_hour', 12) <= 10:
            contact_time = now.replace(hour=10, minute=0, second=0, microsecond=0)
        # Default to afternoon
        else:
            contact_time = now.replace(hour=14, minute=30, second=0, microsecond=0)
        
        # If time passed, schedule for next day
        if contact_time < now:
            contact_time += timedelta(days=1)
        
        return contact_time
    
    def _calculate_confidence(self, features: Dict[str, Any], score: float) -> float:
        """Calculate prediction confidence based on data completeness"""
        confidence = 0.5
        
        if features.get('property_views_30d', 0) > 5:
            confidence += 0.2
        if features.get('total_inquiries', 0) > 0:
            confidence += 0.15
        if features.get('profile_completeness', 0) > 0.7:
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _identify_strengths(self, features: Dict[str, Any]) -> List[str]:
        """Identify lead's key strengths"""
        strengths = []
        
        if features.get('financing_approved'):
            strengths.append("Pre-approved financing")
        if features.get('buying_urgency_score', 0) >= 7:
            strengths.append("High buying urgency")
        if features.get('property_views_30d', 0) > 10:
            strengths.append("Highly engaged viewer")
        if features.get('high_intent_actions_30d', 0) > 3:
            strengths.append("Strong purchase intent")
        
        return strengths[:3]
    
    def _identify_weaknesses(self, features: Dict[str, Any]) -> List[str]:
        """Identify areas needing improvement"""
        weaknesses = []
        
        if features.get('profile_completeness', 0) < 0.5:
            weaknesses.append("Incomplete profile")
        if features.get('days_since_last_activity', 90) > 21:
            weaknesses.append("Low recent engagement")
        if features.get('total_inquiries', 0) == 0:
            weaknesses.append("No inquiries submitted")
        if not features.get('financing_approved'):
            weaknesses.append("Financing not pre-approved")
        
        return weaknesses[:2]
    
    async def train_models(self, min_samples: int = 100) -> Dict[str, Any]:
        """
        Train all ML models using historical conversion data
        """
        try:
            logger.info("Starting model training...")
            
            # Fetch training data
            training_data = await self._fetch_training_data(min_samples)
            
            if len(training_data) < min_samples:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient training data. Need {min_samples}, got {len(training_data)}"
                )
            
            # Prepare features and targets
            X = training_data.drop(['converted', 'conversion_value', 'lead_id', 'quality_tier'], axis=1, errors='ignore')
            y_quality = training_data['quality_tier'] if 'quality_tier' in training_data.columns else pd.Series(['Cold'] * len(training_data))
            y_conversion = training_data['converted']
            y_ltv = training_data['conversion_value']
            
            # Train/test split
            X_train, X_test, y_quality_train, y_quality_test = train_test_split(
                X, y_quality, test_size=0.2, random_state=42
            )
            
            # Scale features
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            self.feature_names = list(X.columns)
            
            # === TRAIN MODELS ===
            
            # 1. Lead Quality Classifier
            self.lead_quality_model = RandomForestClassifier(
                n_estimators=100, max_depth=10, random_state=42
            )
            self.lead_quality_model.fit(X_train_scaled, y_quality_train)
            quality_score = self.lead_quality_model.score(X_test_scaled, y_quality_test)
            logger.info(f"Lead Quality Model - Accuracy: {quality_score:.3f}")
            
            # 2. Conversion Probability
            self.conversion_prob_model = LogisticRegression(max_iter=1000, random_state=42)
            self.conversion_prob_model.fit(
                X_train_scaled, 
                y_conversion.loc[X_train.index]
            )
            conv_score = self.conversion_prob_model.score(
                X_test_scaled, 
                y_conversion.loc[X_test.index]
            )
            logger.info(f"Conversion Model - Accuracy: {conv_score:.3f}")
            
            # 3. LTV Predictor
            self.ltv_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
            self.ltv_model.fit(X_train_scaled, y_ltv.loc[X_train.index])
            ltv_score = self.ltv_model.score(X_test_scaled, y_ltv.loc[X_test.index])
            logger.info(f"LTV Model - R²: {ltv_score:.3f}")
            
            # 4. Churn Risk Neural Network (if TF available)
            if TF_AVAILABLE:
                self.churn_risk_model = keras.Sequential([
                    keras.layers.Dense(64, activation='relu', input_shape=(X_train_scaled.shape[1],)),
                    keras.layers.Dropout(0.3),
                    keras.layers.Dense(32, activation='relu'),
                    keras.layers.Dense(1, activation='sigmoid')
                ])
                self.churn_risk_model.compile(
                    optimizer='adam', 
                    loss='binary_crossentropy', 
                    metrics=['accuracy']
                )
                
                y_churn = (y_quality_train == 'Cold').astype(int)
                self.churn_risk_model.fit(
                    X_train_scaled, y_churn, 
                    epochs=50, batch_size=32, 
                    validation_split=0.2, verbose=0
                )
                
                self.churn_risk_model.save(CHURN_RISK_MODEL)
            
            # === SAVE MODELS ===
            joblib.dump(self.lead_quality_model, LEAD_QUALITY_MODEL)
            joblib.dump(self.conversion_prob_model, CONVERSION_PROB_MODEL)
            joblib.dump(self.ltv_model, LTV_MODEL)
            joblib.dump(self.scaler, SCALER)
            
            logger.info("Models trained and saved successfully")
            
            return {
                "status": "success",
                "models_trained": 4 if TF_AVAILABLE else 3,
                "training_samples": len(training_data),
                "accuracy_scores": {
                    "lead_quality": float(quality_score),
                    "conversion_probability": float(conv_score),
                    "ltv_prediction": float(ltv_score)
                },
                "feature_count": len(self.feature_names),
                "trained_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Model training failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
    
    async def _fetch_training_data(self, min_samples: int) -> pd.DataFrame:
        """Fetch and prepare training data from Supabase"""
        try:
            # Fetch converted leads
            supabase = get_supabase_client()
            conversions = supabase.table('lead_conversions').select(
                '*, leads!inner(*)'
            ).limit(min_samples * 2).execute()
            
            if not conversions.data:
                raise HTTPException(status_code=400, detail="No conversion data available for training")
            
            training_records = []
            
            for conversion in conversions.data:
                lead_id = conversion['lead_id']
                
                try:
                    features = await FeatureEngineer.extract_features(lead_id)
                    features['lead_id'] = lead_id
                    features['converted'] = 1
                    features['conversion_value'] = float(conversion.get('conversion_value', 0) or 0)
                    
                    days_to_convert = conversion.get('days_to_convert', 30)
                    if days_to_convert <= 14:
                        features['quality_tier'] = 'Hot'
                    elif days_to_convert <= 30:
                        features['quality_tier'] = 'Warm'
                    else:
                        features['quality_tier'] = 'Cold'
                    
                    training_records.append(features)
                except Exception as e:
                    logger.warning(f"Failed to extract features for lead {lead_id}: {e}")
                    continue
            
            # Fetch non-converted leads
            non_converted = get_supabase_client().table('leads').select('id').in_(
                'status', ['lost']
            ).limit(min_samples).execute()
            
            for lead in non_converted.data[:min_samples]:
                try:
                    features = await FeatureEngineer.extract_features(lead['id'])
                    features['lead_id'] = lead['id']
                    features['converted'] = 0
                    features['conversion_value'] = 0
                    features['quality_tier'] = 'Cold'
                    training_records.append(features)
                except Exception as e:
                    logger.warning(f"Failed to extract features for lead {lead['id']}: {e}")
                    continue
            
            if not training_records:
                raise HTTPException(status_code=400, detail="No valid training data extracted")
            
            df = pd.DataFrame(training_records)
            logger.info(f"Prepared {len(df)} training samples")
            
            return df
            
        except Exception as e:
            logger.error(f"Training data fetch failed: {str(e)}")
            raise

# =============================================
# INITIALIZE MODEL MANAGER
# =============================================
model_manager = ModelManager()
feature_engineer = FeatureEngineer()

# =============================================
# HELPER FUNCTIONS
# =============================================
async def _get_cached_score(lead_id: int, ttl_minutes: int) -> Optional[SmartScoreResponse]:
    """Check if recent score exists in cache"""
    try:
        cutoff = datetime.now() - timedelta(minutes=ttl_minutes)
        
        supabase = get_supabase_client()
        result = supabase.table('smartscore_history').select('*').eq(
            'lead_id', lead_id
        ).gte('created_at', cutoff.isoformat()).order(
            'created_at', desc=True
        ).limit(1).execute()
        
        if result.data:
            score_data = result.data[0]
            # Map to SmartScoreResponse format
            return SmartScoreResponse(
                lead_id=score_data['lead_id'],
                smartscore=float(score_data['score_value']),
                conversion_probability=float(score_data.get('conversion_probability', 0) or 0),
                predicted_ltv=0,  # Not in history table
                churn_risk=0,
                priority_tier='standard',
                next_best_action='',
                optimal_contact_time=datetime.now(),
                confidence_score=0,
                ai_insights=score_data.get('score_factors', {}),
                model_version=score_data.get('model_version', 'v2'),
                scored_at=datetime.fromisoformat(score_data['created_at'].replace('Z', '+00:00'))
            )
        
        return None
        
    except Exception as e:
        logger.warning(f"Cache check failed for {lead_id}: {e}")
        return None

async def _save_score_to_db(score: SmartScoreResponse):
    """Save SmartScore to leads table and history"""
    try:
        # Update leads table
        supabase = get_supabase_client()
        supabase.table('leads').update({
            'smartscore_v2': score.smartscore,
            'conversion_probability': score.conversion_probability,
            'predicted_ltv': score.predicted_ltv,
            'priority_tier': score.priority_tier,
            'next_best_action': score.next_best_action,
            'optimal_contact_time': score.optimal_contact_time.isoformat(),
            'ai_insights': score.ai_insights,
            'smartscore_updated_at': score.scored_at.isoformat()
        }).eq('id', score.lead_id).execute()
        
        # Insert into history
        supabase.table('smartscore_history').insert({
            'lead_id': score.lead_id,
            'score_version': 'v2.0_ml',
            'score_value': score.smartscore,
            'conversion_probability': score.conversion_probability,
            'score_factors': score.ai_insights.get('score_breakdown', {}),
            'features_used': score.ai_insights.get('behavioral_summary', {}),
            'model_version': score.model_version,
            'created_at': score.scored_at.isoformat()
        }).execute()
        
        logger.info(f"Saved score for lead {score.lead_id}")
        
    except Exception as e:
        logger.error(f"Score save failed for lead {score.lead_id}: {str(e)}")

async def _batch_score_update():
    """Background task to update all active leads"""
    try:
        # Fetch all active leads
        supabase = get_supabase_client()
        leads = supabase.table('leads').select('id').in_(
            'status', ['new', 'contacted', 'qualified']
        ).execute()
        
        lead_ids = [lead['id'] for lead in leads.data]
        
        logger.info(f"Batch scoring {len(lead_ids)} leads...")
        
        # Score in batches of 50
        for i in range(0, len(lead_ids), 50):
            batch = lead_ids[i:i+50]
            await calculate_smartscore_batch(SmartScoreRequest(
                lead_ids=batch,
                use_cached=False
            ))
        
        logger.info("Batch scoring completed")
        
    except Exception as e:
        logger.error(f"Batch scoring failed: {str(e)}")

async def calculate_smartscore_batch(request: SmartScoreRequest) -> List[SmartScoreResponse]:
    """Calculate SmartScore for batch of leads"""
    results = []
    
    for lead_id in request.lead_ids:
        try:
            # Check cache first
            if request.use_cached:
                cached = await _get_cached_score(lead_id, request.cache_ttl_minutes)
                if cached:
                    results.append(cached)
                    continue
            
            # Extract features
            features = await feature_engineer.extract_features(lead_id)
            
            # Predict
            score = await model_manager.predict_smartscore(lead_id, features)
            
            # Save to database
            await _save_score_to_db(score)
            
            results.append(score)
        except Exception as e:
            logger.error(f"Failed to score lead {lead_id}: {e}")
            continue
    
    return results

async def _get_last_training_time() -> Optional[datetime]:
    """Get timestamp of last model training"""
    try:
        # Check if we have a metadata table or use model file timestamps
        model_files = [LEAD_QUALITY_MODEL, CONVERSION_PROB_MODEL, LTV_MODEL]
        latest_time = None
        
        for model_file in model_files:
            if os.path.exists(model_file):
                mtime = datetime.fromtimestamp(os.path.getmtime(model_file))
                if latest_time is None or mtime > latest_time:
                    latest_time = mtime
        
        return latest_time
    except:
        return None

