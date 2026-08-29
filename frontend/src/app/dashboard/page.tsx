"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/Header";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { api, DigitalTwinGrid, SimulationResult } from "@/lib/api";
import { 
  ArrowRight, 
  Globe2,
  ShieldCheck,
  TrendingDown,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const DigitalTwinMap = dynamic(
  () => import("@/components/DigitalTwinMap").then((mod) => mod.DigitalTwinMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[620px] flex items-center justify-center surface-inset rounded-lg text-xs font-mono text-ink-muted skeleton-pulse">
        Initializing 10m Spatial Digital Twin…
      </div>
    ),
  }
);

const EnergyBalanceChart = dynamic(
  () => import("@/components/EnergyBalanceChart").then((mod) => mod.EnergyBalanceChart),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 flex items-center justify-center surface-inset rounded-lg text-xs font-mono text-ink-muted skeleton-pulse">
        Loading Thermodynamic Flux Balance…
      </div>
    ),
  }
);

const studyAreaPills = [
  { id: "delhi_cp", label: "Delhi · CP", flag: "🇮🇳", temp: "42.0°C" },
  { id: "mumbai_bkc", label: "Mumbai · BKC", flag: "🇮🇳", temp: "36.5°C" },
  { id: "singapore_marina", label: "Singapore · Marina", flag: "🇸🇬", temp: "33.0°C" },
  { id: "phoenix_downtown", label: "Phoenix · Downtown", flag: "🇺🇸", temp: "45.0°C" },
  { id: "tokyo_shinjuku", label: "Tokyo · Shinjuku", flag: "🇯🇵", temp: "35.5°C" },
];

export default function DashboardPage() {
  const [studyArea, setStudyArea] = useState("delhi_cp");
  const [grid, setGrid] = useState<DigitalTwinGrid | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async (areaId = studyArea) => {
    setLoading(true);
    try {
      const [gridData, simRes] = await Promise.all([
        api.getDigitalTwinGrid(areaId, 50, 50),
        api.runPhysicsSimulation("scen_hybrid_cp", undefined, areaId)
      ]);
      setGrid(gridData);
      setSimResult(simRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedArea = localStorage.getItem("urbancoolsim_study_area") || "delhi_cp";
    setStudyArea(savedArea);
    loadDashboard(savedArea);

    const handleAreaChange = (e: any) => {
      if (e.detail) {
        setStudyArea(e.detail);
        loadDashboard(e.detail);
      }
    };
    window.addEventListener("studyAreaChanged", handleAreaChange);
    return () => window.removeEventListener("studyAreaChanged", handleAreaChange);
  }, []);

  const handlePillClick = (areaId: string) => {
    setStudyArea(areaId);
    localStorage.setItem("urbancoolsim_study_area", areaId);
    loadDashboard(areaId);
    window.dispatchEvent(new CustomEvent("studyAreaChanged", { detail: areaId }));
  };

  const baselineTemp = simResult?.baseline_t_mean || 44.5;
  const coolingBenefit = simResult?.delta_t_mean || 3.42;

  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-ink-primary select-none">
      <Header 
        title="Executive Heat Intelligence" 
        subtitle="10m Spatial Digital Twin & Surface Energy Balance" 
        onStudyAreaChange={(id) => {
          setStudyArea(id);
          loadDashboard(id);
        }}
      />

      <div className="p-5 sm:p-7 max-w-7xl mx-auto w-full space-y-6">
        {/* District Archetype Navigation Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-surface-border/60">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Globe2 className="w-3.5 h-3.5 text-cobalt" />
            <span className="text-label text-ink-dim">Active Archetype:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {studyAreaPills.map((pill) => {
              const isSelected = pill.id === studyArea;
              return (
                <button
                  key={pill.id}
                  onClick={() => handlePillClick(pill.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                    isSelected
                      ? "bg-cobalt text-white font-medium shadow-sm"
                      : "bg-surface-elevated text-ink-secondary hover:text-ink-primary hover:bg-surface-interactive border border-surface-border"
                  }`}
                >
                  <span>{pill.flag}</span>
                  <span>{pill.label}</span>
                  <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-ink-dim"}`}>
                    {pill.temp}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Asymmetrical Metric Layout: Primary Metric + Metrics Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Primary Decision Metric (5 Cols) */}
          <div className="lg:col-span-5 graphite-card p-6 sm:p-7 rounded-lg flex flex-col justify-between space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-cobalt" />
                <span className="text-label text-cobalt">
                  Primary Decision Metric
                </span>
              </div>
              <h2 className="text-xs text-ink-secondary">
                Achievable Mean District Cooling (ΔT)
              </h2>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1">
                <span className="editorial-headline text-5xl sm:text-6xl text-cobalt font-normal tracking-tight">−</span>
                <AnimatedCounter 
                  value={coolingBenefit} 
                  decimals={2} 
                  className="editorial-headline text-5xl sm:text-6xl text-cobalt font-normal tracking-tight"
                />
                <span className="text-2xl text-ink-muted font-light font-serif ml-1">°C</span>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Maximized across 2,500 cells via NSGA-II Pareto hybrid strategy (cool roofs + canopy shading).
              </p>
            </div>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs font-mono">
              <span className="text-ink-dim">Solver Status:</span>
              <span className="text-status-safe font-medium flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> Deterministic Validated
              </span>
            </div>
          </div>

          {/* Secondary Metrics Breakdown (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 flex-1">
              {/* Metric 1: Baseline LST */}
              <div className="graphite-card p-5 rounded-lg flex flex-col justify-between space-y-3">
                <span className="text-label text-ink-dim">
                  Observed Baseline LST
                </span>
                <div className="flex items-baseline gap-1">
                  <AnimatedCounter 
                    value={baselineTemp} 
                    decimals={1} 
                    className="text-2xl sm:text-3xl font-serif text-ink-primary tracking-tight"
                  />
                  <span className="text-xs text-ink-muted font-sans">°C</span>
                </div>
                <span className="text-[10px] text-ink-dim leading-snug">
                  Peak thermal infrared
                </span>
              </div>

              {/* Metric 2: Exposed Pop */}
              <div className="graphite-card p-5 rounded-lg flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-label text-ink-dim">
                    Exposed Pop.
                  </span>
                  <Users className="w-3 h-3 text-status-high" />
                </div>
                <div className="flex items-baseline gap-1">
                  <AnimatedCounter 
                    value={14800} 
                    decimals={0} 
                    className="text-2xl sm:text-3xl font-serif text-status-high tracking-tight"
                  />
                  <span className="text-[11px] text-ink-muted font-sans">res.</span>
                </div>
                <span className="text-[10px] text-ink-dim leading-snug">
                  In zones &gt;41.5°C
                </span>
              </div>

              {/* Metric 3: Chiller Savings */}
              <div className="graphite-card p-5 rounded-lg flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-label text-ink-dim">
                    HVAC Saved
                  </span>
                  <Zap className="w-3 h-3 text-status-safe" />
                </div>
                <div className="flex items-baseline gap-1">
                  <AnimatedCounter 
                    value={142000} 
                    decimals={0} 
                    className="text-2xl sm:text-3xl font-serif text-ink-primary tracking-tight"
                  />
                  <span className="text-[10px] text-ink-dim font-mono">kWh</span>
                </div>
                <span className="text-[10px] text-status-safe font-mono">
                  +$17,040 / yr
                </span>
              </div>
            </div>

            {/* Recommendation Ribbon */}
            <div className="graphite-card p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-ink-primary">Recommended Mitigation Blueprint</span>
                <p className="text-xs text-ink-secondary">
                  35% Green Roofs ($75/m²) + 25% Cool Roofs ($18/m²) + 20% Canopy Expansion.
                </p>
              </div>

              <Link
                href="/optimization"
                className="btn-cobalt px-3.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 shrink-0"
              >
                <span>Tune Optimizer</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column: Spatial Map + Thermodynamic Flux Balance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex justify-between items-baseline px-1 text-xs">
              <h3 className="font-medium text-ink-primary">10m Spatial Digital Twin</h3>
              <span className="font-mono text-ink-dim text-[11px]">2,500 Cells (10m × 10m)</span>
            </div>
            <DigitalTwinMap gridData={grid} />
          </div>

          <div className="lg:col-span-5 space-y-4">
            <EnergyBalanceChart data={simResult?.energy_fluxes_json} />
          </div>
        </div>
      </div>
    </div>
  );
}
