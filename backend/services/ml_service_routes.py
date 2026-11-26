# =============================================
# ML SERVICE API ROUTES
# =============================================
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from datetime import datetime
import logging

from services.smartscore_ml_service import (
    model_manager,
    feature_engineer,
    SmartScoreRequest,
    SmartScoreResponse,
    ModelTrainingRequest,
    calculate_smartscore_batch,
    _batch_score_update,
    _get_last_training_time
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ml", tags=["ML"])

@router.post("/smartscore/calculate", response_model=List[SmartScoreResponse])
async def calculate_smartscore(request: SmartScoreRequest):
    """
    Calculate SmartScore for one or multiple leads using ML models
    """
    try:
        results = await calculate_smartscore_batch(request)
        return results
    except Exception as e:
        logger.error(f"SmartScore calculation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")

@router.post("/smartscore/batch")
async def batch_calculate_smartscore(background_tasks: BackgroundTasks):
    """
    Trigger batch recalculation of SmartScores for all active leads
    """
    background_tasks.add_task(_batch_score_update)
    return {
        "status": "Batch scoring initiated",
        "message": "Scores will update in background"
    }

@router.post("/models/train")
async def train_models(request: ModelTrainingRequest, background_tasks: BackgroundTasks):
    """
    Train/retrain ML models using latest conversion data
    """
    try:
        # Check if training needed
        if not request.force_retrain:
            last_train = await _get_last_training_time()
            if last_train and (datetime.now() - last_train).days < 7:
                return {
                    "status": "skipped",
                    "message": "Models recently trained",
                    "last_trained": last_train.isoformat()
                }
        
        # Train in background
        background_tasks.add_task(
            model_manager.train_models, 
            request.min_samples
        )
        
        return {
            "status": "training_initiated",
            "message": "Model training started in background"
        }
        
    except Exception as e:
        logger.error(f"Training initiation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/status")
async def get_model_status():
    """Get current model versions and performance metrics"""
    return {
        "lead_quality_model": "loaded" if model_manager.lead_quality_model else "missing",
        "conversion_prob_model": "loaded" if model_manager.conversion_prob_model else "missing",
        "ltv_model": "loaded" if model_manager.ltv_model else "missing",
        "churn_risk_model": "loaded" if (model_manager.churn_risk_model is not None) else "missing",
        "feature_count": len(model_manager.feature_names),
        "last_trained": (await _get_last_training_time()).isoformat() if await _get_last_training_time() else None
    }

@router.get("/features/{lead_id}")
async def get_lead_features(lead_id: int):
    """Get extracted features for a lead (for debugging/transparency)"""
    try:
        features = await feature_engineer.extract_features(lead_id)
        return {"lead_id": lead_id, "features": features}
    except Exception as e:
        logger.error(f"Feature extraction failed for {lead_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SmartScore ML Service",
        "version": "2.0",
        "models_loaded": all([
            model_manager.lead_quality_model,
            model_manager.conversion_prob_model,
            model_manager.ltv_model
        ])
    }

