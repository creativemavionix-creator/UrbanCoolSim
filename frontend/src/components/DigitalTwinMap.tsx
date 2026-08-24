"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Sparkles,
  MapPin
} from "lucide-react";

interface DigitalTwinMapProps {
  gridData: any;
  activeLayer?: string;
  onCellSelect?: (cell: any) => void;
  title?: string;
  showInspector?: boolean;
}

export function DigitalTwinMap({ 
  gridData, 
  activeLayer = "baseline_temperature_c", 
  onCellSelect,
  title,
  showInspector = true
}: DigitalTwinMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string>(activeLayer);
  const [hoveredCell, setHoveredCell] = useState<any | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [smoothRaster, setSmoothRaster] = useState<boolean>(true);
  const [showUrbanContext, setShowUrbanContext] = useState<boolean>(true);

  // Sync prop changes
  useEffect(() => {
    if (activeLayer) setSelectedLayer(activeLayer);
  }, [activeLayer]);

  // Color mapping logic
  const getInterpolatedColor = useCallback((norm: number, layer: string): [number, number, number] => {
    const clamped = Math.max(0, Math.min(1, norm));

    if (layer.includes("temperature") || layer === "lst") {
      // Scientific Thermal Scale: Deep Blue -> Emerald -> Amber -> Crimson -> Dark Ruby
      if (clamped < 0.25) {
        const t = clamped / 0.25;
        return [Math.round(14 + t * (16 - 14)), Math.round(165 + t * (185 - 165)), Math.round(233 + t * (129 - 233))];
      } else if (clamped < 0.50) {
        const t = (clamped - 0.25) / 0.25;
        return [Math.round(16 + t * (245 - 16)), Math.round(185 + t * (158 - 185)), Math.round(129 + t * (11 - 129))];
      } else if (clamped < 0.75) {
        const t = (clamped - 0.50) / 0.25;
        return [Math.round(245 + t * (234 - 245)), Math.round(158 + t * (88 - 158)), Math.round(11 + t * (12 - 11))];
      } else {
        const t = (clamped - 0.75) / 0.25;
        return [Math.round(234 + t * (220 - 234)), Math.round(88 + t * (38 - 88)), Math.round(12 + t * (38 - 12))];
      }
    } else if (layer.includes("veg")) {
      const r = Math.round(15 + clamped * 25);
      const g = Math.round(60 + clamped * 155);
      const b = Math.round(30 + clamped * 65);
      return [r, g, b];
    } else if (layer.includes("building") || layer.includes("density")) {
      const v = Math.round(35 + clamped * 180);
      return [v, Math.round(v * 1.05), Math.round(v * 1.15)];
    } else if (layer.includes("water")) {
      return [Math.round(10 + clamped * 30), Math.round(100 + clamped * 130), Math.round(180 + clamped * 75)];
    } else if (layer.includes("albedo")) {
      const v = Math.round(50 + clamped * 195);
      return [v, v, v];
    } else {
      const v = Math.round(clamped * 255);
      return [v, v, v];
    }
  }, []);

  // Canvas Render Effect
  useEffect(() => {
    if (!gridData || !gridData.layers || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rows = gridData.metadata.rows || 50;
    const cols = gridData.metadata.cols || 50;

    const renderSize = 640;
    canvas.width = renderSize;
    canvas.height = renderSize;

    const layerValues = gridData.layers[selectedLayer] || gridData.layers["baseline_temperature_c"];
    if (!layerValues) return;

    // Calculate Layer Statistics
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = layerValues[r]?.[c] ?? 0;
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }
    if (minVal === maxVal) maxVal = minVal + 1;

    ctx.clearRect(0, 0, renderSize, renderSize);

    // Create Offscreen raster for clean interpolation
    const offscreen = document.createElement("canvas");
    offscreen.width = cols;
    offscreen.height = rows;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const imgData = offCtx.createImageData(cols, rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = layerValues[r]?.[c] ?? minVal;
        const norm = (val - minVal) / (maxVal - minVal);
        const [red, green, blue] = getInterpolatedColor(norm, selectedLayer);

        const idx = (r * cols + c) * 4;
        imgData.data[idx] = red;
        imgData.data[idx + 1] = green;
        imgData.data[idx + 2] = blue;
        imgData.data[idx + 3] = 255;
      }
    }
    offCtx.putImageData(imgData, 0, 0);

    // Draw main raster with optional smoothing
    ctx.imageSmoothingEnabled = smoothRaster;
    ctx.imageSmoothingQuality = "high";

    const drawW = renderSize * zoom;
    const drawH = renderSize * zoom;
    const offsetX = (renderSize - drawW) / 2;
    const offsetY = (renderSize - drawH) / 2;

    ctx.drawImage(offscreen, offsetX, offsetY, drawW, drawH);

    // Overlay Urban Contextual Concentric Circles & Radial Corridors (Connaught Place)
    if (showUrbanContext) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3, 4]);

      const cx = renderSize / 2;
      const cy = renderSize / 2;

      // Inner Circle (Central Park)
      ctx.beginPath();
      ctx.arc(cx, cy, 65 * zoom, 0, Math.PI * 2);
      ctx.stroke();

      // Middle Circle
      ctx.beginPath();
      ctx.arc(cx, cy, 140 * zoom, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Circle (Connaught Circus)
      ctx.beginPath();
      ctx.arc(cx, cy, 220 * zoom, 0, Math.PI * 2);
      ctx.stroke();

      // 8 Radial Arteries
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 70 * zoom, cy + Math.sin(angle) * 70 * zoom);
        ctx.lineTo(cx + Math.cos(angle) * 270 * zoom, cy + Math.sin(angle) * 270 * zoom);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Draw highlighted hovered cell boundary
    if (hoveredCell) {
      const cellW = (renderSize / cols) * zoom;
      const cellH = (renderSize / rows) * zoom;
      const cellX = offsetX + hoveredCell.col * cellW;
      const cellY = offsetY + hoveredCell.row * cellH;

      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cellX, cellY, cellW, cellH);
      ctx.restore();
    }
  }, [gridData, selectedLayer, zoom, smoothRaster, showUrbanContext, hoveredCell, getInterpolatedColor]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gridData || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rows = gridData.metadata.rows || 50;
    const cols = gridData.metadata.cols || 50;

    const renderSize = rect.width;
    const drawW = renderSize * zoom;
    const drawH = renderSize * zoom;
    const offsetX = (renderSize - drawW) / 2;
    const offsetY = (renderSize - drawH) / 2;

    const relX = x - offsetX;
    const relY = y - offsetY;

    const cellW = drawW / cols;
    const cellH = drawH / rows;

    const c = Math.floor(relX / cellW);
    const r = Math.floor(relY / cellH);

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      const tempVal = gridData.layers["baseline_temperature_c"]?.[r]?.[c] ?? 0;
      const cellInfo = {
        row: r,
        col: c,
        val: gridData.layers[selectedLayer]?.[r]?.[c] ?? 0,
        temp: typeof tempVal === "number" ? tempVal.toFixed(1) : tempVal,
        density: gridData.layers["building_density"]?.[r]?.[c] ?? 0,
        height: gridData.layers["building_height"]?.[r]?.[c] ?? 0,
        veg: gridData.layers["veg_fraction"]?.[r]?.[c] ?? 0,
        albedo: gridData.layers["albedo"]?.[r]?.[c] ?? 0,
      };
      setHoveredCell(cellInfo);
      if (onCellSelect) onCellSelect(cellInfo);
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Precision Map Controls Header */}
      <div className="flex flex-wrap justify-between items-center bg-obsidian-subtle border border-obsidian-border px-3.5 py-2 rounded-lg text-xs gap-3">
        <div className="flex items-center gap-2.5">
          <Layers className="w-3.5 h-3.5 text-obsidian-textMuted" />
          <span className="text-obsidian-textSecondary font-medium">Layer:</span>
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="bg-obsidian-surface border border-obsidian-border text-white text-xs px-2.5 py-1 rounded focus:outline-none focus:border-white/30 transition-colors"
          >
            <option value="baseline_temperature_c">Surface Temperature (°C)</option>
            <option value="building_density">Building Density (0 – 1)</option>
            <option value="building_height">Building Height (m)</option>
            <option value="veg_fraction">Vegetation Fraction (0 – 1)</option>
            <option value="albedo">Surface Albedo (α)</option>
            <option value="water_fraction">Water Surface (0 – 1)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Spatial Smoothing Toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSmoothRaster(!smoothRaster)}
            title="Toggle Continuous Raster vs Discrete Grid"
            className={`px-2 py-1 rounded text-[11px] font-mono border transition-all flex items-center gap-1 ${
              smoothRaster 
                ? "bg-obsidian-surface text-white border-obsidian-border" 
                : "bg-transparent text-obsidian-textMuted border-transparent hover:text-white"
            }`}
          >
            <Sparkles className="w-3 h-3 text-botanical-light" />
            <span>Raster</span>
          </motion.button>

          {/* Urban Context Toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUrbanContext(!showUrbanContext)}
            title="Toggle Urban Road Geometry Context"
            className={`px-2 py-1 rounded text-[11px] font-mono border transition-all flex items-center gap-1 ${
              showUrbanContext 
                ? "bg-obsidian-surface text-white border-obsidian-border" 
                : "bg-transparent text-obsidian-textMuted border-transparent hover:text-white"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Grid Overlay</span>
          </motion.button>

          <div className="h-3 w-px bg-obsidian-border mx-0.5" />

          {/* Zoom Controls */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
            className="p-1 text-obsidian-textSecondary hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.8))}
            className="p-1 text-obsidian-textSecondary hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative bg-obsidian-base border border-obsidian-border rounded-xl p-4 flex justify-center items-center overflow-hidden min-h-[460px]">
        {title && (
          <div className="absolute top-4 left-4 z-10 text-xs font-mono text-obsidian-textMuted uppercase tracking-wider">
            {title}
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair rounded-lg max-w-full h-auto aspect-square"
          style={{ width: "100%", maxWidth: "580px" }}
        />

        {/* Quiet Scientific Legend */}
        <div className="absolute bottom-4 left-4 bg-obsidian-subtle/90 backdrop-blur-md border border-obsidian-border px-3 py-2 rounded-lg text-[11px] shadow-surface pointer-events-none">
          <div className="text-[10px] font-mono text-obsidian-textMuted uppercase tracking-wider mb-1.5">
            {selectedLayer.includes("temperature") ? "Observed LST Scale" : "Intensity Scale"}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-obsidian-textSecondary">&lt;36°C</span>
            <div className="w-24 h-2 rounded-full bg-gradient-to-r from-thermal-cool via-thermal-moderate via-thermal-warm to-thermal-extreme" />
            <span className="font-mono text-[10px] text-obsidian-textSecondary">&gt;44°C</span>
          </div>
        </div>

        {/* Precision Cell Inspector Panel */}
        <AnimatePresence>
          {showInspector && hoveredCell && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute top-4 right-4 bg-obsidian-subtle/95 backdrop-blur-md border border-obsidian-border p-3.5 rounded-lg text-xs w-56 shadow-floating pointer-events-none space-y-2 z-20"
            >
              <div className="flex items-center justify-between border-b border-obsidian-border pb-1.5">
                <span className="font-mono text-[10px] text-obsidian-textMuted uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-botanical-light" />
                  Cell [{hoveredCell.row}, {hoveredCell.col}]
                </span>
                <span className="text-[10px] font-mono text-obsidian-textSecondary">10m Res</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between items-baseline">
                  <span className="text-obsidian-textMuted">Surface Temp:</span>
                  <span className="font-mono text-sm font-semibold text-white">{hoveredCell.temp}°C</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-obsidian-textMuted">Building Density:</span>
                  <span className="font-mono text-obsidian-textPrimary">{Math.round(hoveredCell.density * 100)}%</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-obsidian-textMuted">Building Height:</span>
                  <span className="font-mono text-obsidian-textPrimary">{hoveredCell.height}m</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-obsidian-textMuted">Vegetation Cover:</span>
                  <span className="font-mono text-botanical-light">{Math.round(hoveredCell.veg * 100)}%</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-obsidian-textMuted">Broadband Albedo:</span>
                  <span className="font-mono text-obsidian-textPrimary">{(hoveredCell.albedo || 0.18).toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
