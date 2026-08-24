from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.security import get_current_user_optional
from app.models.db_models import User
from app.ml.surrogate import SurrogateModelPipeline

router = APIRouter(prefix="/ml", tags=["AI Surrogate Model"])
pipeline = SurrogateModelPipeline()

@router.post("/train")
def train_surrogate(
    n_samples: int = Query(default=1200, ge=200, le=5000),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    metrics = pipeline.train_and_evaluate(n_samples=n_samples)
    return {
        "status": "SUCCESS",
        "message": "AI Surrogate model trained and evaluated successfully",
        "metrics": metrics
    }

@router.post("/predict")
def predict_cooling(
    features: Dict[str, float],
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    pred_delta_t = pipeline.predict_delta_t(features)
    return {
        "predicted_delta_t_c": round(pred_delta_t, 2),
        "target": "Surface Temperature Reduction ΔT (°C)",
        "model": "LightGBM Surrogate Regressor v1.0"
    }

@router.post("/explain")
def explain_scenario(
    features: Dict[str, float],
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    shap_vals = pipeline.explain_prediction(features)
    return {
        "shap_values": shap_vals,
        "explanation": "SHAP (Shapley Additive exPlanations) attribution showing feature contribution to predicted cooling benefit ΔT."
    }

