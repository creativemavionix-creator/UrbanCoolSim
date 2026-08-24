"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ShapWaterfallProps {
  data?: {
    feature: string;
    val: number;
    description: string;
  }[];
}

export function ShapWaterfallChart({ data }: ShapWaterfallProps) {
  const shapData = data || [
    { feature: "Cool Roof Albedo (α)", val: 1.25, description: "Solar shortwave radiation reflection" },
    { feature: "Green Roof Coverage", val: 0.95, description: "Rooftop evapotranspiration & latent flux" },
    { feature: "Tree Canopy Expansion", val: 0.82, description: "Direct ground shading & transpiration" },
    { feature: "Urban Water Bodies", val: 0.45, description: "Evaporative microclimate heat sink" },
    { feature: "Reflective Pavements", val: 0.38, description: "Street-level albedo modification" },
    { feature: "Building Density (f_bldg)", val: -0.22, description: "Thermal mass & street canyon heat trapping" },
  ];

  return (
    <div className="bg-obsidian-subtle border border-obsidian-border p-5 rounded-xl flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-baseline gap-2 border-b border-obsidian-border pb-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">Intervention Factor Influence</h2>
          <p className="text-xs text-obsidian-textMuted mt-0.5">
            Attribution of microclimate cooling response (ΔT °C) via TreeSHAP
          </p>
        </div>
        <span className="text-[11px] font-mono text-obsidian-textSecondary">
          Model: <strong className="text-white">LightGBM Surrogate</strong>
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={shapData} margin={{ top: 5, right: 25, left: 50, bottom: 0 }}>
            <XAxis 
              type="number" 
              stroke="#6b7280" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}°C`}
            />
            <YAxis 
              dataKey="feature" 
              type="category" 
              stroke="#9ca3af" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
            />
            <Tooltip
              cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="bg-obsidian-surface border border-obsidian-border p-3 rounded-lg text-xs shadow-floating space-y-1">
                      <div className="font-semibold text-white">{p.feature}</div>
                      <div className="text-[11px] text-obsidian-textMuted">{p.description}</div>
                      <div className="font-mono text-xs text-white pt-1">
                        Impact: <strong className={p.val >= 0 ? "text-botanical-light" : "text-thermal-extreme"}>
                          {p.val >= 0 ? "+" : ""}{p.val.toFixed(2)}°C cooling
                        </strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="val" radius={[0, 3, 3, 0]} maxBarSize={22}>
              {shapData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.val >= 0 ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-obsidian-textMuted flex justify-between items-center px-1">
        <span>Positive values denote increased cooling contribution</span>
        <span className="font-mono">Shapley Additive Attribution</span>
      </div>
    </div>
  );
}
