import numpy as np
from typing import Dict, Any, Tuple

# Physical Constants
SIGMA = 5.670374419e-8  # Stefan-Boltzmann constant (W / m^2 K^4)
RHO_CP = 1200.0         # Volumetric heat capacity of air (J / m^3 K)
VON_KARMAN = 0.4        # von Kármán constant

class EnergyBalanceSolver:
    """
    Surface Energy Balance physics solver for urban climate digital twin.
    Formulation: Q* + Qf = Qh + Qe + dQs
    
    Q*  : Net radiation (W/m²)
    Qf  : Anthropogenic heat flux (W/m²)
    Qh  : Sensible heat flux (W/m²)
    Qe  : Latent heat flux / evapotranspiration (W/m²)
    dQs : Heat flux stored in urban canopy fabric (W/m²)
    """
    
    def __init__(
        self,
        solar_rad: float = 850.0,       # Downwelling solar irradiance (W/m²)
        air_temp_c: float = 38.5,       # Ambient air temperature (°C)
        rel_humidity: float = 0.45,     # Relative humidity (0 to 1)
        wind_speed: float = 2.5,        # Wind speed at 10m height (m/s)
        z_meas: float = 10.0,           # Measurement height (m)
    ):
        self.solar_rad = solar_rad
        self.T_air_k = air_temp_c + 273.15
        self.rel_humidity = rel_humidity
        self.wind_speed = max(0.5, wind_speed)  # Bound minimum wind to avoid zero division
        self.z_meas = z_meas
        
        # Calculate atmospheric vapor pressure e_a (Pa)
        # Tetens equation for saturation vapor pressure e_sat
        e_sat = 610.78 * np.exp(17.27 * air_temp_c / (air_temp_c + 237.3))
        self.e_a = self.rel_humidity * e_sat
        
        # Atmospheric emissivity (Brunt / Idso formulation)
        self.epsilon_atm = 1.24 * (self.e_a / self.T_air_k)**(1/7)
        
        # Downwelling longwave radiation L_down (W/m²)
        self.L_down = self.epsilon_atm * SIGMA * (self.T_air_k ** 4)

    def calculate_aerodynamic_resistance(self, building_height: float, building_density: float) -> float:
        """
        Calculates aerodynamic resistance r_a (s/m) based on aerodynamic roughness z0.
        z0 = 0.1 * H_bldg, with displacement height d = 0.7 * H_bldg
        """
        H = max(1.0, building_height)
        z0 = max(0.05, 0.1 * H * (1.0 + building_density))
        d = 0.7 * H
        
        z_eff = max(z0 + 0.5, self.z_meas - d)
        
        r_a = (np.log(z_eff / z0) ** 2) / (VON_KARMAN**2 * self.wind_speed)
        return float(np.clip(r_a, 5.0, 300.0))

    def solve_cell_equilibrium(
        self,
        albedo: float,
        emissivity: float,
        veg_fraction: float,
        water_fraction: float,
        building_height: float,
        building_density: float,
        q_f: float,
        wetness_factor: float = 0.5
    ) -> Dict[str, float]:
        """
        Solves cell surface equilibrium temperature T_s (°C) and flux components.
        """
        # Bound input physical properties
        alpha = np.clip(albedo, 0.05, 0.90)
        eps = np.clip(emissivity, 0.85, 0.99)
        f_veg = np.clip(veg_fraction, 0.0, 1.0)
        f_water = np.clip(water_fraction, 0.0, 1.0)
        f_imperv = np.clip(1.0 - f_veg - f_water, 0.0, 1.0)
        
        # Aerodynamic resistance
        r_a = self.calculate_aerodynamic_resistance(building_height, building_density)
        
        # Shortwave absorbed Q_sw = (1 - alpha) * S_down
        Q_sw = (1.0 - alpha) * self.solar_rad
        
        # Initial guess for surface temperature T_s (Kelvin)
        T_s = self.T_air_k + 4.0
        
        # Newton-Raphson iteration to find root of energy balance F(T_s) = 0
        for _ in range(25):
            # Longwave radiation
            L_up = eps * SIGMA * (T_s ** 4)
            Q_star = Q_sw + eps * self.L_down - L_up
            
            # Sensible heat flux Qh
            Q_h = RHO_CP * (T_s - self.T_air_k) / r_a
            
            # Latent heat flux Qe (Evapotranspiration)
            # Potential ET based on net radiation equilibrium
            Q_e_pot = max(0.0, 0.6 * Q_star)
            Q_e = Q_e_pot * (f_veg * wetness_factor + f_water * 1.0)
            
            # Stored heat flux dQs (Objective hysteresis / thermal mass factor)
            # Impervious surfaces store high heat (concrete/asphalt ~0.35 Q*), vegetation/water store low (~0.1 Q*)
            storage_coef = 0.35 * f_imperv + 0.15 * f_veg + 0.08 * f_water
            dQs = storage_coef * Q_star
            
            # Residual F = Q* + Qf - (Qh + Qe + dQs)
            F = Q_star + q_f - (Q_h + Q_e + dQs)
            
            # Derivative dF/dT_s
            dL_up_dT = 4.0 * eps * SIGMA * (T_s ** 3)
            dQ_star_dT = -dL_up_dT
            dQ_h_dT = RHO_CP / r_a
            dQ_e_dT = 0.6 * dQ_star_dT * (f_veg * wetness_factor + f_water)
            ddQs_dT = storage_coef * dQ_star_dT
            
            dF_dT = dQ_star_dT - (dQ_h_dT + dQ_e_dT + ddQs_dT)
            
            # Newton step
            delta_T = F / dF_dT
            T_s = T_s - delta_T
            
            if abs(delta_T) < 1e-4:
                break
        
        # Convert back to °C and extract final fluxes
        T_s_c = float(T_s - 273.15)
        L_up = float(eps * SIGMA * (T_s ** 4))
        Q_star = float(Q_sw + eps * self.L_down - L_up)
        Q_h = float(RHO_CP * (T_s - self.T_air_k) / r_a)
        Q_e = float(max(0.0, 0.6 * Q_star) * (f_veg * wetness_factor + f_water))
        dQs = float((0.35 * f_imperv + 0.15 * f_veg + 0.08 * f_water) * Q_star)
        
        return {
            "T_surface_c": round(T_s_c, 2),
            "Q_star": round(Q_star, 1),
            "Q_f": round(float(q_f), 1),
            "Q_h": round(Q_h, 1),
            "Q_e": round(Q_e, 1),
            "dQs": round(dQs, 1),
            "r_a": round(r_a, 2),
        }

    def solve_grid(
        self,
        grid_data: Dict[str, np.ndarray],
        interventions: Dict[str, float] = None
    ) -> Dict[str, np.ndarray]:
        """
        Vectorized solver for spatial grid arrays.
        """
        interventions = interventions or {}
        
        # Extract spatial base fields
        albedo = np.array(grid_data["albedo"], dtype=float)
        emissivity = np.array(grid_data.get("emissivity", 0.95), dtype=float)
        veg_frac = np.array(grid_data["veg_fraction"], dtype=float)
        water_frac = np.array(grid_data["water_fraction"], dtype=float)
        bldg_height = np.array(grid_data["building_height"], dtype=float)
        bldg_density = np.array(grid_data["building_density"], dtype=float)
        q_f = np.array(grid_data.get("q_f", 35.0), dtype=float)
        
        # Apply parameter modifications from intervention engine
        green_roof_coverage = interventions.get("green_roof_coverage", 0.0)
        cool_roof_albedo_boost = interventions.get("cool_roof_albedo_boost", 0.0)
        tree_canopy_addition = interventions.get("tree_canopy_addition", 0.0)
        reflective_pave_albedo = interventions.get("reflective_pavement_albedo", 0.0)
        water_feature_fraction = interventions.get("water_feature_fraction", 0.0)
        wetness_factor = interventions.get("wetness_factor", 0.5)
        
        # Modified physical fields
        mod_albedo = albedo + (bldg_density * cool_roof_albedo_boost) + ((1.0 - bldg_density - water_frac) * reflective_pave_albedo)
        mod_veg_frac = np.clip(veg_frac + (bldg_density * green_roof_coverage) + tree_canopy_addition, 0.0, 1.0)
        mod_water_frac = np.clip(water_frac + water_feature_fraction, 0.0, 1.0)
        mod_albedo = np.clip(mod_albedo, 0.05, 0.85)
        
        shape = albedo.shape
        t_surface_arr = np.zeros(shape)
        q_star_arr = np.zeros(shape)
        q_h_arr = np.zeros(shape)
        q_e_arr = np.zeros(shape)
        dqs_arr = np.zeros(shape)
        
        # Solve cell by cell (or flattened iteration)
        flat_size = int(np.prod(shape))
        fl_albedo = mod_albedo.flatten()
        fl_emissivity = np.full(flat_size, float(emissivity)) if emissivity.size == 1 else emissivity.flatten()
        fl_veg = mod_veg_frac.flatten()
        fl_water = mod_water_frac.flatten()
        fl_h = bldg_height.flatten()
        fl_den = bldg_density.flatten()
        fl_qf = np.full(flat_size, float(q_f)) if q_f.size == 1 else q_f.flatten()
        
        fl_ts = np.zeros(flat_size)
        fl_qs = np.zeros(flat_size)
        fl_qh = np.zeros(flat_size)
        fl_qe = np.zeros(flat_size)
        fl_dqs = np.zeros(flat_size)
        
        for i in range(flat_size):
            res = self.solve_cell_equilibrium(
                albedo=fl_albedo[i],
                emissivity=fl_emissivity[i],
                veg_fraction=fl_veg[i],
                water_fraction=fl_water[i],
                building_height=fl_h[i],
                building_density=fl_den[i],
                q_f=fl_qf[i],
                wetness_factor=wetness_factor
            )
            fl_ts[i] = res["T_surface_c"]
            fl_qs[i] = res["Q_star"]
            fl_qh[i] = res["Q_h"]
            fl_qe[i] = res["Q_e"]
            fl_dqs[i] = res["dQs"]
            
        return {
            "T_surface_c": fl_ts.reshape(shape),
            "Q_star": fl_qs.reshape(shape),
            "Q_h": fl_qh.reshape(shape),
            "Q_e": fl_qe.reshape(shape),
            "dQs": fl_dqs.reshape(shape),
        }
