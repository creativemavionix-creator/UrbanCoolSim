"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { EnergyBalanceChart } from "@/components/EnergyBalanceChart";
import { api, SimulationResult } from "@/lib/api";
import { Flame, Wind, Sun, Sliders, Info } from "lucide-react";
import { motion } from "framer-motion";

const easeOutExpo = [0.16, 1, 0.3, 1];

export default function ThermalAnalysisPage() {
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [airTemp, setAirTemp] = useState<number>(42.0);
  const [solarRad, setSolarRad] = useState<number>(900);
  const [windSpeed, setWindSpeed] = useState<number>(2.5);

  useEffect(() => {
    async function loadThermal() {
      try {
        const res = await api.runPhysicsSimulation("scen_hybrid_cp", {
          air_temp: airTemp,
          solar_rad: solarRad,
          wind_speed: windSpeed,
        });
        setSimResult(res);
      } catch (err) {
        console.error(err);
      }
    }
    loadThermal();
  }, [airTemp, solarRad, windSpeed]);

  const fluxes = simResult?.energy_fluxes_json || {
    Q_star_mean: 580.4,
    Q_f_mean: 45.2,
    Q_h_mean: 380.1,
    Q_e_mean: 65.3,
    dQs_mean: 180.2,
  };

  return (
    <div className="flex flex-col min-h-screen bg-obsidian-base">
      <Header 
        title="Surface Energy Balance Analysis" 
        subtitle="First-Principles Thermodynamic Physics Engine" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="p-8 max-w-7xl mx-auto w-full space-y-10"
      >
        {/* Thermal Narrative Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-obsidian-border pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-normal tracking-tight text-white">
              Thermodynamic Flux Decomposition
            </h1>
            <p className="text-xs text-obsidian-textSecondary max-w-xl leading-relaxed">
              Enforcing deterministic conservation of energy: <span className="font-mono text-botanical-light">Q* + Q_f = Q_h + Q_e + ΔQ_s</span>. 
              Sensible turbulent flux (Q_h) heats the urban air, while latent flux (Q_e) provides natural evaporative cooling.
            </p>
          </div>

          <div className="flex items-baseline gap-6">
            <div>
              <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Net Solar Influx (Q*)</span>
              <span className="text-3xl font-serif text-white">{Math.round(fluxes.Q_star_mean)} <span className="text-xs font-sans text-obsidian-textMuted">W/m²</span></span>
            </div>
            <div className="h-8 w-px bg-obsidian-border" />
            <div>
              <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Sensible Heat (Q_h)</span>
              <span className="text-3xl font-serif text-rose-400">{Math.round(fluxes.Q_h_mean)} <span className="text-xs font-sans text-obsidian-textMuted">W/m²</span></span>
            </div>
          </div>
        </div>

        {/* Boundary Condition Sliders */}
        <div className="bg-obsidian-subtle border border-obsidian-border p-6 rounded-xl space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-wider text-obsidian-textSecondary">
            Atmospheric Boundary Conditions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-obsidian-textSecondary">Ambient Air Temperature (T_a):</span>
                <span className="font-mono font-medium text-white">{airTemp.toFixed(1)}°C</span>
              </div>
              <input
                type="range" min="30" max="48" step="0.5" value={airTemp}
                onChange={(e) => setAirTemp(Number(e.target.value))}
                className="w-full accent-white bg-obsidian-surface h-1 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-obsidian-textSecondary">Downwelling Solar Flux (S_down):</span>
                <span className="font-mono font-medium text-white">{solarRad} W/m²</span>
              </div>
              <input
                type="range" min="400" max="1100" step="25" value={solarRad}
                onChange={(e) => setSolarRad(Number(e.target.value))}
                className="w-full accent-white bg-obsidian-surface h-1 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-obsidian-textSecondary">Canopy Wind Velocity (u_a):</span>
                <span className="font-mono font-medium text-white">{windSpeed.toFixed(1)} m/s</span>
              </div>
              <input
                type="range" min="0.5" max="8.0" step="0.5" value={windSpeed}
                onChange={(e) => setWindSpeed(Number(e.target.value))}
                className="w-full accent-white bg-obsidian-surface h-1 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Energy Flux Chart Surface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <EnergyBalanceChart data={fluxes} />
          </div>

          <div className="lg:col-span-4 bg-obsidian-subtle border border-obsidian-border p-6 rounded-xl space-y-4 text-xs">
            <h3 className="font-semibold text-white tracking-tight border-b border-obsidian-border pb-2.5">
              Thermodynamic Explanations
            </h3>

            <div className="space-y-3 text-obsidian-textSecondary leading-relaxed">
              <div>
                <strong className="text-white block font-medium">Q* (Net Radiation):</strong>
                Shortwave absorption $(1 - \alpha)S$ minus net longwave Planck radiative emission.
              </div>
              <div>
                <strong className="text-white block font-medium">Q_h (Sensible Turbulent Heat):</strong>
                Primary convective driver of ambient air heating $\rho c_p (T_s - T_a) / r_a$.
              </div>
              <div>
                <strong className="text-white block font-medium">Q_e (Latent Heat / Transpiration):</strong>
                Moisture flux cooling the canopy via tree and green roof evapotranspiration.
              </div>
              <div>
                <strong className="text-white block font-medium">ΔQ_s (Subsurface Storage):</strong>
                Thermal inertia of concrete and asphalt structures absorbing heat during peak hours.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
