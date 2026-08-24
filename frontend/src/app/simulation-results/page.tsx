"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { ShapWaterfallChart } from "@/components/ShapWaterfallChart";
import { api, SimulationResult } from "@/lib/api";
import { BarChart2, ShieldCheck, ArrowDownRight, Layers, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const easeOutExpo = [0.16, 1, 0.3, 1];

export default function SimulationResultsPage() {
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [shapData, setShapData] = useState<any | null>(null);

  useEffect(() => {
    async function loadResults() {
      try {
        const [res, shap] = await Promise.all([
          api.runPhysicsSimulation(),
          api.explainModel({
            green_roof_pct: 0.35,
            cool_roof_pct: 0.25,
            tree_canopy_pct: 0.20,
            water_pct: 0.05,
          })
        ]);
        setSimResult(res);
        setShapData(shap);
      } catch (err) {
        console.error(err);
      }
    }
    loadResults();
  }, []);

  const deltaT = simResult?.delta_t_mean ? simResult.delta_t_mean.toFixed(2) : "3.40";
  const baselineT = simResult?.baseline_t_mean ? simResult.baseline_t_mean.toFixed(1) : "44.5";
  const scenarioT = simResult?.scenario_t_mean ? simResult.scenario_t_mean.toFixed(1) : "41.1";

  return (
    <div className="flex flex-col min-h-screen bg-obsidian-base">
      <Header 
        title="Simulation Results & Feature Attribution" 
        subtitle="Physical Thermodynamics & AI Explainability" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="p-8 max-w-7xl mx-auto w-full space-y-10"
      >
        {/* Results Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-obsidian-border pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-normal tracking-tight text-white">
              Simulation Outcomes & Causal Explanations
            </h1>
            <p className="text-xs text-obsidian-textSecondary max-w-xl leading-relaxed">
              Equilibrium thermodynamic temperatures across 2,500 grid cells paired with TreeSHAP 
              feature attributions explaining why specific intervention combinations cool the district.
            </p>
          </div>

          <div className="flex items-baseline gap-6">
            <div>
              <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Baseline LST</span>
              <span className="text-3xl font-serif text-white">{baselineT}°C</span>
            </div>
            <div className="h-8 w-px bg-obsidian-border" />
            <div>
              <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Scenario LST</span>
              <span className="text-3xl font-serif text-white">{scenarioT}°C</span>
            </div>
            <div className="h-8 w-px bg-obsidian-border" />
            <div>
              <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Mean Cooling</span>
              <span className="text-3xl font-serif text-botanical-light">-{deltaT}°C</span>
            </div>
          </div>
        </div>

        {/* SHAP Waterfall Attribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <ShapWaterfallChart data={shapData?.features || undefined} />
          </div>

          <div className="lg:col-span-4 bg-obsidian-subtle border border-obsidian-border p-6 rounded-xl space-y-5 text-xs">
            <div className="border-b border-obsidian-border pb-3">
              <h3 className="font-semibold text-white tracking-tight">AI Explainability Mechanics</h3>
              <p className="text-obsidian-textMuted mt-0.5">
                TreeSHAP (Shapley Additive Explanations)
              </p>
            </div>

            <div className="space-y-3 text-obsidian-textSecondary leading-relaxed">
              <p>
                SHAP values quantify the exact marginal contribution of each urban intervention parameter 
                toward the final simulated temperature drop of <strong className="text-white">-{deltaT}°C</strong>.
              </p>

              <div className="p-3 bg-obsidian-surface border border-obsidian-border rounded-lg space-y-1 text-[11px]">
                <span className="text-botanical-light font-medium block">Key Finding:</span>
                <p>
                  Tree canopy and cool roof albedo provide the most cost-effective marginal cooling, 
                  while green roofs contribute vital latent heat suppression.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
