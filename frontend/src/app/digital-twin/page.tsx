"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { DigitalTwinMap } from "@/components/DigitalTwinMap";
import { api, DigitalTwinGrid } from "@/lib/api";
import { Satellite, Database, MapPin, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const easeOutExpo = [0.16, 1, 0.3, 1];

export default function DigitalTwinPage() {
  const [grid, setGrid] = useState<DigitalTwinGrid | null>(null);
  const [selectedCell, setSelectedCell] = useState<any | null>(null);

  useEffect(() => {
    async function loadGrid() {
      try {
        const res = await api.getDigitalTwinGrid();
        setGrid(res);
      } catch (err) {
        console.error(err);
      }
    }
    loadGrid();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-obsidian-base">
      <Header 
        title="High-Resolution Spatial Digital Twin" 
        subtitle="10m Multi-Spectral Urban Morphology & Microclimate Grid" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="p-8 max-w-7xl mx-auto w-full space-y-8"
      >
        {/* Editorial Subheader */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-obsidian-border pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-normal tracking-tight text-white">
              Connaught Place 10m Microgrid Surface Layers
            </h1>
            <p className="text-xs text-obsidian-textSecondary max-w-xl">
              Fusing Landsat 8 TIRS, Sentinel-2 surface reflectance, ESA WorldCover, and Copernicus DEM 
              into a unified spatial digital twin.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-obsidian-textMuted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-botanical-light" />
              Observed Satellite Ingestion
            </span>
            <span>·</span>
            <span>2,500 Cells</span>
          </div>
        </div>

        {/* Spatial Digital Twin Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Visual Canvas Surface */}
          <div className="lg:col-span-8">
            <DigitalTwinMap 
              gridData={grid} 
              onCellSelect={(c) => setSelectedCell(c)}
            />
          </div>

          {/* Precision Telemetry & Metadata Rail */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-obsidian-subtle border border-obsidian-border p-6 rounded-xl space-y-5">
              <div className="border-b border-obsidian-border pb-3">
                <h3 className="text-sm font-semibold text-white tracking-tight">Microgrid Cell Telemetry</h3>
                <p className="text-xs text-obsidian-textMuted mt-0.5">
                  Click or hover any cell on the canvas to inspect spatial parameters
                </p>
              </div>

              {selectedCell ? (
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-obsidian-border/50">
                    <span className="text-obsidian-textSecondary">Cell Coordinates:</span>
                    <span className="font-mono text-white">[{selectedCell.row}, {selectedCell.col}]</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-obsidian-border/50">
                    <span className="text-obsidian-textSecondary">Observed Baseline LST:</span>
                    <span className="font-mono font-semibold text-botanical-light text-sm">{selectedCell.temp}°C</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-obsidian-border/50">
                    <span className="text-obsidian-textSecondary">Building Footprint Density:</span>
                    <span className="font-mono text-white">{Math.round(selectedCell.density * 100)}%</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-obsidian-border/50">
                    <span className="text-obsidian-textSecondary">Mean Building Height (H):</span>
                    <span className="font-mono text-white">{selectedCell.height}m</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-obsidian-border/50">
                    <span className="text-obsidian-textSecondary">Vegetation Cover (f_veg):</span>
                    <span className="font-mono text-botanical-light">{Math.round(selectedCell.veg * 100)}%</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-obsidian-textSecondary">Broadband Albedo (α):</span>
                    <span className="font-mono text-white">{(selectedCell.albedo || 0.18).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-obsidian-border rounded-lg text-xs text-obsidian-textMuted">
                  Hover over the canvas to inspect 10m microgrid cell parameters.
                </div>
              )}
            </div>

            {/* Spatial Dataset Metadata Box */}
            <div className="bg-obsidian-subtle border border-obsidian-border p-6 rounded-xl space-y-4 text-xs">
              <h4 className="font-semibold text-white tracking-tight border-b border-obsidian-border pb-2.5">
                Ingested Satellite Feeds
              </h4>
              <div className="space-y-2 text-obsidian-textSecondary">
                <div className="flex justify-between">
                  <span>Thermal Band:</span>
                  <span className="font-mono text-white">Landsat 8 TIRS Band 10</span>
                </div>
                <div className="flex justify-between">
                  <span>Surface Reflectance:</span>
                  <span className="font-mono text-white">Sentinel-2 MSI Level-2A</span>
                </div>
                <div className="flex justify-between">
                  <span>Land Cover:</span>
                  <span className="font-mono text-white">ESA WorldCover 10m</span>
                </div>
                <div className="flex justify-between">
                  <span>Topography DEM:</span>
                  <span className="font-mono text-white">Copernicus GLO-30 DEM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
