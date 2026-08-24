"use client";

import { Header } from "@/components/Header";
import { BookOpen, ShieldCheck, Compass, Scale, Info } from "lucide-react";
import { motion } from "framer-motion";

const easeOutExpo = [0.16, 1, 0.3, 1];

export default function MethodologyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-obsidian-base">
      <Header 
        title="Methodology & Scientific Principles" 
        subtitle="Mathematical Formulations, Physical Assumptions & Safeguards" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="p-8 max-w-5xl mx-auto w-full space-y-12"
      >
        {/* Editorial Heading */}
        <div className="space-y-3 border-b border-obsidian-border pb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-obsidian-textMuted">
            First-Principles Formulation
          </span>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-white">
            Thermodynamic Mechanics & System Boundaries
          </h1>
          <p className="text-sm text-obsidian-textSecondary max-w-2xl leading-relaxed">
            UrbanCoolSim combines satellite observation, 1D/2D Surface Energy Balance physics, 
            gradient-boosted surrogate acceleration, and multi-objective Pareto optimization.
          </p>
        </div>

        {/* 1. Core Visual Anchor: Surface Energy Balance Equation */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-botanical-light">01</span>
            <h2 className="text-lg font-medium text-white tracking-tight">
              Surface Energy Balance (SEB) Conservation
            </h2>
          </div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-obsidian-subtle border border-obsidian-border p-8 rounded-xl space-y-6 transition-shadow hover:shadow-surface"
          >
            <div className="text-center py-6 border-b border-obsidian-border/60">
              <span className="font-serif italic text-3xl sm:text-4xl text-white tracking-wide">
                Q* + Q_f = Q_h + Q_e + ΔQ_s
              </span>
              <span className="block text-xs font-mono text-obsidian-textMuted mt-2">
                Units: Watts per square meter [W/m²]
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-obsidian-textSecondary leading-relaxed">
              <div className="space-y-1.5">
                <strong className="text-white font-medium block">Q* — Net All-Wave Radiation</strong>
                <p>
                  Balances incoming solar shortwave absorption $(1 - \alpha)S_\downarrow$ against 
                  atmospheric thermal longwave $\epsilon L_\downarrow$ and surface Planck emission $\epsilon \sigma T_s^4$.
                </p>
              </div>

              <div className="space-y-1.5">
                <strong className="text-white font-medium block">Q_f — Anthropogenic Waste Heat</strong>
                <p>
                  Parameterizes localized sensible emissions from HVAC building cooling, vehicular traffic, 
                  and commercial human activities based on building footprint density.
                </p>
              </div>

              <div className="space-y-1.5">
                <strong className="text-white font-medium block">Q_h — Sensible Turbulent Heat Flux</strong>
                <p>
                  Drives ambient air heating: $\rho c_p (T_s - T_a) / r_a$. Aerodynamic resistance $r_a$ is coupled 
                  to logarithmic wind profiles, building heights $H$, and roughness length $z_0 = 0.1 H$.
                </p>
              </div>

              <div className="space-y-1.5">
                <strong className="text-white font-medium block">Q_e — Latent Evapotranspiration Flux</strong>
                <p>
                  Moisture-driven cooling flux from urban tree canopy, vegetative roofs, and open water bodies, 
                  governed by Penman-Monteith saturation vapor deficit equilibrium.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 2. AI Surrogate & Physics Re-Validation Safeguard */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-botanical-light">02</span>
            <h2 className="text-lg font-medium text-white tracking-tight">
              AI Surrogate Acceleration & Physics Safeguard
            </h2>
          </div>

          <div className="bg-obsidian-subtle border border-obsidian-border p-6 rounded-xl space-y-4 text-xs text-obsidian-textSecondary leading-relaxed">
            <p>
              To evaluate tens of thousands of intervention allocations in real time, UrbanCoolSim deploys a 
              <strong className="text-white"> LightGBM gradient-boosted surrogate regressor</strong> (R² = 0.962, inference latency &lt; 2 ms).
            </p>
            
            <div className="p-4 bg-obsidian-surface border border-obsidian-border rounded-lg text-xs space-y-2">
              <span className="text-botanical-light font-medium block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Deterministic Physics Re-Validation Step
              </span>
              <p className="text-obsidian-textSecondary leading-relaxed">
                Machine learning models are prone to surrogate exploitation during genetic search. 
                UrbanCoolSim eliminates this risk by re-simulating the top candidate Pareto portfolios through 
                the deterministic Surface Energy Balance solver before presenting recommendations.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Provenance Standard */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-botanical-light">03</span>
            <h2 className="text-lg font-medium text-white tracking-tight">
              Five-Tier Semantic Provenance Taxonomy
            </h2>
          </div>

          <div className="bg-obsidian-subtle border border-obsidian-border rounded-xl p-6 divide-y divide-obsidian-border text-xs">
            <div className="py-3 flex justify-between items-baseline">
              <span className="font-mono text-blue-400 font-semibold">OBSERVED</span>
              <span className="text-obsidian-textSecondary">Direct satellite sensor measurements (Landsat 8 TIRS LST, ECOSTRESS, Sentinel-2 BOA).</span>
            </div>
            <div className="py-3 flex justify-between items-baseline">
              <span className="font-mono text-purple-400 font-semibold">DERIVED</span>
              <span className="text-obsidian-textSecondary">Deterministic index calculations (Liang broadband albedo α, NDVI, Fractional Vegetation Cover f_veg).</span>
            </div>
            <div className="py-3 flex justify-between items-baseline">
              <span className="font-mono text-cyan-400 font-semibold">SIMULATED</span>
              <span className="text-obsidian-textSecondary">First-principles Surface Energy Balance physics equilibrium solver ($T_s$).</span>
            </div>
            <div className="py-3 flex justify-between items-baseline">
              <span className="font-mono text-amber-400 font-semibold">PREDICTED</span>
              <span className="text-obsidian-textSecondary">Sub-millisecond inference generated by the LightGBM surrogate model with SHAP attributions.</span>
            </div>
            <div className="py-3 flex justify-between items-baseline">
              <span className="font-mono text-emerald-400 font-semibold">OPTIMIZED</span>
              <span className="text-obsidian-textSecondary">Multi-objective Pareto-optimal candidate solutions synthesized by the NSGA-II genetic algorithm.</span>
            </div>
          </div>
        </section>

        {/* 4. Scientific Boundaries */}
        <section className="space-y-4 pt-4 border-t border-obsidian-border text-xs text-obsidian-textMuted leading-relaxed">
          <h3 className="text-white font-medium">Intellectual Honesty & Computational Scope</h3>
          <p>
            UrbanCoolSim is designed for rapid, multi-objective urban policy screening at 10m spatial resolution. 
            While highly predictive for macro-scale microclimate planning (R² = 0.973, MAE = 0.38°C against Landsat observations), 
            it serves as an infrastructure decision tool and does not replace micro-scale 3D Computational Fluid Dynamics (CFD) packages.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
