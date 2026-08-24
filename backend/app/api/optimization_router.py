from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import datetime

from app.database import get_db
from app.auth.security import get_current_user_optional
from app.models.db_models import User, OptimizationRun
from app.schemas.schemas import OptimizationRequest, OptimizationResponse
from app.optimization.pareto_optimizer import run_multi_objective_optimization

router = APIRouter(prefix="/optimization", tags=["Multi-Objective Optimization"])

@router.post("/run", response_model=OptimizationResponse)
def execute_optimization(
    req: OptimizationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    res = run_multi_objective_optimization(
        max_budget_usd=req.max_budget_usd,
        max_water_m3=req.max_water_demand_m3,
        max_land_m2=req.max_land_area_m2,
        pop_size=req.population_size,
        n_gen=req.n_gen
    )
    
    run_db = OptimizationRun(
        id=str(uuid.uuid4()),
        name=f"Optimization - Budget ${req.max_budget_usd:,.0f}",
        objectives=res["objectives"],
        constraints=res["constraints"],
        pareto_solutions=res["pareto_solutions"],
        recommended_solution=res["recommended_solution"],
        study_area_id=req.study_area_id,
        physics_validated=True
    )
    db.add(run_db)
    db.commit()
    db.refresh(run_db)
    
    return OptimizationResponse(
        id=run_db.id,
        name=run_db.name,
        objectives=run_db.objectives,
        constraints=run_db.constraints,
        pareto_solutions=run_db.pareto_solutions,
        recommended_solution=run_db.recommended_solution,
        physics_validated=True,
        created_at=run_db.created_at
    )
