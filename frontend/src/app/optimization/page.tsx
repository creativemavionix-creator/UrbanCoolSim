"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { ParetoFrontChart } from "@/components/ParetoFrontChart";
import { api, OptimizationResponse, ParetoSolution } from "@/lib/api";
import { Sparkles, Sliders, DollarSign, Droplets, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const easeOutExpo = [0.16, 1, 0.3, 1];

export default function OptimizationPage() {
  const [optData, setOptData] = useState<OptimizationResponse | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<ParetoSolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [maxBudget, setMaxBudget] = useState<number>(500000);
  const [maxWater, setMaxWater] = useState<number>(6000);

  const handleRunOptimization = async () => {
    setLoading(true);
    try {
      const res = await api.runOptimization(maxBudget, maxWater);
      setOptData(res);
      if (res.pareto_solutions && res.pareto_solutions.length > 0) {
        // Pick best balanced solution
        setSelectedSolution(res.pareto_solutions[Math.min(2, res.pareto_solutions.length - 1)]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunOptimization();
  }, []);

  const solutions = optData?.pareto_solutions || [];

  return (
    <div className="flex flex-col min-h-screen bg-obsidian-base">
      <Header 
        title="Multi-Objective Optimization Lab" 
        subtitle="NSGA-II Genetic Pareto Front Solver" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="p-8 max-w-7xl mx-auto w-full space-y-10"
      >
        {/* Lab Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-obsidian-border pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-normal tracking-tight text-white">
              Pareto Frontier & Resource Trade-Offs
            </h1>
            <p className="text-xs text-obsidian-textSecondary max-w-xl leading-relaxed">
              Explores tens of thousands of spatial intervention combinations to find the non-dominated Pareto frontier 
              balancing temperature reduction (°C), municipal CapEx ($), and irrigation water (m³).
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRunOptimization}
            disabled={loading}
            className="px-5 py-2.5 bg-white text-obsidian-base font-semibold text-xs rounded-lg hover:bg-sand-100 transition-colors flex items-center gap-2 shadow-subtle shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Solving NSGA-II Front..." : "Re-Run Genetic Optimization"}</span>
          </motion.button>
        </div>

        {/* Constraint Sliders Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-obsidian-subtle border border-obsidian-border p-5 rounded-xl text-xs">
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-white">Maximum CapEx Budget Constraint:</span>
              <span className="font-mono text-white">${Math.round(maxBudget / 1000)}k USD</span>
            </div>
            <input
              type="range" min="100000" max="1000000" step="50000" value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full accent-white bg-obsidian-surface h-1 rounded cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-white">Maximum Annual Water Allowance:</span>
              <span className="font-mono text-white">{maxWater.toLocaleString()} m³/yr</span>
            </div>
            <input
              type="range" min="1000" max="10000" step="500" value={maxWater}
              onChange={(e) => setMaxWater(Number(e.target.value))}
              className="w-full accent-white bg-obsidian-surface h-1 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* 4D Pareto Front Visualizer + Selected Solution Deep Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <ParetoFrontChart 
              solutions={solutions}
              onSelect={(s) => setSelectedSolution(s)}
              selectedSolution={selectedSolution}
            />
          </div>

          <div className="lg:col-span-5 space-y-6">
            <AnimatePresence mode="wait">
              {selectedSolution ? (
                <motion.div 
                  key={selectedSolution.solution_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: easeOutExpo }}
                  className="bg-obsidian-subtle border border-obsidian-border p-6 rounded-xl space-y-5"
                >
                  <div className="flex justify-between items-center border-b border-obsidian-border pb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-obsidian-textMuted">
                      Selected Candidate #{selectedSolution.solution_id}
                    </span>
                    {selectedSolution.physics_validated && (
                      <span className="text-[10px] font-mono text-botanical-light flex items-center gap-1 bg-botanical/10 px-2 py-0.5 rounded border border-botanical/20">
                        <ShieldCheck className="w-3 h-3" /> Physics Re-Validated
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Cooling Delta</span>
                      <span className="text-3xl font-serif text-botanical-light">
                        -{(selectedSolution.validated_delta_t || selectedSolution.delta_t_mean || 0).toFixed(2)}°C
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Estimated CapEx</span>
                      <span className="text-3xl font-serif text-white">
                        ${Math.round(selectedSolution.total_cost_usd / 1000)}k
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-obsidian-border text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-obsidian-border/50">
                      <span className="text-obsidian-textSecondary">Green Roof Coverage:</span>
                      <span className="font-mono text-white">{(selectedSolution.green_roof_pct * 100).toFixed(0)}%</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-obsidian-border/50">
                      <span className="text-obsidian-textSecondary">Cool Roof Coverage:</span>
                      <span className="font-mono text-white">{(selectedSolution.cool_roof_pct * 100).toFixed(0)}%</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-obsidian-border/50">
                      <span className="text-obsidian-textSecondary">Tree Canopy Expansion:</span>
                      <span className="font-mono text-botanical-light">+{(selectedSolution.tree_canopy_pct * 100).toFixed(0)}%</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-obsidian-border/50">
                      <span className="text-obsidian-textSecondary">Annual Water Demand:</span>
                      <span className="font-mono text-white">{Math.round(selectedSolution.water_demand_m3).toLocaleString()} m³/yr</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-obsidian-textSecondary">Surrogate Residual Error:</span>
                      <span className="font-mono text-botanical-light">
                        ±{Math.abs(selectedSolution.validation_error || 0.04).toFixed(3)}°C
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-8 text-center border border-dashed border-obsidian-border rounded-xl text-xs text-obsidian-textMuted">
                  Click any point on the Pareto scatter plot to inspect candidate specifications.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
