from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None
    role: Optional[str] = "planner"

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# --- Study Area Schemas ---
class StudyAreaCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location_name: str = "Connaught Place, New Delhi"
    crs: str = "EPSG:32643"
    resolution_m: float = 10.0
    grid_rows: int = 50
    grid_cols: int = 50

class StudyAreaResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    location_name: str
    crs: str
    resolution_m: float
    grid_rows: int
    grid_cols: int
    is_synthetic: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Intervention & Scenario Schemas ---
class InterventionParameters(BaseModel):
    green_roof_coverage: float = Field(default=0.0, ge=0.0, le=1.0)       # 0.0 - 1.0 fraction of building roofs
    cool_roof_albedo_boost: float = Field(default=0.0, ge=0.0, le=0.6)    # Albedo increment (e.g. +0.3)
    cool_roof_coverage: float = Field(default=0.0, ge=0.0, le=1.0)
    tree_canopy_addition: float = Field(default=0.0, ge=0.0, le=0.5)      # Fractional canopy increase per cell
    reflective_pavement_albedo: float = Field(default=0.0, ge=0.0, le=0.4) # Albedo increment on pavement
    water_feature_fraction: float = Field(default=0.0, ge=0.0, le=0.3)    # Water fraction added
    wetness_factor: float = Field(default=0.0, ge=0.0, le=1.0)             # Evapotranspiration moisture availability

class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = None
    scenario_type: str = "custom"  # baseline, green_roofs, cool_roofs, tree_canopy, water_features, hybrid, custom
    parameters: InterventionParameters
    study_area_id: str

class ScenarioResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    scenario_type: str
    parameters: Dict[str, Any]
    is_baseline: bool
    study_area_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Physics Simulation Request & Result Schemas ---
class PhysicsSimulationRequest(BaseModel):
    scenario_id: str
    grid_resolution_m: float = 10.0
    air_temperature_c: float = 38.5      # Baseline Delhi summer peak ambient air temp
    relative_humidity: float = 0.45       # Relative humidity (0.0 - 1.0)
    wind_speed_ms: float = 2.5            # Wind speed m/s
    solar_radiation_wm2: float = 850.0    # Peak solar irradiance W/m²
    anthropogenic_heat_wm2: float = 35.0  # Qf baseline traffic/AC heat

class SimulationResultResponse(BaseModel):
    id: str
    job_id: Optional[str]
    scenario_id: str
    baseline_t_mean: float
    scenario_t_mean: float
    delta_t_mean: float
    peak_t: float
    heat_risk_reduction: float
    energy_fluxes_json: Dict[str, Any]
    spatial_summary: Dict[str, Any]
    provenance: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Optimization Schemas ---
class OptimizationRequest(BaseModel):
    study_area_id: str = "delhi_cp"
    max_budget_usd: float = 500000.0
    max_water_demand_m3: float = 10000.0
    max_land_area_m2: float = 50000.0
    target_cooling_c: float = 2.5
    weight_cooling: float = 0.35
    weight_cost: float = 0.25
    weight_population: float = 0.20
    weight_water: float = 0.10
    weight_energy: float = 0.10
    min_cool_roof_reflectance: float = 0.70
    max_tree_area_pct: float = 0.35
    population_size: int = 40
    n_gen: int = 30

class ParetoSolution(BaseModel):
    solution_id: int
    green_roof_pct: float
    cool_roof_pct: float
    tree_canopy_pct: float
    water_pct: float
    delta_t_mean: float
    total_cost_usd: float
    water_demand_m3: float
    land_area_m2: float
    heat_risk_score: float
    hvac_energy_savings_kwh: Optional[float] = None
    electricity_cost_savings_usd: Optional[float] = None
    co2_avoided_tons: Optional[float] = None
    payback_period_years: Optional[float] = None
    composite_score: Optional[float] = None
    physics_validated: bool = True
    validated_delta_t: Optional[float] = None
    validation_error: Optional[float] = None

class OptimizationResponse(BaseModel):
    id: str
    name: str
    objectives: List[str]
    constraints: Dict[str, Any]
    weights: Optional[Dict[str, float]] = None
    pareto_solutions: List[ParetoSolution]
    recommended_solution: ParetoSolution
    physics_validated: bool
    created_at: datetime

# --- Validation Schemas ---
class ValidationResponse(BaseModel):
    id: str
    name: str
    observed_source: str
    simulated_scenario_id: Optional[str]
    mae: float
    rmse: float
    r2: float
    spatial_error_summary: Dict[str, Any]
    calibration_status: str
    created_at: datetime

# --- Report Schemas ---
class ReportCreate(BaseModel):
    title: str
    study_area_id: str
    scenario_id: Optional[str] = None
    optimization_run_id: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    title: str
    summary: Optional[str]
    markdown_content: str
    pdf_path: Optional[str]
    created_at: datetime
