"use client";

import { Header } from "@/components/Header";
import { BookOpen, ShieldCheck, Scale } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-ink-primary select-none">
      <Header 
        title="Methodology & Scientific Principles" 
        subtitle="Mathematical Formulations, Physical Assumptions & Safeguards" 
      />

      <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-10">
        {/* Editorial Heading */}
        <div className="space-y-2 border-b border-surface-border pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-cobalt font-semibold">
            First-Principles Scientific Formulation
          </span>
          <h1 className="editorial-headline text-3xl sm:text-4xl font-normal text-ink-primary">
            Thermodynamic Mechanics & System Boundaries
          </h1>
          <p className="text-xs text-ink-secondary max-w-2xl leading-relaxed">
            UrbanCoolSim combines satellite multi-spectral remote sensing, 1D/2D Surface Energy Balance physics, 
            gradient-boosted surrogate acceleration, and multi-objective Pareto optimization.
          </p>
        </div>

        {/* 1. Surface Energy Balance Equation */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-cobalt font-semibold">01</span>
            <h2 className="text-sm font-semibold text-ink-primary tracking-tight">
              Surface Energy Balance (SEB) Conservation
            </h2>
          </div>

          <div className="graphite-card p-8 rounded-lg space-y-6">
            <div className="text-center py-4 border-b border-surface-border">
              <span className="font-serif italic text-3xl sm:text-4xl text-ink-primary tracking-wide">
                Q* + Q_f = Q_h + Q_e + ΔQ_s
              </span>
              <span className="block text-[11px] font-mono text-ink-muted mt-2">
                Units: Watts per square meter [W/m²]
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-ink-secondary leading-relaxed">
              <div className="space-y-1 p-3 rounded bg-surface-base border border-surface-border">
                <strong className="text-ink-primary font-medium block">Q* — Net All-Wave Radiation</strong>
                <p className="text-[11px]">
                  Balances incoming solar shortwave absorption $(1 - \alpha)S_\downarrow$ against 
                  atmospheric thermal longwave $\epsilon L_\downarrow$ and surface Planck emission $\epsilon \sigma T_s^4$.
                </p>
              </div>

              <div className="space-y-1 p-3 rounded bg-surface-base border border-surface-border">
                <strong className="text-ink-primary font-medium block">Q_f — Anthropogenic Waste Heat</strong>
                <p className="text-[11px]">
                  Parameterizes localized sensible emissions from HVAC building cooling, vehicular traffic, 
                  and commercial activities based on building footprint density.
                </p>
              </div>

              <div className="space-y-1 p-3 rounded bg-surface-base border border-surface-border">
                <strong className="text-ink-primary font-medium block">Q_h — Sensible Turbulent Heat Flux</strong>
                <p className="text-[11px]">
                  Drives ambient air heating: $\rho c_p (T_s - T_a) / r_a$. Aerodynamic resistance $r_a$ is coupled 
                  to logarithmic wind profiles, building heights $H$, and roughness length $z_0 = 0.1 H$.
                </p>
              </div>

              <div className="space-y-1 p-3 rounded bg-surface-base border border-surface-border">
                <strong className="text-ink-primary font-medium block">Q_e — Latent Evapotranspiration Flux</strong>
                <p className="text-[11px]">
                  Moisture-driven cooling flux from urban tree canopy, vegetative roofs, and open water bodies, 
                  governed by Penman-Monteith saturation vapor deficit equilibrium.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. AI Surrogate & Physics Re-Validation */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-cobalt font-semibold">02</span>
            <h2 className="text-sm font-semibold text-ink-primary tracking-tight">
              AI Surrogate Acceleration & Physics Safeguard
            </h2>
          </div>

          <div className="graphite-card p-6 rounded-lg space-y-4 text-xs text-ink-secondary leading-relaxed">
            <p>
              While deterministic SEB root-finding guarantees thermodynamic truth, evaluating tens of thousands 
              of optimization candidates in real time requires rapid inference. UrbanCoolSim trains a gradient-boosted surrogate 
              (LightGBM) on 10,000 pre-computed physics runs ($R^2 = 0.962$).
            </p>

            <div className="p-4 bg-surface-base border border-surface-border rounded flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-status-safe shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink-primary font-medium block">Deterministic Ground-Truth Re-Validation:</strong>
                <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                  Surrogate models are never trusted blindly. Once the NSGA-II optimizer identifies candidate 
                  Pareto solutions, each solution is re-simulated through the full deterministic numerical SEB engine. 
                  Any portfolio exhibiting residual error &gt; 0.15°C is rejected.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. NSGA-II Formulation */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-cobalt font-semibold">03</span>
            <h2 className="text-sm font-semibold text-ink-primary tracking-tight">
              Multi-Objective NSGA-II Optimization Formulation
            </h2>
          </div>

          <div className="graphite-card p-6 rounded-lg space-y-3 text-xs">
            <p className="text-ink-secondary leading-relaxed">
              UrbanCoolSim executes an Non-Dominated Sorting Genetic Algorithm (NSGA-II) solving across 5 competing objective functions:
            </p>
            <div className="p-4 rounded bg-surface-base border border-surface-border font-mono text-[11px] text-cobalt space-y-1">
              <div>min F(x) = [ -w_cool·ΔT,  +w_cost·CapEx,  -w_pop·PopProtected,  +w_water·WaterDemand,  -w_energy·HVAC_kWh ]</div>
              <div className="text-ink-muted text-[10px]">subject to: CapEx ≤ Budget_max,  Water ≤ Water_max,  α_cool ≥ α_min,  Trees ≤ Tree_max</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
