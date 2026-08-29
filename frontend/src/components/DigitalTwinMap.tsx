"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { BitmapLayer, GeoJsonLayer } from "deck.gl";
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
  RotateCcw,
  AlertCircle,
  Search,
  Loader2,
  Globe,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SatelliteBasemapProvider, MapProviderType } from "@/lib/mapProviders";
import {
  getStudyAreaBoundary,
  getAllStudyAreaBoundaries,
  makeFeatherAlpha,
  StudyAreaBoundary,
} from "@/lib/studyAreaBoundaries";
import {
  fetchOSMBuildings,
  assignThermalToBuildings,
} from "@/lib/osmBuildings";

interface DigitalTwinMapProps {
  gridData: any;
  activeLayer?: string;
  onCellSelect?: (cell: any) => void;
  title?: string;
  showInspector?: boolean;
}

// ─── Scientific Layer Metadata ────────────────────────────────────────────────
const LAYER_METAS: Record<
  string,
  {
    label: string;
    source: string;
    unit: string;
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
    gradientCss: string;
  }
> = {
  baseline_temperature_c: {
    label: "Surface Temperature (LST)",
    source: "Landsat 8 TIRS · 10m Calibrated",
    unit: "°C",
    min: 30,
    max: 50,
    minLabel: "30°C (Cool)",
    maxLabel: "50°C (Hotspot)",
    gradientCss:
      "linear-gradient(to right, #1c4bcc, #06b6d4, #f59e0b, #dc2626)",
  },
  canopy_height: {
    label: "Tree Canopy Height",
    source: "NASA GEDI LiDAR (L2A/L2B)",
    unit: "m",
    min: 0,
    max: 25,
    minLabel: "0m (No Canopy)",
    maxLabel: "25m (Dense Canopy)",
    gradientCss:
      "linear-gradient(to right, #1a2e1c, #16a34a, #4ade80, #bbf7d0)",
  },
  population_density: {
    label: "Demographic Exposure",
    source: "WorldPop 100m Grid",
    unit: "pop/ha",
    min: 0,
    max: 500,
    minLabel: "0",
    maxLabel: "500 pop/ha",
    gradientCss:
      "linear-gradient(to right, #1e1b4b, #7c3aed, #db2777, #fbbf24)",
  },
  anthropogenic_heat_qf: {
    label: "Waste Heat Flux (Qf)",
    source: "VIIRS Day/Night Band",
    unit: "W/m²",
    min: 0,
    max: 90,
    minLabel: "0 W/m²",
    maxLabel: "90 W/m²",
    gradientCss:
      "linear-gradient(to right, #1c1917, #b45309, #f97316, #fde68a)",
  },
  building_height: {
    label: "Building Heights (H)",
    source: "Google Open Buildings V3",
    unit: "m",
    min: 0,
    max: 85,
    minLabel: "0m (Ground)",
    maxLabel: "85m (High-Rise)",
    gradientCss:
      "linear-gradient(to right, #0f172a, #334155, #94a3b8, #f1f5f9)",
  },
  albedo: {
    label: "Surface Albedo (α)",
    source: "Sentinel-2 MSI Level-2A",
    unit: "",
    min: 0.08,
    max: 0.45,
    minLabel: "0.08 (Asphalt)",
    maxLabel: "0.45 (Cool Roof)",
    gradientCss:
      "linear-gradient(to right, #1c1917, #57534e, #a8a29e, #fafaf9)",
  },
};

// ─── NASA GIBS Native Colormap Metadata (for honest global reference legend) ──
const NASA_GIBS_LST_META = {
  label: "NASA MODIS Land Surface Temp (Daytime)",
  source: "NASA EOSDIS GIBS · Native Colormap (~1km)",
  unit: "°C",
  min: 0,
  max: 50,
  minLabel: "0°C (Cold / Cloud)",
  maxLabel: "50°C+ (Hot)",
  // NASA MODIS Land Surface Temperature Rainbow Palette
  gradientCss:
    "linear-gradient(to right, #051e3e, #005082, #00a8cc, #00bfa5, #7cb342, #fbc02d, #ff6f00, #d50000, #5d001e)",
  note: "NASA native pre-colored LST colormap (~1km resolution)",
};

// ─── 5 Pinned High-Resolution Study Areas ──────────────────────────────────────
const PINNED_STUDY_AREAS = [
  {
    id: "delhi_cp",
    name: "Connaught Place",
    city: "New Delhi",
    country: "India",
    flag: "🇮🇳",
    center: [77.2167, 28.6315] as [number, number],
    zoom: 15.5,
  },
  {
    id: "mumbai_bkc",
    name: "Bandra Kurla Complex",
    city: "Mumbai",
    country: "India",
    flag: "🇮🇳",
    center: [72.8683, 19.0657] as [number, number],
    zoom: 15.0,
  },
  {
    id: "singapore_marina",
    name: "Marina Bay",
    city: "Singapore",
    country: "Singapore",
    flag: "🇸🇬",
    center: [103.8565, 1.2847] as [number, number],
    zoom: 15.2,
  },
  {
    id: "phoenix_downtown",
    name: "Downtown Core",
    city: "Phoenix",
    country: "USA",
    flag: "🇺🇸",
    center: [-112.0740, 33.4484] as [number, number],
    zoom: 15.0,
  },
  {
    id: "tokyo_shinjuku",
    name: "Shinjuku Center",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    center: [139.7034, 35.6938] as [number, number],
    zoom: 15.0,
  },
];

// ─── Scientific Colormap ──────────────────────────────────────────────────────
function getColormapRGBA(
  val: number,
  minVal: number,
  maxVal: number,
  layer: string,
  alpha = 220
): [number, number, number, number] {
  const norm = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal || 1)));

  if (layer.includes("temperature") || layer === "lst") {
    if (norm < 0.25) {
      const t = norm / 0.25;
      return [Math.round(28 + t * 12), Math.round(75 + t * 90), Math.round(220 - t * 20), alpha];
    } else if (norm < 0.5) {
      const t = (norm - 0.25) / 0.25;
      return [Math.round(40 + t * 185), Math.round(165 + t * 45), Math.round(200 - t * 190), alpha];
    } else if (norm < 0.75) {
      const t = (norm - 0.5) / 0.25;
      return [Math.round(225 + t * 25), Math.round(210 - t * 120), 10, alpha];
    } else {
      const t = (norm - 0.75) / 0.25;
      return [Math.round(250 - t * 15), Math.round(90 - t * 65), Math.round(10 + t * 15), alpha];
    }
  } else if (layer.includes("canopy") || layer.includes("veg")) {
    if (val < 1.5) return [0, 0, 0, 0];
    return [Math.round(16 + (1 - norm) * 20), Math.round(140 + norm * 110), Math.round(45 + norm * 50), alpha];
  } else if (layer.includes("population")) {
    if (norm < 0.05) return [0, 0, 0, 0];
    return [Math.round(80 + norm * 165), Math.round(25 + norm * 180), Math.round(180 - norm * 120), alpha];
  } else if (layer.includes("qf") || layer.includes("anthropogenic")) {
    if (norm < 0.1) return [0, 0, 0, 0];
    return [Math.round(180 + norm * 70), Math.round(60 + norm * 150), 15, alpha];
  } else if (layer.includes("height")) {
    if (val < 2.0) return [0, 0, 0, 0];
    const v = Math.round(70 + norm * 180);
    return [Math.round(v * 0.9), Math.round(v * 0.95), Math.min(255, Math.round(v * 1.15)), alpha];
  } else {
    const v = Math.round(40 + norm * 215);
    return [v, v, v, alpha - 20];
  }
}

// ─── GIBS Configuration (verified from live WMTS capabilities 2026-08-27) ────
// Layer: MODIS Terra Daily Daytime Land Surface Temperature (TES)
// TileMatrixSet: GoogleMapsCompatible_Level7  (max zoom 7 native, MapLibre overzooms fine)
const GIBS_LAYER_ID = "MODIS_Terra_L3_Land_Surface_Temp_Daily_Day_TES";
const GIBS_TILE_MATRIX_SET = "GoogleMapsCompatible_Level7";
// Use the no-time URL pattern (GIBS serves a default/latest date without {Time})
const GIBS_TILE_URL =
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${GIBS_LAYER_ID}/default/${GIBS_TILE_MATRIX_SET}/{z}/{y}/{x}.png`;

// Zoom thresholds for cross-fade
const GIBS_FADE_START_ZOOM = 12;  // Below this: only GIBS (or Not Available for non-LST)
const GIBS_FADE_END_ZOOM   = 14;  // Above this: only local grid

// ─── Thermal value interpolation color for extruded buildings ─────────────────
function thermalValueToRGBA(thermalValue: number, layerKey: string): [number, number, number, number] {
  const meta = LAYER_METAS[layerKey] || LAYER_METAS.baseline_temperature_c;
  return getColormapRGBA(thermalValue, meta.min, meta.max, layerKey, 230);
}

export function DigitalTwinMap({
  gridData,
  activeLayer = "baseline_temperature_c",
  onCellSelect,
}: DigitalTwinMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [is3DMode, setIs3DMode] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState(activeLayer);
  const selectedLayerRef = useRef(selectedLayer);
  selectedLayerRef.current = selectedLayer;

  const [thermalOpacity, setThermalOpacity] = useState(0.72); // higher default for deck.gl
  const [showAnalysisGrid, setShowAnalysisGrid] = useState(false);
  const [activeScenario, setActiveScenario] = useState("baseline");
  const [hoveredCell, setHoveredCell] = useState<any | null>(null);
  const [selectedCell, setSelectedCell] = useState<any | null>(null);
  const [mapProvider] = useState<MapProviderType>(SatelliteBasemapProvider.getActiveProvider());

  // GIBS cross-fade & data mode state:
  // "gibs" = global MODIS LST active
  // "crossfade" = blending MODIS → 10m grid
  // "local" = 10m physics simulated grid active
  // "not_available" = layer has no global reference (non-LST layer outside study areas / zoomed out)
  const [dataMode, setDataMode] = useState<"gibs" | "crossfade" | "local" | "not_available">("local");
  const [gibsOpacity, setGibsOpacity] = useState(0.0);

  // Location search state (Part 2)
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // OSM 3D building state
  const [osmBuildings, setOsmBuildings] = useState<GeoJSON.FeatureCollection | null>(null);
  const [osmStatus, setOsmStatus] = useState<string>("");
  const [osmLoading, setOsmLoading] = useState(false);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  useEffect(() => {
    if (activeLayer) setSelectedLayer(activeLayer);
  }, [activeLayer]);

  const layerMeta = LAYER_METAS[selectedLayer] || LAYER_METAS.baseline_temperature_c;

  // ── Geographic bounds from study area registry or grid metadata ───────────
  const studyAreaBounds = useMemo(() => {
    const areaId = gridData?.metadata?.study_area_id ?? "delhi_cp";
    const registered = getStudyAreaBoundary(areaId);
    if (registered) {
      return {
        centerLat: registered.center[1],
        centerLon: registered.center[0],
        north: registered.bbox.north,
        south: registered.bbox.south,
        east: registered.bbox.east,
        west: registered.bbox.west,
      };
    }

    const lat = gridData?.metadata?.center_lat ?? 28.6315;
    const lon = gridData?.metadata?.center_lon ?? 77.2167;
    const rows = gridData?.metadata?.rows ?? 50;
    const cols = gridData?.metadata?.cols ?? 50;
    const resM = gridData?.metadata?.resolution_m ?? 10.0;

    const totalHeightM = rows * resM;
    const totalWidthM = cols * resM;
    const deltaLat = totalHeightM / 111320.0;
    const deltaLon = totalWidthM / (111320.0 * Math.cos((lat * Math.PI) / 180.0));

    const north = lat + deltaLat / 2;
    const south = lat - deltaLat / 2;
    const east = lon + deltaLon / 2;
    const west = lon - deltaLon / 2;

    return { centerLat: lat, centerLon: lon, north, south, east, west };
  }, [gridData]);

  // ── Study area boundary polygon ────────────────────────────────────────────
  const studyBoundary = useMemo(() => {
    const areaId = gridData?.metadata?.study_area_id ?? "delhi_cp";
    return getStudyAreaBoundary(areaId, studyAreaBounds);
  }, [gridData, studyAreaBounds]);

  // Texture cache ref to prevent recomputing 40k pixels on non-data state changes
  const textureCacheRef = useRef<Map<string, string>>(new Map());

  // Reset OSM buildings and texture cache on study area switch
  const currentStudyAreaId = gridData?.metadata?.study_area_id ?? "delhi_cp";
  const prevStudyAreaIdRef = useRef<string>(currentStudyAreaId);

  useEffect(() => {
    if (prevStudyAreaIdRef.current !== currentStudyAreaId) {
      setOsmBuildings(null);
      setOsmStatus("");
      textureCacheRef.current.clear();
      prevStudyAreaIdRef.current = currentStudyAreaId;
    }
  }, [currentStudyAreaId]);

  // ── Generate 4x-upsampled thermal texture (GPU bilinear on BitmapLayer) ────
  const generateThermalTexture = useCallback(
    (layerKey: string, scenario: string): string | null => {
      if (!gridData?.layers) return null;

      const cacheKey = `${currentStudyAreaId}_${layerKey}_${scenario}`;
      if (textureCacheRef.current.has(cacheKey)) {
        return textureCacheRef.current.get(cacheKey) || null;
      }

      const srcRows = gridData.metadata.rows ?? 50;
      const srcCols = gridData.metadata.cols ?? 50;
      // 4× upsample for GPU bilinear smoothing
      const SCALE = 4;
      const dstW = srcCols * SCALE;
      const dstH = srcRows * SCALE;

      const canvas = document.createElement("canvas");
      canvas.width = dstW;
      canvas.height = dstH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const layerValues =
        gridData.layers[layerKey] || gridData.layers["baseline_temperature_c"];
      if (!layerValues) return null;

      const meta = LAYER_METAS[layerKey] || LAYER_METAS.baseline_temperature_c;
      const bldgH = gridData.layers["building_height"];
      const vegF = gridData.layers["veg_fraction"];

      // Build feather alpha function from boundary.
      // featherWidthDeg = 0.0012° ≈ 130m — wide enough to be clearly visible
      // as a lush soft gradient at zoom 14–16 without hard box cuts.
      const featherFn =
        studyBoundary
          ? makeFeatherAlpha(studyBoundary.boundary, 0.0012)
          : null;

      const { north, south, east, west } = studyAreaBounds;
      const dLat = (north - south) / srcRows;
      const dLon = (east - west) / srcCols;

      // Each dst pixel maps back to a src cell via bilinear sampling
      const imgData = ctx.createImageData(dstW, dstH);

      for (let py = 0; py < dstH; py++) {
        // src fractional row
        const fracRow = (py / (dstH - 1)) * (srcRows - 1);
        const r0 = Math.floor(fracRow);
        const r1 = Math.min(srcRows - 1, r0 + 1);
        const wr = fracRow - r0;

        for (let px = 0; px < dstW; px++) {
          // src fractional col
          const fracCol = (px / (dstW - 1)) * (srcCols - 1);
          const c0 = Math.floor(fracCol);
          const c1 = Math.min(srcCols - 1, c0 + 1);
          const wc = fracCol - c0;

          // Bilinear interpolation of data value
          const v00 = layerValues[r0]?.[c0] ?? meta.min;
          const v01 = layerValues[r0]?.[c1] ?? meta.min;
          const v10 = layerValues[r1]?.[c0] ?? meta.min;
          const v11 = layerValues[r1]?.[c1] ?? meta.min;
          let val =
            v00 * (1 - wr) * (1 - wc) +
            v01 * (1 - wr) * wc +
            v10 * wr * (1 - wc) +
            v11 * wr * wc;

          // Scenario physics modifiers (same as original DigitalTwinMap)
          if (layerKey.includes("temperature") || layerKey === "lst") {
            const h =
              (bldgH?.[r0]?.[c0] ?? 0) * (1 - wr) * (1 - wc) +
              (bldgH?.[r0]?.[c1] ?? 0) * (1 - wr) * wc +
              (bldgH?.[r1]?.[c0] ?? 0) * wr * (1 - wc) +
              (bldgH?.[r1]?.[c1] ?? 0) * wr * wc;
            const v =
              (vegF?.[r0]?.[c0] ?? 0) * (1 - wr) * (1 - wc) +
              (vegF?.[r0]?.[c1] ?? 0) * (1 - wr) * wc +
              (vegF?.[r1]?.[c0] ?? 0) * wr * (1 - wc) +
              (vegF?.[r1]?.[c1] ?? 0) * wr * wc;

            if (scenario === "cool_roofs" && h > 10.0)
              val = Math.max(30.0, val - 3.2);
            else if (scenario === "green_roofs" && h > 10.0)
              val = Math.max(30.0, val - 3.8);
            else if (scenario === "tree_canopy" && h < 5.0)
              val = Math.max(30.0, val - 4.5);
            else if (scenario === "optimized") {
              if (h > 15.0) val = Math.max(30.0, val - 3.5);
              else if (h < 5.0 && v < 0.2) val = Math.max(30.0, val - 4.2);
            }
          }

          // Colormap
          const [R, G, B, A] = getColormapRGBA(val, meta.min, meta.max, layerKey, 220);

          // Feather alpha mask
          let featherA = 1.0;
          if (featherFn) {
            const pxLon = west + (px / (dstW - 1)) * (east - west);
            const pxLat = north - (py / (dstH - 1)) * (north - south);
            featherA = featherFn(pxLon, pxLat);
          }

          const idx = (py * dstW + px) * 4;
          imgData.data[idx] = R;
          imgData.data[idx + 1] = G;
          imgData.data[idx + 2] = B;
          imgData.data[idx + 3] = Math.round(A * featherA);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const dataUrl = canvas.toDataURL();
      textureCacheRef.current.set(cacheKey, dataUrl);
      return dataUrl;
    },
    [gridData, studyAreaBounds, studyBoundary, currentStudyAreaId]
  );

  // ── 10m analysis grid GeoJSON (for hover + grid lines) ────────────────────
  const analysisGridGeoJSON = useMemo(() => {
    if (!gridData?.layers) return null;

    const rows = gridData.metadata.rows ?? 50;
    const cols = gridData.metadata.cols ?? 50;
    const { north, south, east, west } = studyAreaBounds;
    const dLat = (north - south) / rows;
    const dLon = (east - west) / cols;

    const baseT = gridData.layers["baseline_temperature_c"];
    const bldgH = gridData.layers["building_height"];
    const bldgD = gridData.layers["building_density"];
    const vegF = gridData.layers["veg_fraction"];
    const canopyH = gridData.layers["canopy_height"];
    const popD = gridData.layers["population_density"];
    const qfVal = gridData.layers["anthropogenic_heat_qf"];
    const svfVal = gridData.layers["sky_view_factor"];
    const albedoVal = gridData.layers["albedo"];

    const features: GeoJSON.Feature[] = [];

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
        const canopy = canopyH?.[r]?.[c] ?? veg * 14.0;

        features.push({
          type: "Feature",
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
            coolingPotential:
              height > 15 ? "-3.2" : veg < 0.2 ? "-4.5" : "-1.8",
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [cellWest, cellNorth],
              [cellEast, cellNorth],
              [cellEast, cellSouth],
              [cellWest, cellSouth],
              [cellWest, cellNorth],
            ]],
          },
        });
      }
    }

    return { type: "FeatureCollection" as const, features };
  }, [gridData, studyAreaBounds]);

  // ── Grid-cell fallback GeoJSON for 3D extrusion when OSM unavailable ───────
  const gridExtrusionGeoJSON = useMemo(() => {
    if (!gridData?.layers) return null;

    const rows = gridData.metadata.rows ?? 50;
    const cols = gridData.metadata.cols ?? 50;
    const { north, south, east, west } = studyAreaBounds;
    const dLat = (north - south) / rows;
    const dLon = (east - west) / cols;

    const baseT = gridData.layers["baseline_temperature_c"];
    const bldgH = gridData.layers["building_height"];
    const bldgD = gridData.layers["building_density"];
    const vegF = gridData.layers["veg_fraction"];

    const features: GeoJSON.Feature[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rawH = bldgH?.[r]?.[c] ?? 0;
        const dens = bldgD?.[r]?.[c] ?? 0;
        // Only extrude cells with actual buildings (density filter)
        if (rawH < 2.0 || dens < 0.12) continue;

        const cellNorth = north - r * dLat;
        const cellSouth = cellNorth - dLat;
        const cellWest = west + c * dLon;
        const cellEast = cellWest + dLon;

        let temp = baseT?.[r]?.[c] ?? 42.0;
        const h = rawH;
        const v = vegF?.[r]?.[c] ?? 0;

        if (activeScenario === "cool_roofs" && h > 10.0) temp = Math.max(30.0, temp - 3.2);
        else if (activeScenario === "green_roofs" && h > 10.0) temp = Math.max(30.0, temp - 3.8);
        else if (activeScenario === "tree_canopy" && h < 5.0) temp = Math.max(30.0, temp - 4.5);
        else if (activeScenario === "optimized") {
          if (h > 15.0) temp = Math.max(30.0, temp - 3.5);
          else if (h < 5.0 && v < 0.2) temp = Math.max(30.0, temp - 4.2);
        }

        features.push({
          type: "Feature",
          properties: { height: rawH, thermalValue: temp, layerKey: selectedLayer },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [cellWest + dLon * 0.08, cellNorth - dLat * 0.08],
              [cellEast - dLon * 0.08, cellNorth - dLat * 0.08],
              [cellEast - dLon * 0.08, cellSouth + dLat * 0.08],
              [cellWest + dLon * 0.08, cellSouth + dLat * 0.08],
              [cellWest + dLon * 0.08, cellNorth - dLat * 0.08],
            ]],
          },
        });
      }
    }

    return { type: "FeatureCollection" as const, features };
  }, [gridData, studyAreaBounds, selectedLayer, activeScenario]);

  // ── Build deck.gl layers array ─────────────────────────────────────────────
  const buildDeckLayers = useCallback(() => {
    const layers: any[] = [];

    // 1. Thermal BitmapLayer — interpolated, feather-masked to boundary
    const dataURL = generateThermalTexture(selectedLayer, activeScenario);
    if (dataURL) {
      const { west, south, east, north } = studyAreaBounds;
      layers.push(
        new BitmapLayer({
          id: "thermal-bitmap-layer",
          image: dataURL,
          bounds: [west, south, east, north],
          opacity: thermalOpacity,
          pickable: false,
          // GPU bilinear sampling — smooth gradient between cells
          textureParameters: {
            minFilter: "linear",
            magFilter: "linear",
          },
        })
      );
    }

    // 2. Study area boundary stroke
    if (studyBoundary) {
      layers.push(
        new GeoJsonLayer({
          id: "study-boundary-layer",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: studyBoundary.boundary,
              },
            ],
          },
          stroked: true,
          filled: false,
          getLineColor: [74, 108, 255, 180],
          getLineWidth: 2,
          lineWidthUnits: "pixels",
          getDashArray: [8, 5],
          dashJustified: true,
          extensions: [], // dasharray extension handled below
          pickable: false,
        })
      );
    }

    // 3. Analysis grid cell hover fill (always present, visible only when hovered)
    if (analysisGridGeoJSON) {
      layers.push(
        new GeoJsonLayer({
          id: "analysis-grid-hover-layer",
          data: analysisGridGeoJSON,
          stroked: showAnalysisGrid,
          filled: true,
          getFillColor: (f: any) => {
            const isHovered =
              hoveredCell &&
              hoveredCell.row === f.properties.row &&
              hoveredCell.col === f.properties.col;
            const isSelected =
              selectedCell &&
              selectedCell.row === f.properties.row &&
              selectedCell.col === f.properties.col;
            if (isSelected) return [74, 108, 255, 80];
            if (isHovered) return [74, 108, 255, 55];
            return [0, 0, 0, 0];
          },
          getLineColor: [255, 255, 255, 30],
          getLineWidth: showAnalysisGrid ? 0.5 : 0,
          lineWidthUnits: "pixels",
          pickable: true,
          autoHighlight: false,
          updateTriggers: {
            getFillColor: [hoveredCell, selectedCell],
            getLineWidth: [showAnalysisGrid],
          },
          onHover: (info: any) => {
            setHoveredCell(info.object?.properties ?? null);
          },
          onClick: (info: any) => {
            if (info.object?.properties) {
              setSelectedCell(info.object.properties);
              onCellSelect?.(info.object.properties);
            }
          },
        })
      );
    }

    // 4. 3D building extrusion (lazy-loaded, only in 3D mode)
    if (is3DMode) {
      if (osmBuildings && osmBuildings.features.length > 0) {
        // Use real OSM footprints with real heights
        const enriched = assignThermalToBuildings(
          osmBuildings,
          gridData,
          studyAreaBounds,
          selectedLayer,
          activeScenario
        );

        layers.push(
          new GeoJsonLayer({
            id: "osm-buildings-3d-layer",
            data: enriched,
            extruded: true,
            stroked: false,
            filled: true,
            wireframe: false,
            getElevation: (f: any) => f.properties?.height ?? 8,
            getFillColor: (f: any) => {
              const tv = f.properties?.thermalValue ?? 42;
              const [R, G, B] = thermalValueToRGBA(tv, selectedLayer);
              return [R, G, B, 210];
            },
            material: {
              ambient: 0.2,
              diffuse: 0.6,
              shininess: 32,
              specularColor: [60, 64, 70],
            },
            pickable: true,
            autoHighlight: true,
            highlightColor: [255, 255, 255, 40],
            onHover: (info: any) => {
              if (info.object?.properties) {
                setHoveredCell({
                  row: 0,
                  col: 0,
                  temp: info.object.properties.thermalValue?.toFixed(1) ?? "—",
                  height: info.object.properties.height?.toFixed(1) ?? "—",
                  canopyHeight: "—",
                  popDensity: "—",
                  qfAnthro: "—",
                  svf: "—",
                  albedo: "—",
                });
              } else {
                setHoveredCell(null);
              }
            },
            updateTriggers: {
              getFillColor: [selectedLayer, activeScenario],
              getElevation: [],
            },
          })
        );
      } else if (gridExtrusionGeoJSON) {
        // Fallback: grid-cell extrusion when OSM unavailable
        layers.push(
          new GeoJsonLayer({
            id: "grid-buildings-3d-layer",
            data: gridExtrusionGeoJSON,
            extruded: true,
            stroked: false,
            filled: true,
            getElevation: (f: any) => f.properties?.height ?? 8,
            getFillColor: (f: any) => {
              const tv = f.properties?.thermalValue ?? 42;
              const [R, G, B] = thermalValueToRGBA(tv, selectedLayer);
              return [R, G, B, 210];
            },
            material: {
              ambient: 0.2,
              diffuse: 0.6,
              shininess: 24,
            },
            pickable: false,
            updateTriggers: {
              getFillColor: [selectedLayer, activeScenario],
            },
          })
        );
      }
    }

    return layers;
  }, [
    generateThermalTexture,
    selectedLayer,
    activeScenario,
    thermalOpacity,
    studyAreaBounds,
    studyBoundary,
    analysisGridGeoJSON,
    showAnalysisGrid,
    hoveredCell,
    selectedCell,
    is3DMode,
    osmBuildings,
    gridExtrusionGeoJSON,
    gridData,
    onCellSelect,
  ]);

  // Reference to trigger layer visibility check on selectedLayer change
  const updateLayerVisibilityRef = useRef<() => void>(() => {});

  // ── Global map flyTo event listener ─────────────────────────────────────────
  useEffect(() => {
    const handleFlyTo = (e: any) => {
      if (e.detail && mapRef.current) {
        const { lon, lat, zoom = 12.0 } = e.detail;
        mapRef.current.flyTo({
          center: [lon, lat],
          zoom,
          duration: 1500,
        });
      }
    };
    window.addEventListener("mapFlyTo", handleFlyTo);
    return () => window.removeEventListener("mapFlyTo", handleFlyTo);
  }, []);

  // ── Click outside search dropdown listener ──────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Search handler with Nominatim OSM geocoding API (Part 2) ────────────────
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setIsSearchOpen(true);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      searchAbortRef.current = controller;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query.trim()
          )}&limit=6&addressdetails=1`,
          {
            signal: controller.signal,
            headers: {
              "Accept-Language": "en",
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
        } else {
          setSearchResults([]);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Geocoding lookup notice:", err);
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Fly to selected pinned study area
  const handleSelectStudyArea = (area: (typeof PINNED_STUDY_AREAS)[0]) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: area.center,
        zoom: area.zoom,
        duration: 1500,
      });
    }
    window.dispatchEvent(
      new CustomEvent("studyAreaChanged", { detail: area.id })
    );
  };

  // Fly to selected Nominatim global search result
  const handleSelectNominatim = (result: any) => {
    setIsSearchOpen(false);
    setSearchQuery(result.display_name.split(",")[0] || searchQuery);
    const lon = parseFloat(result.lon);
    const lat = parseFloat(result.lat);
    if (!isNaN(lon) && !isNaN(lat) && mapRef.current) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 12.0,
        duration: 1600,
      });
    }
  };

  // ── Initialize MapLibre + deck.gl MapboxOverlay ────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const style = SatelliteBasemapProvider.getMapLibreStyle(mapProvider);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style,
      center: [studyAreaBounds.centerLon, studyAreaBounds.centerLat],
      zoom: 15.5,
      pitch: 0,
      bearing: 0,
      antialias: true,
      attributionControl: false,
    });

    mapRef.current = map;

    // Add NASA GIBS MODIS LST raster source once the style loads
    map.on("load", () => {
      // GIBS global LST tile source
      map.addSource("gibs-lst-source", {
        type: "raster",
        tiles: [GIBS_TILE_URL],
        tileSize: 256,
        attribution:
          "Imagery provided by NASA EOSDIS GIBS · MODIS Terra LST",
        maxzoom: 7,
      });

      map.addLayer({
        id: "gibs-lst-layer",
        type: "raster",
        source: "gibs-lst-source",
        paint: {
          "raster-opacity": 0.0, // starts hidden; zoom listener drives setPaintProperty
          "raster-resampling": "linear",
        },
      });
    });

    // ── GIBS ↔ local grid cross-fade & non-LST layer gate ─────────────────
    const allBoundaries = getAllStudyAreaBoundaries();

    const handleZoomOrMove = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      const cLon = center.lng;
      const cLat = center.lat;

      // Check if camera center is inside any registered study area bbox
      const insideStudyArea = allBoundaries.some((sb) => {
        const { west, south, east, north } = sb.bbox;
        return cLon >= west && cLon <= east && cLat >= south && cLat <= north;
      });

      const currentLayer = selectedLayerRef.current;
      const isLSTLayer = currentLayer === "baseline_temperature_c";

      let targetGibsOpacity = 0.0;
      let newDataMode: "gibs" | "crossfade" | "local" | "not_available";

      if (insideStudyArea && zoom >= GIBS_FADE_END_ZOOM) {
        // Inside study area at detail zoom: show local 10m grid
        targetGibsOpacity = 0.0;
        newDataMode = "local";
      } else if (insideStudyArea && zoom >= GIBS_FADE_START_ZOOM) {
        // Inside study area in crossfade zone
        if (isLSTLayer) {
          const t =
            (zoom - GIBS_FADE_START_ZOOM) /
            (GIBS_FADE_END_ZOOM - GIBS_FADE_START_ZOOM);
          targetGibsOpacity = 0.72 * (1 - t);
          newDataMode = "crossfade";
        } else {
          targetGibsOpacity = 0.0;
          newDataMode = "local";
        }
      } else {
        // Outside study area OR zoomed out past threshold
        if (isLSTLayer) {
          targetGibsOpacity = 0.72;
          newDataMode = "gibs";
        } else {
          // Bug B Fix: For non-LST layers outside study areas, do NOT render GIBS!
          targetGibsOpacity = 0.0;
          newDataMode = "not_available";
        }
      }

      // Apply opacity to MapLibre raster layer
      if (map.getLayer("gibs-lst-layer")) {
        map.setPaintProperty(
          "gibs-lst-layer",
          "raster-opacity",
          targetGibsOpacity
        );
      }

      setGibsOpacity(targetGibsOpacity);
      setDataMode(newDataMode);
    };

    updateLayerVisibilityRef.current = handleZoomOrMove;

    map.on("zoom", handleZoomOrMove);
    map.on("move", handleZoomOrMove);
    map.on("load", handleZoomOrMove);

    const overlay = new MapboxOverlay({
      interleaved: false,
      layers: [],
    });

    overlayRef.current = overlay;
    map.addControl(overlay as any);

    // Initial resize on load and next frame
    map.on("load", () => {
      map.resize();
    });
    const resizeTimer = setTimeout(() => {
      if (mapRef.current) mapRef.current.resize();
    }, 150);

    // ResizeObserver for dynamic layout / tab changes
    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    ro.observe(mapContainerRef.current);

    return () => {
      clearTimeout(resizeTimer);
      ro.disconnect();
      overlay.finalize();
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapProvider]);

  // ── Sync map camera when study area bounds change ───────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const sb = studyBoundary;
    const center = sb
      ? sb.center
      : ([studyAreaBounds.centerLon, studyAreaBounds.centerLat] as [number, number]);
    const zoom = sb?.zoom ?? 15.5;
    mapRef.current.flyTo({
      center,
      zoom,
      duration: 1200,
    });
  }, [studyBoundary, studyAreaBounds]);

  // ── Immediately update layer visibility when selectedLayer changes ──────────
  useEffect(() => {
    selectedLayerRef.current = selectedLayer;
    if (updateLayerVisibilityRef.current) {
      updateLayerVisibilityRef.current();
    }
  }, [selectedLayer]);

  // ── Update deck.gl layers whenever state changes ───────────────────────────
  useEffect(() => {
    if (!overlayRef.current) return;
    overlayRef.current.setProps({ layers: buildDeckLayers() });
  }, [buildDeckLayers]);

  // ── 2D ↔ 3D camera transition ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.easeTo({
      pitch: is3DMode ? 55 : 0,
      bearing: is3DMode ? -18 : 0,
      duration: 900,
    });
  }, [is3DMode]);

  // ── Lazy-load OSM buildings when 3D mode first activated ───────────────────
  useEffect(() => {
    if (!is3DMode || osmBuildings !== null || osmLoading) return;

    setOsmLoading(true);
    setOsmStatus("Fetching OSM building footprints…");

    const areaId = gridData?.metadata?.study_area_id ?? "delhi_cp";
    fetchOSMBuildings(studyAreaBounds, areaId, setOsmStatus).then((result) => {
      setOsmBuildings(result); // null = graceful degradation to grid fallback
      setOsmLoading(false);
      if (!result) setOsmStatus("Grid fallback active");
    });
  }, [is3DMode, osmBuildings, osmLoading, studyAreaBounds, gridData]);

  // ── Reset camera ──────────────────────────────────────────────────────────
  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;
    const sb = studyBoundary;
    map.flyTo({
      center: sb
        ? sb.center
        : [studyAreaBounds.centerLon, studyAreaBounds.centerLat],
      zoom: sb?.zoom ?? 15.5,
      pitch: is3DMode ? 55 : 0,
      bearing: is3DMode ? -18 : 0,
      duration: 1000,
    });
  };

  const activeInspection = selectedCell || hoveredCell;

  // Filter pinned study areas matching query
  const filteredPinned = PINNED_STUDY_AREAS.filter((p) =>
    `${p.name} ${p.city} ${p.country}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase().trim())
  );

  // Derive badge metadata cleanly
  const pinnedArea = PINNED_STUDY_AREAS.find((p) => p.id === currentStudyAreaId);
  const registeredBoundary = getStudyAreaBoundary(currentStudyAreaId);
  const badgeTitle =
    pinnedArea?.name ||
    registeredBoundary?.name ||
    gridData?.metadata?.name?.replace(" Multi-Source Satellite Twin", "") ||
    "Connaught Place";
  const badgeSubtitle = pinnedArea
    ? `${pinnedArea.city}, ${pinnedArea.country}`
    : gridData?.metadata?.city && gridData?.metadata?.country
    ? `${gridData.metadata.city}, ${gridData.metadata.country}`
    : gridData?.metadata?.location || "";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-[620px] select-none overflow-hidden rounded-lg border border-surface-border bg-[#0B0C10]">
      {/* 1. Full-Width Absolute Map Canvas Mount */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* 2. Unified Top Control Toolbar */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between gap-2 flex-wrap pointer-events-none">
        {/* Left: Study Area Badge & Global Search */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {/* Study Area Badge */}
          <div className="flex items-center gap-2 bg-surface-elevated/90 backdrop-blur-md border border-surface-border px-3 py-1.5 rounded-md shadow-floating text-xs">
            <span className="w-2 h-2 rounded-full bg-status-safe animate-subtle-pulse shrink-0" />
            <span className="font-medium text-ink-primary tracking-tight truncate max-w-[170px]">
              {badgeTitle}
            </span>
            {badgeSubtitle && (
              <span className="text-ink-dim font-mono text-[10px] hidden sm:inline truncate">
                ({badgeSubtitle})
              </span>
            )}
          </div>

          {/* Global Location Search Bar */}
          <div ref={searchContainerRef} className="relative">
            <div className="flex items-center bg-surface-elevated/90 backdrop-blur-md border border-surface-border hover:border-surface-borderHover focus-within:border-cobalt/60 rounded-md px-2.5 py-1.5 shadow-floating text-xs text-ink-primary transition-all w-36 sm:w-52">
              <Search className="w-3.5 h-3.5 text-ink-muted mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="bg-transparent border-none outline-none text-xs text-ink-primary placeholder-ink-dim w-full font-sans"
              />
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-cobalt animate-spin shrink-0" />
              ) : searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="text-ink-muted hover:text-ink-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && (
              <div className="absolute left-0 mt-1.5 w-80 max-h-88 overflow-y-auto bg-surface-elevated/95 backdrop-blur-xl border border-surface-border rounded-lg p-1.5 shadow-floating z-50 text-xs space-y-1.5">
                {/* Pinned 10m Physics Study Areas */}
                <div>
                  <div className="text-label px-2 py-1 text-cobalt border-b border-surface-border/50 flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3 h-3" />
                    <span>10m Physics Study Areas</span>
                  </div>
                  {filteredPinned.length > 0 ? (
                    filteredPinned.map((area) => (
                      <button
                        key={area.id}
                        onClick={() => handleSelectStudyArea(area)}
                        className="w-full flex items-center justify-between p-1.5 rounded-md hover:bg-surface-interactive text-left text-ink-secondary hover:text-ink-primary transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{area.flag}</span>
                          <div>
                            <div className="font-medium text-xs text-ink-primary">
                              {area.name}
                            </div>
                            <div className="text-[10px] text-ink-muted">
                              {area.city}, {area.country}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-status-safe/10 text-status-safe border border-status-safe/20">
                          10m Grid
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-1 text-[11px] text-ink-dim italic">
                      No matching study areas
                    </div>
                  )}
                </div>

                {/* Worldwide Nominatim Results */}
                {searchQuery.trim() && (
                  <div className="border-t border-surface-border/50 pt-1">
                    <div className="text-label px-2 py-1 text-ink-muted flex items-center gap-1.5 mb-1">
                      <Globe className="w-3 h-3" />
                      <span>Global Locations (OSM Reference)</span>
                    </div>

                    {isSearching ? (
                      <div className="p-3 text-center text-ink-muted flex items-center justify-center gap-2 text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cobalt" />
                        <span>Searching geocoder…</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectNominatim(item)}
                          className="w-full flex items-start gap-2 p-1.5 rounded-md hover:bg-surface-interactive text-left text-ink-secondary hover:text-ink-primary transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-ink-dim shrink-0 mt-0.5" />
                          <div className="truncate">
                            <div className="font-medium text-xs text-ink-primary truncate">
                              {item.display_name.split(",")[0]}
                            </div>
                            <div className="text-[10px] text-ink-dim truncate">
                              {item.display_name}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-2 text-center text-ink-dim text-xs italic">
                        No global locations found
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Camera Actions */}
        <div className="flex items-center gap-1.5 bg-surface-elevated/90 backdrop-blur-md border border-surface-border p-1 rounded-md shadow-floating text-xs text-ink-primary pointer-events-auto">
          {/* 2D / 3D Segmented Control */}
          <div className="flex items-center bg-surface-base p-0.5 rounded border border-surface-border">
            <button
              onClick={() => setIs3DMode(false)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                !is3DMode
                  ? "bg-cobalt text-white font-medium shadow-sm"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setIs3DMode(true)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                is3DMode
                  ? "bg-cobalt text-white font-medium shadow-sm"
                  : "text-ink-muted hover:text-ink-primary"
              }`}
            >
              3D
            </button>
          </div>

          {/* Reset View */}
          <button
            onClick={handleResetView}
            className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-interactive transition-colors"
            title="Reset Camera Orientation & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Secondary Floating Control Bar: Layer, Scenario, Opacity & Grid */}
      <div className="absolute top-12 left-2.5 z-20 flex flex-wrap items-center gap-2 bg-surface-elevated/90 backdrop-blur-md border border-surface-border p-1.5 rounded-md shadow-floating text-xs text-ink-primary max-w-[calc(100%-20px)]">
        {/* Layer Dropdown */}
        <div className="flex items-center gap-1.5 pl-0.5">
          <Layers className="w-3.5 h-3.5 text-cobalt shrink-0" />
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="bg-surface-base border border-surface-border text-ink-primary text-xs px-2 py-1 rounded outline-none focus:border-cobalt transition-colors font-sans cursor-pointer"
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
          <Zap className="w-3.5 h-3.5 text-status-high shrink-0" />
          <select
            value={activeScenario}
            onChange={(e) => setActiveScenario(e.target.value)}
            className="bg-surface-base border border-surface-border text-ink-primary text-xs px-2 py-1 rounded outline-none focus:border-cobalt transition-colors font-sans cursor-pointer"
          >
            <option value="baseline">Baseline (Observed)</option>
            <option value="cool_roofs">Cool Roofs (α=0.85)</option>
            <option value="green_roofs">Green Roofs (Extensive)</option>
            <option value="tree_canopy">Tree Canopy Corridor</option>
            <option value="optimized">NSGA-II Optimized Strategy</option>
          </select>
        </div>

        <div className="h-3.5 w-px bg-surface-border hidden sm:block" />

        {/* Overlay Opacity Slider */}
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-ink-dim text-[11px] font-sans">Alpha:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={thermalOpacity}
            onChange={(e) => setThermalOpacity(Number(e.target.value))}
            className="w-14 accent-cobalt cursor-pointer"
            title="Adjust raster opacity"
          />
          <span className="text-ink-secondary font-mono text-[10px] w-5">
            {Math.round(thermalOpacity * 100)}%
          </span>
        </div>

        <div className="h-3.5 w-px bg-surface-border hidden sm:block" />

        {/* 10m Grid Toggle */}
        <button
          onClick={() => setShowAnalysisGrid(!showAnalysisGrid)}
          className={`px-2 py-0.5 rounded text-[11px] font-sans transition-colors flex items-center gap-1 border ${
            showAnalysisGrid
              ? "bg-cobalt/15 text-cobalt border-cobalt/30 font-medium"
              : "bg-transparent text-ink-muted border-transparent hover:text-ink-primary"
          }`}
          title="Toggle 10m cell grid lines"
        >
          <Grid className="w-3 h-3" />
          <span>Grid</span>
        </button>
      </div>

      {/* 4. Global Notice for Non-LST Layers outside Study Areas */}
      {dataMode === "not_available" && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-surface-elevated/95 backdrop-blur-md border border-status-high/30 px-3.5 py-1.5 rounded-md shadow-floating text-xs text-status-high">
          <Info className="w-3.5 h-3.5 text-status-high shrink-0" />
          <span>
            Global reference unavailable for <strong>{layerMeta.label}</strong>. Zoom into a 10m study area.
          </span>
        </div>
      )}

      {/* 5. OSM Status Badge (3D mode) */}
      {is3DMode && osmStatus && (
        <div className="absolute top-24 left-2.5 z-20 flex items-center gap-1.5 bg-surface-elevated/90 backdrop-blur-md border border-surface-border px-2.5 py-1 rounded-md text-[10px] font-mono text-ink-secondary">
          {osmLoading ? (
            <span className="w-1.5 h-1.5 rounded-full bg-status-high animate-subtle-pulse" />
          ) : osmBuildings ? (
            <span className="w-1.5 h-1.5 rounded-full bg-status-safe" />
          ) : (
            <AlertCircle className="w-3 h-3 text-status-high" />
          )}
          {osmStatus}
        </div>
      )}

      {/* 6. Bottom-Left: Collapsible Scientific Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-surface-elevated/90 backdrop-blur-md border border-surface-border p-2.5 rounded-lg shadow-floating text-xs space-y-1.5 min-w-48 max-w-64">
        <div className="flex items-center justify-between gap-2 border-b border-surface-border/50 pb-1">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-ink-primary">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                dataMode === "local"
                  ? "bg-cobalt"
                  : dataMode === "crossfade"
                  ? "bg-status-high animate-subtle-pulse"
                  : dataMode === "gibs"
                  ? "bg-status-safe"
                  : "bg-status-high"
              }`}
            />
            <span className="truncate">
              {dataMode === "local"
                ? "10m Microgrid"
                : dataMode === "crossfade"
                ? "MODIS ↔ 10m Grid"
                : dataMode === "gibs"
                ? "NASA MODIS ~1km"
                : "10m Simulation"}
            </span>
          </div>

          <button
            onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
            className="text-ink-muted hover:text-ink-primary transition-colors p-0.5"
            title={isLegendCollapsed ? "Expand legend" : "Collapse legend"}
          >
            {isLegendCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {!isLegendCollapsed && (
          <>
            {dataMode === "not_available" ? (
              <div className="space-y-1 pt-0.5">
                <div className="text-[11px] font-medium text-ink-primary">
                  {layerMeta.label}
                </div>
                <div className="text-[10px] text-ink-muted leading-snug">
                  Global reference available for Surface Temperature (LST).
                </div>
              </div>
            ) : dataMode === "gibs" ? (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-ink-muted">
                  <span>{NASA_GIBS_LST_META.label}</span>
                  <span className="font-mono text-ink-secondary">{NASA_GIBS_LST_META.unit}</span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full"
                  style={{ background: NASA_GIBS_LST_META.gradientCss }}
                />
                <div className="flex justify-between text-[9px] text-ink-muted font-mono">
                  <span>{NASA_GIBS_LST_META.minLabel}</span>
                  <span>{NASA_GIBS_LST_META.maxLabel}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-ink-muted">
                  <span>{layerMeta.label}</span>
                  <span className="font-mono text-ink-secondary">{layerMeta.unit}</span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full"
                  style={{ background: layerMeta.gradientCss }}
                />
                <div className="flex justify-between text-[9px] text-ink-muted font-mono">
                  <span>{layerMeta.minLabel}</span>
                  <span>{layerMeta.maxLabel}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 7. Bottom-Right: Tactical Cell Inspector HUD */}
      {activeInspection && (
        <div className="absolute bottom-3 right-3 z-20 bg-surface-elevated/95 backdrop-blur-md border border-surface-border p-3 rounded-lg shadow-floating text-xs space-y-2.5 min-w-56 max-w-64 animate-fade-in">
          <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cobalt" />
              <span className="font-medium text-xs text-ink-primary font-mono">
                {activeInspection.row !== undefined
                  ? `Cell [${activeInspection.row}, ${activeInspection.col}]`
                  : "Feature"}
              </span>
            </div>
            {selectedCell && (
              <button
                onClick={() => setSelectedCell(null)}
                className="text-ink-muted hover:text-ink-primary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1.5 text-[11px]">
            {/* Prominent Temperature Display */}
            <div className="flex items-baseline justify-between bg-surface-base/80 p-2 rounded border border-surface-border">
              <span className="text-ink-muted text-[10px]">Surface Temp:</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-status-critical font-bold text-sm font-mono">
                  {activeInspection.temp}
                </span>
                <span className="text-[10px] text-ink-muted">°C</span>
              </div>
            </div>

            {/* 2-Column Property Grid */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div className="surface-inset p-1.5 rounded">
                <span className="text-[9px] text-ink-dim block font-mono">HEIGHT</span>
                <span className="text-[11px] font-mono text-ink-primary">{activeInspection.height}m</span>
              </div>
              <div className="surface-inset p-1.5 rounded">
                <span className="text-[9px] text-ink-dim block font-mono">CANOPY</span>
                <span className="text-[11px] font-mono text-status-safe">{activeInspection.canopyHeight}m</span>
              </div>
              <div className="surface-inset p-1.5 rounded">
                <span className="text-[9px] text-ink-dim block font-mono">EXPOSURE</span>
                <span className="text-[11px] font-mono text-ink-primary">{activeInspection.popDensity} /ha</span>
              </div>
              <div className="surface-inset p-1.5 rounded">
                <span className="text-[9px] text-ink-dim block font-mono">ALBEDO</span>
                <span className="text-[11px] font-mono text-ink-primary">{activeInspection.albedo}</span>
              </div>
            </div>

            {activeScenario !== "baseline" && activeInspection.coolingPotential && (
              <div className="mt-1 p-1.5 rounded bg-status-safe/10 border border-status-safe/20 flex justify-between items-center text-[11px] text-status-safe font-mono font-medium">
                <span>Predicted ΔT:</span>
                <span>{activeInspection.coolingPotential}°C</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Micro Attribution */}
      <div className="absolute bottom-1 right-2 z-10 text-[9px] text-ink-dim pointer-events-none font-mono">
        © Esri · NASA GIBS · 10m SEB
      </div>
    </div>
  );
}

