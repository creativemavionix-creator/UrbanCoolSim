"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { DigitalTwinMap } from "@/components/DigitalTwinMap";
import { EnergyBalanceChart } from "@/components/EnergyBalanceChart";
import { api, DigitalTwinGrid, SimulationResult } from "@/lib/api";
import { ArrowRight, Sparkles, TrendingDown, DollarSign, Droplets, MapPin } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const easeOutExpo = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutExpo }
  }
};

export default function DashboardPage() {
  const [grid, setGrid] = useState<DigitalTwinGrid | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [gridData, simRes] = await Promise.all([
          api.getDigitalTwinGrid(),
          api.runPhysicsSimulation()
        ]);
        setGrid(gridData);
        setSimResult(simRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const baselineTemp = simResult?.baseline_t_mean ? simResult.baseline_t_mean.toFixed(1) : "44.5";
  const coolingBenefit = simResult?.delta_t_mean ? simResult.delta_t_mean.toFixed(1) : "3.4";

  return (
    <div className="flex flex-col min-h-screen bg-obsidian-base">
      <Header 
        title="Executive Heat Intelligence" 
        subtitle="Urban Climate Digital Twin & Optimization" 
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-8 max-w-7xl mx-auto w-full space-y-10"
      >
        {/* Executive Opening Statement & Spatial Hero Metric */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-obsidian-border pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-obsidian-textMuted">
              <MapPin className="w-3.5 h-3.5 text-botanical-light" />
              <span>National Capital Territory · Connaught Place</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-white">
              Surface Thermal State & Intervention Impact
            </h1>
            <p className="text-sm text-obsidian-textSecondary max-w-2xl leading-relaxed">
              Localized heat risk is acutely concentrated across high building density zones. 
              Physical thermodynamics and multi-objective Pareto optimization project up to a 
              <strong className="text-white font-medium"> -{coolingBenefit}°C</strong> cooling reduction across the microgrid.
            </p>
          </div>

          <div className="flex items-baseline gap-8 shrink-0">
            <div>
              <span className="text-[11px] font-mono text-obsidian-textMuted uppercase tracking-wider block">
                Observed Baseline LST
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-light text-white font-serif tracking-tight">
                  {baselineTemp}
                </span>
                <span className="text-xl text-obsidian-textMuted">°C</span>
              </div>
            </div>

            <div className="h-10 w-px bg-obsidian-border hidden sm:block" />

            <div>
              <span className="text-[11px] font-mono text-obsidian-textMuted uppercase tracking-wider block">
                Achievable Cooling
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-light text-botanical-light font-serif tracking-tight">
                  -{coolingBenefit}
                </span>
                <span className="text-xl text-botanical-light/70">°C</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hero Spatial Visual + Supporting Evidence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Spatial Thermal Map (The Hero) */}
          <motion.div variants={itemVariants} className="lg:col-span-7 space-y-3">
            <div className="flex justify-between items-baseline px-1">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">10m Spatial Digital Twin</h2>
                <p className="text-xs text-obsidian-textMuted">Observed Landsat 8 TIRS & Calibrated SEB Microgrid</p>
              </div>
              <span className="text-[11px] font-mono text-obsidian-textSecondary">
                2,500 Cells (10m x 10m)
              </span>
            </div>

            <DigitalTwinMap gridData={grid} />
          </motion.div>

          {/* Supporting Decision Evidence Column */}
          <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
            {/* Pareto-Optimal Recommendation Card */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-obsidian-subtle border border-obsidian-border p-6 rounded-xl space-y-5 transition-shadow hover:shadow-surface"
            >
              <div className="flex justify-between items-center border-b border-obsidian-border pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-botanical-light" />
                  <span className="text-xs font-mono uppercase tracking-wider text-obsidian-textSecondary">
                    Optimal Portfolio
                  </span>
                </div>
                <span className="text-[11px] font-mono text-white bg-obsidian-surface px-2 py-0.5 rounded border border-obsidian-border">
                  NSGA-II Candidate #04
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white tracking-tight">
                  Connaught Place Balanced Resilience Strategy
                </h3>
                <p className="text-xs text-obsidian-textSecondary leading-relaxed">
                  Engineered across multi-objective trade-offs between capital expenditure, water scarcity, and sensible heat flux reduction.
                </p>
              </div>

              {/* Strategy Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-obsidian-surface/60 border border-obsidian-border/60">
                  <span className="text-[11px] text-obsidian-textMuted block">Green Roofs</span>
                  <span className="text-sm font-mono font-medium text-white">35% Roof Area</span>
                  <span className="text-[10px] text-obsidian-textMuted block mt-0.5">Latent cooling ($75/m²)</span>
                </div>

                <div className="p-3 rounded-lg bg-obsidian-surface/60 border border-obsidian-border/60">
                  <span className="text-[11px] text-obsidian-textMuted block">Cool Roofs</span>
                  <span className="text-sm font-mono font-medium text-white">25% Roof Area</span>
                  <span className="text-[10px] text-obsidian-textMuted block mt-0.5">High albedo ($18/m²)</span>
                </div>

                <div className="p-3 rounded-lg bg-obsidian-surface/60 border border-obsidian-border/60">
                  <span className="text-[11px] text-obsidian-textMuted block">Tree Canopy</span>
                  <span className="text-sm font-mono font-medium text-botanical-light">+20% Arteries</span>
                  <span className="text-[10px] text-obsidian-textMuted block mt-0.5">Ground shading & ET</span>
                </div>

                <div className="p-3 rounded-lg bg-obsidian-surface/60 border border-obsidian-border/60">
                  <span className="text-[11px] text-obsidian-textMuted block">Water Bodies</span>
                  <span className="text-sm font-mono font-medium text-white">5% Surface</span>
                  <span className="text-[10px] text-obsidian-textMuted block mt-0.5">Evaporative heat sink</span>
                </div>
              </div>

              {/* Cost & Water Demand Metrics */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-obsidian-border text-xs">
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 text-obsidian-textMuted" />
                  <div>
                    <span className="text-[10px] text-obsidian-textMuted block uppercase">Estimated CapEx</span>
                    <strong className="font-mono text-sm text-white">$345,000 USD</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Droplets className="w-4 h-4 text-obsidian-textMuted" />
                  <div>
                    <span className="text-[10px] text-obsidian-textMuted block uppercase">Annual Water</span>
                    <strong className="font-mono text-sm text-white">4,200 m³/yr</strong>
                  </div>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-1">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Link
                    href="/optimization"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-obsidian-base text-xs font-semibold hover:bg-sand-100 transition-colors shadow-subtle group"
                  >
                    <span>Explore Pareto Optimization Trade-Offs</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Surface Energy Balance Conservation Chart */}
            <EnergyBalanceChart data={simResult?.energy_fluxes_json} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
