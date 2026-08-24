from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.auth.security import get_current_user_optional
from app.models.db_models import User, Scenario, StudyArea
from app.schemas.schemas import ScenarioCreate, ScenarioResponse
from app.interventions.engine import InterventionEngine

router = APIRouter(prefix="/scenarios", tags=["Scenarios & Interventions"])

@router.post("", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
def create_scenario(
    scen_in: ScenarioCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    scen = Scenario(
        name=scen_in.name,
        description=scen_in.description,
        scenario_type=scen_in.scenario_type,
        parameters=scen_in.parameters.model_dump(),
        study_area_id=scen_in.study_area_id,
        is_baseline=(scen_in.scenario_type == "baseline")
    )
    db.add(scen)
    db.commit()
    db.refresh(scen)
    return scen

@router.get("", response_model=List[ScenarioResponse])
def list_scenarios(
    study_area_id: str = "default_delhi",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    scenarios = db.query(Scenario).all()
    if not scenarios:
        # Seed standard predefined pilot scenarios
        baseline = Scenario(
            id="scen_baseline", name="Baseline Current State",
            description="Existing Connaught Place urban geometry without interventions",
            scenario_type="baseline", parameters={}, is_baseline=True, study_area_id=study_area_id
        )
        green_roofs = Scenario(
            id="scen_green_roofs", name="Green Roofs Infrastructure Initiative",
            description="Convert 50% of suitable commercial rooftops to extensive green roofs",
            scenario_type="green_roofs",
            parameters={"green_roof_coverage": 0.50, "wetness_factor": 0.60},
            is_baseline=False, study_area_id=study_area_id
        )
        cool_pave = Scenario(
            id="scen_cool_pave", name="High-Albedo Reflective Pavement & Cool Roofs",
            description="Apply cool reflective coatings (+0.3 albedo) to roofs and parking corridors",
            scenario_type="cool_roofs",
            parameters={"cool_roof_albedo_boost": 0.30, "reflective_pavement_albedo": 0.20, "cool_roof_coverage": 0.60},
            is_baseline=False, study_area_id=study_area_id
        )
        canopy = Scenario(
            id="scen_tree_canopy", name="Urban Tree Canopy & Shading Network",
            description="Expand street-level tree canopy density by 25% across walking corridors",
            scenario_type="tree_canopy",
            parameters={"tree_canopy_addition": 0.25, "wetness_factor": 0.50},
            is_baseline=False, study_area_id=study_area_id
        )
        hybrid = Scenario(
            id="scen_hybrid_cp", name="Connaught Place Optimal Hybrid Resiliency Portfolio",
            description="Combined 35% Green Roofs + 25% Cool Roofs + 20% Canopy + 5% Water misting",
            scenario_type="hybrid",
            parameters={
                "green_roof_coverage": 0.35,
                "cool_roof_albedo_boost": 0.25,
                "cool_roof_coverage": 0.25,
                "tree_canopy_addition": 0.20,
                "water_feature_fraction": 0.05,
                "wetness_factor": 0.55
            },
            is_baseline=False, study_area_id=study_area_id
        )
        db.add_all([baseline, green_roofs, cool_pave, canopy, hybrid])
        db.commit()
        scenarios = db.query(Scenario).all()
        
    return scenarios
