"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import { 
  Layers, 
  MapPin, 
  Sliders, 
  Thermometer, 
  Building, 
  Trees, 
  Zap, 
  Grid, 
  Compass, 
  Eye, 
  X,
  Sparkles,
  ShieldCheck,
  Maximize2,
  RotateCcw
} from "lucide-react";
import { SatelliteBasemapProvider, MapProviderType } from "@/lib/mapProviders";

interface DigitalTwinMapProps {
  gridData: any;
  activeLayer?: string;
  onCellSelect?: (cell: any) => void;
  title?: string;
  showInspector?: boolean;
}

// Scientific Layer Metas for Physical Calibration
const LAYER_METAS: Record<string, {
  label: string;
  source: string;
  unit: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}> = {
  baseline_temperature_c: {
    label: "Surface Temperature (LST)",
    source: "Landsat 8 TIRS · 10m Calibrated",
    unit: "°C",
    min: 30,
    max: 50,
    minLabel: "30°C (Cool)",
    maxLabel: "50°C (Hotspot)"
  },
  canopy_height: {
    label: "Tree Canopy Height",
    source: "NASA GEDI LiDAR (L2A/L2B)",
    unit: "m",
    min: 0,
    max: 25,
    minLabel: "0m (No Canopy)",
    maxLabel: "25m (Dense Canopy)"
  },
  population_density: {
    label: "Demographic Exposure",
    source: "WorldPop 100m Grid",
    unit: "pop/ha",
    min: 0,
    max: 500,
    minLabel: "0",
    maxLabel: "500 pop/ha"
  },
  anthropogenic_heat_qf: {
    label: "Waste Heat Flux (Qf)",
    source: "VIIRS Day/Night Band",
    unit: "W/m²",
    min: 0,
    max: 90,
    minLabel: "0 W/m²",
    maxLabel: "90 W/m²"
  },
  building_height: {
    label: "Building Heights (H)",
    source: "Google Open Buildings V3",
    unit: "m",
    min: 0,
    max: 85,
    minLabel: "0m (Ground)",
    maxLabel: "85m (High-Rise)"
  },
  albedo: {
    label: "Surface Albedo (α)",
    source: "Sentinel-2 MSI Level-2A",
    unit: "",
    min: 0.08,
    max: 0.45,
    minLabel: "0.08 (Asphalt)",
    maxLabel: "0.45 (Cool Roof)"
  }
};

export function DigitalTwinMap({
  gridData,
  activeLayer = "baseline_temperature_c",
  onCellSelect,
}: DigitalTwinMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  // Map State
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [selectedLayer, setSelectedLayer] = useState<string>(activeLayer);
  const [thermalOpacity, setThermalOpacity] = useState<number>(0.38); // 38% Default - satellite visible
  const [showAnalysisGrid, setShowAnalysisGrid] = useState<boolean>(false); // OFF by default
  const [activeScenario, setActiveScenario] = useState<string>("baseline");
  const [hoveredCell, setHoveredCell] = useState<any | null>(null);
  const [selectedCell, setSelectedCell] = useState<any | null>(null);
  const [mapProvider, setMapProvider] = useState<MapProviderType>(SatelliteBasemapProvider.getActiveProvider());

  useEffect(() => {
    if (activeLayer) setSelectedLayer(activeLayer);
  }, [activeLayer]);

  const layerMeta = LAYER_METAS[selectedLayer] || LAYER_METAS.baseline_temperature_c;

  // Exact WGS84 Geographic Bounds calculation
  const studyAreaBounds = useMemo(() => {
    if (!gridData || !gridData.metadata) {
      return {
        centerLat: 28.6315,
        centerLon: 77.2167,
        north: 28.63375,
        south: 28.62925,
        east: 77.21925,
        west: 77.21415,
        coordinates: [
          [77.21415, 28.63375],
          [77.21925, 28.63375],
          [77.21925, 28.62925],
          [77.21415, 28.62925],
        ] as [[number, number], [number, number], [number, number], [number, number]]
      };
    }

    const lat = gridData.metadata.center_lat || 28.6315;
    const lon = gridData.metadata.center_lon || 77.2167;
    const rows = gridData.metadata.rows || 50;
    const cols = gridData.metadata.cols || 50;
    const resM = gridData.metadata.resolution_m || 10.0;

    const totalHeightM = rows * resM;
    const totalWidthM = cols * resM;

    const deltaLat = totalHeightM / 111320.0;
    const deltaLon = totalWidthM / (111320.0 * Math.cos((lat * Math.PI) / 180.0));

    const north = lat + deltaLat / 2.0;
    const south = lat - deltaLat / 2.0;
    const east = lon + deltaLon / 2.0;
    const west = lon - deltaLon / 2.0;

    return {
      centerLat: lat,
      centerLon: lon,
      north,
      south,
      east,
      west,
      coordinates: [
        [west, north],
        [east, north],
        [east, south],
        [west, south]
      ] as [[number, number], [number, number], [number, number], [number, number]]
    };
  }, [gridData]);

  // Scientific Colormapping Function (Restrained, Calibrated, Non-Saturating)
  const getColormapRGB = useCallback((val: number, minVal: number, maxVal: number, layer: string): [number, number, number, number] => {
    const norm = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal || 1)));

    if (layer.includes("temperature") || layer === "lst") {
      // Restrained Scientific Thermal Ramp: Blue -> Teal -> Yellow -> Orange -> Red
      if (norm < 0.25) {
        const t = norm / 0.25;
        return [Math.round(28 + t * 12), Math.round(75 + t * 90), Math.round(220 - t * 20), 220];
      } else if (norm < 0.50) {
        const t = (norm - 0.25) / 0.25;
        return [Math.round(40 + t * 185), Math.round(165 + t * 45), Math.round(200 - t * 190), 230];
      } else if (norm < 0.75) {
        const t = (norm - 0.50) / 0.25;
        return [Math.round(225 + t * 25), Math.round(210 - t * 120), Math.round(10), 240];
      } else {
        const t = (norm - 0.75) / 0.25;
        return [Math.round(250 - t * 15), Math.round(90 - t * 65), Math.round(10 + t * 15), 250];
      }
    } else if (layer.includes("canopy") || layer.includes("veg")) {
      // Canopy: Transparent on non-canopy (< 1.5m), Emerald gradient where trees exist
      if (val < 1.5) {
        return [0, 0, 0, 0];
      }
      const r = Math.round(16 + (1 - norm) * 20);
      const g = Math.round(140 + norm * 110);
      const b = Math.round(45 + norm * 50);
      return [r, g, b, 220];
    } else if (layer.includes("population")) {
      // Demographic Density: Indigo -> Magenta -> Warm Gold
      if (norm < 0.05) return [0, 0, 0, 0];
      const r = Math.round(80 + norm * 165);
      const g = Math.round(25 + norm * 180);
      const b = Math.round(180 - norm * 120);
      return [r, g, b, 210];
    } else if (layer.includes("qf") || layer.includes("anthropogenic")) {
      // Waste Heat: Transparent below baseline, Flame ramp in hot canyons
      if (norm < 0.1) return [0, 0, 0, 0];
      const r = Math.round(180 + norm * 70);
      const g = Math.round(60 + norm * 150);
      const b = Math.round(15);
      return [r, g, b, 220];
    } else if (layer.includes("height")) {
      // Building Heights: Transparent on ground roads, Slate-to-white on buildings
      if (val < 2.0) return [0, 0, 0, 0];
      const v = Math.round(70 + norm * 180);
      return [Math.round(v * 0.9), Math.round(v * 0.95), Math.min(255, Math.round(v * 1.15)), 210];
    } else {
      // Albedo
      const v = Math.round(40 + norm * 215);
      return [v, v, v, 200];
    }
  }, []);

  // Generate GPU Overlay from Backend Numerical Layers
  const generateOverlayDataURL = useCallback((layerKey: string, scenario: string) => {
    if (!gridData || !gridData.layers) return null;

    const rows = gridData.metadata.rows || 50;
    const cols = gridData.metadata.cols || 50;

    const canvas = document.createElement("canvas");
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    let layerValues = gridData.layers[layerKey] || gridData.layers["baseline_temperature_c"];
    if (!layerValues) return null;

    const meta = LAYER_METAS[layerKey] || LAYER_METAS.baseline_temperature_c;
    const minVal = meta.min;
    const maxVal = meta.max;

    const bldgH = gridData.layers["building_height"];
    const vegF = gridData.layers["veg_fraction"];

    const imgData = ctx.createImageData(cols, rows);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let val = layerValues[r][c];

        // Apply Scenario Microclimate Physics Modifiers
        if (layerKey.includes("temperature") || layerKey === "lst") {
          const h = bldgH?.[r]?.[c] ?? 0;
          const v = vegF?.[r]?.[c] ?? 0;

          if (scenario === "cool_roofs" && h > 10.0) {
            val = Math.max(30.0, val - 3.2); // Cool roof albedo shift
          } else if (scenario === "green_roofs" && h > 10.0) {
            val = Math.max(30.0, val - 3.8); // Green roof latent cooling
          } else if (scenario === "tree_canopy" && h < 5.0) {
            val = Math.max(30.0, val - 4.5); // Tree canopy shade
          } else if (scenario === "optimized") {
            if (h > 15.0) val = Math.max(30.0, val - 3.5);
            else if (h < 5.0 && v < 0.2) val = Math.max(30.0, val - 4.2);
          }
        }

        const [R, G, B, A] = getColormapRGB(val, minVal, maxVal, layerKey);
        const idx = (r * cols + c) * 4;
        imgData.data[idx] = R;
        imgData.data[idx + 1] = G;
        imgData.data[idx + 2] = B;
        imgData.data[idx + 3] = A;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }, [gridData, getColormapRGB]);

  // Generate 10m Analysis Grid GeoJSON Features
  const analysisGridGeoJSON = useMemo(() => {
    if (!gridData || !gridData.layers) return null;

    const rows = gridData.metadata.rows || 50;
    const cols = gridData.metadata.cols || 50;
    const { north, south, east, west } = studyAreaBounds;

    const dLat = (north - south) / rows;
    const dLon = (east - west) / cols;

    const features: any[] = [];
    const baseT = gridData.layers["baseline_temperature_c"];
    const bldgH = gridData.layers["building_height"];
    const bldgD = gridData.layers["building_density"];
    const vegF = gridData.layers["veg_fraction"];
    const canopyH = gridData.layers["canopy_height"];
    const popD = gridData.layers["population_density"];
    const qfVal = gridData.layers["anthropogenic_heat_qf"];
    const svfVal = gridData.layers["sky_view_factor"];
    const albedoVal = gridData.layers["albedo"];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellNorth = north - r * dLat;
        const cellSouth = cellNorth - dLat;
        const cellWest = west + c * dLon;
        const cellEast = cellWest + dLon;

        const temp = baseT?.[r]?.[c] ?? 42.0;
        const height = bldgH?.[r]?.[c] ?? 0.0;
        const density = bldgD?.[r]?.[c] ?? 0.0;
        const veg = vegF?.[r]?.[c] ?? 0.0;
        const canopy = canopyH?.[r]?.[c] ?? (veg * 14.0);

        features.push({
          type: "Feature" as const,
          id: r * cols + c,
          properties: {
            row: r,
            col: c,
            temp: Number(temp.toFixed(1)),
            height: Number(height.toFixed(1)),
            density: Number(density.toFixed(2)),
            veg: Number(veg.toFixed(2)),
            canopyHeight: Number(canopy.toFixed(1)),
            popDensity: Math.round(popD?.[r]?.[c] ?? 180),
            qfAnthro: Math.round(qfVal?.[r]?.[c] ?? 45),
            svf: Number((svfVal?.[r]?.[c] ?? 0.72).toFixed(2)),
            albedo: Number((albedoVal?.[r]?.[c] ?? 0.18).toFixed(2)),
            coolingPotential: (height > 15 ? "-3.2" : (veg < 0.2 ? "-4.5" : "-1.8")),
          },
          geometry: {
            type: "Polygon" as const,
            coordinates: [[
              [cellWest, cellNorth],
              [cellEast, cellNorth],
              [cellEast, cellSouth],
              [cellWest, cellSouth],
              [cellWest, cellNorth]
            ]]
          }
        });
      }
    }

    return {
      type: "FeatureCollection" as const,
      features
    };
  }, [gridData, studyAreaBounds]);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const style = SatelliteBasemapProvider.getMapLibreStyle(mapProvider);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style,
      center: [studyAreaBounds.centerLon, studyAreaBounds.centerLat],
      zoom: 16.0,
      pitch: is3DMode ? 56 : 0,
      bearing: is3DMode ? -20 : 0,
      antialias: true,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      // 1. Subtle Study Area Boundary
      map.addSource("study-area-boundary-source", {
        type: "geojson",
        data: {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "Polygon" as const,
            coordinates: [[
              [studyAreaBounds.west, studyAreaBounds.north],
              [studyAreaBounds.east, studyAreaBounds.north],
              [studyAreaBounds.east, studyAreaBounds.south],
              [studyAreaBounds.west, studyAreaBounds.south],
              [studyAreaBounds.west, studyAreaBounds.north]
            ]]
          }
        }
      });

      map.addLayer({
        id: "study-area-boundary-outline",
        type: "line",
        source: "study-area-boundary-source",
        paint: {
          "line-color": "rgba(74, 108, 255, 0.7)",
          "line-width": 1.2,
          "line-dasharray": [3, 2],
        }
      });

      // 2. GPU-Composited Scientific / AI Thermal Data Mask Overlay
      const initialDataURL = generateOverlayDataURL(selectedLayer, activeScenario);
      if (initialDataURL) {
        map.addSource("scientific-data-overlay-source", {
          type: "image",
          url: initialDataURL,
          coordinates: studyAreaBounds.coordinates
        });

        map.addLayer({
          id: "scientific-data-overlay-layer",
          type: "raster",
          source: "scientific-data-overlay-source",
          paint: {
            "raster-opacity": thermalOpacity,
            "raster-fade-duration": 150,
            "raster-resampling": "linear"
          }
        });
      }

      // 3. 10m Analysis Grid & Building Extrusion Layers
      if (analysisGridGeoJSON) {
        map.addSource("analysis-grid-source", {
          type: "geojson",
          data: analysisGridGeoJSON
        });

        // Hover Fill
        map.addLayer({
          id: "analysis-grid-fill-layer",
          type: "fill",
          source: "analysis-grid-source",
          paint: {
            "fill-color": "#4A6CFF",
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              0.28,
              0.0
            ]
          }
        });

        // Subtle Grid Lines (12% opacity when enabled)
        map.addLayer({
          id: "analysis-grid-lines-layer",
          type: "line",
          source: "analysis-grid-source",
          paint: {
            "line-color": "rgba(255, 255, 255, 0.12)",
            "line-width": 0.5,
            "line-opacity": showAnalysisGrid ? 1.0 : 0.0
          }
        });

        // 3D Building Extrusions Layer
        map.addLayer({
          id: "3d-building-extrusion-layer",
          type: "fill-extrusion",
          source: "analysis-grid-source",
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["get", "temp"],
              32, "#2563eb",
              38, "#06b6d4",
              43, "#f59e0b",
              48, "#dc2626"
            ],
            "fill-extrusion-height": ["*", ["get", "height"], 1.1],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": is3DMode ? 0.85 : 0.0
          }
        });
      }

      // Cell Interactions
      let currentHoverId: number | null = null;

      map.on("mousemove", "analysis-grid-fill-layer", (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          setHoveredCell(props);

          if (currentHoverId !== null) {
            map.setFeatureState({ source: "analysis-grid-source", id: currentHoverId }, { hover: false });
          }
          currentHoverId = feature.id as number;
          map.setFeatureState({ source: "analysis-grid-source", id: currentHoverId }, { hover: true });
        }
      });

      map.on("mouseleave", "analysis-grid-fill-layer", () => {
        setHoveredCell(null);
        if (currentHoverId !== null) {
          map.setFeatureState({ source: "analysis-grid-source", id: currentHoverId }, { hover: false });
          currentHoverId = null;
        }
      });

      map.on("click", "analysis-grid-fill-layer", (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          setSelectedCell(props);
          if (onCellSelect) onCellSelect(props);
        }
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapProvider, studyAreaBounds]);

  // Update Data Overlay Layer whenever selectedLayer, activeScenario, or gridData updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("scientific-data-overlay-source") as maplibregl.ImageSource;
    if (source) {
      const dataURL = generateOverlayDataURL(selectedLayer, activeScenario);
      if (dataURL) {
        source.updateImage({
          url: dataURL,
          coordinates: studyAreaBounds.coordinates
        });
      }
    }
  }, [selectedLayer, activeScenario, generateOverlayDataURL, studyAreaBounds]);

  // Update Raster Opacity
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer("scientific-data-overlay-layer")) {
      map.setPaintProperty("scientific-data-overlay-layer", "raster-opacity", thermalOpacity);
    }
  }, [thermalOpacity]);

  // Toggle 10m Grid Lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer("analysis-grid-lines-layer")) {
      map.setPaintProperty("analysis-grid-lines-layer", "line-opacity", showAnalysisGrid ? 1.0 : 0.0);
    }
  }, [showAnalysisGrid]);

  // Toggle 2D / 3D Smooth Camera & Building Extrusions
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.easeTo({
      pitch: is3DMode ? 56 : 0,
      bearing: is3DMode ? -20 : 0,
      duration: 800
    });

    if (map.isStyleLoaded() && map.getLayer("3d-building-extrusion-layer")) {
      map.setPaintProperty("3d-building-extrusion-layer", "fill-extrusion-opacity", is3DMode ? 0.85 : 0.0);
    }
  }, [is3DMode]);

  // Reset Camera View
  const handleResetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [studyAreaBounds.centerLon, studyAreaBounds.centerLat],
      zoom: 16.0,
      pitch: is3DMode ? 56 : 0,
      bearing: is3DMode ? -20 : 0,
      duration: 1000
    });
  };

  const activeInspection = selectedCell || hoveredCell;

  return (
    <div className="relative w-full h-full min-h-[620px] select-none overflow-hidden rounded-lg border border-white/10 bg-[#0B0C10]">
      {/* 1. Full-Width Map Canvas Mount */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 2. Top-Left: Floating Compact Study Area Title */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#13151B]/85 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-md shadow-2xl text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-medium text-white tracking-tight">
          {gridData?.metadata?.name || "Connaught Place Study Area"}
        </span>
        <span className="text-white/40 font-mono text-[11px]">
          ({gridData?.metadata?.city}, {gridData?.metadata?.country})
        </span>
      </div>

      {/* 3. Top-Right: Single Compact Floating Map Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2.5 bg-[#13151B]/90 backdrop-blur-md border border-white/10 p-1.5 rounded-lg shadow-2xl text-xs text-white">
        {/* Layer Dropdown */}
        <div className="flex items-center gap-1.5 pl-1.5">
          <Layers className="w-3.5 h-3.5 text-cobalt shrink-0" />
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="bg-[#0B0C10] border border-white/10 text-white text-xs px-2 py-1 rounded outline-none focus:border-cobalt transition-colors font-sans"
          >
            <option value="baseline_temperature_c">Surface Temperature (LST)</option>
            <option value="canopy_height">Tree Canopy Height (m)</option>
            <option value="population_density">Demographic Exposure</option>
            <option value="anthropogenic_heat_qf">Waste Heat Flux (Qf)</option>
            <option value="building_height">Building Heights (m)</option>
            <option value="albedo">Surface Albedo (α)</option>
          </select>
        </div>

        {/* Scenario Dropdown */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <select
            value={activeScenario}
            onChange={(e) => setActiveScenario(e.target.value)}
            className="bg-[#0B0C10] border border-white/10 text-white text-xs px-2 py-1 rounded outline-none focus:border-cobalt transition-colors font-sans"
          >
            <option value="baseline">Baseline (Observed)</option>
            <option value="cool_roofs">Cool Roofs (α=0.85)</option>
            <option value="green_roofs">Green Roofs (Extensive)</option>
            <option value="tree_canopy">Tree Canopy Corridor</option>
            <option value="optimized">NSGA-II Optimized Strategy</option>
          </select>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Thermal Opacity Slider */}
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-white/50 text-[11px] font-sans">Overlay:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={thermalOpacity}
            onChange={(e) => setThermalOpacity(Number(e.target.value))}
            className="w-16 accent-cobalt cursor-pointer"
            title="Adjust satellite vs thermal overlay opacity"
          />
          <span className="text-white/80 font-mono text-[10px] w-6">{Math.round(thermalOpacity * 100)}%</span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* 10m Grid Toggle */}
        <button
          onClick={() => setShowAnalysisGrid(!showAnalysisGrid)}
          className={`px-2 py-1 rounded text-[11px] font-sans transition-colors flex items-center gap-1 border ${
            showAnalysisGrid 
              ? "bg-cobalt/20 text-cobalt border-cobalt/40 font-medium" 
              : "bg-transparent text-white/50 border-transparent hover:text-white"
          }`}
          title="Toggle subtle 10m microclimate gridlines"
        >
          <Grid className="w-3 h-3" />
          <span>Grid</span>
        </button>

        {/* 2D / 3D Toggle */}
        <div className="flex items-center bg-[#0B0C10] p-0.5 rounded border border-white/10">
          <button
            onClick={() => setIs3DMode(false)}
            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
              !is3DMode ? "bg-cobalt text-white font-medium shadow-sm" : "text-white/50 hover:text-white"
            }`}
          >
            2D
          </button>
          <button
            onClick={() => setIs3DMode(true)}
            className={`px-2.5 py-0.5 rounded text-[11px] transition-colors ${
              is3DMode ? "bg-cobalt text-white font-medium shadow-sm" : "text-white/50 hover:text-white"
            }`}
          >
            3D
          </button>
        </div>

        {/* Reset Camera Button */}
        <button
          onClick={handleResetView}
          className="p-1 rounded text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title="Fit Study Area View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Bottom-Left: Floating Compact Scientific Legend */}
      <div className="absolute bottom-6 left-6 z-20 bg-[#13151B]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-2xl text-xs space-y-1.5 pointer-events-none min-w-52">
        <div className="flex justify-between items-center text-[10px] text-white/50 font-sans tracking-wide uppercase">
          <span>{layerMeta.label}</span>
          <span className="font-mono text-white/70">{layerMeta.unit}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gradient-to-r from-blue-600 via-teal-400 via-amber-400 to-red-600" />
        <div className="flex justify-between text-[10px] text-white/60 font-sans">
          <span>{layerMeta.minLabel}</span>
          <span>{layerMeta.maxLabel}</span>
        </div>
      </div>

      {/* 5. Bottom-Right: Floating Clean Spatial Cell Inspector */}
      {activeInspection && (
        <div className="absolute bottom-6 right-6 z-20 bg-[#13151B]/95 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-2xl text-xs space-y-3 min-w-64">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cobalt" />
              <span className="font-semibold text-white">Cell [{activeInspection.row}, {activeInspection.col}]</span>
            </div>
            {selectedCell && (
              <button 
                onClick={() => setSelectedCell(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1.5 text-[11px] text-white/80">
            <div className="flex justify-between items-baseline">
              <span className="text-white/50">Surface Temp (LST):</span>
              <strong className="text-red-400 font-bold text-sm">{activeInspection.temp}°C</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Building Height:</span>
              <span className="text-white font-medium">{activeInspection.height}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Building Density:</span>
              <span className="text-white">{Math.round(activeInspection.density * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Tree Canopy (GEDI):</span>
              <span className="text-emerald-400 font-medium">{activeInspection.canopyHeight}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Population Exposure:</span>
              <span className="text-white">{activeInspection.popDensity} pop/ha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Surface Albedo (α):</span>
              <span className="text-white">{activeInspection.albedo}</span>
            </div>

            {activeScenario !== "baseline" && (
              <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-emerald-400 font-semibold">
                <span>Predicted Cooling (ΔT):</span>
                <span>{activeInspection.coolingPotential}°C</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Discreet Imagery Attribution */}
      <div className="absolute bottom-1 right-2 z-10 text-[9px] text-white/30 pointer-events-none font-sans">
        © Esri • World Imagery · UrbanCoolSim SEB Intelligence
      </div>
    </div>
  );
}
