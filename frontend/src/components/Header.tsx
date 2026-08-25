"use client";

import { useState, useEffect } from "react";
import { 
  MapPin, 
  ChevronDown, 
  HelpCircle, 
  Building2, 
  Landmark, 
  Microscope,
  Activity
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
    if (onStudyAreaChange) onStudyAreaChange(id);
    window.dispatchEvent(new CustomEvent("studyAreaChanged", { detail: id }));
  };

  const handleSelectPersona = (id: string) => {
    setSelectedPersona(id);
    localStorage.setItem("urbancoolsim_persona", id);
    setShowPersonaDropdown(false);
    window.dispatchEvent(new CustomEvent("personaChanged", { detail: id }));
  };

  const currentAreaObj = studyAreas.find((s) => s.id === selectedArea) || studyAreas[0];
  const currentPersonaObj = personas.find((p) => p.id === selectedPersona) || personas[0];
  const PersonaIcon = currentPersonaObj.icon;

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
          {/* Multi-City Study Area Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAreaDropdown(!showAreaDropdown);
                setShowPersonaDropdown(false);
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
