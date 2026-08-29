"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { EnergyBalanceChart } from "@/components/EnergyBalanceChart";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { api, SimulationResult } from "@/lib/api";
import { Wind, Sun, Thermometer } from "lucide-react";

export default function ThermalAnalysisPage() {
  const [studyArea, setStudyArea] = useState("delhi_cp");
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [airTemp, setAirTemp] = useState<number>(42.0);
  const [solarRad, setSolarRad] = useState<number>(900);
  const [windSpeed, setWindSpeed] = useState<number>(2.5);

  const loadThermal = async (areaId = studyArea) => {
    try {
      const res = await api.runPhysicsSimulation("scen_hybrid_cp", {
        air_temp: airTemp,
        solar_rad: solarRad,
        wind_speed: windSpeed,
      }, areaId);
      setSimResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const savedArea = localStorage.getItem("urbancoolsim_study_area") || "delhi_cp";
    setStudyArea(savedArea);
    loadThermal(savedArea);

    const handleAreaChange = (e: any) => {
      if (e.detail) {
        setStudyArea(e.detail);
        loadThermal(e.detail);
      }
    };
    window.addEventListener("studyAreaChanged", handleAreaChange);
    return () => window.removeEventListener("studyAreaChanged", handleAreaChange);
  }, [airTemp, solarRad, windSpeed]);

  const fluxes = simResult?.energy_fluxes_json || {
    Q_star_mean: 580.4,
    Q_f_mean: 45.2,
    Q_h_mean: 380.1,
    Q_e_mean: 65.3,
    dQs_mean: 180.2,
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-ink-primary select-none">
      <Header 
        title="Surface Energy Balance Analysis" 
        subtitle="First-Principles Thermodynamic Physics Engine" 
        onStudyAreaChange={(id) => {
          setStudyArea(id);
          loadThermal(id);
        }}
      />

      <div className="p-5 sm:p-7 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Statement */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-surface-border/60">
          <div className="space-y-1.5">
            <span className="text-label text-cobalt">
              Deterministic SEB Thermodynamics
            </span>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink-primary">
              Thermodynamic Flux Decomposition
            </h1>
            <p className="text-xs text-ink-secondary max-w-xl leading-relaxed">
              Enforcing deterministic conservation of energy:{" "}
              <span className="text-ink-primary font-medium font-mono">
                Q* + Qf = Qh + Qe + ΔQs
              </span>
              . Sensible turbulent flux (Qh) heats pedestrian air, while latent flux (Qe) provides evaporative cooling.
            </p>
          </div>

          <div className="flex items-baseline gap-6 shrink-0 tabular-nums">
            <div>
              <span className="text-label text-ink-dim block mb-0.5">Net All-Wave Influx (Q*)</span>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter value={fluxes.Q_star_mean} decimals={0} className="editorial-headline text-3xl text-ink-primary font-normal tracking-tight" />
                <span className="text-xs text-ink-dim font-mono">W/m²</span>
              </div>
            </div>
            <div className="h-8 w-px bg-surface-border" />
            <div>
              <span className="text-label text-ink-dim block mb-0.5">Sensible Heat (Qh)</span>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter value={fluxes.Q_h_mean} decimals={0} className="editorial-headline text-3xl text-status-critical font-normal tracking-tight" />
                <span className="text-xs text-ink-dim font-mono">W/m²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Boundary Condition Controls */}
        <div className="graphite-card p-5 sm:p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center border-b border-surface-border pb-3">
            <h3 className="text-xs font-semibold text-ink-primary">
              Atmospheric Boundary Conditions
            </h3>
            <span className="text-label text-status-safe">
              Newton-Raphson Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs tabular-nums">
            <div className="space-y-2 p-3 rounded-lg surface-inset">
              <div className="flex justify-between items-baseline">
                <span className="text-ink-secondary flex items-center gap-1.5 text-[11px]">
                  <Thermometer className="w-3.5 h-3.5 text-status-critical" /> Ambient Air Temp (Ta):
                </span>
                <span className="font-mono font-medium text-ink-primary">{airTemp.toFixed(1)}°C</span>
              </div>
              <input
                type="range" min="30" max="48" step="0.5" value={airTemp}
                onChange={(e) => setAirTemp(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2 p-3 rounded-lg surface-inset">
              <div className="flex justify-between items-baseline">
                <span className="text-ink-secondary flex items-center gap-1.5 text-[11px]">
                  <Sun className="w-3.5 h-3.5 text-status-high" /> Solar Downwelling:
                </span>
                <span className="font-mono font-medium text-ink-primary">{solarRad} W/m²</span>
              </div>
              <input
                type="range" min="400" max="1100" step="25" value={solarRad}
                onChange={(e) => setSolarRad(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2 p-3 rounded-lg surface-inset">
              <div className="flex justify-between items-baseline">
                <span className="text-ink-secondary flex items-center gap-1.5 text-[11px]">
                  <Wind className="w-3.5 h-3.5 text-cobalt" /> Canopy Wind Speed:
                </span>
                <span className="font-mono font-medium text-ink-primary">{windSpeed.toFixed(1)} m/s</span>
              </div>
              <input
                type="range" min="0.5" max="8.0" step="0.5" value={windSpeed}
                onChange={(e) => setWindSpeed(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* 2-Column: Surface Energy Balance Breakdown + Technical Physics Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8">
            <EnergyBalanceChart data={fluxes} />
          </div>

          <div className="lg:col-span-4 graphite-card p-5 rounded-lg space-y-3.5 text-xs font-mono">
            <div className="border-b border-surface-border pb-2">
              <h3 className="text-xs font-semibold text-ink-primary font-sans">Equilibrium Formulation</h3>
            </div>

            <div className="space-y-2.5 text-ink-secondary leading-relaxed">
              <div className="p-3 rounded-lg surface-inset text-center text-cobalt font-medium text-xs">
                f(Ts) = Q*(Ts) + Qf − Qh(Ts) − Qe(Ts) − ΔQs(Ts) = 0
              </div>
              <p className="text-[11px] font-sans text-ink-dim leading-relaxed">
                Solved cell-by-cell using Newton-Raphson iteration. Canopy aerodynamic resistance ra is coupled to building height H and roughness length z0 = 0.1 H.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
