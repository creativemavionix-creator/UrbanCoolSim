"use client";

import { useState, useEffect } from "react";
import { 
  MapPin, 
  ChevronDown, 
  HelpCircle, 
  Building2, 
  Landmark, 
  Microscope,
  Activity,
  Search,
  Loader2,
  Globe,
  X,
} from "lucide-react";
import { OnboardingModal } from "@/components/OnboardingModal";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onStudyAreaChange?: (areaId: string) => void;
}

const studyAreas = [
  { 
    id: "delhi_cp", 
    name: "Connaught Place", 
    city: "New Delhi", 
    country: "India", 
    crs: "UTM 43N", 
    flag: "🇮🇳",
    baseTemp: "42.0°C",
    typology: "Semi-Arid Radial Core",
    center: [77.2167, 28.6315],
    zoom: 15.5,
  },
  { 
    id: "mumbai_bkc", 
    name: "Bandra Kurla Complex", 
    city: "Mumbai", 
    country: "India", 
    crs: "UTM 43N", 
    flag: "🇮🇳",
    baseTemp: "36.5°C",
    typology: "Coastal Humid Core",
    center: [72.8683, 19.0657],
    zoom: 15.0,
  },
  { 
    id: "singapore_marina", 
    name: "Marina Bay", 
    city: "Singapore", 
    country: "Singapore", 
    crs: "UTM 48N", 
    flag: "🇸🇬",
    baseTemp: "33.0°C",
    typology: "Tropical High-Rise Waterfront",
    center: [103.8565, 1.2847],
    zoom: 15.2,
  },
  { 
    id: "phoenix_downtown", 
    name: "Downtown Core", 
    city: "Phoenix", 
    country: "USA", 
    crs: "UTM 12N", 
    flag: "🇺🇸",
    baseTemp: "45.0°C",
    typology: "Arid Desert Grid",
    center: [-112.0740, 33.4484],
    zoom: 15.0,
  },
  { 
    id: "tokyo_shinjuku", 
    name: "Shinjuku Canyon", 
    city: "Tokyo", 
    country: "Japan", 
    crs: "UTM 54N", 
    flag: "🇯🇵",
    baseTemp: "35.5°C",
    typology: "High-Density Urban Canyons",
    center: [139.7034, 35.6938],
    zoom: 15.0,
  },
];

const personas = [
  { id: "muni", label: "Municipal Planner", icon: Landmark, tag: "Heat-Health" },
  { id: "developer", label: "Real Estate ESG", icon: Building2, tag: "LEED / ROI" },
  { id: "consultant", label: "Climate Scientist", icon: Microscope, tag: "SEB Physics" },
];

export function Header({ title, subtitle, onStudyAreaChange }: HeaderProps) {
  const [selectedArea, setSelectedArea] = useState("delhi_cp");
  const [selectedPersona, setSelectedPersona] = useState("muni");
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Global search state in Header
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [isHeaderSearching, setIsHeaderSearching] = useState(false);
  const [headerSearchResults, setHeaderSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const savedArea = localStorage.getItem("urbancoolsim_study_area");
    if (savedArea) setSelectedArea(savedArea);
    const savedPersona = localStorage.getItem("urbancoolsim_persona");
    if (savedPersona) setSelectedPersona(savedPersona);
  }, []);

  const handleSelectArea = (id: string) => {
    setSelectedArea(id);
    localStorage.setItem("urbancoolsim_study_area", id);
    setShowAreaDropdown(false);
    setIsHeaderSearchOpen(false);
    setHeaderSearchQuery("");
    if (onStudyAreaChange) onStudyAreaChange(id);
    window.dispatchEvent(new CustomEvent("studyAreaChanged", { detail: id }));

    const area = studyAreas.find((s) => s.id === id);
    if (area) {
      window.dispatchEvent(
        new CustomEvent("mapFlyTo", {
          detail: { lon: area.center[0], lat: area.center[1], zoom: area.zoom },
        })
      );
    }
  };

  const handleSelectPersona = (id: string) => {
    setSelectedPersona(id);
    localStorage.setItem("urbancoolsim_persona", id);
    setShowPersonaDropdown(false);
    window.dispatchEvent(new CustomEvent("personaChanged", { detail: id }));
  };

  const handleHeaderSearch = (query: string) => {
    setHeaderSearchQuery(query);
    setIsHeaderSearchOpen(true);

    if (!query.trim()) {
      setHeaderSearchResults([]);
      setIsHeaderSearching(false);
      return;
    }

    setIsHeaderSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query.trim()
          )}&limit=5&addressdetails=1`,
          {
            headers: { "Accept-Language": "en" },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setHeaderSearchResults(data || []);
        }
      } catch (err) {
        console.warn("Header geocoding error:", err);
      } finally {
        setIsHeaderSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  };

  const handleSelectNominatimHeader = (result: any) => {
    setIsHeaderSearchOpen(false);
    setHeaderSearchQuery(result.display_name.split(",")[0] || headerSearchQuery);
    const lon = parseFloat(result.lon);
    const lat = parseFloat(result.lat);
    if (!isNaN(lon) && !isNaN(lat)) {
      window.dispatchEvent(
        new CustomEvent("mapFlyTo", {
          detail: { lon, lat, zoom: 12.0 },
        })
      );
    }
  };

  const currentAreaObj = studyAreas.find((s) => s.id === selectedArea) || studyAreas[0];
  const currentPersonaObj = personas.find((p) => p.id === selectedPersona) || personas[0];
  const PersonaIcon = currentPersonaObj.icon;

  const filteredStudyAreas = studyAreas.filter((s) =>
    `${s.name} ${s.city} ${s.country}`
      .toLowerCase()
      .includes(headerSearchQuery.toLowerCase().trim())
  );

  return (
    <>
      <header className="h-14 border-b border-surface-border bg-surface-base px-6 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Title & Hierarchy */}
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium text-ink-primary tracking-tight">{title}</h1>
          {subtitle && (
            <span className="text-xs text-ink-muted border-l border-surface-border pl-3 hidden md:inline">
              {subtitle}
            </span>
          )}
        </div>

        {/* Action Controls & Multi-City Switcher */}
        <div className="flex items-center gap-3 text-xs">
          {/* Global Location Search Input in Header */}
          <div className="relative hidden sm:block">
            <div className="flex items-center bg-surface-elevated border border-surface-border hover:border-surface-borderHover focus-within:border-cobalt rounded px-2.5 py-1.5 text-xs text-ink-primary transition-all w-52 lg:w-64">
              <Search className="w-3.5 h-3.5 text-ink-muted mr-1.5 shrink-0" />
              <input
                type="text"
                placeholder="Search global city..."
                value={headerSearchQuery}
                onChange={(e) => handleHeaderSearch(e.target.value)}
                onFocus={() => setIsHeaderSearchOpen(true)}
                className="bg-transparent border-none outline-none text-xs text-ink-primary placeholder-ink-muted w-full font-sans"
              />
              {isHeaderSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-cobalt animate-spin shrink-0" />
              ) : headerSearchQuery ? (
                <button
                  onClick={() => {
                    setHeaderSearchQuery("");
                    setHeaderSearchResults([]);
                  }}
                  className="text-ink-muted hover:text-ink-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>

            {/* Header Search Dropdown */}
            <AnimatePresence>
              {isHeaderSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1.5 w-80 max-h-96 overflow-y-auto bg-surface-elevated border border-surface-border rounded-lg p-2 shadow-floating z-50 space-y-2 text-xs"
                >
                  {/* Pinned Study Areas */}
                  <div>
                    <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-cobalt font-semibold flex items-center gap-1.5 border-b border-surface-border/60 pb-1 mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>10m Physics Study Areas</span>
                    </div>
                    {filteredStudyAreas.map((area) => (
                      <button
                        key={area.id}
                        onClick={() => handleSelectArea(area.id)}
                        className={`w-full flex items-center justify-between p-1.5 rounded text-left transition-colors ${
                          area.id === selectedArea
                            ? "bg-surface-interactive text-ink-primary font-medium"
                            : "text-ink-secondary hover:text-ink-primary hover:bg-surface-interactive/60"
                        }`}
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
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          10m Physics
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Worldwide Nominatim Results */}
                  {headerSearchQuery.trim() && (
                    <div className="border-t border-surface-border pt-1.5">
                      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted flex items-center gap-1.5 mb-1">
                        <Globe className="w-3 h-3" />
                        <span>Global Locations (OSM Reference)</span>
                      </div>
                      {isHeaderSearching ? (
                        <div className="p-3 text-center text-ink-muted flex items-center justify-center gap-2 text-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cobalt" />
                          <span>Searching global geocoder...</span>
                        </div>
                      ) : headerSearchResults.length > 0 ? (
                        headerSearchResults.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectNominatimHeader(item)}
                            className="w-full flex items-start gap-2 p-1.5 rounded text-left text-ink-secondary hover:text-ink-primary hover:bg-surface-interactive/60 transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
                            <div className="truncate">
                              <div className="font-medium text-xs text-ink-primary truncate">
                                {item.display_name.split(",")[0]}
                              </div>
                              <div className="text-[10px] text-ink-muted truncate">
                                {item.display_name}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-2 text-center text-ink-muted text-xs italic">
                          No global locations found
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Multi-City Study Area Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAreaDropdown(!showAreaDropdown);
                setShowPersonaDropdown(false);
                setIsHeaderSearchOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-surface-elevated border border-surface-border hover:border-surface-borderHover text-ink-primary transition-all"
            >
              <span>{currentAreaObj.flag}</span>
              <span className="font-medium text-ink-primary">
                {currentAreaObj.city} · {currentAreaObj.name}
              </span>
              <span className="text-[10px] font-mono text-ink-muted hidden sm:inline">
                {currentAreaObj.baseTemp}
              </span>
              <ChevronDown className="w-3 h-3 text-ink-muted" />
            </button>

            <AnimatePresence>
              {showAreaDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1.5 w-72 bg-surface-elevated border border-surface-border rounded-lg p-1.5 shadow-floating z-50 space-y-0.5"
                >
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted border-b border-surface-border/60">
                    10m Digital Twin Archetypes
                  </div>
                  {studyAreas.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => handleSelectArea(area.id)}
                      className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors ${
                        area.id === selectedArea
                          ? "bg-surface-interactive text-ink-primary font-medium"
                          : "text-ink-secondary hover:text-ink-primary hover:bg-surface-interactive/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{area.flag}</span>
                        <div>
                          <div className="font-medium text-xs text-ink-primary">{area.city} · {area.name}</div>
                          <div className="text-[10px] text-ink-muted">{area.typology}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-status-critical font-medium block">{area.baseTemp}</span>
                        <span className="text-[9px] font-mono text-ink-muted">{area.crs}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stakeholder Persona Switcher */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => {
                setShowPersonaDropdown(!showPersonaDropdown);
                setShowAreaDropdown(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-surface-elevated border border-surface-border hover:border-surface-borderHover text-ink-secondary hover:text-ink-primary transition-all"
            >
              <PersonaIcon className="w-3.5 h-3.5 text-cobalt" />
              <span>{currentPersonaObj.label}</span>
              <ChevronDown className="w-3 h-3 text-ink-muted" />
            </button>

            <AnimatePresence>
              {showPersonaDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1.5 w-56 bg-surface-elevated border border-surface-border rounded-lg p-1.5 shadow-floating z-50 space-y-0.5"
                >
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted border-b border-surface-border/60">
                    Decision Perspective
                  </div>
                  {personas.map((p) => {
                    const PIcon = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPersona(p.id)}
                        className={`w-full flex items-center justify-between p-2 rounded text-xs transition-colors ${
                          p.id === selectedPersona
                            ? "bg-surface-interactive text-ink-primary font-medium"
                            : "text-ink-secondary hover:text-ink-primary hover:bg-surface-interactive/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <PIcon className="w-3.5 h-3.5 text-cobalt" />
                          <span>{p.label}</span>
                        </div>
                        <span className="text-[9px] font-mono text-ink-muted">{p.tag}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-3 w-px bg-surface-border hidden md:block" />

          {/* Quick Guide Tour Launcher */}
          <button
            onClick={() => setShowTour(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-surface-elevated hover:bg-surface-interactive border border-surface-border text-xs text-ink-secondary hover:text-ink-primary transition-colors"
            title="Open Platform Walkthrough"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cobalt" />
            <span className="hidden md:inline">Tour</span>
          </button>
        </div>
      </header>

      {/* Onboarding Tour Modal */}
      <OnboardingModal isOpen={showTour} onClose={() => setShowTour(false)} />
    </>
  );
}
