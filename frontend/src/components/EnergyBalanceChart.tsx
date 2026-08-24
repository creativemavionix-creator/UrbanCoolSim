"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface EnergyBalanceProps {
  data?: {
    Q_star_mean?: number;
    Q_f_mean?: number;
    Q_h_mean?: number;
    Q_e_mean?: number;
    dQs_mean?: number;
  };
}

export function EnergyBalanceChart({ data }: EnergyBalanceProps) {
  const chartData = [
    { name: "Net Radiation (Q*)", key: "Q*", value: data?.Q_star_mean || 580.5, color: "#38bdf8", desc: "Shortwave + Longwave" },
    { name: "Anthropogenic (Qf)", key: "Qf", value: data?.Q_f_mean || 35.0, color: "#f59e0b", desc: "HVAC & Traffic Heat" },
    { name: "Sensible Heat (Qh)", key: "Qh", value: data?.Q_h_mean || 320.0, color: "#ea580c", desc: "Turbulent Air Heating" },
    { name: "Latent Heat (Qe)", key: "Qe", value: data?.Q_e_mean || 145.0, color: "#10b981", desc: "Evapotranspiration" },
    { name: "Storage (ΔQs)", key: "ΔQs", value: data?.dQs_mean || 150.5, color: "#818cf8", desc: "Building Fabric Storage" },
  ];

  return (
    <div className="bg-obsidian-subtle border border-obsidian-border p-5 rounded-xl flex flex-col gap-4">
      {/* Header with Physical Equation */}
      <div className="flex flex-wrap justify-between items-baseline gap-2 border-b border-obsidian-border pb-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">Surface Energy Balance Conservation</h2>
          <p className="text-xs text-obsidian-textMuted font-mono mt-0.5">
            Q* + Q_f = Q_h + Q_e + ΔQ_s
          </p>
        </div>
        <span className="text-[11px] font-mono text-obsidian-textSecondary">
          Units: <strong className="text-white">W/m²</strong>
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <XAxis 
              dataKey="key" 
              stroke="#6b7280" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="bg-obsidian-surface border border-obsidian-border px-3 py-2 rounded-lg text-xs shadow-floating space-y-1">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[11px] text-obsidian-textMuted">{p.desc}</div>
                      <div className="font-mono text-sm text-white pt-1">
                        {p.value.toFixed(1)} <span className="text-xs text-obsidian-textMuted">W/m²</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px] pt-1">
        {chartData.map((item) => (
          <div key={item.key} className="p-2 rounded bg-obsidian-surface/50 border border-obsidian-border/50">
            <span className="text-obsidian-textMuted block text-[10px]">{item.key}</span>
            <span className="font-mono text-xs font-medium text-white">{item.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
