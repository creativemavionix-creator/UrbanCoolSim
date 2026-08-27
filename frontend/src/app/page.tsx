"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  Satellite, 
  Cpu, 
  Sliders, 
  CheckCircle2, 
  Flame,
  Scale,
  FileText,
  Thermometer,
  Layers
} from "lucide-react";
import { Hero3DCanvas } from "@/components/Hero3DCanvas";

export default function LandingPage() {
  const [isCooled, setIsCooled] = useState<boolean>(false);

  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-ink-primary select-none">
      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-20 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Hero Narrative (Left) */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-elevated border border-surface-border text-xs font-mono text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-status-safe" />
            <span>Deterministic Surface Energy Balance · 10m Microclimate Twin</span>
          </div>

          <h1 className="editorial-headline text-4xl sm:text-6xl font-normal tracking-tight text-ink-primary">
            Better urban infrastructure decisions, <span className="italic font-serif text-cobalt">not passive heat maps.</span>
          </h1>

          <p className="text-sm text-ink-secondary leading-relaxed max-w-lg">
            UrbanCoolSim unifies satellite multi-spectral remote sensing, first-principles thermodynamics, 
            and NSGA-II Pareto optimization to quantify cooling impacts and simulate capital interventions before construction.
          </p>

          {/* Action CTAs & Interactive State Trigger */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="btn-cobalt px-6 py-3 rounded text-xs flex items-center gap-2"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setIsCooled(!isCooled)}
              className="px-4 py-3 rounded bg-surface-elevated hover:bg-surface-interactive border border-surface-border text-xs text-ink-secondary hover:text-ink-primary transition-colors flex items-center gap-2 font-mono"
            >
              <Thermometer className="w-3.5 h-3.5 text-cobalt" />
              <span>Toggle State: <strong className={isCooled ? "text-cobalt" : "text-status-critical"}>{isCooled ? "Cooled (41.1°C)" : "Baseline (44.5°C)"}</strong></span>
            </button>
          </div>
        </div>

        {/* 3D Volumetric Thermal Field (Right) */}
        <div className="w-full lg:w-1/2 h-[440px] graphite-card rounded-lg overflow-hidden relative">
          <Hero3DCanvas isCooled={isCooled} />
          
          <div className="absolute bottom-4 left-4 p-3 rounded bg-surface-base/90 border border-surface-border text-xs font-mono space-y-1">
            <div className="text-ink-muted text-[10px] uppercase tracking-wider">Interactive 3D Thermal Canvas</div>
            <div className="flex items-center gap-2 text-ink-primary">
              <span>{isCooled ? "Pareto Hybrid Strategy Active" : "Observed Baseline LST"}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${isCooled ? "bg-cobalt/20 text-cobalt" : "bg-status-critical/20 text-status-critical"}`}>
                {isCooled ? "-3.42°C ΔT" : "Peak 48.5°C"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Asymmetrical Spatial Problem Section */}
      <section className="py-16 px-6 sm:px-12 border-t border-surface-border bg-surface-elevated/40">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-ink-muted">The Core Challenge</span>
            <h2 className="editorial-headline text-3xl font-normal text-ink-primary">
              Why Conventional Heat Maps Fail Urban Planners
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Dominant Visual Insight (7 Cols) */}
            <div className="lg:col-span-7 graphite-card p-7 sm:p-8 rounded-lg space-y-4 hover:border-surface-borderHover transition-all">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-cobalt/10 border border-cobalt/20 text-xs font-mono text-cobalt">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Thermodynamic Insight</span>
                </div>
                <span className="text-[10px] font-mono text-ink-muted">10m Microgrid Physics</span>
              </div>

              <h3 className="text-xl font-serif text-ink-primary leading-snug">
                Thermal infrared rasters only display current surface temperature, not the physical mechanisms driving them.
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Without Surface Energy Balance conservation (
                <span className="text-ink-primary font-medium">
                  <i>Q</i>* + <i>Q</i><sub>f</sub> = <i>Q</i><sub>h</sub> + <i>Q</i><sub>e</sub> + Δ<i>Q</i><sub>s</sub>
                </span>
                ), municipal planners cannot predict how much cooling a specific high-albedo roof or tree canopy will achieve, or whether municipal water limits will be exceeded.
              </p>

              <div className="p-3.5 rounded-md bg-surface-base/90 border border-surface-border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-status-critical shrink-0 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-ink-muted uppercase">CFD Simulation Time</span>
                    <span className="text-ink-primary font-semibold">~14.5 Hours</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 sm:border-l sm:border-surface-border sm:pl-3">
                  <span className="w-2 h-2 rounded-full bg-cobalt shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-cobalt uppercase">AI Surrogate Speed</span>
                    <span className="text-cobalt font-semibold">~1.8 ms (sub-2ms)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supporting Challenge Points (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="graphite-card p-6 rounded-lg space-y-2.5 hover:border-surface-borderHover transition-all">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-cobalt/10 border border-cobalt/20 text-[10px] font-mono text-cobalt uppercase tracking-wider font-semibold">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Unconstrained Planning</span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-muted">CapEx & Water</span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium text-ink-primary">Budget & Water Resource Blind Spots</h4>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    Conventional greenery plans frequently ignore finite municipal water reserves, structural rooftop load constraints, and ongoing maintenance expenditures.
                  </p>
                </div>
              </div>

              <div className="graphite-card p-6 rounded-lg space-y-2.5 hover:border-surface-borderHover transition-all">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-cobalt/10 border border-cobalt/20 text-[10px] font-mono text-cobalt uppercase tracking-wider font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verification Safeguard</span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-muted">Physics Ground Truth</span>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium text-ink-primary">Deterministic Physics Re-Validation</h4>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    To eliminate AI model hallucination or surrogate gaming, every recommended Pareto strategy is automatically re-simulated through the deterministic physics solver.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Narrative Pipeline Section (Data -> Twin -> Physics -> Optimization -> Decision) */}
      <section className="py-20 px-6 sm:px-12 border-t border-surface-border">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cobalt">Scientific Pipeline</span>
            <h2 className="editorial-headline text-3xl sm:text-4xl font-normal text-ink-primary">
              From Multi-Spectral Ingestion to Verified Capital Decisions
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="graphite-card p-6 rounded-lg space-y-3.5 hover:border-surface-borderHover transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-cobalt/10 border border-cobalt/20 flex items-center justify-center text-cobalt font-mono font-semibold text-xs shrink-0">
                    01
                  </div>
                  <h3 className="text-sm font-semibold text-ink-primary tracking-tight truncate">
                    10m Digital Twin
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Fuses Landsat 8 TIRS, Sentinel-2, ESA WorldCover, and building height morphology into a 2,500-cell microgrid.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[10px] font-mono text-ink-muted">
                <span>Multi-Spectral</span>
                <span className="text-cobalt">10m Unified</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="graphite-card p-6 rounded-lg space-y-3.5 hover:border-surface-borderHover transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-cobalt/10 border border-cobalt/20 flex items-center justify-center text-cobalt font-mono font-semibold text-xs shrink-0">
                    02
                  </div>
                  <h3 className="text-sm font-semibold text-ink-primary tracking-tight truncate">
                    SEB Thermodynamics
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Solves non-linear surface temperature equilibrium cell-by-cell using Newton-Raphson numerical root-finding.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[10px] font-mono text-ink-muted">
                <span>Energy Balance</span>
                <span className="text-cobalt">First-Principles</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="graphite-card p-6 rounded-lg space-y-3.5 hover:border-surface-borderHover transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-cobalt/10 border border-cobalt/20 flex items-center justify-center text-cobalt font-mono font-semibold text-xs shrink-0">
                    03
                  </div>
                  <h3 className="text-sm font-semibold text-ink-primary tracking-tight truncate">
                    NSGA-II Pareto Solver
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Explores non-dominated trade-offs between cooling impact, CapEx ($), water demand (m³), and energy savings.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[10px] font-mono text-ink-muted">
                <span>Multi-Objective</span>
                <span className="text-cobalt">Physics-Checked</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="graphite-card p-6 rounded-lg space-y-3.5 hover:border-surface-borderHover transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded bg-cobalt/10 border border-cobalt/20 flex items-center justify-center text-cobalt font-mono font-semibold text-xs shrink-0">
                    04
                  </div>
                  <h3 className="text-sm font-semibold text-ink-primary tracking-tight truncate">
                    Executive Blueprints
                  </h3>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Exports publication-ready PDF decision dossiers, vector GeoJSON layers, and microclimate CSV grids.
                </p>
              </div>
              <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[10px] font-mono text-ink-muted">
                <span>Decision Support</span>
                <span className="text-cobalt">PDF & GeoJSON</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="py-8 px-6 sm:px-12 border-t border-surface-border text-xs font-mono text-ink-muted flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>UrbanCoolSim · Urban Microclimate Intelligence Platform</span>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hover:text-ink-primary transition-colors">Overview</Link>
          <Link href="/digital-twin" className="hover:text-ink-primary transition-colors">Digital Twin</Link>
          <Link href="/optimization" className="hover:text-ink-primary transition-colors">Optimization</Link>
          <Link href="/methodology" className="hover:text-ink-primary transition-colors">Methodology</Link>
        </div>
      </footer>
    </div>
  );
}
