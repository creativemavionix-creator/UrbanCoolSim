const API_BASE = "/api/v1";

export interface StudyAreaOption {
  id: string;
  name: string;
  city: string;
  country: string;
  crs: string;
  resolution_m: number;
  typology: string;
  description: string;
  center_lat: number;
  center_lon: number;
  base_climate: {
    air_temp_c: number;
    solar_rad_wm2: number;
    rel_humidity: number;
    wind_speed_ms: number;
    q_f_wm2: number;
  };
}

export interface DigitalTwinGrid {
  metadata: {
    study_area_id?: string;
    name: string;
    city?: string;
    country?: string;
    location: string;
    crs: string;
    resolution_m: number;
    rows: number;
    cols: number;
    total_cells: number;
    typology?: string;
    center_lat?: number;
    center_lon?: number;
    base_climate?: any;
    is_synthetic: boolean;
    tag: string;
    sources?: string[];
  };
  layers: {
    building_density: number[][];
    building_height: number[][];
    veg_fraction: number[][];
    water_fraction: number[][];
    albedo: number[][];
    baseline_temperature_c: number[][];
    canopy_height?: number[][];
    population_density?: number[][];
    anthropogenic_heat_qf?: number[][];
    surface_emissivity?: number[][];
    sky_view_factor?: number[][];
    lai?: number[][];
  };
}

export interface SimulationResult {
  id: string;
  scenario_id: string;
  baseline_t_mean: number;
  scenario_t_mean: number;
  delta_t_mean: number;
  peak_t: number;
  heat_risk_reduction: number;
  energy_fluxes_json: {
    Q_star_mean: number;
    Q_f_mean: number;
    Q_h_mean: number;
    Q_e_mean: number;
    dQs_mean: number;
  };
  spatial_summary: {
    min_t_c: number;
    max_t_c: number;
    p25_t_c: number;
    p50_t_c: number;
    p75_t_c: number;
    max_cooling_c: number;
    spatial_delta_map: number[][];
    baseline_temp_map: number[][];
    scenario_temp_map: number[][];
  };
  provenance: {
    equation: string;
    solver: string;
    units: string;
    synthetic_flag: boolean;
  };
}

export interface ParetoSolution {
  solution_id: number;
  green_roof_pct: number;
  cool_roof_pct: number;
  tree_canopy_pct: number;
  water_pct: number;
  delta_t_mean: number;
  total_cost_usd: number;
  water_demand_m3: number;
  land_area_m2: number;
  heat_risk_score: number;
  hvac_energy_savings_kwh?: number;
  electricity_cost_savings_usd?: number;
  co2_avoided_tons?: number;
  payback_period_years?: number;
  composite_score?: number;
  physics_validated: boolean;
  validated_delta_t: number;
  validation_error: number;
}

export interface OptimizationResponse {
  id: string;
  name: string;
  objectives: string[];
  constraints: Record<string, any>;
  weights?: Record<string, number>;
  pareto_solutions: ParetoSolution[];
  recommended_solution: ParetoSolution;
  physics_validated: boolean;
}

export interface CriticalZone {
  zone_id: string;
  name: string;
  area_pct: number;
  cell_count: number;
  mean_temp_c: number;
  peak_temp_c: number;
  benefit: string;
  constraint: string;
  unit_cost_usd_m2: number;
}

export interface HeatRiskData {
  study_area_id: string;
  location: string;
  heat_alert_tier: string;
  heat_alert_message: string;
  mean_surface_temp_c: float;
  peak_surface_temp_c: float;
  total_population_estimate: number;
  population_high_exposure: number;
  outdoor_workers_at_risk: number;
  vulnerable_area_pct: number;
  critical_zones: CriticalZone[];
  ward_risk_ranking: {
    rank: number;
    ward_name: string;
    mean_temp_c: number;
    population_exposed: number;
    hvi_score: number;
    risk_tier: string;
    primary_driver: string;
    recommended_action: string;
  }[];
  hvi_distribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface DiurnalPoint {
  hour: number;
  time_label: string;
  air_temp_c: number;
  baseline_surface_temp_c: number;
  scenario_surface_temp_c: number;
  cooling_benefit_c: number;
  solar_radiation_wm2: number;
}

export interface DiurnalProfileResponse {
  study_area_id: string;
  scenario_id: string;
  diurnal_curve: DiurnalPoint[];
  peak_baseline_t: number;
  peak_scenario_t: number;
  max_cooling_c: number;
  nighttime_cooling_c: number;
}

export interface ValidationResponse {
  id: string;
  name: string;
  observed_source: string;
  mae: number;
  rmse: number;
  r2: number;
  spatial_error_summary: Record<string, number>;
  calibration_status: string;
}

type float = number;

export const api = {
  async getStudyAreas(): Promise<StudyAreaOption[]> {
    const res = await fetch(`${API_BASE}/digital-twin/study-areas`);
    if (!res.ok) throw new Error("Failed to fetch study areas");
    return res.json();
  },

  async getDigitalTwinGrid(studyAreaId = "delhi_cp", rows = 50, cols = 50): Promise<DigitalTwinGrid> {
    const res = await fetch(`${API_BASE}/digital-twin/grid?study_area_id=${studyAreaId}&rows=${rows}&cols=${cols}`);
    if (!res.ok) throw new Error("Failed to fetch digital twin grid");
    return res.json();
  },

  async getHeatRiskAnalysis(studyAreaId = "delhi_cp"): Promise<HeatRiskData> {
    const res = await fetch(`${API_BASE}/heat-risk/analysis?study_area_id=${studyAreaId}`);
    if (!res.ok) throw new Error("Failed to fetch heat risk analysis");
    return res.json();
  },

  async getDiurnalProfile(studyAreaId = "delhi_cp", scenarioId = "scen_hybrid_cp"): Promise<DiurnalProfileResponse> {
    const res = await fetch(`${API_BASE}/thermal/diurnal-profile?study_area_id=${studyAreaId}&scenario_id=${scenarioId}`);
    if (!res.ok) throw new Error("Failed to fetch diurnal profile");
    return res.json();
  },

  async runPhysicsSimulation(scenarioId?: string, params?: any, studyAreaId = "delhi_cp"): Promise<SimulationResult> {
    const res = await fetch(`${API_BASE}/thermal/simulate?study_area_id=${studyAreaId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario_id: scenarioId || "scen_hybrid_cp",
        air_temperature_c: params?.air_temp || 42.0,
        relative_humidity: params?.rel_humidity || 0.45,
        wind_speed_ms: params?.wind_speed || 2.5,
        solar_radiation_wm2: params?.solar_rad || 900.0,
        anthropogenic_heat_wm2: params?.q_f || 45.0
      })
    });
    if (!res.ok) throw new Error("Failed to run physics simulation");
    return res.json();
  },

  async runOptimization(params?: {
    studyAreaId?: string;
    maxBudget?: number;
    maxWater?: number;
    maxLand?: number;
    weightCooling?: number;
    weightCost?: number;
    weightPopulation?: number;
    weightWater?: number;
    weightEnergy?: number;
    minCoolRoofReflectance?: number;
    maxTreeAreaPct?: number;
  }): Promise<OptimizationResponse> {
    const res = await fetch(`${API_BASE}/optimization/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        study_area_id: params?.studyAreaId || "delhi_cp",
        max_budget_usd: params?.maxBudget ?? 500000,
        max_water_demand_m3: params?.maxWater ?? 10000,
        max_land_area_m2: params?.maxLand ?? 50000,
        weight_cooling: params?.weightCooling ?? 0.35,
        weight_cost: params?.weightCost ?? 0.25,
        weight_population: params?.weightPopulation ?? 0.20,
        weight_water: params?.weightWater ?? 0.10,
        weight_energy: params?.weightEnergy ?? 0.10,
        min_cool_roof_reflectance: params?.minCoolRoofReflectance ?? 0.70,
        max_tree_area_pct: params?.maxTreeAreaPct ?? 0.35,
        population_size: 35,
        n_gen: 20
      })
    });
    if (!res.ok) throw new Error("Failed to run optimization");
    return res.json();
  },

  async explainModel(features?: any): Promise<any> {
    const res = await fetch(`${API_BASE}/ml/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features || {
        green_roof_pct: 0.35,
        cool_roof_pct: 0.25,
        tree_canopy_pct: 0.20,
        water_pct: 0.05
      })
    });
    if (!res.ok) throw new Error("Failed to fetch SHAP feature attributions");
    return res.json();
  },

  async runValidation(): Promise<ValidationResponse> {
    const res = await fetch(`${API_BASE}/validation/run?scenario_id=scen_baseline`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Failed to run validation");
    return res.json();
  },

  async generateReport(studyAreaId = "delhi_cp"): Promise<{ id: string; title: string; markdown_content: string; pdf_path?: string }> {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "UrbanCoolSim Technical Executive Report",
        study_area_id: studyAreaId
      })
    });
    if (!res.ok) throw new Error("Failed to generate report");
    return res.json();
  },

  // GIS Export Helpers
  exportGridToCSV(grid: DigitalTwinGrid, filename = "urbancoolsim_microgrid.csv") {
    const rows = grid.metadata.rows;
    const cols = grid.metadata.cols;
    let csv = "row,col,surface_temp_c,building_density,building_height_m,veg_fraction,water_fraction,albedo\n";
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = grid.layers.baseline_temperature_c[r][c];
        const bd = grid.layers.building_density[r][c];
        const bh = grid.layers.building_height[r][c];
        const veg = grid.layers.veg_fraction[r][c];
        const wat = grid.layers.water_fraction[r][c];
        const alb = grid.layers.albedo[r][c];
        csv += `${r},${c},${t},${bd},${bh},${veg},${wat},${alb}\n`;
      }
    }
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  },

  exportInterventionsToGeoJSON(solution: ParetoSolution, studyAreaName = "Urban District", filename = "intervention_blueprint.geojson") {
    const geojson = {
      type: "FeatureCollection",
      name: `UrbanCoolSim Mitigation Blueprint - ${studyAreaName}`,
      crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::32643" } },
      features: [
        {
          type: "Feature",
          properties: {
            intervention: "Cool Roof Program",
            coverage_pct: solution.cool_roof_pct,
            albedo_delta: "+0.40",
            capex_usd: solution.total_cost_usd * 0.22,
            cooling_contribution: "-1.4°C"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[[77.215, 28.630], [77.218, 28.630], [77.218, 28.633], [77.215, 28.633], [77.215, 28.630]]]
          }
        },
        {
          type: "Feature",
          properties: {
            intervention: "Green Roof & Living Infrastructure",
            coverage_pct: solution.green_roof_pct,
            annual_water_demand_m3: solution.water_demand_m3 * 0.45,
            cooling_contribution: "-0.9°C"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[[77.218, 28.630], [77.221, 28.630], [77.221, 28.633], [77.218, 28.633], [77.218, 28.630]]]
          }
        },
        {
          type: "Feature",
          properties: {
            intervention: "Urban Tree Shading Corridors",
            canopy_expansion_pct: solution.tree_canopy_pct,
            cooling_contribution: "-1.1°C"
          },
          geometry: {
            type: "LineString",
            coordinates: [[77.214, 28.628], [77.222, 28.635]]
          }
        }
      ]
    };
    
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
};
