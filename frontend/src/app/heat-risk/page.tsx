"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { api, HeatRiskData } from "@/lib/api";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Trees, 
  Droplets, 
  Sun, 
  Building2, 
  ArrowRight,
  Search,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function HeatRiskPage() {
  const [studyArea, setStudyArea] = useState("delhi_cp");
  const [heatData, setHeatData] = useState<HeatRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async (areaId: string) => {
    setLoading(true);
    try {
      const res = await api.getHeatRiskAnalysis(areaId);
      setHeatData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedArea = localStorage.getItem("urbancoolsim_study_area") || "delhi_cp";
    setStudyArea(savedArea);
    loadData(savedArea);

    const handleAreaChange = (e: any) => {
      if (e.detail) {
        setStudyArea(e.detail);
        loadData(e.detail);
      }
    };
    window.addEventListener("studyAreaChanged", handleAreaChange);
    return () => window.removeEventListener("studyAreaChanged", handleAreaChange);
  }, []);

  const filteredWards = (heatData?.ward_risk_ranking || []).filter(w => 
    w.ward_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.primary_driver.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const alertTier = heatData?.heat_alert_tier || "ORANGE ALERT";
  const isRed = alertTier.includes("RED");

  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-ink-primary select-none">
      <Header 
        title="Heat Risk & Vulnerability Analysis" 
        subtitle="Demographic Exposure Matrix & The 4 Canonical Urban Zones" 
        onStudyAreaChange={(id) => {
          setStudyArea(id);
          loadData(id);
        }}
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Header Title & Demographic KPIs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-surface-border pb-8">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-widest text-status-critical font-semibold">
              Demographic Vulnerability & Heat Index
            </span>
            <h1 className="editorial-headline text-3xl sm:text-4xl font-normal text-ink-primary">
              Localized Heat Risk & Critical Zones
            </h1>
            <p className="text-xs text-ink-secondary max-w-xl leading-relaxed">
              Synthesizes surface thermal infrared extremes, building density morphology, and population exposure 
              into prioritized municipal intervention tiers.
            </p>
          </div>

          <div className="flex items-baseline gap-6 shrink-0">
            <div>
              <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                Exposed Population (&gt;41.5°C)
              </span>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter 
                  value={heatData?.population_high_exposure || 14800} 
                  decimals={0} 
                  className="editorial-headline text-4xl sm:text-5xl text-status-critical font-normal tracking-tight"
                />
                <span className="text-xs text-ink-muted font-sans">residents</span>
              </div>
            </div>
            <div className="h-8 w-px bg-surface-border" />
            <div>
              <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                Outdoor Workers at Risk
              </span>
              <div className="flex items-baseline gap-1">
                <AnimatedCounter 
                  value={heatData?.outdoor_workers_at_risk || 4140} 
                  decimals={0} 
                  className="editorial-headline text-4xl sm:text-5xl text-status-high font-normal tracking-tight"
                />
                <span className="text-xs text-ink-muted font-sans">active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heat-Health Protocol Advisory Banner */}
        <div className={`p-4 rounded border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isRed 
            ? "bg-status-critical/10 border-status-critical/30 text-status-critical" 
            : "bg-status-high/10 border-status-high/30 text-status-high"
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider">
                {alertTier} · Municipal Heatwave Warning Active
              </div>
              <p className="text-xs text-ink-secondary mt-0.5">
                {heatData?.heat_alert_message || "High thermal risk across commercial corridors. Public hydration stations active."}
              </p>
            </div>
          </div>

          <Link
            href="/optimization"
            className="btn-cobalt px-4 py-2 rounded text-xs flex items-center gap-1.5 shrink-0"
          >
            <span>Run Mitigation Optimizer</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* The 4 Canonical Urban Heat Zones (Zone 4 Differentiated with Dominant Scale) */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline px-1">
            <h2 className="text-sm font-medium text-ink-primary">
              The 4 Canonical Urban Heat Zones
            </h2>
            <span className="text-[10px] font-mono text-ink-muted">
              2,500 Microgrid Cells (10m x 10m)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* ZONE 4: DOMINANT CRITICAL FOCUS (5 Cols) */}
            {heatData?.critical_zones?.[3] && (
              <div className="lg:col-span-5 graphite-card p-6 rounded-lg flex flex-col justify-between space-y-4 border-l-2 border-l-status-critical">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded bg-status-critical/15 text-status-critical font-semibold">
                      Highest Risk Focus · Zone 4
                    </span>
                    <span className="text-xs font-mono text-ink-muted">
                      {heatData.critical_zones[3].area_pct}% District Area
                    </span>
                  </div>

                  <h3 className="text-lg font-serif text-ink-primary font-normal">
                    {heatData.critical_zones[3].name}
                  </h3>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="editorial-headline text-3xl text-status-critical font-normal">
                      {heatData.critical_zones[3].mean_temp_c}°C
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted uppercase">Mean Thermal LST</span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-surface-border text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-ink-muted uppercase block">Key Benefit:</span>
                    <p className="text-ink-primary leading-snug">{heatData.critical_zones[3].benefit}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-ink-muted uppercase block">Constraint:</span>
                    <p className="text-ink-secondary leading-snug">{heatData.critical_zones[3].constraint}</p>
                  </div>
                  <div className="flex justify-between items-center pt-1 font-mono text-xs">
                    <span className="text-ink-muted">Unit CapEx:</span>
                    <strong className="text-ink-primary">${heatData.critical_zones[3].unit_cost_usd_m2}/m²</strong>
                  </div>
                </div>
              </div>
            )}

            {/* ZONES 1, 2, 3: SECONDARY COMPARATIVE GRID (7 Cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(heatData?.critical_zones || []).slice(0, 3).map((zone, idx) => {
                const icons = [Trees, Droplets, Sun];
                const ZIcon = icons[idx];
                return (
                  <div key={zone.name} className="graphite-card p-5 rounded-lg flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <ZIcon className="w-4 h-4 text-cobalt" />
                        <span className="text-[10px] font-mono text-ink-muted">{zone.area_pct}% Area</span>
                      </div>
                      <h4 className="text-xs font-semibold text-ink-primary leading-snug">{zone.name}</h4>
                      <div className="text-xl font-serif text-ink-primary">{zone.mean_temp_c}°C</div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-surface-border text-[11px]">
                      <p className="text-ink-secondary leading-snug">{zone.benefit}</p>
                      <div className="font-mono text-[10px] text-ink-muted pt-1">
                        ${zone.unit_cost_usd_m2}/m²
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sub-District / Ward Ranking Table with Tabular Figures */}
        <div className="graphite-card p-6 rounded-lg space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-surface-border pb-4">
            <div>
              <h3 className="text-sm font-semibold text-ink-primary">
                Sub-District Heat Vulnerability Index (HVI) Ranking
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Prioritizes municipal intervention based on demographic exposure and localized thermal accumulation
              </p>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter wards..."
                className="w-full pl-9 pr-3 py-1.5 rounded bg-surface-base border border-surface-border text-xs text-ink-primary placeholder-ink-muted outline-none focus:border-cobalt transition-colors font-mono"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted font-mono uppercase text-[10px]">
                  <th className="pb-2.5 pr-4">Rank</th>
                  <th className="pb-2.5 px-4">Sub-District / Sector</th>
                  <th className="pb-2.5 px-4">Mean LST</th>
                  <th className="pb-2.5 px-4">Population Exposed</th>
                  <th className="pb-2.5 px-4">HVI Index (0-10)</th>
                  <th className="pb-2.5 px-4">Risk Tier</th>
                  <th className="pb-2.5 pl-4">Action Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/40 text-ink-secondary">
                {filteredWards.map((ward) => (
                  <tr key={ward.ward_name} className="hover:bg-surface-interactive/40 transition-colors">
                    <td className="py-3 pr-4 font-mono text-ink-primary font-medium">#{ward.rank}</td>
                    <td className="py-3 px-4 font-medium text-ink-primary">{ward.ward_name}</td>
                    <td className="py-3 px-4 font-mono text-status-critical font-medium">{ward.mean_temp_c}°C</td>
                    <td className="py-3 px-4 font-mono">{ward.population_exposed.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-ink-primary">{ward.hvi_score}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded uppercase ${
                        ward.risk_tier === "CRITICAL"
                          ? "bg-status-critical/15 text-status-critical font-semibold"
                          : ward.risk_tier === "HIGH"
                          ? "bg-status-high/15 text-status-high font-semibold"
                          : "bg-status-safe/15 text-status-safe"
                      }`}>
                        {ward.risk_tier}
                      </span>
                    </td>
                    <td className="py-3 pl-4 text-xs text-ink-secondary">
                      {ward.recommended_action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
