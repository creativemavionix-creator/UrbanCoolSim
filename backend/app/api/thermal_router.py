from typing import Optional
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.security import get_current_user_optional
from app.models.db_models import User, Scenario
from app.schemas.schemas import PhysicsSimulationRequest, SimulationResultResponse
from app.physics.energy_balance import EnergyBalanceSolver
from app.api.digital_twin_router import generate_synthetic_connaught_place_grid

router = APIRouter(prefix="/thermal", tags=["Physics Thermal Simulation"])

@router.post("/simulate", response_model=SimulationResultResponse)
def run_physics_simulation(
    req: PhysicsSimulationRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Fetch scenario parameters if available
    interventions = {}
    if req.scenario_id:
        scen = db.query(Scenario).filter(Scenario.id == req.scenario_id).first()
        if scen and scen.parameters:
            interventions = scen.parameters
            
    grid = generate_synthetic_connaught_place_grid(rows=40, cols=40)
    layers = grid["layers"]
    
    solver = EnergyBalanceSolver(
        solar_rad=req.solar_radiation_wm2,
        air_temp_c=req.air_temperature_c,
        rel_humidity=req.relative_humidity,
        wind_speed=req.wind_speed_ms
    )
    
    grid_inputs = {
        "albedo": np.array(layers["albedo"]),
        "emissivity": 0.95,
        "veg_fraction": np.array(layers["veg_fraction"]),
        "water_fraction": np.array(layers["water_fraction"]),
        "building_height": np.array(layers["building_height"]),
        "building_density": np.array(layers["building_density"]),
        "q_f": req.anthropogenic_heat_wm2
    }
    
    # Run Baseline Simulation
    base_res = solver.solve_grid(grid_inputs, interventions={})
    # Run Scenario Simulation
    scen_res = solver.solve_grid(grid_inputs, interventions=interventions)
    
    base_ts = base_res["T_surface_c"]
    scen_ts = scen_res["T_surface_c"]
    delta_ts = base_ts - scen_ts
    
    base_t_mean = float(np.mean(base_ts))
    scen_t_mean = float(np.mean(scen_ts))
    delta_t_mean = float(np.mean(delta_ts))
    peak_t = float(np.max(scen_ts))
    
    # Energy fluxes spatial means
    fluxes_summary = {
        "Q_star_mean": float(np.mean(scen_res["Q_star"])),
        "Q_f_mean": float(req.anthropogenic_heat_wm2),
        "Q_h_mean": float(np.mean(scen_res["Q_h"])),
        "Q_e_mean": float(np.mean(scen_res["Q_e"])),
        "dQs_mean": float(np.mean(scen_res["dQs"])),
    }
    
    spatial_summary = {
        "min_t_c": float(np.min(scen_ts)),
        "max_t_c": peak_t,
        "p25_t_c": float(np.percentile(scen_ts, 25)),
        "p50_t_c": float(np.median(scen_ts)),
        "p75_t_c": float(np.percentile(scen_ts, 75)),
        "max_cooling_c": float(np.max(delta_ts)),
        "spatial_delta_map": np.round(delta_ts, 2).tolist(),
        "baseline_temp_map": np.round(base_ts, 2).tolist(),
        "scenario_temp_map": np.round(scen_ts, 2).tolist()
    }
    
    provenance = {
        "equation": "Q* + Qf = Qh + Qe + dQs",
        "solver": "NewtonRaphson Surface Energy Balance Solver",
        "units": "°C, W/m²",
        "synthetic_flag": True,
        "is_physics_informed": True
    }
    
    return SimulationResultResponse(
        id="sim_" + req.scenario_id[:8] if req.scenario_id else "sim_default",
        job_id=None,
        scenario_id=req.scenario_id or "scen_baseline",
        baseline_t_mean=round(base_t_mean, 2),
        scenario_t_mean=round(scen_t_mean, 2),
        delta_t_mean=round(delta_t_mean, 2),
        peak_t=round(peak_t, 2),
        heat_risk_reduction=round(delta_t_mean * 15.0, 1),
        energy_fluxes_json=fluxes_summary,
        spatial_summary=spatial_summary,
        provenance=provenance,
        created_at=np.datetime64('now').astype(str)
    )
