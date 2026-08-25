"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

  useEffect(() => {
    if (activeLayer) setSelectedLayer(activeLayer);
  }, [activeLayer]);

  // Scientific Colormap (Blue -> Cyan -> Amber -> Red)
  const getInterpolatedColor = useCallback((norm: number, layer: string): [number, number, number] => {
    const clamped = Math.max(0, Math.min(1, norm));

    if (layer.includes("temperature") || layer === "lst") {
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
    } else if (layer.includes("veg")) {
      const r = Math.round(16 + clamped * 36);
      const g = Math.round(64 + clamped * 150);
      const b = Math.round(32 + clamped * 70);
      return [r, g, b];
    } else if (layer.includes("building") || layer.includes("density")) {
      const v = Math.round(40 + clamped * 180);
      return [v, Math.round(v * 1.05), Math.round(v * 1.15)];
    } else if (layer.includes("water")) {
      return [Math.round(6 + clamped * 30), Math.round(182 + clamped * 50), Math.round(212 + clamped * 40)];
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

    const renderSize = 600;
    canvas.width = renderSize;
    canvas.height = renderSize;

    const layerValues = gridData.layers[selectedLayer] || gridData.layers["baseline_temperature_c"];
    if (!layerValues) return;

    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = layerValues[r][c];
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }
    if (minVal === maxVal) {
      minVal = 0;
      maxVal = 1;
    }

    if (selectedLayer.includes("temperature") || selectedLayer === "lst") {
      minVal = 30.0;
      maxVal = 50.0;
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = cols;
    offscreen.height = rows;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const imgData = offCtx.createImageData(cols, rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = layerValues[r][c];
        const norm = (val - minVal) / (maxVal - minVal);
        const [R, G, B] = getInterpolatedColor(norm, selectedLayer);

        const idx = (r * cols + c) * 4;
        imgData.data[idx] = R;
        imgData.data[idx + 1] = G;
        imgData.data[idx + 2] = B;
        imgData.data[idx + 3] = 255;
      }
    }
    offCtx.putImageData(imgData, 0, 0);

    ctx.clearRect(0, 0, renderSize, renderSize);

    const drawW = renderSize * zoom;
    const drawH = renderSize * zoom;
    const offsetX = (renderSize - drawW) / 2;
    const offsetY = (renderSize - drawH) / 2;

    ctx.imageSmoothingEnabled = smoothRaster;
    ctx.drawImage(offscreen, offsetX, offsetY, drawW, drawH);

    // Urban Context Concentric Geometry
    if (showUrbanContext) {
      ctx.save();
      const cx = renderSize / 2;
      const cy = renderSize / 2;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3, 4]);

      const rInner = (renderSize * 0.18) * zoom;
      const rOuter = (renderSize * 0.38) * zoom;

      ctx.beginPath();
      ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
      ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
        ctx.lineTo(cx + Math.cos(angle) * (rOuter + 30 * zoom), cy + Math.sin(angle) * (rOuter + 30 * zoom));
        ctx.stroke();
      }
      ctx.restore();
    }

    // Hover Highlight
    if (hoveredCell) {
      const cellW = drawW / cols;
      const cellH = drawH / rows;
      const cellX = offsetX + hoveredCell.col * cellW;
      const cellY = offsetY + hoveredCell.row * cellH;

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cellX, cellY, cellW, cellH);
    }
  }, [gridData, selectedLayer, zoom, smoothRaster, showUrbanContext, hoveredCell, getInterpolatedColor]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gridData || !gridData.layers || !canvasRef.current) return;

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

  return (
    <div className="flex flex-col gap-3">
      {/* Precision Map Controls Header */}
      <div className="flex flex-wrap justify-between items-center bg-surface-elevated border border-surface-border px-3.5 py-2 rounded text-xs gap-3">
        <div className="flex items-center gap-2.5">
          <Layers className="w-3.5 h-3.5 text-ink-muted" />
          <span className="text-ink-secondary font-medium">Layer:</span>
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="bg-surface-base border border-surface-border text-ink-primary text-xs px-2.5 py-1 rounded outline-none focus:border-cobalt transition-colors font-mono"
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
          <button
            onClick={() => setSmoothRaster(!smoothRaster)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors flex items-center gap-1 ${
              smoothRaster 
                ? "bg-surface-interactive text-ink-primary border-surface-border" 
                : "bg-transparent text-ink-muted border-transparent hover:text-ink-primary"
            }`}
          >
            <Sparkles className="w-3 h-3 text-cobalt" />
            <span>Continuous</span>
          </button>

          {/* Urban Context Toggle */}
          <button
            onClick={() => setShowUrbanContext(!showUrbanContext)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors flex items-center gap-1 ${
              showUrbanContext 
                ? "bg-surface-interactive text-ink-primary border-surface-border" 
                : "bg-transparent text-ink-muted border-transparent hover:text-ink-primary"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Overlays</span>
          </button>

          <div className="h-3 w-px bg-surface-border mx-0.5" />

          {/* Zoom Controls */}
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
            className="p-1 text-ink-secondary hover:text-ink-primary transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.8))}
            className="p-1 text-ink-secondary hover:text-ink-primary transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative bg-surface-base border border-surface-border rounded p-4 flex justify-center items-center overflow-hidden min-h-[460px]">
        {title && (
          <div className="absolute top-4 left-4 z-10 text-xs font-mono text-ink-muted uppercase tracking-wider">
            {title}
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredCell(null)}
          className="cursor-crosshair rounded max-w-full h-auto aspect-square"
          style={{ width: "100%", maxWidth: "560px" }}
        />

        {/* Scientific Legend */}
        <div className="absolute bottom-4 left-4 bg-surface-elevated/90 border border-surface-border px-3 py-2 rounded text-[11px] shadow-floating pointer-events-none">
          <div className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">
            {selectedLayer.includes("temperature") ? "Observed LST Scale" : "Intensity Scale"}
          </div>
          
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-ink-muted">&lt;36°C</span>
            <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 via-amber-500 to-red-600" />
            <span className="text-ink-muted">&gt;44°C</span>
          </div>
        </div>

        {/* Precision Cell Inspector Panel */}
        {showInspector && hoveredCell && (
          <div className="absolute top-4 right-4 bg-surface-elevated border border-surface-border p-3.5 rounded text-xs w-56 shadow-floating pointer-events-none space-y-2 z-20 tabular-nums">
            <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
              <span className="font-mono text-[10px] text-cobalt uppercase tracking-wider flex items-center gap-1 font-semibold">
                <MapPin className="w-3 h-3" />
                Cell [{hoveredCell.row}, {hoveredCell.col}]
              </span>
              <span className="text-[10px] font-mono text-ink-muted">10m Res</span>
            </div>

            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex justify-between items-baseline">
                <span className="text-ink-muted font-sans">Surface Temp:</span>
                <span className="font-bold text-status-critical">{hoveredCell.temp}°C</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-ink-muted font-sans">Building Density:</span>
                <span className="text-ink-primary">{Math.round(hoveredCell.density * 100)}%</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-ink-muted font-sans">Building Height:</span>
                <span className="text-ink-primary">{hoveredCell.height}m</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-ink-muted font-sans">Vegetation Cover:</span>
                <span className="text-cobalt font-medium">{Math.round(hoveredCell.veg * 100)}%</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-ink-muted font-sans">Albedo:</span>
                <span className="text-ink-primary">{(hoveredCell.albedo || 0.18).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
