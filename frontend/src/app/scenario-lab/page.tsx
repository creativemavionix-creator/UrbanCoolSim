"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Layers, Sliders, CheckCircle2, ArrowRight, Sparkles, TrendingDown, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const easeOutExpo = [0.16, 1, 0.3, 1];

interface ScenarioPreset {
  id: string;
  name: string;
  tag: string;
  deltaT: string;
  cost: string;
  water: string;
  description: string;
  greenRoof: string;
  coolRoof: string;
  trees: string;
  waterPct: string;
  colorGrad: string;
}

const presets: ScenarioPreset[] = [
  {
    id: "baseline",
    name: "01 · Current Baseline (No Action)",
    tag: "Observed",
    deltaT: "0.0°C",
    cost: "$0",
    water: "0 m³",
    description: "Current high-density urban fabric with low albedo and minimal tree canopy.",
    greenRoof: "0%",
    coolRoof: "0%",
    trees: "0%",
    waterPct: "0%",
    colorGrad: "from-rose-600 to-amber-600"
  },
  {
    id: "albedo",
    name: "02 · High-Albedo Cool Roof Program",
    tag: "Budget Efficient",
    deltaT: "-1.8°C",
    cost: "$85,000",
    water: "0 m³",
    description: "Extensive application of high-reflectance coatings across commercial rooftops.",
    greenRoof: "0%",
    coolRoof: "60%",
    trees: "5%",
    waterPct: "0%",
    colorGrad: "from-amber-600 to-emerald-600"
  },
  {
    id: "green",
    name: "03 · Intensive Green Infrastructure",
    tag: "Ecological",
    deltaT: "-2.6°C",
    cost: "$290,000",
    water: "5,800 m³",
    description: "Extensive rooftop gardens and dense tree plantings along all radial pedestrian corridors.",
    greenRoof: "50%",
    coolRoof: "10%",
    trees: "30%",
    waterPct: "2%",
    colorGrad: "from-emerald-600 to-teal-600"
  },
  {
    id: "hybrid",
    name: "04 · Pareto-Optimal Hybrid Matrix",
    tag: "Recommended",
    deltaT: "-3.4°C",
    cost: "$345,000",
    water: "4,200 m³",
    description: "NSGA-II multi-objective solution balancing high-albedo roofs with shaded tree corridors.",
    greenRoof: "35%",
    coolRoof: "25%",
    trees: "20%",
    waterPct: "5%",
    colorGrad: "from-emerald-600 to-sky-600"
  }
];

export default function ScenarioLabPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioPreset>(presets[3]);

  return (
    <div className="flex flex-col min-h-screen bg-obsidian-base">
      <Header 
        title="Scenario Comparison Lab" 
        subtitle="Side-by-Side Policy & Intervention Evaluation" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="p-8 max-w-7xl mx-auto w-full space-y-10"
      >
        {/* Editorial Narrative Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-obsidian-border pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-normal tracking-tight text-white">
              Comparative Urban Scenarios
            </h1>
            <p className="text-xs text-obsidian-textSecondary max-w-xl leading-relaxed">
              Evaluate how distinct intervention combinations alter localized surface thermodynamics, 
              capital budgets, and water consumption profiles across Connaught Place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-obsidian-textMuted uppercase">Active Evaluation:</span>
            <span className="px-3 py-1 bg-obsidian-surface border border-obsidian-border rounded-lg text-xs font-mono text-botanical-light">
              {selectedScenario.name.split("·")[1]}
            </span>
          </div>
        </div>

        {/* 4 Comparative Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {presets.map((preset) => {
            const isSelected = selectedScenario.id === preset.id;
            return (
              <motion.div
                key={preset.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedScenario(preset)}
                className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                  isSelected
                    ? "bg-obsidian-subtle border-botanical-light shadow-surface"
                    : "bg-obsidian-subtle/50 border-obsidian-border hover:border-obsidian-border/80"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      isSelected 
                        ? "bg-botanical/20 border-botanical/40 text-botanical-light" 
                        : "bg-obsidian-surface border-obsidian-border text-obsidian-textMuted"
                    }`}>
                      {preset.tag}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-botanical-light animate-pulse" />
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
                    {preset.name}
                  </h3>

                  <p className="text-[11px] text-obsidian-textMuted leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                {/* Mini Thermal Preview Gradient */}
                <div className={`h-12 w-full rounded-lg bg-gradient-to-r ${preset.colorGrad} opacity-80 flex items-center justify-end px-3 shadow-inner`}>
                  <span className="font-serif text-lg text-white font-medium drop-shadow">
                    {preset.deltaT}
                  </span>
                </div>

                {/* Key Metrics */}
                <div className="space-y-2 pt-2 border-t border-obsidian-border/60 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-obsidian-textMuted">Cooling Benefit:</span>
                    <strong className={preset.deltaT !== "0.0°C" ? "font-mono text-botanical-light" : "font-mono text-obsidian-textMuted"}>
                      {preset.deltaT}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-obsidian-textMuted">Capital CapEx:</span>
                    <span className="font-mono text-white">{preset.cost}</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-obsidian-textMuted">Water Demand:</span>
                    <span className="font-mono text-white">{preset.water}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Scenario Deep Dive */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedScenario.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: easeOutExpo }}
            className="bg-obsidian-subtle border border-obsidian-border p-8 rounded-xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-obsidian-border pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-obsidian-textMuted block">
                  Scenario Specifications
                </span>
                <h2 className="text-lg font-medium text-white tracking-tight mt-0.5">
                  {selectedScenario.name}
                </h2>
              </div>

              <div className="flex items-baseline gap-6">
                <div>
                  <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Cooling</span>
                  <span className="text-2xl font-serif text-botanical-light font-light">{selectedScenario.deltaT}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">CapEx</span>
                  <span className="text-2xl font-serif text-white font-light">{selectedScenario.cost}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Water</span>
                  <span className="text-2xl font-serif text-white font-light">{selectedScenario.water}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-obsidian-surface border border-obsidian-border">
                <span className="text-[11px] text-obsidian-textMuted block">Green Roofs</span>
                <strong className="text-sm font-mono text-white mt-1 block">{selectedScenario.greenRoof}</strong>
              </div>
              <div className="p-4 rounded-lg bg-obsidian-surface border border-obsidian-border">
                <span className="text-[11px] text-obsidian-textMuted block">Cool Roofs</span>
                <strong className="text-sm font-mono text-white mt-1 block">{selectedScenario.coolRoof}</strong>
              </div>
              <div className="p-4 rounded-lg bg-obsidian-surface border border-obsidian-border">
                <span className="text-[11px] text-obsidian-textMuted block">Canopy Trees</span>
                <strong className="text-sm font-mono text-white mt-1 block">{selectedScenario.trees}</strong>
              </div>
              <div className="p-4 rounded-lg bg-obsidian-surface border border-obsidian-border">
                <span className="text-[11px] text-obsidian-textMuted block">Water Bodies</span>
                <strong className="text-sm font-mono text-white mt-1 block">{selectedScenario.waterPct}</strong>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
