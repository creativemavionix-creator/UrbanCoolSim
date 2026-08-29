"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  ShieldCheck, 
  Thermometer,
  Layers,
  Cpu,
  FileText,
  Target,
} from "lucide-react";
import dynamic from "next/dynamic";

const Hero3DCanvas = dynamic(
  () => import("@/components/Hero3DCanvas").then((mod) => mod.Hero3DCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full skeleton-pulse rounded-lg" />
    ),
  }
);

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function LandingPage() {
  const [isCooled, setIsCooled] = useState<boolean>(false);

  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-ink-primary select-none">
      {/* Hero */}
      <section className="relative pt-20 pb-24 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-16">
        <div className="w-full lg:w-1/2 space-y-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="flex items-center gap-2 text-[11px] text-ink-muted"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-status-safe" />
            <span>Deterministic Surface Energy Balance · 10m Resolution</span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-medium tracking-tight leading-[1.08] text-ink-primary"
          >
            Better infrastructure decisions,{" "}
            <span className="italic font-serif text-cobalt">not passive heat maps.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-sm text-ink-secondary leading-relaxed max-w-md"
          >
            Unify satellite remote sensing, first-principles thermodynamics, and Pareto optimization 
            to quantify cooling impacts before construction.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex items-center gap-3 pt-1"
          >
            <Link
              href="/dashboard"
              className="btn-cobalt px-5 py-2.5 rounded-md text-[13px] flex items-center gap-2"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setIsCooled(!isCooled)}
              className={`px-4 py-2.5 rounded-md border text-[13px] flex items-center gap-2 transition-all ${
                isCooled
                  ? "border-cobalt/30 bg-cobalt/8 text-cobalt"
                  : "border-surface-border bg-surface-elevated text-ink-secondary hover:text-ink-primary"
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>{isCooled ? "Cooled 41.1°C" : "Baseline 44.5°C"}</span>
            </button>
          </motion.div>
        </div>

        {/* 3D Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full lg:w-1/2 h-[440px] graphite-card rounded-lg overflow-hidden relative"
        >
          <Hero3DCanvas isCooled={isCooled} />
          
          <div className="absolute bottom-3 left-3 py-2 px-3 rounded-md bg-surface-base/80 backdrop-blur-sm border border-surface-border text-[11px] space-y-0.5">
            <div className="text-ink-muted text-[9px] font-mono tracking-wide">INTERACTIVE THERMAL FIELD</div>
            <div className="flex items-center gap-2 text-ink-primary">
              <span>{isCooled ? "Pareto Hybrid Active" : "Observed Baseline"}</span>
              <span className={`text-[10px] px-1.5 py-px rounded ${
                isCooled ? "bg-cobalt/15 text-cobalt" : "bg-status-critical/15 text-status-critical"
              }`}>
                {isCooled ? "−3.42°C" : "Peak 48.5°C"}
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Problem Statement — Asymmetric layout, not uniform cards */}
      <section className="py-20 px-6 sm:px-12 border-t border-surface-border bg-surface-elevated/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: The Insight */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-label text-ink-muted">The Core Challenge</span>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink-primary leading-snug">
                Thermal rasters display surface temperature — not the physical mechanisms driving them.
              </h2>
              <p className="text-sm text-ink-secondary leading-relaxed max-w-xl">
                Without Surface Energy Balance conservation (
                <span className="text-ink-primary">
                  <em>Q</em>* + <em>Q</em><sub>f</sub> = <em>Q</em><sub>h</sub> + <em>Q</em><sub>e</sub> + Δ<em>Q</em><sub>s</sub>
                </span>
                ), planners cannot predict how much cooling a specific intervention will achieve, 
                or whether municipal water limits will be exceeded.
              </p>

              <div className="flex items-center gap-8 pt-2 text-sm">
                <div>
                  <div className="text-label text-status-critical mb-1">CFD Simulation</div>
                  <span className="text-xl font-medium text-ink-primary">~14.5 hrs</span>
                </div>
                <div className="h-8 w-px bg-surface-border" />
                <div>
                  <div className="text-label text-cobalt mb-1">AI Surrogate</div>
                  <span className="text-xl font-medium text-cobalt">~1.8 ms</span>
                </div>
              </div>
            </div>

            {/* Right: Supporting Points — stacked, not card grid */}
            <div className="lg:col-span-5 space-y-5 lg:pt-8">
              <div className="border-l-2 border-ink-dim pl-4 space-y-1.5">
                <h4 className="text-sm font-medium text-ink-primary">Budget & Water Blind Spots</h4>
                <p className="text-[13px] text-ink-secondary leading-relaxed">
                  Conventional greenery plans ignore finite municipal water reserves, structural load constraints, 
                  and ongoing maintenance expenditures.
                </p>
              </div>

              <div className="border-l-2 border-cobalt/40 pl-4 space-y-1.5">
                <h4 className="text-sm font-medium text-ink-primary">Physics Re-Validation</h4>
                <p className="text-[13px] text-ink-secondary leading-relaxed">
                  Every Pareto-recommended strategy is re-simulated through the deterministic physics solver 
                  to eliminate surrogate model hallucination.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline — Stepped flow, not uniform card grid */}
      <section className="py-20 px-6 sm:px-12 border-t border-surface-border">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="max-w-xl space-y-2">
            <span className="text-label text-cobalt">How It Works</span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink-primary">
              From satellite ingestion to verified capital decisions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {[
              {
                step: "01",
                title: "10m Digital Twin",
                desc: "Fuses Landsat 8 TIRS, Sentinel-2, ESA WorldCover, and building height morphology into a 2,500-cell microgrid.",
                detail: "Multi-Spectral · 10m Unified",
                icon: Layers,
              },
              {
                step: "02",
                title: "SEB Thermodynamics",
                desc: "Solves non-linear surface temperature equilibrium cell-by-cell using Newton-Raphson numerical root-finding.",
                detail: "Energy Balance · First-Principles",
                icon: Cpu,
              },
              {
                step: "03",
                title: "NSGA-II Optimization",
                desc: "Explores non-dominated trade-offs between cooling impact, capital expenditure, water demand, and energy savings.",
                detail: "Multi-Objective · Physics-Checked",
                icon: Target,
              },
              {
                step: "04",
                title: "Executive Blueprints",
                desc: "Exports publication-ready PDF decision dossiers, vector GeoJSON layers, and microclimate CSV grids.",
                detail: "Decision Support · PDF & GeoJSON",
                icon: FileText,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={i}
                  className="flex gap-4"
                >
                  <div className="shrink-0 pt-0.5">
                    <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center">
                      <Icon className="w-4 h-4 text-cobalt" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-ink-dim">{item.step}</span>
                      <h3 className="text-sm font-medium text-ink-primary">{item.title}</h3>
                    </div>
                    <p className="text-[13px] text-ink-secondary leading-relaxed">{item.desc}</p>
                    <span className="text-[10px] font-mono text-ink-dim">{item.detail}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 sm:px-12 border-t border-surface-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-ink-dim">
          <span>UrbanCoolSim · Urban Microclimate Intelligence</span>
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="hover:text-ink-secondary transition-colors">Overview</Link>
            <Link href="/digital-twin" className="hover:text-ink-secondary transition-colors">Digital Twin</Link>
            <Link href="/optimization" className="hover:text-ink-secondary transition-colors">Optimization</Link>
            <Link href="/methodology" className="hover:text-ink-secondary transition-colors">Methodology</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
