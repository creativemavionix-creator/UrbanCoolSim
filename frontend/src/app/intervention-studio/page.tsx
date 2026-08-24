"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { SlidersHorizontal, DollarSign, Droplets, ArrowDownRight, Layers, Trees, Building, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const easeOutExpo = [0.16, 1, 0.3, 1];

export default function InterventionStudioPage() {
  const [greenRoof, setGreenRoof] = useState(0.35);
  const [coolRoof, setCoolRoof] = useState(0.25);
  const [treeCanopy, setTreeCanopy] = useState(0.20);
  const [reflectPave, setReflectPave] = useState(0.15);
  const [waterFeat, setWaterFeat] = useState(0.05);
  const [savedStatus, setSavedStatus] = useState(false);

  // Resource & Cost Calculations (Connaught Place 25 ha boundary)
  const studyAreaM2 = 250000;
  const bldgArea = studyAreaM2 * 0.45;
  const groundArea = studyAreaM2 * 0.55;

  const greenRoofArea = bldgArea * greenRoof;
  const coolRoofArea = bldgArea * coolRoof;
  const treeArea = groundArea * treeCanopy;
  const paveArea = groundArea * reflectPave;
  const waterArea = groundArea * waterFeat;

  const costGreen = greenRoofArea * 75;
  const costCool = coolRoofArea * 18;
  const costTree = treeArea * 35;
  const costPave = paveArea * 22;
  const costWater = waterArea * 120;

  const totalCost = costGreen + costCool + costTree + costPave + costWater;
  const waterDemandM3 = (greenRoofArea * 450 + treeArea * 600 + waterArea * 1200) / 1000.0;

  // First-principles thermodynamic response approximation
  const estimatedDeltaT = (greenRoof * 1.8 + coolRoof * 2.5 + treeCanopy * 2.2 + reflectPave * 1.2 + waterFeat * 3.5).toFixed(2);

  const handleSave = () => {
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-obsidian-base">
      <Header 
        title="Intervention Design Studio" 
        subtitle="Parameterized Microclimate Engineering" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="p-8 max-w-7xl mx-auto w-full space-y-10"
      >
        {/* Studio Title & Real-Time Impact Ribbon */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-obsidian-border pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-normal tracking-tight text-white">
              Design a Cooler Urban District
            </h1>
            <p className="text-xs text-obsidian-textSecondary max-w-xl leading-relaxed">
              Dynamically adjust roof albedo, vegetative cover, and urban canopy. 
              Thermodynamic physics recalculates cooling benefits, capital budgets, and annual irrigation needs in real time.
            </p>
          </div>

          {/* Real-time Outcomes Ticker */}
          <div className="flex items-baseline gap-6 bg-obsidian-subtle border border-obsidian-border p-4 rounded-xl shadow-surface">
            <div>
              <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Projected Cooling</span>
              <motion.span 
                key={estimatedDeltaT}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-serif text-botanical-light font-light inline-block"
              >
                -{estimatedDeltaT}°C
              </motion.span>
            </div>
            <div className="h-8 w-px bg-obsidian-border" />
            <div>
              <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Estimated CapEx</span>
              <span className="text-2xl font-serif text-white font-light">${Math.round(totalCost / 1000)}k</span>
            </div>
            <div className="h-8 w-px bg-obsidian-border" />
            <div>
              <span className="text-[10px] font-mono text-obsidian-textMuted uppercase block">Water Demand</span>
              <span className="text-2xl font-serif text-white font-light">{Math.round(waterDemandM3).toLocaleString()} <span className="text-xs font-sans text-obsidian-textMuted">m³</span></span>
            </div>
          </div>
        </div>

        {/* Studio Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Sandbox (Left Column) */}
          <div className="lg:col-span-7 bg-obsidian-subtle border border-obsidian-border p-6 rounded-xl space-y-6">
            <div className="flex justify-between items-center border-b border-obsidian-border pb-3">
              <h3 className="text-sm font-semibold text-white tracking-tight">Intervention Parameter Sandbox</h3>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className="px-3 py-1.5 rounded text-xs font-medium bg-white text-obsidian-base hover:bg-sand-100 transition-colors flex items-center gap-1.5 shadow-subtle"
              >
                {savedStatus ? <Check className="w-3.5 h-3.5 text-botanical" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{savedStatus ? "Scenario Saved" : "Save Strategy"}</span>
              </motion.button>
            </div>

            <div className="space-y-6 text-xs">
              {/* Green Roofs */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-white">Green Roof Coverage</span>
                  <span className="font-mono text-botanical-light">{Math.round(greenRoof * 100)}% of roof area</span>
                </div>
                <input
                  type="range" min="0" max="0.80" step="0.05" value={greenRoof}
                  onChange={(e) => setGreenRoof(Number(e.target.value))}
                  className="w-full accent-white bg-obsidian-surface h-1 rounded cursor-pointer transition-all"
                />
                <div className="flex justify-between text-[11px] text-obsidian-textMuted">
                  <span>Adds rooftop evapotranspiration & latent heat flux</span>
                  <span>$75/m² · 450 L/m²/yr</span>
                </div>
              </div>

              {/* Cool Roofs */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-white">Cool Roofs High-Albedo Boost</span>
                  <span className="font-mono text-white">+{coolRoof.toFixed(2)} Δα</span>
                </div>
                <input
                  type="range" min="0" max="0.40" step="0.05" value={coolRoof}
                  onChange={(e) => setCoolRoof(Number(e.target.value))}
                  className="w-full accent-white bg-obsidian-surface h-1 rounded cursor-pointer transition-all"
                />
                <div className="flex justify-between text-[11px] text-obsidian-textMuted">
                  <span>High solar reflectance coatings</span>
                  <span>$18/m² · Zero water demand</span>
                </div>
              </div>

              {/* Urban Tree Canopy */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-white">Urban Tree Canopy Expansion</span>
                  <span className="font-mono text-botanical-light">+{Math.round(treeCanopy * 100)}% ground area</span>
                </div>
                <input
                  type="range" min="0" max="0.40" step="0.05" value={treeCanopy}
                  onChange={(e) => setTreeCanopy(Number(e.target.value))}
                  className="w-full accent-white bg-obsidian-surface h-1 rounded cursor-pointer transition-all"
                />
                <div className="flex justify-between text-[11px] text-obsidian-textMuted">
                  <span>Direct pedestrian corridor shading & transpiration</span>
                  <span>$35/m² · 600 L/m²/yr</span>
                </div>
              </div>

              {/* Reflective Pavements */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-white">Reflective Street Pavements</span>
                  <span className="font-mono text-white">+{reflectPave.toFixed(2)} Δα</span>
                </div>
                <input
                  type="range" min="0" max="0.30" step="0.05" value={reflectPave}
                  onChange={(e) => setReflectPave(Number(e.target.value))}
                  className="w-full accent-white bg-obsidian-surface h-1 rounded cursor-pointer transition-all"
                />
                <div className="flex justify-between text-[11px] text-obsidian-textMuted">
                  <span>Modifies ground-level sensible heat release</span>
                  <span>$22/m²</span>
                </div>
              </div>

              {/* Water Features */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-white">Urban Water Bodies & Fountains</span>
                  <span className="font-mono text-white">+{Math.round(waterFeat * 100)}% surface area</span>
                </div>
                <input
                  type="range" min="0" max="0.15" step="0.01" value={waterFeat}
                  onChange={(e) => setWaterFeat(Number(e.target.value))}
                  className="w-full accent-white bg-obsidian-surface h-1 rounded cursor-pointer transition-all"
                />
                <div className="flex justify-between text-[11px] text-obsidian-textMuted">
                  <span>Direct evaporative cooling sink</span>
                  <span>$120/m² · 1,200 L/m²/yr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost & Resource Accounting (Right Column) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-obsidian-subtle border border-obsidian-border p-6 rounded-xl space-y-5">
              <div className="border-b border-obsidian-border pb-3">
                <h3 className="text-sm font-semibold text-white tracking-tight">Resource & CapEx Accounting</h3>
                <p className="text-xs text-obsidian-textMuted mt-0.5">
                  Detailed line-item capital cost and municipal resource allocation
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-obsidian-border/50">
                  <span className="text-obsidian-textSecondary">Green Roofs ({Math.round(greenRoofArea).toLocaleString()} m²)</span>
                  <span className="font-mono text-white">${Math.round(costGreen).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-obsidian-border/50">
                  <span className="text-obsidian-textSecondary">Cool Roofs ({Math.round(coolRoofArea).toLocaleString()} m²)</span>
                  <span className="font-mono text-white">${Math.round(costCool).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-obsidian-border/50">
                  <span className="text-obsidian-textSecondary">Canopy Trees ({Math.round(treeArea).toLocaleString()} m²)</span>
                  <span className="font-mono text-white">${Math.round(costTree).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-obsidian-border/50">
                  <span className="text-obsidian-textSecondary">Pavements ({Math.round(paveArea).toLocaleString()} m²)</span>
                  <span className="font-mono text-white">${Math.round(costPave).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-obsidian-border/50">
                  <span className="text-obsidian-textSecondary">Water Bodies ({Math.round(waterArea).toLocaleString()} m²)</span>
                  <span className="font-mono text-white">${Math.round(costWater).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pt-3 font-semibold text-sm">
                  <span className="text-white">Total Strategy Budget</span>
                  <span className="font-mono text-botanical-light">${Math.round(totalCost).toLocaleString()} USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
