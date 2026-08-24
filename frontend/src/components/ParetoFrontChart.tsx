"use client";

import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import { ParetoSolution } from "@/lib/api";

interface ParetoFrontChartProps {
  solutions: ParetoSolution[];
  onSelect?: (s: ParetoSolution) => void;
  selectedSolution?: ParetoSolution | null;
}

export function ParetoFrontChart({ solutions, onSelect, selectedSolution }: ParetoFrontChartProps) {
  const chartData = solutions.map((s, idx) => ({
    x: parseFloat(((s.validated_delta_t || s.delta_t_mean || 0)).toFixed(2)),
    y: parseFloat((s.total_cost_usd / 1000.0).toFixed(1)), // in $k USD
    water: s.water_demand_m3,
    isSelected: selectedSolution?.solution_id === s.solution_id,
    solution: s,
    id: `sol-${s.solution_id || idx}`
  }));

  return (
    <div className="bg-obsidian-subtle border border-obsidian-border p-5 rounded-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-baseline gap-2 border-b border-obsidian-border pb-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">NSGA-II Pareto Frontier</h2>
          <p className="text-xs text-obsidian-textMuted mt-0.5">
            Trade-off: Cooling Impact (ΔT °C) vs Capital Cost ($k USD)
          </p>
        </div>
        <span className="text-[11px] font-mono text-botanical-light flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-botanical-light" />
          Deterministic Physics Re-Validated
        </span>
      </div>

      {/* Scatter Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Cooling Benefit ΔT" 
              unit="°C"
              stroke="#6b7280" 
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              domain={['dataMin - 0.2', 'dataMax + 0.2']}
              tickFormatter={(v) => `-${Math.abs(v).toFixed(1)}°C`}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Capital Cost" 
              unit="$k"
              stroke="#6b7280" 
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.08)" }}
              tickFormatter={(v) => `$${Math.round(v)}k`}
            />
            <ZAxis type="number" dataKey="water" range={[60, 220]} name="Water Demand (m³)" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "rgba(255, 255, 255, 0.15)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="bg-obsidian-surface border border-obsidian-border p-3 rounded-lg text-xs shadow-floating space-y-1.5">
                      <div className="font-semibold text-white">Pareto Candidate Strategy</div>
                      <div className="text-[11px] space-y-1 font-mono">
                        <div className="text-botanical-light">
                          Cooling: <strong>-{Math.abs(p.x).toFixed(2)}°C</strong>
                        </div>
                        <div className="text-white">
                          CapEx: <strong>${Math.round(p.y * 1000).toLocaleString()} USD</strong>
                        </div>
                        <div className="text-obsidian-textSecondary">
                          Water: <strong>{p.water.toLocaleString()} m³/yr</strong>
                        </div>
                      </div>
                      <div className="text-[10px] text-obsidian-textMuted pt-1 border-t border-obsidian-border">
                        Click to inspect intervention breakdown
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter
              data={chartData}
              fill="#22c55e"
              onClick={(e) => onSelect && onSelect(e.payload.solution)}
              className="cursor-pointer"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-obsidian-textMuted flex justify-between items-center px-1">
        <span>Bubble size corresponds to annual water demand ($m^3$)</span>
        <span className="font-mono">{solutions.length} Non-dominated portfolios</span>
      </div>
    </div>
  );
}
