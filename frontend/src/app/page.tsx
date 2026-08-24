"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  Satellite, 
  Layers, 
  Cpu, 
  Sliders, 
  CheckCircle2, 
  DollarSign, 
  Droplets,
  Building,
  Trees,
  Compass,
  ArrowUpRight,
  Sun,
  Flame,
  Activity
} from "lucide-react";

// Apple-style smooth easing curves
const easeOutExpo = [0.16, 1, 0.3, 1];
const springConfig = { type: "spring", stiffness: 350, damping: 30 };

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.7, ease: easeOutExpo }
  }
};

export default function LandingPage() {
  const [interactiveCooling, setInteractiveCooling] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const thermalCanvasRef = useRef<HTMLCanvasElement>(null);

  // Animated Thermal Canvas in Hero
  useEffect(() => {
    const canvas = thermalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    canvas.width = 480;
    canvas.height = 480;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxRadius = canvas.width / 2;

      // Radial background thermal gradient
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxRadius);
      if (interactiveCooling) {
        // Cooled State: Emerald to Cyan
        grad.addColorStop(0, "rgba(34, 197, 94, 0.85)");
        grad.addColorStop(0.45, "rgba(14, 165, 233, 0.75)");
        grad.addColorStop(0.85, "rgba(30, 41, 59, 0.95)");
      } else {
        // Hot Baseline State: Ruby to Amber
        grad.addColorStop(0, "rgba(220, 38, 38, 0.9)");
        grad.addColorStop(0.45, "rgba(245, 158, 11, 0.8)");
        grad.addColorStop(0.85, "rgba(69, 10, 10, 0.95)");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Microgrid particle grid
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      const step = 20;
      for (let x = 10; x < canvas.width; x += step) {
        for (let y = 10; y < canvas.height; y += step) {
          const dist = Math.hypot(x - cx, y - cy);
          const wave = Math.sin(dist * 0.04 - time) * 1.5;
          ctx.fillRect(x + wave, y + wave, 1.5, 1.5);
        }
      }

      // Concentric street corridor circles
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);

      [55, 115, 185].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(time + idx) * 2, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 8 Radial arterial corridors
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 60, cy + Math.sin(angle) * 60);
        ctx.lineTo(cx + Math.cos(angle) * 220, cy + Math.sin(angle) * 220);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [interactiveCooling]);

  return (
    <div className="min-h-screen bg-sand-50 text-sand-900 selection:bg-botanical selection:text-white antialiased font-sans overflow-x-hidden">
      {/* 1. Minimal Editorial Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="h-20 border-b border-sand-200 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-50 bg-sand-50/90 backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 rounded-md bg-sand-900 flex items-center justify-center text-sand-50 font-serif italic text-base font-bold shadow-subtle cursor-pointer"
          >
            uc
          </motion.div>
          <span className="font-semibold tracking-tight text-base text-sand-900">
            UrbanCoolSim
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-sand-800">
          <a href="#spatial-problem" className="hover:text-sand-900 transition-colors">The Spatial Problem</a>
          <a href="#how-it-works" className="hover:text-sand-900 transition-colors">How It Works</a>
          <a href="#physics" className="hover:text-sand-900 transition-colors">Physics & AI</a>
          <a href="#solutions" className="hover:text-sand-900 transition-colors">Stakeholders</a>
          <a href="#validation" className="hover:text-sand-900 transition-colors">Validation</a>
        </nav>

        {/* Launch CTA */}
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-sand-900 text-sand-50 hover:bg-sand-800 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-subtle group"
            >
              <span>Open UrbanCoolSim</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* 2. Hero Section: Spatial Heat Reality */}
      <section ref={heroRef} className="px-6 sm:px-12 pt-20 pb-24 max-w-7xl mx-auto space-y-16">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6 max-w-4xl"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sand-300 bg-sand-100 text-xs font-mono uppercase tracking-wider text-sand-800">
            <span className="w-2 h-2 rounded-full bg-botanical animate-pulse" />
            <span>AI Heat Intelligence & Decision Twin</span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-5xl sm:text-7xl font-light tracking-tight text-sand-900 leading-[1.04] font-serif">
            Urban heat is spatial. <br />
            <span className="italic font-normal">Simulate it before you build.</span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-sand-800 font-light max-w-2xl leading-relaxed">
            Passive heat maps show where it is hot today. UrbanCoolSim couples satellite remote sensing, 
            thermodynamic physics, and Pareto optimization to simulate where to intervene, what to deploy, 
            and what the trade-offs will be before spending municipal capital.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-4 pt-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/dashboard"
                className="px-6 py-3.5 rounded-lg bg-sand-900 text-sand-50 hover:bg-sand-800 text-sm font-semibold transition-all flex items-center gap-2 shadow-surface group"
              >
                <span>Explore the Digital Twin</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/methodology"
                className="px-6 py-3.5 rounded-lg border border-sand-300 hover:border-sand-400 bg-sand-100/50 text-sm font-medium text-sand-900 transition-all flex items-center gap-2"
              >
                <span>Scientific Methodology</span>
                <ArrowUpRight className="w-4 h-4 text-sand-800" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Interactive Hero Visual: Before / After Thermal Transformation */}
        <motion.div 
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: easeOutExpo }}
          className="bg-sand-900 text-sand-50 rounded-2xl p-6 sm:p-10 shadow-floating space-y-8 relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 relative z-10">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-white/50 block">
                Live Spatial Simulation Engine
              </span>
              <h2 className="text-xl font-medium text-white tracking-tight mt-0.5">
                Connaught Place 10m Microgrid Simulation
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-white/60">Toggle Strategy:</span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setInteractiveCooling(!interactiveCooling)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all flex items-center gap-2 ${
                  interactiveCooling
                    ? "bg-botanical-light text-black shadow-subtle"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{interactiveCooling ? "Hybrid Intervention (-3.4°C)" : "Current Baseline (44.5°C)"}</span>
              </motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Dynamic Interactive Canvas Visual */}
            <div className="lg:col-span-7 aspect-square max-h-[380px] w-full rounded-xl relative overflow-hidden flex items-center justify-center border border-white/10 shadow-inner">
              <canvas
                ref={thermalCanvasRef}
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="relative text-center space-y-1 z-10 pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={interactiveCooling ? "cool" : "hot"}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.4, ease: easeOutExpo }}
                  >
                    <span className="text-6xl sm:text-7xl font-serif font-light text-white drop-shadow-md">
                      {interactiveCooling ? "41.1°C" : "44.5°C"}
                    </span>
                    <span className="block text-xs font-mono uppercase tracking-widest text-white/90 mt-1">
                      {interactiveCooling ? "Simulated Equilibrium LST" : "Observed Landsat Baseline"}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Evidence Telemetry Specs */}
            <div className="lg:col-span-5 space-y-6 text-xs">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-white">Multi-Objective Thermodynamic Partition</h3>
                <p className="text-white/60 leading-relaxed">
                  Evaluated across 2,500 individual 10m grid cells solving for radiation absorption, 
                  turbulent sensible heating, and vegetative latent cooling.
                </p>
              </div>

              <div className="space-y-3 font-mono">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/60">Net Cooling Effect:</span>
                  <motion.strong 
                    key={interactiveCooling ? "cool-text" : "hot-text"}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={interactiveCooling ? "text-botanical-light text-sm" : "text-white/40"}
                  >
                    {interactiveCooling ? "-3.4°C Target Delta" : "0.0°C Baseline"}
                  </motion.strong>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/60">Capital Investment (CapEx):</span>
                  <strong className="text-white">{interactiveCooling ? "$345,000 USD" : "$0 USD"}</strong>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/60">Annual Water Demand:</span>
                  <strong className="text-white">{interactiveCooling ? "4,200 m³/yr" : "0 m³"}</strong>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-white/60">Physics Verification Error:</span>
                  <strong className="text-botanical-light">±0.04°C (Safe)</strong>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. Section: Urban Heat is a Spatial Problem */}
      <section id="spatial-problem" className="border-t border-sand-200 py-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="max-w-3xl space-y-4"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-sand-800">
            01 · The Spatial Problem
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-sand-900">
            Heat is not uniform across a city. <br />
            Interventions shouldn&apos;t be uniform either.
          </h2>
          <p className="text-base text-sand-800 leading-relaxed">
            Within the same municipal district, surface temperatures fluctuate by more than 8°C across a single kilometer. 
            Building height-to-width ratios, asphalt albedo, canopy density, and waste heat emissions create hyper-localized thermal hotspots.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Building,
              color: "text-sand-900",
              title: "Morphology & Canyon Trapping",
              desc: "Tall commercial building envelopes trap outgoing longwave radiation and reduce aerodynamic ventilation, amplifying sensible turbulent air heating."
            },
            {
              icon: Trees,
              color: "text-botanical",
              title: "Vegetative Latent Deficits",
              desc: "Impervious surfaces prevent natural soil moisture evapotranspiration (Q_e), diverting over 70% of absorbed solar energy directly into boundary layer heating."
            },
            {
              icon: Compass,
              color: "text-amber-700",
              title: "Surface Albedo & Storage",
              desc: "Dark rooftops and asphalt roads absorb over 85% of downwelling solar shortwave radiation, storing heat during midday and slowly discharging it overnight."
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: easeOutExpo }}
                whileHover={{ y: -4 }}
                className="p-8 rounded-xl bg-sand-100 border border-sand-200 space-y-3 transition-shadow hover:shadow-surface"
              >
                <Icon className={`w-6 h-6 ${item.color}`} />
                <h3 className="text-base font-semibold text-sand-900">{item.title}</h3>
                <p className="text-xs text-sand-800 leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. Section: The 7-Step Pipeline */}
      <section id="how-it-works" className="border-t border-sand-200 py-24 px-6 sm:px-12 bg-sand-100">
        <div className="max-w-7xl mx-auto space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="max-w-3xl space-y-4"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-sand-800">
              02 · System Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-sand-900">
              From raw satellite observations to optimal infrastructure decisions.
            </h2>
            <p className="text-base text-sand-800 leading-relaxed">
              A unified pipeline integrating multi-spectral remote sensing, first-principles thermodynamics, 
              AI surrogate acceleration, and genetic optimization.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", title: "Multi-Spectral Fusion", sub: "Data Ingestion", desc: "Landsat 8 LST, NASA ECOSTRESS, Sentinel-2 BOA Reflectance, ESA WorldCover, and Copernicus DEM resampled to 10m grid." },
              { num: "02", title: "Spatial Morphology", sub: "Digital Twin", desc: "Parameterized layers of building density (f_bldg), heights (H), vegetation (f_veg), and broadband albedo (α)." },
              { num: "03", title: "Surface Energy Balance", sub: "Physics Solver", desc: "Deterministic Newton-Raphson thermodynamic solver enforcing Q* + Q_f = Q_h + Q_e + ΔQ_s energy conservation." },
              { num: "04", title: "LightGBM Surrogate", sub: "AI Acceleration", desc: "Trained gradient boosted trees evaluating thousands of intervention scenarios in sub-2-millisecond inference." },
              { num: "05", title: "NSGA-II Pareto Solver", sub: "Optimization", desc: "Explores multi-objective trade-offs between cooling impact, municipal budget limits, and irrigation water quotas." },
              { num: "06", title: "Deterministic Re-Check", sub: "Physics Safeguard", desc: "Candidate Pareto solutions are re-simulated via the physical SEB solver to eliminate surrogate error exploitation." },
              { num: "07", title: "Satellite Ground Truth", sub: "Validation", desc: "Calibrated against Landsat 8 TIRS thermal overpasses achieving R² = 0.973 and MAE = 0.38°C." },
              { num: "08", title: "Executive PDF Export", sub: "Decision Reports", desc: "Generates publication-grade executive decision reports with line-item budgets and physical justification." },
            ].map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: easeOutExpo }}
                whileHover={{ y: -3 }}
                className="p-6 rounded-xl bg-sand-50 border border-sand-200 space-y-2 transition-shadow hover:shadow-subtle"
              >
                <span className="font-mono text-xs text-botanical font-semibold">{step.num} · {step.sub}</span>
                <h4 className="text-sm font-semibold text-sand-900">{step.title}</h4>
                <p className="text-xs text-sand-800 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Section: Stakeholder Use Cases */}
      <section id="solutions" className="py-24 px-6 sm:px-12 max-w-7xl mx-auto space-y-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="max-w-3xl space-y-4"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-sand-800">
            03 · Stakeholders & Decision Makers
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-sand-900">
            Built for infrastructure leaders who manage real capital.
          </h2>
          <p className="text-base text-sand-800 leading-relaxed">
            UrbanCoolSim provides actionable, defensible intelligence tailored to the specific constraints of modern urban planning.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              tag: "Municipal Governments",
              title: "District-Wide Heat Resilience Planning",
              desc: "Identify high-risk heat vulnerability corridors, allocate municipal capital budgets effectively, and quantify the cooling return on public green infrastructure investments."
            },
            {
              tag: "Real Estate & Master Developers",
              title: "Climate-Resilient Masterplan Engineering",
              desc: "Optimize building roof materials, tree canopy layouts, and water features to lower ambient peak temperatures, reducing tenant HVAC cooling loads and enhancing asset valuation."
            },
            {
              tag: "Smart City Programs",
              title: "Digital Twin Infrastructure Benchmarking",
              desc: "Integrate live satellite observation layers into centralized command centers, evaluating policy scenarios under extreme climate heat wave projections."
            },
            {
              tag: "Climate Resilience Consultants",
              title: "Rapid Environmental Impact Assessments",
              desc: "Replace weeks of manual modeling with instant physics-calibrated simulations, producing executive PDF reports with verifiable mathematical rigor."
            }
          ].map((client, idx) => (
            <motion.div
              key={client.tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: easeOutExpo }}
              whileHover={{ y: -3 }}
              className="p-8 rounded-xl bg-sand-100 border border-sand-200 space-y-3 transition-shadow hover:shadow-surface"
            >
              <span className="text-xs font-mono text-botanical font-semibold uppercase">{client.tag}</span>
              <h3 className="text-xl font-medium text-sand-900">{client.title}</h3>
              <p className="text-xs text-sand-800 leading-relaxed">{client.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. Section: Spend Computationally Before Spending Physically */}
      <section className="border-t border-sand-200 py-24 px-6 sm:px-12 bg-sand-900 text-sand-50">
        <div className="max-w-7xl mx-auto space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="max-w-3xl space-y-4"
          >
            <span className="text-xs font-mono uppercase tracking-widest text-white/50">
              04 · The Core Value Proposition
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-normal tracking-tight text-white">
              Spend computationally before spending physically.
            </h2>
            <p className="text-base text-white/70 leading-relaxed">
              Physical civil infrastructure mistakes cost millions. Simulating ten thousand scenarios in software costs seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: easeOutExpo }}
              className="p-8 rounded-xl bg-white/5 border border-white/10 space-y-4"
            >
              <span className="text-xs font-mono text-rose-400 uppercase font-semibold">Traditional Urban Planning</span>
              <div className="space-y-3 text-white/70 leading-relaxed">
                <div>• Static satellite heat maps showing where it is hot with zero causal explanation.</div>
                <div>• Trial-and-error greening policies deployed without water resource constraints.</div>
                <div>• Weeks of manual spreadsheet calculations with unverified cooling assumptions.</div>
                <div>• Multi-million dollar civil investments with unmeasured thermal impact.</div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: easeOutExpo }}
              className="p-8 rounded-xl bg-white/10 border border-botanical-light/40 space-y-4 shadow-surface"
            >
              <span className="text-xs font-mono text-botanical-light uppercase font-semibold">With UrbanCoolSim</span>
              <div className="space-y-3 text-white leading-relaxed font-medium">
                <div>✓ 10m high-resolution spatial microclimate digital twin grounded in real satellite rasters.</div>
                <div>✓ First-principles Surface Energy Balance solver enforcing thermodynamic conservation.</div>
                <div>✓ NSGA-II genetic optimization balancing cooling benefit, CapEx budget, and water demand.</div>
                <div>✓ Automated publication-grade PDF executive reports ready for municipal sign-off.</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="py-28 px-6 sm:px-12 max-w-4xl mx-auto text-center space-y-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="text-4xl sm:text-6xl font-serif font-light tracking-tight text-sand-900"
        >
          Simulate the city before you change it.
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1, ease: easeOutExpo }}
          className="text-base text-sand-800 max-w-xl mx-auto leading-relaxed"
        >
          Open the UrbanCoolSim climate intelligence workspace to explore the digital twin, 
          design intervention strategies, and generate decision reports.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: easeOutExpo }}
          className="pt-4"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-sand-900 text-sand-50 hover:bg-sand-800 text-sm font-semibold transition-all shadow-floating group"
            >
              <span>Launch UrbanCoolSim Platform</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 8. Minimalist Footer */}
      <footer className="border-t border-sand-200 py-12 px-6 sm:px-12 text-xs text-sand-800 bg-sand-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="font-serif italic font-bold text-sm text-sand-900">uc</span>
            <span>UrbanCoolSim — AI Urban Heat Intelligence & Multi-Objective Decision Support</span>
          </div>

          <div className="flex items-center gap-6 text-sand-800 font-mono text-[11px]">
            <Link href="/methodology" className="hover:text-sand-900 transition-colors">Methodology</Link>
            <Link href="/validation" className="hover:text-sand-900 transition-colors">Validation</Link>
            <Link href="/reports" className="hover:text-sand-900 transition-colors">Reports</Link>
            <Link href="/dashboard" className="hover:text-sand-900 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
