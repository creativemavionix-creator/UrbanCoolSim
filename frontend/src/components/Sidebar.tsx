"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Map, 
  Flame, 
  AlertTriangle,
  SlidersHorizontal, 
  SplitSquareVertical, 
  Sparkles, 
  BarChart2, 
  CheckCircle, 
  FileText, 
  BookOpen,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight
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
      { label: "10m Digital Twin", href: "/digital-twin", icon: Map },
      { label: "Heat Risk Matrix", href: "/heat-risk", icon: AlertTriangle, tag: "HVI" },
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
      { label: "Calibration & Truth", href: "/validation", icon: CheckCircle },
      { label: "Decision Reports", href: "/reports", icon: FileText },
    ]
  },
  {
    group: "System",
    items: [
      { label: "Physics & Methodology", href: "/methodology", icon: BookOpen },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const isDigitalTwin = pathname === "/digital-twin";
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse sidebar on Digital Twin page to maximize map canvas
  useEffect(() => {
    if (isDigitalTwin) {
      setIsCollapsed(true);
    }
  }, [isDigitalTwin]);

  return (
    <aside 
      className={`${
        isCollapsed ? "w-16" : "w-60"
      } bg-surface-elevated border-r border-surface-border flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none transition-all duration-300 ease-in-out`}
    >
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Brand Header */}
        <div className={`p-4 flex items-center ${isCollapsed ? "justify-center" : "justify-between"} border-b border-surface-border`}>
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-surface-interactive border border-surface-border flex items-center justify-center text-ink-primary font-bold text-xs group-hover:border-cobalt transition-colors shrink-0">
              <span className="font-serif italic text-sm font-semibold tracking-tighter text-cobalt">uc</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-medium text-ink-primary text-xs tracking-tight leading-none truncate">
                  UrbanCoolSim
                </span>
                <span className="text-[9px] text-ink-muted font-mono tracking-wider uppercase mt-1 truncate">
                  Decision Twin
                </span>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="text-ink-muted hover:text-ink-primary p-1 rounded transition-colors"
              title="Collapse navigation"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grouped Navigation */}
        <nav className="px-2 py-3 space-y-3 flex-1">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-0.5">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-ink-muted font-medium">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className="block relative"
                  >
                    <div
                      className={`group relative flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-2.5"} py-1.5 rounded text-xs transition-colors ${
                        isActive
                          ? "bg-surface-interactive text-ink-primary font-medium"
                          : "text-ink-secondary hover:text-ink-primary hover:bg-surface-interactive/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                          isActive ? "text-cobalt" : "text-ink-muted group-hover:text-ink-secondary"
                        }`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && item.tag && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-base text-ink-muted border border-surface-border">
                          {item.tag}
                        </span>
                      )}

                      {isActive && (
                        <motion.div 
                          layoutId="activeNavIndicator"
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-cobalt rounded-r"
                          transition={{ duration: 0.15, ease: "easeOut" }}
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Toggle / Telemetry */}
      <div className="p-2.5 border-t border-surface-border bg-surface-base/80 text-[10px] font-mono text-ink-muted">
        {isCollapsed ? (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="w-full flex items-center justify-center p-1.5 rounded hover:bg-surface-interactive text-ink-muted hover:text-ink-primary transition-colors"
            title="Expand navigation"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-status-safe" />
                <span className="text-ink-secondary">SEB Physics</span>
              </span>
              <span className="text-ink-primary">Deterministic</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-secondary">LightGBM Surrogate</span>
              <span className="text-ink-muted">R² = 0.962</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
