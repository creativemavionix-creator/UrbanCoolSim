"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { DigitalTwinMap } from "@/components/DigitalTwinMap";
import { api, DigitalTwinGrid } from "@/lib/api";
import { Download, Compass } from "lucide-react";

export default function DigitalTwinPage() {
  const [studyArea, setStudyArea] = useState("delhi_cp");
  const [grid, setGrid] = useState<DigitalTwinGrid | null>(null);
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

  return (
    <div className="flex flex-col h-screen w-full bg-[#0B0C10] text-[#F2F3F5] overflow-hidden select-none">
      {/* Minimal Header */}
      <Header 
        title="Spatial Digital Twin" 
        subtitle="10m Satellite Remote Sensing & Thermal Physics" 
        onStudyAreaChange={(id) => {
          setStudyArea(id);
          loadGrid(id);
        }}
      />

      {/* Hero Map Application Viewport (Occupies 92% of Screen) */}
      <main className="flex-1 w-full h-[calc(100vh-64px)] p-3 relative">
        {grid ? (
          <DigitalTwinMap 
            gridData={grid}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/40 font-mono">
            Loading satellite digital twin...
          </div>
        )}
      </main>
    </div>
  );
}
