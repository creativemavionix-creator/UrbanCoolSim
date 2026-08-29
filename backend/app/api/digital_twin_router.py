import numpy as np
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, Query

from app.auth.security import get_current_user_optional
from app.models.db_models import User
from app.spatial.raster_pipeline import RasterDataPipeline

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin"])

raster_pipeline = RasterDataPipeline()

STUDY_AREAS_METADATA = [
    {
        "id": "delhi_cp",
        "name": "Connaught Place Radial District",
        "city": "New Delhi",
        "country": "India",
        "crs": "EPSG:32643",
        "resolution_m": 10.0,
        "typology": "commercial_radial",
        "description": "Dense concentric commercial ring around Central Park, high thermal inertia asphalt roadways.",
        "center_lat": 28.6328,
        "center_lon": 77.2197,
        "base_climate": {
            "air_temp_c": 42.0,
            "solar_rad_wm2": 920.0,
            "rel_humidity": 0.35,
            "wind_speed_ms": 2.2,
            "q_f_wm2": 45.0
        }
    },
    {
        "id": "mumbai_bkc",
        "name": "Bandra Kurla Complex (BKC)",
        "city": "Mumbai",
        "country": "India",
        "crs": "EPSG:32643",
        "resolution_m": 10.0,
        "typology": "coastal_commercial",
        "description": "High-rise financial district with Mithi River corridor, high humidity and low surface albedo.",
        "center_lat": 19.0657,
        "center_lon": 72.8683,
        "base_climate": {
            "air_temp_c": 36.5,
            "solar_rad_wm2": 840.0,
            "rel_humidity": 0.75,
            "wind_speed_ms": 3.8,
            "q_f_wm2": 50.0
        }
    },
    {
        "id": "singapore_marina",
        "name": "Marina Bay Financial District",
        "city": "Singapore",
        "country": "Singapore",
        "crs": "EPSG:32648",
        "resolution_m": 10.0,
        "typology": "tropical_waterfront",
        "description": "Equatorial high-rise waterfront with integrated park connectors, tropical humidity and water cooling.",
        "center_lat": 1.2847,
        "center_lon": 103.8565,
        "base_climate": {
            "air_temp_c": 33.0,
            "solar_rad_wm2": 880.0,
            "rel_humidity": 0.82,
            "wind_speed_ms": 2.8,
            "q_f_wm2": 40.0
        }
    },
    {
        "id": "phoenix_downtown",
        "name": "Downtown Urban Core",
        "city": "Phoenix, AZ",
        "country": "USA",
        "crs": "EPSG:32612",
        "resolution_m": 10.0,
        "typology": "arid_desert_grid",
        "description": "Low-humidity arid desert grid with intense solar radiation, wide asphalt streets and high night heat retention.",
        "center_lat": 33.4484,
        "center_lon": -112.0740,
        "base_climate": {
            "air_temp_c": 45.0,
            "solar_rad_wm2": 1020.0,
            "rel_humidity": 0.18,
            "wind_speed_ms": 2.0,
            "q_f_wm2": 55.0
        }
    },
    {
        "id": "tokyo_shinjuku",
        "name": "Shinjuku Skyscraper Center",
        "city": "Tokyo",
        "country": "Japan",
        "crs": "EPSG:32654",
        "resolution_m": 10.0,
        "typology": "hyperdense_canyon",
        "description": "Extreme building heights, complex 3D urban canyons, high anthropogenic HVAC heat release.",
        "center_lat": 35.6938,
        "center_lon": 139.7034,
        "base_climate": {
            "air_temp_c": 35.5,
            "solar_rad_wm2": 860.0,
            "rel_humidity": 0.68,
            "wind_speed_ms": 2.4,
            "q_f_wm2": 65.0
        }
    }
]


def generate_study_area_grid(study_area_id: str = "delhi_cp", rows: int = 50, cols: int = 50) -> Dict[str, Any]:
    """
    Generates high-fidelity 10m spatial microgrids for chosen study area archetypes,
    accurately aligned with real-world satellite features, water bodies, road corridors,
    building clusters, and tree canopy foliage.
    """
    np.random.seed(abs(hash(study_area_id)) % 100000 + 42)
    meta = next((s for s in STUDY_AREAS_METADATA if s["id"] == study_area_id), STUDY_AREAS_METADATA[0])
    
    y_coords, x_coords = np.ogrid[:rows, :cols]
    center_y, center_x = rows / 2.0, cols / 2.0
    dist_from_center = np.sqrt((x_coords - center_x)**2 + (y_coords - center_y)**2)
    
    # Initialize arrays
    bldg_density = np.zeros((rows, cols), dtype=float)
    bldg_height = np.zeros((rows, cols), dtype=float)
    veg_frac = np.zeros((rows, cols), dtype=float)
    water_frac = np.zeros((rows, cols), dtype=float)
    canopy_height = np.zeros((rows, cols), dtype=float)
    albedo = np.full((rows, cols), 0.18, dtype=float)
    base_t = np.full((rows, cols), 36.0, dtype=float)

    if study_area_id == "delhi_cp":
        # Connaught Place (Rajiv Chowk), New Delhi
        # True Central Park is a circular park of radius ~115m (11.5 cells)
        central_park_mask = dist_from_center <= 11.5
        central_fountain = dist_from_center <= 2.5
        
        # 8 Real Radial Avenues in CP (only outside Central Park dist >= 11.5):
        # Janpath, Barakhamba, KG Marg, Sansad Marg, Baba Kharak Singh, Panchkuian, Chelmsford, Minto
        # Measured in math angle from center (y downward)
        angles = np.arctan2(y_coords - center_y, x_coords - center_x)
        cp_spoke_angles = [
            0.0,    # Barakhamba Rd (Due East)
            0.55,   # KG Marg (East-South-East)
            1.57,   # Janpath (Due South)
            2.20,   # Sansad Marg / Parliament St (South-South-West)
            2.85,   # Baba Kharak Singh Marg (West-South-West)
            -2.65,  # Panchkuian Marg (West-North-West)
            -1.85,  # Chelmsford Rd / State Entry Rd (North-North-West)
            -0.75,  # Minto Rd (East-North-East)
        ]
        
        radial_spokes = np.zeros((rows, cols), dtype=bool)
        for sa in cp_spoke_angles:
            angle_diff = np.abs((angles - sa + np.pi) % (2 * np.pi) - np.pi)
            radial_spokes |= (angle_diff < 0.10) & (dist_from_center >= 11.5)

        # Concentric Rings:
        # 1. Inner Circle Road (11.5 to 14.5)
        inner_circle_road = (dist_from_center > 11.5) & (dist_from_center < 14.5)
        # 2. Inner Circle Colonnade Blocks A-F (14.5 to 19.5)
        inner_circle_bldgs = (dist_from_center >= 14.5) & (dist_from_center < 19.5) & ~radial_spokes
        # 3. Middle Circle Road (19.5 to 21.5)
        middle_circle_road = (dist_from_center >= 19.5) & (dist_from_center < 21.5)
        # 4. Outer Circle Colonnade Blocks G-P (21.5 to 26.5)
        outer_circle_bldgs = (dist_from_center >= 21.5) & (dist_from_center < 26.5) & ~radial_spokes
        # 5. Connaught Circus Outer Road (26.5 to 28.5)
        outer_circus_road = (dist_from_center >= 26.5) & (dist_from_center < 28.5)
        # 6. Surrounding High-Rises & Commercial Blocks (28.5+)
        surrounding_blocks = (dist_from_center >= 28.5) & ~radial_spokes

        all_roads = inner_circle_road | middle_circle_road | outer_circus_road | radial_spokes

        # 1. Buildings (Strictly masonry colonnade & high-rise blocks, 0 canopy on roofs)
        bldg_density[inner_circle_bldgs] = 0.82
        bldg_height[inner_circle_bldgs] = 22.0
        bldg_density[outer_circle_bldgs] = 0.80
        bldg_height[outer_circle_bldgs] = 26.0
        bldg_density[surrounding_blocks] = 0.68
        bldg_height[surrounding_blocks] = 42.0

        # 2. Central Park (Full 115m radius lush park with mature tree canopy)
        veg_frac[central_park_mask] = 0.92
        canopy_height[central_park_mask] = np.clip(16.0 + np.random.normal(0, 2.2, np.sum(central_park_mask)), 9.0, 24.0)
        
        # Central fountain / pool
        water_frac[central_fountain] = 0.88
        veg_frac[central_fountain] = 0.05
        canopy_height[central_fountain] = 0.0
        bldg_density[central_park_mask] = 0.0
        bldg_height[central_park_mask] = 0.0

        # 3. Roadside Avenue Tree Verges (along inner circle verge & radial avenues)
        avenue_verges = ((dist_from_center >= 12.0) & (dist_from_center < 13.0)) | \
                        ((dist_from_center >= 14.0) & (dist_from_center < 28.0) & radial_spokes & (np.abs(angles % 0.25) < 0.04))
        veg_frac[avenue_verges] = 0.48
        canopy_height[avenue_verges] = np.clip(12.0 + np.random.normal(0, 1.8, np.sum(avenue_verges)), 6.0, 17.0)

        # 4. Road lanes (strictly 0 canopy, low albedo asphalt)
        road_lanes = all_roads & ~avenue_verges
        albedo[road_lanes] = 0.10
        albedo[central_park_mask] = 0.24
        albedo[inner_circle_bldgs | outer_circle_bldgs] = 0.22

        # 5. Baseline Temperature: Cool oasis in Central Park, warm heat on asphalt & built rings
        base_t = 37.5 + (bldg_density * 8.2) + np.where(road_lanes, 3.8, 0.0) - (veg_frac * 6.8) - (water_frac * 7.5)

    elif study_area_id == "mumbai_bkc":
        # Bandra Kurla Complex (BKC), Mumbai
        # Real geography: Mithi River curves on the EAST (x_coords > 38) and loops north-east/south-east
        river_channel = (x_coords >= 38) | ((y_coords <= 8) & (x_coords >= 30)) | ((y_coords >= 42) & (x_coords >= 32))
        river_banks = (x_coords >= 34) & (x_coords < 38) & ~river_channel

        # BKC Commercial Core (G-Block, ICICI, NSE, BDB, Maker Maxity, Asian Heart)
        bkc_highrise_core = (x_coords >= 12) & (x_coords <= 33) & (y_coords >= 10) & (y_coords <= 40)
        
        # Real BKC Urban Parks & Green Spaces:
        # 1. Jio World Garden / City Park (centered around cols 24-30, rows 16-23)
        jio_garden = (x_coords >= 24) & (x_coords <= 30) & (y_coords >= 16) & (y_coords <= 23)
        # 2. BKC Urban Nature Park / G-Block Green Verge (cols 14-19, rows 31-36)
        bkc_green_park = (x_coords >= 14) & (x_coords <= 19) & (y_coords >= 31) & (y_coords <= 36)
        # 3. Main Arterial Avenue (BKC Main Road connecting West to East)
        bkc_main_road = (y_coords >= 24) & (y_coords <= 26) & (x_coords >= 4) & (x_coords <= 36)
        # 4. Avenue street tree verges along BKC Main Road
        street_trees = ((y_coords == 23) | (y_coords == 27)) & (x_coords >= 8) & (x_coords <= 34)

        # Western commercial / Kalanagar approach
        western_approach = (x_coords < 12) & ~river_channel

        # Apply building footprints (excluding parks, river, and roads)
        bldg_mask = (bkc_highrise_core | western_approach) & ~jio_garden & ~bkc_green_park & ~bkc_main_road & ~street_trees
        bldg_density[bldg_mask] = np.where(bkc_highrise_core[bldg_mask], 0.74, 0.48)
        bldg_height[bldg_mask] = np.where(bkc_highrise_core[bldg_mask], 48.0, 24.0)

        # Mithi River (Pure Water - strictly 0 canopy, 0 buildings)
        water_frac[river_channel] = 0.96
        bldg_density[river_channel] = 0.0
        bldg_height[river_channel] = 0.0
        veg_frac[river_channel] = 0.0
        canopy_height[river_channel] = 0.0

        # Riverbank Mangrove Fringe
        veg_frac[river_banks] = 0.72
        canopy_height[river_banks] = np.clip(10.0 + np.random.normal(0, 1.8, np.sum(river_banks)), 4.0, 15.0)

        # Jio Garden & BKC Urban Parks (Lush Lawn + Tall Canopy Trees)
        park_mask = jio_garden | bkc_green_park
        veg_frac[park_mask] = 0.86
        canopy_height[park_mask] = np.clip(16.0 + np.random.normal(0, 2.2, np.sum(park_mask)), 8.0, 22.0)
        bldg_density[park_mask] = 0.02
        bldg_height[park_mask] = 0.0

        # Street Tree Avenues
        veg_frac[street_trees] = 0.52
        canopy_height[street_trees] = np.clip(12.0 + np.random.normal(0, 1.5, np.sum(street_trees)), 6.0, 16.0)

        # Road lanes & concrete plazas (strictly 0 canopy)
        albedo[river_channel] = 0.06
        albedo[bkc_main_road] = 0.11
        albedo[park_mask] = 0.24
        albedo[bldg_mask] = 0.16

        base_t = 34.0 + (bldg_density * 7.5) + np.where(bkc_main_road, 3.2, 0.0) - (veg_frac * 5.2) - (water_frac * 6.5)

    elif study_area_id == "singapore_marina":
        # Marina Bay Financial District & Gardens by the Bay
        # Center-West: Marina Bay open water body
        marina_bay = (x_coords < 22) & (y_coords >= 8) & (y_coords <= 42)
        # East / South-East: Gardens by the Bay (Supertree Grove, Cloud Forest)
        gardens_by_the_bay = (x_coords >= 28) & (y_coords >= 18)
        # West & North-West: Raffles Place / Downtown High-Rise Core
        cbd_highrises = (x_coords < 18) & ((y_coords < 8) | (y_coords > 42)) | ((x_coords >= 18) & (x_coords <= 27) & (y_coords < 16))
        # Marina Bay Sands Waterfront strip
        mbs_towers = (x_coords >= 23) & (x_coords <= 27) & (y_coords >= 18) & (y_coords <= 36)
        # Park connector tree corridors
        park_connectors = ((x_coords == 22) | (x_coords == 28)) & (y_coords >= 8) & (y_coords <= 40)

        # Marina Bay Water Body
        water_frac[marina_bay] = 0.98
        bldg_density[marina_bay] = 0.0
        bldg_height[marina_bay] = 0.0
        veg_frac[marina_bay] = 0.0
        canopy_height[marina_bay] = 0.0

        # Gardens by the Bay (Extremely lush tropical canopy)
        veg_frac[gardens_by_the_bay] = 0.92
        canopy_height[gardens_by_the_bay] = np.clip(18.0 + np.random.normal(0, 2.5, np.sum(gardens_by_the_bay)), 10.0, 25.0)
        bldg_density[gardens_by_the_bay] = 0.04
        bldg_height[gardens_by_the_bay] = 6.0

        # CBD High-Rise Core
        bldg_density[cbd_highrises] = 0.78
        bldg_height[cbd_highrises] = 76.0
        bldg_density[mbs_towers] = 0.68
        bldg_height[mbs_towers] = 65.0

        # Tree connectors
        veg_frac[park_connectors] = 0.65
        canopy_height[park_connectors] = np.clip(14.0 + np.random.normal(0, 1.8, np.sum(park_connectors)), 7.0, 19.0)

        albedo[marina_bay] = 0.06
        albedo[gardens_by_the_bay] = 0.25
        albedo[cbd_highrises | mbs_towers] = 0.19

        base_t = 31.0 + (bldg_density * 6.2) - (veg_frac * 4.8) - (water_frac * 5.8)

    elif study_area_id == "phoenix_downtown":
        # Downtown Phoenix Arid Desert Grid
        grid_roads = (x_coords % 8 == 0) | (y_coords % 8 == 0)
        # Margaret T. Hance Park (East-West green corridor on North, rows 5-10, cols 8-42)
        hance_park = (y_coords >= 5) & (y_coords <= 10) & (x_coords >= 8) & (x_coords <= 42)
        # Commercial Core Blocks
        core_blocks = (x_coords >= 12) & (x_coords <= 38) & (y_coords >= 14) & (y_coords <= 38) & ~grid_roads

        bldg_density[core_blocks] = 0.62
        bldg_height[core_blocks] = 38.0
        
        # Park green space
        veg_frac[hance_park] = 0.75
        canopy_height[hance_park] = np.clip(12.0 + np.random.normal(0, 2.0, np.sum(hance_park)), 6.0, 18.0)
        bldg_density[hance_park] = 0.02
        bldg_height[hance_park] = 0.0

        # Irrigated streetscape trees
        street_trees = grid_roads & ((x_coords >= 10) & (x_coords <= 40) & (y_coords >= 10) & (y_coords <= 40)) & ((x_coords % 8 == 1) | (y_coords % 8 == 1))
        veg_frac[street_trees] = 0.35
        canopy_height[street_trees] = np.clip(8.0 + np.random.normal(0, 1.2, np.sum(street_trees)), 4.0, 12.0)

        # Wide asphalt streets & unshaded surface parking lots
        asphalt_parking = ~core_blocks & ~hance_park & ~grid_roads & (np.random.uniform(0, 1, (rows, cols)) > 0.6)
        albedo[grid_roads | asphalt_parking] = 0.10
        albedo[hance_park] = 0.22
        albedo[core_blocks] = 0.19

        base_t = 41.5 + (bldg_density * 8.5) + np.where(grid_roads | asphalt_parking, 4.5, 0.0) - (veg_frac * 5.5)

    else:  # tokyo_shinjuku
        # Shinjuku Skyscraper Center & Shinjuku Central Park
        # West: Shinjuku Central Park (cols 6-13, rows 16-36)
        shinjuku_park = (x_coords >= 6) & (x_coords <= 13) & (y_coords >= 16) & (y_coords <= 36)
        # Center-West: Skyscraper Core (TMG Bldg, Sumitomo, Park Hyatt, cols 15-25, rows 12-40)
        skyscraper_core = (x_coords >= 15) & (x_coords <= 25) & (y_coords >= 12) & (y_coords <= 40)
        # Center: Shinjuku Station & Massive Multi-Track Rail Corridor (cols 27-32)
        rail_corridor = (x_coords >= 27) & (x_coords <= 32)
        # East: Kabukicho Hyperdense Entertainment District (cols 34-45, rows 10-38)
        kabukicho = (x_coords >= 34) & (x_coords <= 45) & (y_coords >= 10) & (y_coords <= 38)
        # Canyon streets
        canyon_roads = (x_coords % 6 == 0) | (y_coords % 6 == 0)

        # Park foliage
        veg_frac[shinjuku_park] = 0.88
        canopy_height[shinjuku_park] = np.clip(17.0 + np.random.normal(0, 2.2, np.sum(shinjuku_park)), 9.0, 24.0)
        bldg_density[shinjuku_park] = 0.01
        bldg_height[shinjuku_park] = 0.0

        # Skyscraper towers
        bldg_density[skyscraper_core & ~canyon_roads] = 0.82
        bldg_height[skyscraper_core & ~canyon_roads] = 92.0

        # Kabukicho dense low/mid-rise canyon
        bldg_density[kabukicho & ~canyon_roads] = 0.76
        bldg_height[kabukicho & ~canyon_roads] = 32.0

        # Rail corridor
        albedo[rail_corridor] = 0.11
        albedo[shinjuku_park] = 0.24
        albedo[skyscraper_core] = 0.20

        base_t = 34.5 + (bldg_density * 8.2) + np.where(rail_corridor, 3.8, 0.0) - (veg_frac * 4.8)

    # Physical Consistency & Noise
    bldg_density = np.clip(bldg_density, 0.0, 0.95)
    bldg_height = np.clip(bldg_height, 0.0, 115.0)
    veg_frac = np.clip(veg_frac, 0.0, 0.98)
    water_frac = np.clip(water_frac, 0.0, 1.0)
    canopy_height = np.where(veg_frac > 0.05, canopy_height, 0.0)
    canopy_height = np.clip(canopy_height, 0.0, 25.0)
    albedo = np.clip(albedo, 0.06, 0.40)

    # Derived NASA GEDI / WorldPop / VIIRS layers
    lai = np.clip(veg_frac * (canopy_height / 3.4), 0.0, 6.0)
    pop_density = np.clip(bldg_density * (480.0 if study_area_id in ["tokyo_shinjuku", "mumbai_bkc"] else 290.0) + np.random.normal(0, 10, (rows, cols)), 0.0, 680.0)
    pop_density = np.where(water_frac > 0.3, 0.0, pop_density)
    
    qf_anthro = np.clip(bldg_density * (meta["base_climate"]["q_f_wm2"] * 1.35) + np.random.normal(0, 1.5, (rows, cols)), 0.0, 95.0)
    qf_anthro = np.where(water_frac > 0.3, 0.0, qf_anthro)
    
    emissivity = np.clip(0.92 + (veg_frac * 0.06) + (water_frac * 0.06) - (bldg_density * 0.03), 0.88, 0.98)
    canyon_width = 18.0 if study_area_id == "tokyo_shinjuku" else 24.0
    svf = np.clip(np.cos(np.arctan(2.0 * bldg_height / canyon_width)), 0.12, 0.98)
    base_t = np.clip(base_t + np.random.normal(0, 0.25, (rows, cols)), 25.0, 52.0)
    
    return {
        "metadata": {
            "study_area_id": meta["id"],
            "name": meta["name"],
            "city": meta["city"],
            "country": meta["country"],
            "location": f"{meta['city']}, {meta['country']}",
            "crs": meta["crs"],
            "resolution_m": meta["resolution_m"],
            "rows": rows,
            "cols": cols,
            "total_cells": rows * cols,
            "typology": meta["typology"],
            "center_lat": meta["center_lat"],
            "center_lon": meta["center_lon"],
            "base_climate": meta["base_climate"],
            "is_synthetic": True,
            "tag": "MULTI-SOURCE SATELLITE TWIN",
            "sources": [
                "Landsat 8/9 Collection 2 Level-2 LST",
                "Sentinel-2 MSI Level-2A BOA Reflectance",
                "Google Open Buildings V3 / GHSL 3D Heights",
                "NASA GEDI L2A/L2B Canopy Heights & LAI",
                "WorldPop 100m Demographic Exposure",
                "VIIRS VNP46A2 Nighttime Lights (Anthropogenic Qf)",
                "ASTER Global Emissivity Dataset (ASTER GED V4)",
                "Copernicus DEM GLO-30 & Sky View Factor"
            ]
        },
        "layers": {
            "building_density": np.round(bldg_density, 3).tolist(),
            "building_height": np.round(bldg_height, 1).tolist(),
            "veg_fraction": np.round(veg_frac, 3).tolist(),
            "water_fraction": np.round(water_frac, 3).tolist(),
            "albedo": np.round(albedo, 3).tolist(),
            "baseline_temperature_c": np.round(base_t, 2).tolist(),
            "canopy_height": np.round(canopy_height, 1).tolist(),
            "population_density": np.round(pop_density, 1).tolist(),
            "anthropogenic_heat_qf": np.round(qf_anthro, 1).tolist(),
            "surface_emissivity": np.round(emissivity, 3).tolist(),
            "sky_view_factor": np.round(svf, 3).tolist(),
            "lai": np.round(lai, 2).tolist(),
        }
    }


def generate_synthetic_connaught_place_grid(rows: int = 50, cols: int = 50) -> Dict[str, Any]:
    """Backward compatibility alias for generate_study_area_grid('delhi_cp')."""
    return generate_study_area_grid(study_area_id="delhi_cp", rows=rows, cols=cols)


@router.get("/study-areas")
def get_available_study_areas():
    """Returns all 5 multi-city digital twin archetypes with metadata and climate baselines."""
    return STUDY_AREAS_METADATA


@router.get("/grid")
def get_digital_twin_grid(
    study_area_id: str = Query(default="delhi_cp"),
    rows: int = Query(default=50, ge=10, le=100),
    cols: int = Query(default=50, ge=10, le=100),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if study_area_id == "delhi_cp" and raster_pipeline.has_raw_rasters():
        grid = raster_pipeline.process_satellite_layers(rows=rows, cols=cols)
    else:
        grid = generate_study_area_grid(study_area_id=study_area_id, rows=rows, cols=cols)
    return grid


@router.get("/inspect-cell")
def inspect_cell(
    study_area_id: str = Query(default="delhi_cp"),
    row: int = Query(..., ge=0),
    col: int = Query(..., ge=0),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if study_area_id == "delhi_cp" and raster_pipeline.has_raw_rasters():
        grid = raster_pipeline.process_satellite_layers(rows=50, cols=50)
    else:
        grid = generate_study_area_grid(study_area_id=study_area_id, rows=50, cols=50)
        
    layers = grid["layers"]
    r, c = min(row, 49), min(col, 49)
    temp = layers["baseline_temperature_c"][r][c]
    
    return {
        "study_area_id": study_area_id,
        "cell_coordinates": {"row": r, "col": c},
        "building_density": layers["building_density"][r][c],
        "building_height_m": layers["building_height"][r][c],
        "veg_fraction": layers["veg_fraction"][r][c],
        "canopy_height_m": layers.get("canopy_height", [[0]*50]*50)[r][c],
        "water_fraction": layers["water_fraction"][r][c],
        "albedo": layers["albedo"][r][c],
        "surface_emissivity": layers.get("surface_emissivity", [[0.92]*50]*50)[r][c],
        "sky_view_factor": layers.get("sky_view_factor", [[0.7]*50]*50)[r][c],
        "population_density_ha": layers.get("population_density", [[150]*50]*50)[r][c],
        "anthropogenic_heat_wm2": layers.get("anthropogenic_heat_qf", [[45]*50]*50)[r][c],
        "baseline_temperature_c": temp,
        "surface_temperature_c": temp,
        "hvi_score": round(min(10.0, max(1.0, (temp - 32.0) * 0.5 + (layers["building_density"][r][c] * 3.0))), 1),
        "heat_risk_level": "CRITICAL" if temp > 44.0 else ("HIGH" if temp > 40.0 else ("MODERATE" if temp > 36.0 else "LOW"))
    }

