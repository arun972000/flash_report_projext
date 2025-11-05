// app/components/CrossCategoryPerformance.tsx
"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

/* ---------- helpers ---------- */
function formatIndian(n: number) {
  const s = n.toString();
  const last3 = s.slice(-3);
  const other = s.slice(0, -3);
  return (other ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "") + last3;
}

function CardTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="rounded-2xl bg-black/90 px-4 py-3 text-white shadow-2xl backdrop-blur">
      <div className="text-lg font-semibold leading-none">{p?.name}</div>
      <div className="mt-1 text-sm text-white/70">
        Sales:&nbsp;<span className="font-semibold text-white">{formatIndian(p?.sales ?? 0)}</span>
      </div>
    </div>
  );
}

/* ---------- data ---------- */
const baseData = [
  { name: "Passenger", sales: 76428, growth: 5.2, color: "#3B82F6" },
  { name: "Commercial", sales: 52940, growth: 3.8, color: "#22C55E" },
  { name: "Two-Wheeler", sales: 80428, growth: 7.1, color: "#F59E0B" },
  { name: "Three-Wheeler", sales: 21420, growth: 2.3, color: "#A78BFA" },
  { name: "Tractor", sales: 16400, growth: 4.5, color: "#EF4444" },
];
const maxSales = Math.max(...baseData.map((d) => d.sales));
const chartData = baseData.map((d) => ({ ...d, value: d.sales / maxSales })); // 0..1 axis

/* ---------- component ---------- */
const CrossCategoryPerformance: React.FC = () => {
  // Subtle hairline border (tweak opacity to taste: /25 lighter, /55 darker)
  const softBorder = "ring-1 ring-inset ring-[#2F3949]/40";

  return (
    <section className="bg-[#0a0f14] text-white">
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Cross-Category Performance
        </h1>
        <p className="mt-2 text-white/70">
          Current month sales comparison across all vehicle segments
        </p>

        {/* CARD */}
        <div className={`mt-6 rounded-3xl ${softBorder} bg-[#0b141f]/70 p-6 shadow-[0_10px_40px_rgba(0,0,0,.55)]`}>
          <h3 className="text-lg font-semibold">Sales by Vehicle Category</h3>
          <p className="mt-1 text-white/70">
            Two-Wheeler segment leads with 7.1% growth, followed by Passenger Vehicles at 5.2%.
            All categories showing positive momentum.
          </p>

          {/* CHART */}
          <div className={`mt-6 h-[420px] w-full rounded-2xl ${softBorder} bg-[#06121e] p-3`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: 12, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,.08)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(255,255,255,.65)" }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={12}
                />
                <YAxis
                  domain={[0, 1]}
                  ticks={[0.25, 0.5, 0.75, 1]}
                  tick={{ fill: "rgba(255,255,255,.65)" }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                {/* <Tooltip cursor={{ fill: "rgba(255,255,255,.03)" }} content={<CardTooltip />} /> */}
                <Bar dataKey="value" barSize={24} radius={[8, 8, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* LEGEND */}
          <div className="mt-7 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {baseData.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="inline-block h-3.5 w-3.5 rounded-full"
                  style={{ background: d.color }}
                />
                <div className="leading-tight">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-white/70">
                    {d.growth >= 0 ? "+" : ""}
                    {d.growth}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CrossCategoryPerformance;
