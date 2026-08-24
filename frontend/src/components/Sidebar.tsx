"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Map, 
  Flame, 
  SlidersHorizontal, 
  SplitSquareVertical, 
  Sparkles, 
  BarChart2, 
  CheckCircle, 
  FileText, 
  BookOpen,
  ArrowUpRight
} from "lucide-react";

interface NavGroup {
  group: string;
  items: {
    label: string;
    href: string;
    icon: any;
    tag?: string;
  }[];
}

const navGroups: NavGroup[] = [
  {
    group: "Understand",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Digital Twin", href: "/digital-twin", icon: Map },
      { label: "Thermal Analysis", href: "/thermal-analysis", icon: Flame },
    ]
  },
  {
    group: "Design",
    items: [
      { label: "Intervention Studio", href: "/intervention-studio", icon: SlidersHorizontal },
      { label: "Scenario Lab", href: "/scenario-lab", icon: SplitSquareVertical },
      { label: "Optimization Engine", href: "/optimization", icon: Sparkles, tag: "NSGA-II" },
    ]
  },
  {
    group: "Decide",
    items: [
      { label: "Simulation Results", href: "/simulation-results", icon: BarChart2 },
      { label: "Validation & Calibration", href: "/validation", icon: CheckCircle, tag: "Landsat" },
      { label: "Decision Reports", href: "/reports", icon: FileText },
    ]
  },
  {
    group: "System",
    items: [
      { label: "Methodology & Physics", href: "/methodology", icon: BookOpen },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-obsidian-subtle border-r border-obsidian-border flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 pb-4 flex items-center justify-between border-b border-obsidian-border">
          <Link href="/" className="group flex items-center gap-2.5">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-obsidian-base font-bold text-xs shadow-subtle group-hover:bg-sand-100 transition-colors"
            >
              <span className="font-serif italic text-sm font-semibold tracking-tighter">uc</span>
            </motion.div>
            <div className="flex flex-col">
              <span className="font-medium text-white text-sm tracking-tight leading-none group-hover:text-sand-100 transition-colors">
                UrbanCoolSim
              </span>
              <span className="text-[10px] text-obsidian-textMuted font-mono tracking-wider uppercase mt-1">
                Climate Twin
              </span>
            </div>
          </Link>

          <Link 
            href="/" 
            title="Public Overview"
            className="text-obsidian-textMuted hover:text-white p-1 rounded transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Thesis Callout */}
        <div className="px-4 pt-3 pb-2">
          <div className="px-3 py-2 rounded bg-obsidian-surface/60 border border-obsidian-border">
            <p className="text-[11px] text-obsidian-textSecondary leading-relaxed">
              <strong className="text-white font-medium">Thesis:</strong> Better urban infrastructure decisions, not passive heat maps.
            </p>
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav className="px-3 py-2 space-y-4 flex-1">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-obsidian-textMuted">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block relative"
                  >
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                        isActive
                          ? "bg-obsidian-surface text-white font-medium shadow-subtle"
                          : "text-obsidian-textSecondary hover:text-white hover:bg-obsidian-surface/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 transition-colors ${
                          isActive ? "text-botanical-light" : "text-obsidian-textMuted group-hover:text-obsidian-textSecondary"
                        }`} />
                        <span>{item.label}</span>
                      </div>

                      {item.tag && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-obsidian-base text-obsidian-textMuted border border-obsidian-border">
                          {item.tag}
                        </span>
                      )}

                      {isActive && (
                        <motion.div 
                          layoutId="active-nav-indicator"
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-botanical-light rounded-r"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer System Telemetry */}
      <div className="p-3.5 border-t border-obsidian-border bg-obsidian-base/60 text-[11px] text-obsidian-textMuted space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-botanical-light animate-pulse" />
            <span className="text-obsidian-textSecondary font-mono text-[10px]">SEB Solver</span>
          </span>
          <span className="text-[10px] font-mono text-obsidian-textPrimary">Deterministic</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-obsidian-textSecondary font-mono text-[10px]">Surrogate</span>
          <span className="text-[10px] font-mono text-botanical-light">R² = 0.962</span>
        </div>
      </div>
    </aside>
  );
}
