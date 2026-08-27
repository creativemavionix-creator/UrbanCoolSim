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
    grid_resolution_m: float = Field(default=10.0, ge=1.0, le=100.0)
    air_temperature_c: float = Field(default=38.5, ge=-20.0, le=65.0)       # Ambient air temp (°C)
    relative_humidity: float = Field(default=0.45, ge=0.01, le=1.0)          # Relative humidity (0.01 - 1.0)
    wind_speed_ms: float = Field(default=2.5, ge=0.1, le=50.0)               # Wind speed m/s (min 0.1 to avoid zero division)
    solar_radiation_wm2: float = Field(default=850.0, ge=0.0, le=1400.0)     # Peak solar irradiance W/m²
    anthropogenic_heat_wm2: float = Field(default=35.0, ge=0.0, le=500.0)    # Qf baseline traffic/AC heat

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
    max_budget_usd: float = Field(default=500000.0, ge=1000.0, le=100000000.0)
    max_water_demand_m3: float = Field(default=10000.0, ge=0.0, le=1000000.0)
    max_land_area_m2: float = Field(default=50000.0, ge=0.0, le=10000000.0)
    target_cooling_c: float = Field(default=2.5, ge=0.0, le=15.0)
    weight_cooling: float = Field(default=0.35, ge=0.0, le=1.0)
    weight_cost: float = Field(default=0.25, ge=0.0, le=1.0)
    weight_population: float = Field(default=0.20, ge=0.0, le=1.0)
    weight_water: float = Field(default=0.10, ge=0.0, le=1.0)
    weight_energy: float = Field(default=0.10, ge=0.0, le=1.0)
    min_cool_roof_reflectance: float = Field(default=0.70, ge=0.10, le=0.95)
    max_tree_area_pct: float = Field(default=0.35, ge=0.0, le=0.90)
    population_size: int = Field(default=40, ge=10, le=200)                  # Capped to prevent CPU exhaustion
    n_gen: int = Field(default=30, ge=5, le=100)                             # Capped to prevent CPU exhaustion

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
