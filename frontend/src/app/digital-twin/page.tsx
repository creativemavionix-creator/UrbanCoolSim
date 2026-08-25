"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { DigitalTwinMap } from "@/components/DigitalTwinMap";
import { DigitalTwin3DMap } from "@/components/DigitalTwin3DMap";
import { api, DigitalTwinGrid } from "@/lib/api";
import { Satellite, Download, Box, Map } from "lucide-react";

export default function DigitalTwinPage() {
  const [studyArea, setStudyArea] = useState("delhi_cp");
  const [grid, setGrid] = useState<DigitalTwinGrid | null>(null);
  const [selectedCell, setSelectedCell] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d");
  const [loading, setLoading] = useState(true);

  const loadGrid = async (areaId = studyArea) => {
    setLoading(true);
    try {
      const res = await api.getDigitalTwinGrid(areaId, 50, 50);
      setGrid(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const handleExportCSV = () => {
    if (grid) {
      api.exportGridToCSV(grid, `${studyArea}_microclimate_grid.csv`);
    }
  };

  const areaName = grid?.metadata?.name || "Urban Microclimate Digital Twin";
  const crs = grid?.metadata?.crs || "EPSG:32643";

  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-ink-primary select-none">
      <Header 
        title="High-Resolution Spatial Digital Twin" 
        subtitle="10m Multi-Spectral Urban Morphology & Microclimate Grid" 
        onStudyAreaChange={(id) => {
          setStudyArea(id);
          loadGrid(id);
        }}
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Subheader & View Mode Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-surface-border pb-6">
          <div className="space-y-1">
            <h1 className="editorial-headline text-2xl sm:text-3xl font-normal text-ink-primary">
              {areaName}
            </h1>
            <p className="text-xs text-ink-secondary max-w-xl leading-relaxed">
              Fusing Landsat 8 TIRS, Sentinel-2 surface reflectance, ESA WorldCover, and Copernicus DEM 
              into a unified 10m microgrid ({crs}).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle: 3D Height-Extruded Mesh vs 2D Top-Down */}
            <div className="p-0.5 rounded bg-surface-elevated border border-surface-border flex items-center">
              <button
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
                  viewMode === "3d"
                    ? "bg-cobalt text-white font-medium shadow-sm"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D Height Mesh</span>
              </button>
              <button
                onClick={() => setViewMode("2d")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono transition-colors ${
                  viewMode === "2d"
                    ? "bg-cobalt text-white font-medium shadow-sm"
                    : "text-ink-secondary hover:text-ink-primary"
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span>2D Top-Down</span>
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded bg-surface-elevated hover:bg-surface-interactive border border-surface-border text-xs text-ink-secondary hover:text-ink-primary flex items-center gap-1.5 transition-colors font-mono"
            >
              <Download className="w-3.5 h-3.5 text-cobalt" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Spatial Visualizer */}
        <div className="graphite-card p-4 rounded-lg overflow-hidden min-h-[520px]">
          {grid ? (
            viewMode === "3d" ? (
              <DigitalTwin3DMap 
                gridData={grid}
                onCellSelect={(cell) => setSelectedCell(cell)}
              />
            ) : (
              <DigitalTwinMap 
                gridData={grid}
                onCellSelect={(cell) => setSelectedCell(cell)}
              />
            )
          ) : (
            <div className="h-96 flex items-center justify-center text-xs text-ink-muted font-mono">
              Loading {studyArea} digital twin rasters...
            </div>
          )}
        </div>

        {/* Selected Cell Telemetry Drawer */}
        {selectedCell && (
          <div className="graphite-card p-6 rounded-lg space-y-3">
            <div className="flex justify-between items-center border-b border-surface-border pb-2 text-xs">
              <span className="font-mono text-ink-muted uppercase">
                Grid Cell [{selectedCell.row}, {selectedCell.col}] Telemetry
              </span>
              <span className="font-mono text-status-critical font-semibold">
                LST: {selectedCell.temp}°C
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded bg-surface-base border border-surface-border">
                <span className="text-[10px] text-ink-muted block">Building Density</span>
                <span className="text-ink-primary font-bold">{Math.round(selectedCell.density * 100)}%</span>
              </div>
              <div className="p-3 rounded bg-surface-base border border-surface-border">
                <span className="text-[10px] text-ink-muted block">Building Height</span>
                <span className="text-ink-primary font-bold">{selectedCell.height}m</span>
              </div>
              <div className="p-3 rounded bg-surface-base border border-surface-border">
                <span className="text-[10px] text-ink-muted block">Vegetation Fraction</span>
                <span className="text-ink-primary font-bold">{Math.round(selectedCell.veg * 100)}%</span>
              </div>
              <div className="p-3 rounded bg-surface-base border border-surface-border">
                <span className="text-[10px] text-ink-muted block">Surface Albedo (α)</span>
                <span className="text-ink-primary font-bold">{(selectedCell.albedo || 0.18).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
