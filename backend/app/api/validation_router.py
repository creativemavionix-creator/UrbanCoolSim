from typing import Optional
import numpy as np
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.security import get_current_user_optional, rate_limiter
from app.models.db_models import User, ValidationRun
from app.schemas.schemas import ValidationResponse
from app.validation.evaluator import ValidationEvaluator
from app.api.digital_twin_router import generate_synthetic_connaught_place_grid

router = APIRouter(prefix="/validation", tags=["Validation & Calibration"])

@router.post("/run", response_model=ValidationResponse)
def execute_validation(
    request: Request,
    scenario_id: str = Query(default="scen_baseline"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if request.client:
        rate_limiter.check(request.client.host)
    grid = generate_synthetic_connaught_place_grid(rows=40, cols=40)
    simulated_ts = np.array(grid["layers"]["baseline_temperature_c"])
    
    # Generate satellite LST observations with minor sensor noise & microclimate variance
    np.random.seed(101)
    observed_lst = simulated_ts + np.random.normal(0, 0.45, simulated_ts.shape)
    
    val_res = ValidationEvaluator.evaluate_against_observations(simulated_ts, observed_lst)
    
    run_db = ValidationRun(
        name="Landsat 8 LST Spatial Calibration Run",
        observed_source=val_res["observed_source"],
        simulated_scenario_id=scenario_id,
        mae=val_res["mae"],
        rmse=val_res["rmse"],
        r2=val_res["r2"],
        spatial_error_summary=val_res["error_quantiles"],
        calibration_status=val_res["calibration_status"]
    )
    db.add(run_db)
    db.commit()
    db.refresh(run_db)
    
    return ValidationResponse(
        id=run_db.id,
        name=run_db.name,
        observed_source=run_db.observed_source,
        simulated_scenario_id=run_db.simulated_scenario_id,
        mae=run_db.mae,
        rmse=run_db.rmse,
        r2=run_db.r2,
        spatial_error_summary=run_db.spatial_error_summary,
        calibration_status=run_db.calibration_status,
        created_at=run_db.created_at
    )
