"use client";

import { MapPin, Satellite, ShieldCheck } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-14 border-b border-obsidian-border bg-obsidian-subtle/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Hierarchy */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white tracking-tight">{title}</h1>
        {subtitle && (
          <span className="text-xs text-obsidian-textMuted border-l border-obsidian-border pl-3">
            {subtitle}
          </span>
        )}
      </div>

      {/* Spatial Telemetry & Metadata Status */}
      <div className="flex items-center gap-5 text-xs text-obsidian-textSecondary">
        {/* Study Area */}
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-obsidian-textMuted" />
          <span className="font-medium text-obsidian-textPrimary">Connaught Place</span>
          <span className="text-[11px] font-mono text-obsidian-textMuted">· 10m UTM 43N</span>
        </div>

        <div className="h-3 w-px bg-obsidian-border" />

        {/* Observation Source */}
        <div className="flex items-center gap-1.5">
          <Satellite className="w-3.5 h-3.5 text-botanical-light" />
          <span className="text-[11px] text-obsidian-textSecondary">Landsat 8 & ECOSTRESS</span>
        </div>

        <div className="h-3 w-px bg-obsidian-border" />

        {/* Physics Verification */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-botanical-light" />
          <span className="text-obsidian-textSecondary">Physics Verified</span>
        </div>
      </div>
    </header>
  );
}
