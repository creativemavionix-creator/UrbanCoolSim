"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { api, DigitalTwinGrid } from "@/lib/api";
import { 
  Columns, 
  SplitSquareVertical, 
  MoveHorizontal 
} from "lucide-react";

interface ScenarioPreset {
  id: string;
  name: string;
  tag: string;
  deltaT: number;
  cost: number;
  water: number;
  description: string;
  greenRoof: number;
  coolRoof: number;
  trees: number;
  waterPct: number;
}

const presets: ScenarioPreset[] = [
  {
    id: "baseline",
    name: "Current Baseline (No Action)",
    tag: "Observed",
    deltaT: 0.0,
    cost: 0,
    water: 0,
    description: "Existing high-density urban fabric with low surface albedo and minimal tree canopy.",
    greenRoof: 0.0,
    coolRoof: 0.0,
    trees: 0.0,
    waterPct: 0.0,
  },
  {
    id: "albedo",
    name: "High-Albedo Cool Roofs",
    tag: "Budget Priority",
    deltaT: 1.85,
    cost: 85000,
    water: 0,
    description: "Extensive application of high-reflectance coatings across commercial rooftops with zero water demand.",
    greenRoof: 0.0,
    coolRoof: 0.40,
    trees: 0.05,
    waterPct: 0.0,
  },
  {
    id: "green",
    name: "Intensive Green Infrastructure",
    tag: "Ecological",
    deltaT: 2.65,
    cost: 290000,
    water: 5800,
    description: "Extensive rooftop gardens and dense tree plantings along all radial pedestrian corridors.",
    greenRoof: 0.50,
    coolRoof: 0.10,
    trees: 0.30,
    waterPct: 0.02,
  },
  {
    id: "hybrid",
    name: "Pareto-Optimal Hybrid Matrix",
    tag: "Recommended",
    deltaT: 3.42,
    cost: 345000,
    water: 4200,
    description: "NSGA-II multi-objective solution balancing high-albedo roofs with shaded tree corridors.",
    greenRoof: 0.35,
    coolRoof: 0.25,
    trees: 0.20,
    waterPct: 0.05,
  }
];

export default function ScenarioLabPage() {
  const [studyArea, setStudyArea] = useState("delhi_cp");
  const [grid, setGrid] = useState<DigitalTwinGrid | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioPreset>(presets[3]);
  const [viewMode, setViewMode] = useState<"side_by_side" | "swipe">("side_by_side");
  const [swipePos, setSwipePos] = useState<number>(50);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; baseT: number; scenT: number; deltaT: number } | null>(null);
  const [isDraggingSwipe, setIsDraggingSwipe] = useState(false);

  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const swipeCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const getDiffColor = useCallback((diffNorm: number): [number, number, number] => {
    const clamped = Math.max(0, Math.min(1, diffNorm));
    const R = Math.round(16 + clamped * (74 - 16));
    const G = Math.round(185 - clamped * (108 - 185));
    const B = Math.round(129 + clamped * (255 - 129));
    return [R, G, B];
  }, []);

  // Redraw Comparison Canvases
  useEffect(() => {
    if (!grid || !grid.layers) return;

    const rows = 50;
    const cols = 50;
    const baseT = grid.layers.baseline_temperature_c;
    const bldgDens = grid.layers.building_density;

    const scenT: number[][] = [];
    const diffT: number[][] = [];
    for (let r = 0; r < rows; r++) {
      scenT[r] = [];
      diffT[r] = [];
      for (let c = 0; c < cols; c++) {
        const b = baseT[r][c];
        const dens = bldgDens[r][c];
        const coolDrop = (selectedScenario.coolRoof * dens * 2.8) +
                         (selectedScenario.greenRoof * dens * 2.2) +
                         (selectedScenario.trees * (1.0 - dens) * 2.5) +
                         (selectedScenario.waterPct * 3.8);
        const s = Math.max(26.0, b - coolDrop);
        scenT[r][c] = s;
        diffT[r][c] = b - s;
      }
    }

    const minT = 30.0;
    const maxT = 50.0;

    const drawGridToCanvas = (canvas: HTMLCanvasElement | null, matrix: number[][], isDiff = false) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 380;
      canvas.height = 380;

      const offscreen = document.createElement("canvas");
      offscreen.width = cols;
      offscreen.height = rows;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      const imgData = offCtx.createImageData(cols, rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = matrix[r][c];
          let R = 0, G = 0, B = 0;

          if (isDiff) {
            const diffNorm = val / 5.0;
            [R, G, B] = getDiffColor(diffNorm);
          } else {
            const norm = (val - minT) / (maxT - minT);
            [R, G, B] = getThermalColor(norm);
          }

          const idx = (r * cols + c) * 4;
          imgData.data[idx] = R;
          imgData.data[idx + 1] = G;
          imgData.data[idx + 2] = B;
          imgData.data[idx + 3] = 255;
        }
      }
      offCtx.putImageData(imgData, 0, 0);

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(offscreen, 0, 0, 380, 380);

      if (hoveredCell) {
        const cellW = 380 / cols;
        const cellH = 380 / rows;
        ctx.strokeStyle = "#4A6CFF";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(hoveredCell.col * cellW, hoveredCell.row * cellH, cellW, cellH);
      }
    };

    if (viewMode === "side_by_side") {
      drawGridToCanvas(baseCanvasRef.current, baseT);
      drawGridToCanvas(scenCanvasRef.current, scenT);
      drawGridToCanvas(diffCanvasRef.current, diffT, true);
    } else {
      const canvas = swipeCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 540;
      canvas.height = 540;

      const offBase = document.createElement("canvas");
      offBase.width = cols;
      offBase.height = rows;
      const offBaseCtx = offBase.getContext("2d");
      if (!offBaseCtx) return;
      const imgBase = offBaseCtx.createImageData(cols, rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const norm = (baseT[r][c] - minT) / (maxT - minT);
          const [R, G, B] = getThermalColor(norm);
          const idx = (r * cols + c) * 4;
          imgBase.data[idx] = R;
          imgBase.data[idx + 1] = G;
          imgBase.data[idx + 2] = B;
          imgBase.data[idx + 3] = 255;
        }
      }
      offBaseCtx.putImageData(imgBase, 0, 0);

      const offScen = document.createElement("canvas");
      offScen.width = cols;
      offScen.height = rows;
      const offScenCtx = offScen.getContext("2d");
      if (!offScenCtx) return;
      const imgScen = offScenCtx.createImageData(cols, rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const norm = (scenT[r][c] - minT) / (maxT - minT);
          const [R, G, B] = getThermalColor(norm);
          const idx = (r * cols + c) * 4;
          imgScen.data[idx] = R;
          imgScen.data[idx + 1] = G;
          imgScen.data[idx + 2] = B;
          imgScen.data[idx + 3] = 255;
        }
      }
      offScenCtx.putImageData(imgScen, 0, 0);

      ctx.drawImage(offBase, 0, 0, 540, 540);

      const splitX = (swipePos / 100) * 540;
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, 540 - splitX, 540);
      ctx.clip();
      ctx.drawImage(offScen, 0, 0, 540, 540);
      ctx.restore();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, 540);
      ctx.stroke();

      ctx.fillStyle = "#4A6CFF";
      ctx.beginPath();
      ctx.arc(splitX, 270, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [grid, selectedScenario, viewMode, swipePos, hoveredCell, getThermalColor, getDiffColor]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, size: number) => {
    if (!grid || !grid.layers) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (viewMode === "swipe" && isDraggingSwipe) {
      const pct = Math.max(0, Math.min(100, (x / size) * 100));
      setSwipePos(pct);
    }

    const col = Math.floor((x / size) * 50);
    const row = Math.floor((y / size) * 50);
    if (row >= 0 && row < 50 && col >= 0 && col < 50) {
      const baseT = grid.layers.baseline_temperature_c[row][col];
      const coolEffect = (selectedScenario.coolRoof * grid.layers.building_density[row][col] * 2.8) +
                         (selectedScenario.greenRoof * grid.layers.building_density[row][col] * 2.2) +
                         (selectedScenario.trees * (1.0 - grid.layers.building_density[row][col]) * 2.5) +
                         (selectedScenario.waterPct * 3.8);
      const scenT = Math.max(26.0, baseT - coolEffect);
      setHoveredCell({ row, col, baseT, scenT, deltaT: baseT - scenT });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-ink-primary select-none">
      <Header 
        title="Scenario Comparison Lab" 
        subtitle="Side-by-Side Dual Raster & Interactive A/B Swipe Spatial Evaluation" 
        onStudyAreaChange={(id) => {
          setStudyArea(id);
          loadGrid(id);
        }}
      />

      <div className="p-5 sm:p-7 max-w-7xl mx-auto w-full space-y-6">
        {/* Header & Mode Switcher */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-surface-border/60">
          <div className="space-y-1.5">
            <span className="text-label text-cobalt">Comparative Analysis</span>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink-primary">
              Comparative Urban Microclimate Scenarios
            </h1>
            <p className="text-xs text-ink-secondary max-w-xl leading-relaxed">
              Dynamically evaluate baseline surface temperatures against high-albedo, greening, and hybrid portfolios.
            </p>
          </div>

          <div className="p-0.5 rounded-md bg-surface-elevated border border-surface-border flex items-center">
            <button
              onClick={() => setViewMode("side_by_side")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                viewMode === "side_by_side"
                  ? "bg-cobalt text-white font-medium shadow-sm"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setViewMode("swipe")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                viewMode === "swipe"
                  ? "bg-cobalt text-white font-medium shadow-sm"
                  : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>A/B Swipe</span>
            </button>
          </div>
        </div>

        {/* 4 Comparative Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 tabular-nums">
          {presets.map((preset) => {
            const isSelected = selectedScenario.id === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => setSelectedScenario(preset)}
                className={`graphite-card p-4 rounded-lg cursor-pointer flex flex-col justify-between space-y-3.5 transition-all ${
                  isSelected
                    ? "border-cobalt/60 bg-surface-interactive shadow-sm"
                    : "hover:border-surface-borderHover"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      isSelected ? "bg-cobalt/15 text-cobalt font-medium" : "bg-surface-base text-ink-dim border border-surface-border"
                    }`}>
                      {preset.tag}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-ink-primary leading-snug">
                    {preset.name}
                  </h3>

                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="space-y-1 pt-2 border-t border-surface-border/50 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-ink-dim">Cooling (ΔT):</span>
                    <strong className={preset.deltaT > 0 ? "font-mono text-cobalt font-medium" : "font-mono text-ink-dim"}>
                      {preset.deltaT > 0 ? `−${preset.deltaT.toFixed(1)}°C` : "0.0°C"}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-ink-dim">CapEx:</span>
                    <span className="font-mono text-ink-primary">${preset.cost.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-ink-dim">Annual Water:</span>
                    <span className="font-mono text-ink-primary">{preset.water.toLocaleString()} m³</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Spatial Comparison Workspace */}
        <div className="graphite-card p-5 sm:p-6 rounded-lg space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-surface-border pb-3.5">
            <div>
              <span className="text-label text-cobalt block mb-0.5">
                Spatial Raster Comparison
              </span>
              <h2 className="text-xs font-medium text-ink-primary">
                Baseline LST vs. {selectedScenario.name}
              </h2>
            </div>

            {hoveredCell ? (
              <div className="flex items-center gap-3 text-xs font-mono bg-surface-base px-3 py-1 rounded border border-surface-border tabular-nums">
                <span className="text-ink-dim">[{hoveredCell.row}, {hoveredCell.col}]</span>
                <span>Base: <strong className="text-status-critical">{hoveredCell.baseT.toFixed(1)}°C</strong></span>
                <span>Scen: <strong className="text-ink-primary">{hoveredCell.scenT.toFixed(1)}°C</strong></span>
                <span>ΔT: <strong className="text-cobalt font-semibold">−{hoveredCell.deltaT.toFixed(2)}°C</strong></span>
              </div>
            ) : (
              <div className="text-[11px] text-ink-dim font-mono">
                Hover cursor over map to inspect coordinates
              </div>
            )}
          </div>

          {/* View Mode 1: Side-by-Side Dual */}
          {viewMode === "side_by_side" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              <div className="space-y-2">
                <div className="flex justify-between items-baseline px-0.5 text-xs">
                  <span className="text-xs font-medium text-ink-primary">01. Baseline LST</span>
                  <span className="font-mono text-status-critical text-[11px]">Peak 48.5°C</span>
                </div>
                <div className="aspect-square bg-surface-base border border-surface-border rounded-lg overflow-hidden flex items-center justify-center surface-inset">
                  <canvas 
                    ref={baseCanvasRef} 
                    className="w-full h-full cursor-crosshair"
                    onMouseMove={(e) => handleCanvasMouseMove(e, 380)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline px-0.5 text-xs">
                  <span className="text-xs font-medium text-ink-primary">02. Mitigated LST</span>
                  <span className="font-mono text-cobalt text-[11px]">−{selectedScenario.deltaT.toFixed(1)}°C</span>
                </div>
                <div className="aspect-square bg-surface-base border border-surface-border rounded-lg overflow-hidden flex items-center justify-center surface-inset">
                  <canvas 
                    ref={scenCanvasRef} 
                    className="w-full h-full cursor-crosshair"
                    onMouseMove={(e) => handleCanvasMouseMove(e, 380)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline px-0.5 text-xs">
                  <span className="text-xs font-medium text-ink-primary">03. Spatial Delta Difference</span>
                  <span className="font-mono text-ink-primary text-[11px]">Up to −4.5°C</span>
                </div>
                <div className="aspect-square bg-surface-base border border-surface-border rounded-lg overflow-hidden flex items-center justify-center surface-inset">
                  <canvas 
                    ref={diffCanvasRef} 
                    className="w-full h-full cursor-crosshair"
                    onMouseMove={(e) => handleCanvasMouseMove(e, 380)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* View Mode 2: A/B Swipe Handle */}
          {viewMode === "swipe" && (
            <div className="space-y-4">
              <div 
                className="relative max-w-lg mx-auto aspect-square bg-surface-base border border-surface-border rounded-lg overflow-hidden select-none cursor-ew-resize surface-inset"
                onMouseDown={() => setIsDraggingSwipe(true)}
                onMouseUp={() => setIsDraggingSwipe(false)}
              >
                <canvas 
                  ref={swipeCanvasRef}
                  className="w-full h-full"
                  onMouseMove={(e) => handleCanvasMouseMove(e, 540)}
                  onMouseLeave={() => {
                    setHoveredCell(null);
                    setIsDraggingSwipe(false);
                  }}
                />
                
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-surface-base/85 text-[10px] font-mono text-status-critical border border-surface-border pointer-events-none">
                  ← Baseline Hotspots
                </div>
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-surface-base/85 text-[10px] font-mono text-cobalt border border-surface-border pointer-events-none">
                  {selectedScenario.name} →
                </div>
              </div>

              <div className="max-w-lg mx-auto space-y-1.5 text-xs">
                <div className="flex justify-between text-ink-muted">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <MoveHorizontal className="w-3.5 h-3.5 text-cobalt" />
                    <span>Drag divider:</span>
                  </span>
                  <span className="font-mono text-ink-primary font-medium text-[11px]">{Math.round(swipePos)}% Split</span>
                </div>
                <input
                  type="range" min="0" max="100" value={swipePos}
                  onChange={(e) => setSwipePos(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
