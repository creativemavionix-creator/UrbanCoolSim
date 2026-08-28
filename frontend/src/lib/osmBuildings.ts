/**
 * osmBuildings.ts
 *
 * Fetches OSM building footprints from the Overpass API for a given bounding
 * box and study area, then caches them in localStorage (24h TTL) so that
 * subsequent loads and pan/zoom events don't re-fetch.
 *
 * Overpass query returns `building=*` ways + `height` / `building:levels` tags.
 * Heights are mapped to meters (OSM `height` is already in metres).
 * `building:levels` is multiplied by 3.2m/floor when `height` is absent.
 * Fallback height: 8m (typical 2-storey commercial block).
 *
 * Returns a GeoJSON FeatureCollection ready for deck.gl GeoJsonLayer.
 */

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_PREFIX = "osm_bldgs_";
const DEFAULT_HEIGHT_M = 8;
const METERS_PER_LEVEL = 3.2;
const TIMEOUT_MS = 12000; // 12s — Overpass can be slow

interface CacheEntry {
  timestamp: number;
  geojson: GeoJSON.FeatureCollection;
}

/** Returns cached data if it exists and is not stale, otherwise null. */
function loadFromCache(studyAreaId: string): GeoJSON.FeatureCollection | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + studyAreaId);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + studyAreaId);
      return null;
    }
    return entry.geojson;
  } catch {
    return null;
  }
}

function saveToCache(studyAreaId: string, geojson: GeoJSON.FeatureCollection): void {
  try {
    const entry: CacheEntry = { timestamp: Date.now(), geojson };
    localStorage.setItem(CACHE_KEY_PREFIX + studyAreaId, JSON.stringify(entry));
  } catch (e) {
    // localStorage full — skip caching silently
    console.warn("osmBuildings: localStorage write failed, caching skipped", e);
  }
}

/** Parses raw Overpass JSON response into a GeoJSON FeatureCollection. */
function overpassToGeoJSON(
  data: any
): GeoJSON.FeatureCollection {
  const nodeMap: Record<number, [number, number]> = {};
  for (const el of data.elements) {
    if (el.type === "node") {
      nodeMap[el.id] = [el.lon, el.lat];
    }
  }

  const features: GeoJSON.Feature[] = [];

  for (const el of data.elements) {
    if (el.type !== "way" || !el.nodes) continue;

    const coords: [number, number][] = [];
    for (const nodeId of el.nodes) {
      const pos = nodeMap[nodeId];
      if (pos) coords.push(pos);
    }
    if (coords.length < 4) continue; // degenerate

    const tags = el.tags || {};

    // Height resolution: explicit height tag → levels → default
    let height = DEFAULT_HEIGHT_M;
    if (tags.height) {
      const parsed = parseFloat(tags.height);
      if (!isNaN(parsed) && parsed > 0) height = parsed;
    } else if (tags["building:levels"]) {
      const levels = parseFloat(tags["building:levels"]);
      if (!isNaN(levels) && levels > 0) height = levels * METERS_PER_LEVEL;
    }

    features.push({
      type: "Feature",
      properties: {
        osm_id: el.id,
        building: tags.building || true,
        height,
        name: tags.name || null,
        levels: tags["building:levels"] ? parseFloat(tags["building:levels"]) : null,
      },
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    });
  }

  return { type: "FeatureCollection", features };
}

/**
 * Returns building footprints as a GeoJSON FeatureCollection.
 *
 * Priority: localStorage cache → Overpass API → null (on failure).
 *
 * @param bounds       Bounding box in WGS84 degrees.
 * @param studyAreaId  Cache key identifier (e.g. "delhi_cp").
 * @param onProgress   Optional callback called with status strings.
 */
export async function fetchOSMBuildings(
  bounds: { south: number; west: number; north: number; east: number },
  studyAreaId: string,
  onProgress?: (msg: string) => void
): Promise<GeoJSON.FeatureCollection | null> {
  // 1. Try cache first
  const cached = loadFromCache(studyAreaId);
  if (cached) {
    onProgress?.("OSM buildings: loaded from cache");
    return cached;
  }

  onProgress?.("OSM buildings: fetching from Overpass API…");

  // 2. Expand bbox slightly (10%) so edge buildings aren't clipped
  const latPad = (bounds.north - bounds.south) * 0.1;
  const lonPad = (bounds.east - bounds.west) * 0.1;
  const { south, west, north, east } = {
    south: bounds.south - latPad,
    west: bounds.west - lonPad,
    north: bounds.north + latPad,
    east: bounds.east + lonPad,
  };

  // Overpass QL query — building ways only, nodes for geometry
  const query = `
[out:json][timeout:15];
(
  way["building"](${south},${west},${north},${east});
);
out body;
>;
out skel qt;
`.trim();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    const data = await response.json();
    const geojson = overpassToGeoJSON(data);

    if (geojson.features.length === 0) {
      onProgress?.("OSM buildings: no buildings found in area");
      return null;
    }

    saveToCache(studyAreaId, geojson);
    onProgress?.(`OSM buildings: ${geojson.features.length} footprints loaded`);
    return geojson;

  } catch (err: any) {
    if (err?.name === "AbortError") {
      onProgress?.("OSM buildings: Overpass timeout — using grid fallback");
    } else {
      onProgress?.(`OSM buildings: fetch failed (${err?.message}) — using grid fallback`);
    }
    return null;
  }
}

/**
 * Assigns a thermal value to each OSM building by finding the nearest grid
 * cell centroid (fast approximation — O(n) scan per building centroid).
 *
 * @param buildings   GeoJSON FeatureCollection from fetchOSMBuildings()
 * @param gridData    DigitalTwinGrid from the API
 * @param studyBounds Exact geographic bounds of the grid
 * @param layerKey    Which grid layer to sample (e.g. "baseline_temperature_c")
 * @param scenario    Scenario modifiers to apply (mirrors DigitalTwinMap logic)
 */
export function assignThermalToBuildings(
  buildings: GeoJSON.FeatureCollection,
  gridData: any,
  studyBounds: { north: number; south: number; east: number; west: number },
  layerKey = "baseline_temperature_c",
  scenario = "baseline"
): GeoJSON.FeatureCollection {
  const { north, south, east, west } = studyBounds;
  const rows: number = gridData.metadata.rows || 50;
  const cols: number = gridData.metadata.cols || 50;
  const dLat = (north - south) / rows;
  const dLon = (east - west) / cols;

  const layerValues = gridData.layers?.[layerKey] || gridData.layers?.["baseline_temperature_c"];
  const bldgH = gridData.layers?.["building_height"];
  const vegF = gridData.layers?.["veg_fraction"];

  function sampleGrid(lon: number, lat: number): number {
    const col = Math.max(0, Math.min(cols - 1, Math.floor((lon - west) / dLon)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor((north - lat) / dLat)));
    let val = layerValues?.[row]?.[col] ?? 42.0;

    // Apply the same scenario modifiers as DigitalTwinMap
    if (layerKey.includes("temperature") || layerKey === "lst") {
      const h = bldgH?.[row]?.[col] ?? 0;
      const v = vegF?.[row]?.[col] ?? 0;
      if (scenario === "cool_roofs" && h > 10.0) val = Math.max(30.0, val - 3.2);
      else if (scenario === "green_roofs" && h > 10.0) val = Math.max(30.0, val - 3.8);
      else if (scenario === "tree_canopy" && h < 5.0) val = Math.max(30.0, val - 4.5);
      else if (scenario === "optimized") {
        if (h > 15.0) val = Math.max(30.0, val - 3.5);
        else if (h < 5.0 && v < 0.2) val = Math.max(30.0, val - 4.2);
      }
    }
    return val;
  }

  const enriched = buildings.features.map((feature) => {
    // Centroid approximation: average of polygon vertices
    const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
    let sumLon = 0, sumLat = 0;
    for (const [ln, lt] of coords) { sumLon += ln; sumLat += lt; }
    const centLon = sumLon / coords.length;
    const centLat = sumLat / coords.length;

    const thermalValue = sampleGrid(centLon, centLat);

    return {
      ...feature,
      properties: {
        ...feature.properties,
        thermalValue,
        layerKey,
      },
    };
  });

  return { type: "FeatureCollection", features: enriched };
}
