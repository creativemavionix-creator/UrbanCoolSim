import numpy as np
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Query

from app.auth.security import get_current_user_optional
from app.models.db_models import User

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin"])



def generate_synthetic_connaught_place_grid(rows: int = 50, cols: int = 50) -> Dict[str, Any]:
    """
    Generates realistic 10m spatial grid for Connaught Place pilot area, New Delhi.
    Includes building height, density, vegetation, water, albedo, and surface heat.
    """
    np.random.seed(42)
    
    # Create radial city structure around central park circle (Connaught Place ring)
    y_coords, x_coords = np.ogrid[:rows, :cols]
    center_y, center_x = rows / 2, cols / 2
    dist_from_center = np.sqrt((x_coords - center_x)**2 + (y_coords - center_y)**2)
    
    # Central Park (Central Green & Water)
    central_park_mask = dist_from_center < 7.0
    inner_ring_mask = (dist_from_center >= 7.0) & (dist_from_center < 16.0)
    outer_dense_mask = dist_from_center >= 16.0
    
    # Building density & height
    bldg_density = np.where(central_park_mask, 0.02, np.where(inner_ring_mask, 0.65, 0.45))
    bldg_density += np.random.uniform(-0.05, 0.05, (rows, cols))
    bldg_density = np.clip(bldg_density, 0.0, 0.85)
    
    bldg_height = np.where(central_park_mask, 0.0, np.where(inner_ring_mask, 28.0, 18.0))
    bldg_height += np.random.uniform(-3.0, 5.0, (rows, cols))
    bldg_height = np.clip(bldg_height, 0.0, 55.0)
    
    # Vegetation & Water
    veg_frac = np.where(central_park_mask, 0.75, np.where(inner_ring_mask, 0.08, 0.18))
    veg_frac += np.random.uniform(-0.03, 0.03, (rows, cols))
    veg_frac = np.clip(veg_frac, 0.0, 0.95)
    
    water_frac = np.where(central_park_mask & (dist_from_center < 3.0), 0.60, 0.01)
    
    # Surface Albedo
    albedo = 0.15 + (1.0 - bldg_density - veg_frac) * 0.08
    albedo = np.clip(albedo, 0.10, 0.35)
    
    # Baseline Surface Temperature field (Hotspots in dense built areas, cool in central park)
    base_t = 38.5 + (bldg_density * 8.5) - (veg_frac * 6.0) - (water_frac * 8.0)
    base_t += np.random.normal(0, 0.4, (rows, cols))
    base_t = np.clip(base_t, 31.0, 48.5)
    
    return {
        "metadata": {
            "name": "Connaught Place Digital Twin Microgrid",
            "location": "New Delhi, India",
            "crs": "EPSG:32643",
            "resolution_m": 10.0,
            "rows": rows,
            "cols": cols,
            "total_cells": rows * cols,
            "is_synthetic": True,
            "tag": "SYNTHETIC DEMO"
        },
        "layers": {
            "building_density": np.round(bldg_density, 3).tolist(),
            "building_height": np.round(bldg_height, 1).tolist(),
            "veg_fraction": np.round(veg_frac, 3).tolist(),
            "water_fraction": np.round(water_frac, 3).tolist(),
            "albedo": np.round(albedo, 3).tolist(),
            "baseline_temperature_c": np.round(base_t, 2).tolist(),
        }
    }

from app.spatial.raster_pipeline import RasterDataPipeline

raster_pipeline = RasterDataPipeline()

@router.get("/grid")
def get_digital_twin_grid(
    rows: int = Query(default=50, ge=10, le=100),
    cols: int = Query(default=50, ge=10, le=100),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if raster_pipeline.has_raw_rasters():
        grid = raster_pipeline.process_satellite_layers(rows=rows, cols=cols)
    else:
        grid = generate_synthetic_connaught_place_grid(rows=rows, cols=cols)
    return grid

@router.get("/inspect-cell")
def inspect_cell(
    row: int = Query(..., ge=0),
    col: int = Query(..., ge=0),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if raster_pipeline.has_raw_rasters():
        grid = raster_pipeline.process_satellite_layers(rows=50, cols=50)
    else:
        grid = generate_synthetic_connaught_place_grid()
    layers = grid["layers"]
    r, c = min(row, 49), min(col, 49)
    
    return {
        "cell_coordinates": {"row": r, "col": c},
        "building_density": layers["building_density"][r][c],
        "building_height_m": layers["building_height"][r][c],
        "vegetation_fraction": layers["veg_fraction"][r][c],
        "water_fraction": layers["water_fraction"][r][c],
        "albedo": layers["albedo"][r][c],
        "baseline_temperature_c": layers["baseline_temperature_c"][r][c],
        "heat_risk_level": "CRITICAL" if layers["baseline_temperature_c"][r][c] > 44.0 else ("HIGH" if layers["baseline_temperature_c"][r][c] > 40.0 else "MODERATE")
    }
