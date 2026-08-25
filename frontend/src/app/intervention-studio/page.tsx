"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { api, DigitalTwinGrid } from "@/lib/api";
import { 
  SlidersHorizontal, 
  DollarSign, 
  Droplets, 
  Trees, 
  Building, 
  Sparkles, 
  Check,
  Target,
  ShieldCheck,
  Paintbrush
} from "lucide-react";

export default function InterventionStudioPage() {
  const [studyArea, setStudyArea] = useState("delhi_cp");
  const [grid, setGrid] = useState<DigitalTwinGrid | null>(null);

  // Intervention Parameters
  const [greenRoof, setGreenRoof] = useState(0.35);
  const [coolRoof, setCoolRoof] = useState(0.25);
  const [treeCanopy, setTreeCanopy] = useState(0.20);
  const [reflectPave, setReflectPave] = useState(0.15);
  const [waterFeat, setWaterFeat] = useState(0.05);

  const [targetZone, setTargetZone] = useState<string>("global");
  const [savedStatus, setSavedStatus] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadGrid = async (areaId: string) => {
    try {
      const res = await api.getDigitalTwinGrid(areaId, 50, 50);
      setGrid(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const savedArea = localStorage.getItem("urbancoolsim_study_area") || "delhi_cp";
    setStudyArea(savedArea);
    loadGrid(savedArea);

    const handleAreaChange = (e: any) => {
      if (e.detail) {
        setStudyArea(e.detail);
        loadGrid(e.detail);
      }
    };
    window.addEventListener("studyAreaChanged", handleAreaChange);
    return () => window.removeEventListener("studyAreaChanged", handleAreaChange);
  }, []);

  // Resource & Cost Calculations (25 ha district boundary)
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
  const estimatedDeltaT = greenRoof * 1.8 + coolRoof * 2.5 + treeCanopy * 2.2 + reflectPave * 1.2 + waterFeat * 3.5;

  // Domain Thermal Colormap
  const getThermalColor = useCallback((norm: number): [number, number, number] => {
    const clamped = Math.max(0, Math.min(1, norm));
    if (clamped < 0.25) {
      const t = clamped / 0.25;
      return [Math.round(37 + t * (6 - 37)), Math.round(99 + t * (182 - 99)), Math.round(235 + t * (212 - 235))];
    } else if (clamped < 0.50) {
      const t = (clamped - 0.25) / 0.25;
      return [Math.round(6 + t * (245 - 6)), Math.round(182 + t * (158 - 182)), Math.round(212 + t * (11 - 212))];
    } else if (clamped < 0.75) {
      const t = (clamped - 0.50) / 0.25;
      return [Math.round(245 + t * (234 - 245)), Math.round(158 + t * (88 - 158)), Math.round(11 + t * (12 - 11))];
    } else {
      const t = (clamped - 0.75) / 0.25;
      return [Math.round(234 + t * (220 - 234)), Math.round(88 + t * (38 - 88)), Math.round(12 + t * (38 - 12))];
    }
  }, []);

  // Real-time 2D Canvas Redraw
  useEffect(() => {
    if (!grid || !grid.layers || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rows = 50;
    const cols = 50;
    const renderSize = 480;
    canvas.width = renderSize;
    canvas.height = renderSize;

    const baseT = grid.layers.baseline_temperature_c;
    const bldgDens = grid.layers.building_density;
    const vegFrac = grid.layers.veg_fraction;

    const offscreen = document.createElement("canvas");
    offscreen.width = cols;
    offscreen.height = rows;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const imgData = offCtx.createImageData(cols, rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const b = baseT[r][c];
        const dens = bldgDens[r][c];
        const veg = vegFrac[r][c];

        let targetMultiplier = 1.0;
        if (targetZone === "zone4_dense" && dens < 0.45) targetMultiplier = 0.2;
        if (targetZone === "zone1_green" && veg < 0.30) targetMultiplier = 0.2;

        const coolDrop = ((coolRoof * dens * 2.8) +
                         (greenRoof * dens * 2.2) +
                         (treeCanopy * (1.0 - dens) * 2.5) +
                         (waterFeat * 3.8)) * targetMultiplier;
        const cellScen = Math.max(26.0, b - coolDrop);

        const norm = (cellScen - 30.0) / (50.0 - 30.0);
        const [R, G, B] = getThermalColor(norm);

        const idx = (r * cols + c) * 4;
        imgData.data[idx] = R;
        imgData.data[idx + 1] = G;
        imgData.data[idx + 2] = B;
        imgData.data[idx + 3] = 255;
      }
    }
    offCtx.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(offscreen, 0, 0, renderSize, renderSize);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.0;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(renderSize / 2, renderSize / 2, renderSize * 0.18, 0, Math.PI * 2);
    ctx.arc(renderSize / 2, renderSize / 2, renderSize * 0.38, 0, Math.PI * 2);
    ctx.stroke();
  }, [grid, greenRoof, coolRoof, treeCanopy, reflectPave, waterFeat, targetZone, getThermalColor]);

  const handleSave = () => {
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-ink-primary select-none">
      <Header 
        title="Intervention Design Studio" 
        subtitle="Parameterized Microclimate Engineering & Real-Time Simulation" 
        onStudyAreaChange={(id) => {
          setStudyArea(id);
          loadGrid(id);
        }}
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Studio Title & Real-Time Impact Ribbon */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-surface-border pb-8">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-cobalt font-semibold">
              Real-Time Simulation Sandbox
            </span>
            <h1 className="editorial-headline text-3xl sm:text-4xl font-normal text-ink-primary">
              Design a Cooler Urban District
            </h1>
            <p className="text-xs text-ink-secondary max-w-xl leading-relaxed">
              Adjust roof albedo, green cover, and shaded pedestrian corridors. 
              The spatial thermodynamic emulator updates temperature fields and municipal budgets in real time (~1.8ms).
            </p>
          </div>

          {/* Real-time Outcomes Ticker with Tabular Figures */}
          <div className="flex items-baseline gap-6 graphite-card p-4 rounded-lg tabular-nums">
            <div>
              <span className="text-[10px] font-mono text-ink-muted uppercase block">Cooling Impact (ΔT)</span>
              <div className="flex items-baseline gap-1">
                <span className="editorial-headline text-3xl text-cobalt tracking-tight">-</span>
                <AnimatedCounter value={estimatedDeltaT} decimals={2} className="editorial-headline text-3xl text-cobalt tracking-tight" />
                <span className="text-sm text-ink-muted font-light font-serif">°C</span>
              </div>
            </div>
            <div className="h-8 w-px bg-surface-border" />
            <div>
              <span className="text-[10px] font-mono text-ink-muted uppercase block">Estimated CapEx</span>
              <span className="editorial-headline text-3xl text-ink-primary tracking-tight">${Math.round(totalCost / 1000)}k</span>
            </div>
            <div className="h-8 w-px bg-surface-border" />
            <div>
              <span className="text-[10px] font-mono text-ink-muted uppercase block">Annual Water</span>
              <span className="editorial-headline text-3xl text-ink-primary tracking-tight">
                {Math.round(waterDemandM3).toLocaleString()} <span className="text-xs font-sans text-ink-muted font-normal">m³</span>
              </span>
            </div>
          </div>
        </div>

        {/* Spatial Zone Focus Pills */}
        <div className="graphite-card p-3.5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="text-ink-secondary font-medium font-mono text-[11px]">Spatial Focus Zone:</span>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "global", label: "Global (All District)" },
              { id: "zone4_dense", label: "Zone 4: Dense Built-Up Core" },
              { id: "zone3_albedo", label: "Zone 3: Commercial Roofs" },
              { id: "zone1_green", label: "Zone 1: Shaded Corridors" }
            ].map((z) => (
              <button
                key={z.id}
                onClick={() => setTargetZone(z.id)}
                className={`px-3 py-1 rounded font-mono text-[11px] transition-colors ${
                  targetZone === z.id
                    ? "bg-cobalt text-white font-medium shadow-sm"
                    : "bg-surface-base text-ink-secondary border border-surface-border hover:text-ink-primary"
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Grid: Sandbox Controls + Live Canvas Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Sandbox */}
          <div className="lg:col-span-7 graphite-card p-6 rounded-lg space-y-5">
            <div className="flex justify-between items-center border-b border-surface-border pb-3">
              <h3 className="text-sm font-semibold text-ink-primary">Intervention Parameter Sandbox</h3>
              <button 
                onClick={handleSave}
                className="btn-cobalt px-3.5 py-1.5 rounded text-xs flex items-center gap-1.5"
              >
                {savedStatus ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{savedStatus ? "Saved" : "Save Strategy"}</span>
              </button>
            </div>

            <div className="space-y-5 text-xs tabular-nums">
              {/* Green Roofs */}
              <div className="space-y-2 p-3.5 rounded bg-surface-base border border-surface-border">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-ink-primary">Green Roof Coverage</span>
                  <span className="font-mono text-cobalt font-semibold">{Math.round(greenRoof * 100)}% roof area</span>
                </div>
                <input
                  type="range" min="0" max="0.80" step="0.05" value={greenRoof}
                  onChange={(e) => setGreenRoof(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-ink-muted">
                  <span>Rooftop evapotranspiration & latent heat flux</span>
                  <span>$75/m² · 450 L/m²/yr</span>
                </div>
              </div>

              {/* Cool Roofs */}
              <div className="space-y-2 p-3.5 rounded bg-surface-base border border-surface-border">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-ink-primary">Cool Roofs High-Albedo Boost</span>
                  <span className="font-mono text-ink-primary font-semibold">+{coolRoof.toFixed(2)} Δα</span>
                </div>
                <input
                  type="range" min="0" max="0.40" step="0.05" value={coolRoof}
                  onChange={(e) => setCoolRoof(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-ink-muted">
                  <span>High solar reflectance coatings</span>
                  <span>$18/m² · Zero water demand</span>
                </div>
              </div>

              {/* Urban Tree Canopy */}
              <div className="space-y-2 p-3.5 rounded bg-surface-base border border-surface-border">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-ink-primary">Urban Tree Canopy Expansion</span>
                  <span className="font-mono text-cobalt font-semibold">+{Math.round(treeCanopy * 100)}% ground area</span>
                </div>
                <input
                  type="range" min="0" max="0.40" step="0.05" value={treeCanopy}
                  onChange={(e) => setTreeCanopy(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-ink-muted">
                  <span>Pedestrian corridor shading & transpiration</span>
                  <span>$35/m² · 600 L/m²/yr</span>
                </div>
              </div>

              {/* Reflective Pavements */}
              <div className="space-y-2 p-3.5 rounded bg-surface-base border border-surface-border">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-ink-primary">Reflective Street Pavements</span>
                  <span className="font-mono text-ink-primary font-semibold">+{reflectPave.toFixed(2)} Δα</span>
                </div>
                <input
                  type="range" min="0" max="0.30" step="0.05" value={reflectPave}
                  onChange={(e) => setReflectPave(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-ink-muted">
                  <span>Street-level sensible heat release</span>
                  <span>$22/m²</span>
                </div>
              </div>

              {/* Water Features */}
              <div className="space-y-2 p-3.5 rounded bg-surface-base border border-surface-border">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-ink-primary">Urban Water Bodies & Retention</span>
                  <span className="font-mono text-ink-primary font-semibold">+{Math.round(waterFeat * 100)}% surface area</span>
                </div>
                <input
                  type="range" min="0" max="0.15" step="0.01" value={waterFeat}
                  onChange={(e) => setWaterFeat(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] text-ink-muted">
                  <span>Evaporative microclimate heat sink</span>
                  <span>$120/m² · 1,200 L/m²/yr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live 2D Canvas + CapEx Ledger */}
          <div className="lg:col-span-5 space-y-6">
            <div className="graphite-card p-5 rounded-lg space-y-3">
              <div className="flex justify-between items-baseline px-1 text-xs">
                <span className="font-mono text-ink-muted uppercase">Live Thermal Response</span>
                <span className="font-mono text-status-safe flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Surrogate (1.8ms)
                </span>
              </div>
              <div className="aspect-square bg-surface-base border border-surface-border rounded overflow-hidden flex items-center justify-center">
                <canvas ref={canvasRef} className="w-full h-full" />
              </div>
            </div>

            {/* Line Item Accounting */}
            <div className="graphite-card p-6 rounded-lg space-y-3 text-xs tabular-nums">
              <div className="border-b border-surface-border pb-2">
                <h3 className="font-medium text-ink-primary">CapEx & Resource Ledger</h3>
              </div>

              <div className="space-y-2 text-ink-secondary">
                <div className="flex justify-between items-center py-1 border-b border-surface-border/40">
                  <span>Green Roofs ({Math.round(greenRoofArea).toLocaleString()} m²)</span>
                  <span className="font-mono text-ink-primary">${Math.round(costGreen).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border/40">
                  <span>Cool Roofs ({Math.round(coolRoofArea).toLocaleString()} m²)</span>
                  <span className="font-mono text-ink-primary">${Math.round(costCool).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border/40">
                  <span>Canopy Trees ({Math.round(treeArea).toLocaleString()} m²)</span>
                  <span className="font-mono text-ink-primary">${Math.round(costTree).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border/40">
                  <span>Reflective Pavements ({Math.round(paveArea).toLocaleString()} m²)</span>
                  <span className="font-mono text-ink-primary">${Math.round(costPave).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border/40">
                  <span>Water Features ({Math.round(waterArea).toLocaleString()} m²)</span>
                  <span className="font-mono text-ink-primary">${Math.round(costWater).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center pt-2 font-medium text-xs">
                  <span className="text-ink-primary">Total Capital Budget</span>
                  <span className="font-mono text-cobalt text-sm font-bold">${Math.round(totalCost).toLocaleString()} USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
