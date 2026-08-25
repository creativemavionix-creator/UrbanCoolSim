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
    { name: "Net Radiation (Q*)", key: "Q*", value: data?.Q_star_mean || 580.5, color: "#4A6CFF", desc: "Shortwave + Longwave" },
    { name: "Anthropogenic (Qf)", key: "Qf", value: data?.Q_f_mean || 35.0, color: "#F59E0B", desc: "HVAC & Traffic Waste Heat" },
    { name: "Sensible Heat (Qh)", key: "Qh", value: data?.Q_h_mean || 320.0, color: "#EF4444", desc: "Turbulent Air Heating" },
    { name: "Latent Heat (Qe)", key: "Qe", value: data?.Q_e_mean || 145.0, color: "#10B981", desc: "Evapotranspiration Cooling" },
    { name: "Storage (ΔQs)", key: "ΔQs", value: data?.dQs_mean || 150.5, color: "#8E95A5", desc: "Building Thermal Mass" },
  ];

  return (
    <div className="graphite-card p-6 rounded-lg flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-baseline gap-2 border-b border-surface-border pb-3">
        <div>
          <h2 className="text-sm font-semibold text-ink-primary">Surface Energy Balance Conservation</h2>
          <p className="text-xs text-ink-muted font-mono mt-0.5">
            Q* + Q_f = Q_h + Q_e + ΔQ_s
          </p>
        </div>
        <span className="text-[11px] font-mono text-ink-muted">
          Units: <strong className="text-ink-primary">W/m²</strong>
        </span>
      </div>

      <div className="h-60 w-full tabular-nums">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <XAxis 
              dataKey="key" 
              stroke="#5E6678" 
              fontSize={11} 
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
            />
            <YAxis 
              stroke="#5E6678" 
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
                    <div className="graphite-card px-3.5 py-2.5 rounded text-xs space-y-0.5 shadow-floating">
                      <div className="font-semibold text-ink-primary">{p.name}</div>
                      <div className="text-[11px] text-ink-muted">{p.desc}</div>
                      <div className="font-mono text-sm text-ink-primary font-bold pt-0.5">
                        {p.value.toFixed(1)} <span className="text-xs font-normal text-ink-muted">W/m²</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={44}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px] pt-1 tabular-nums">
        {chartData.map((item) => (
          <div key={item.key} className="p-2 rounded bg-surface-base border border-surface-border">
            <span className="text-ink-muted block text-[10px] font-mono">{item.key}</span>
            <span className="font-mono text-xs font-medium text-ink-primary mt-0.5 block">{item.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
