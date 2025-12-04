"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from "recharts";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  CHART_ANIMATION,
  getStaggerDelay,
  getAnimationConfig,
} from "@/lib/animationConfig";
import {
  renderGradientDefs,
  getGradientFillFromColor,
  getGradientIdFromColor,
} from "@/lib/gradientConfig";
import { useIsMobile } from "@/hooks/use-is-mobile";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const catColors: Record<string, string> = {
  "2W": "#ffffff",
  "3W": "#ff1f23",
  PV: "#FFCE56",
  TRAC: "#4BC0C0",
  Truck: "#00CED1",
  Bus: "#DC143C",
  CV: "#9966FF",
  Total: "#FF9F40",
};

const forecastColors = {
  linear: "#00BFFF",
  score: "#FF69B4",
  ai: "#32CD32",
  race: "#FFA500",
};

const categories = ["2W", "3W", "PV", "TRAC", "Truck", "Bus", "CV", "Total"];

const abbreviate = (v: number) =>
  v >= 1e9
    ? `${(v / 1e9).toFixed(1)}B`
    : v >= 1e6
    ? `${(v / 1e6).toFixed(1)}M`
    : v >= 1e3
    ? `${(v / 1e3).toFixed(1)}K`
    : `${v}`;

interface LineChartProps {
  overallData: any[];
  category: string; // e.g. 'Total', '2W', ...
  height?: number;
  className?: string;
}

export function LineChart({
  overallData,
  category,
  height = 400,
  className,
}: LineChartProps) {
  const selectedCat = category;
  const [chartData, setChartData] = useState<any[]>([]);
  const isReducedMotion = useReducedMotion();
  const animationConfig = getAnimationConfig(isReducedMotion);

  const isMobile = useIsMobile();

  // clamp height on mobile
  const effectiveHeight = isMobile ? Math.min(height, 260) : height;

  const chartMargin = isMobile
    ? { top: 4, right: 8, left: 4, bottom: 4 }
    : { top: 5, right: 20, left: 20, bottom: 5 };

  const xTickStyle = {
    fontSize: isMobile ? 9 : 11,
    fill: "hsl(var(--muted-foreground))",
  };

  const yTickStyle = {
    fontSize: isMobile ? 9 : 11,
    fill: "hsl(var(--muted-foreground))",
  };

  // 1) Build historical + forecast series (ported from old chart)
  useEffect(() => {
    if (!overallData || !overallData.length) {
      setChartData([]);
      return;
    }

    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);

    const rows = overallData.map((entry: any, idx: number) => {
      const date = new Date(`${entry.month}-01`);
      const label = `${monthNames[date.getMonth()]}${date
        .getFullYear()
        .toString()
        .slice(-2)}`;

      return {
        ...entry,
        idx,
        date,
        label,
      };
    });

    const forecastStartIdx = rows.findIndex(
      (r: any) => r.date.getTime() >= today.getTime()
    );
    const safeForecastStartIdx =
      forecastStartIdx !== -1 ? forecastStartIdx : Math.floor(rows.length / 2);

    const linReg = (x: number[], y: number[]) => {
      const n = x.length;
      if (!n) return (_idx: number) => 0;

      const sx = x.reduce((a, b) => a + b, 0);
      const sy = y.reduce((a, b) => a + b, 0);
      const sxy = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sx2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const den = n * sx2 - sx * sx || 1;
      const m = (n * sxy - sx * sy) / den;
      const b = sy / n - (m * sx) / n;
      return (idx: number) => b + m * idx;
    };

    const round = (v: number | null | undefined) =>
      v != null ? Math.round(v) : null;

    const forecastRows: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const row: any = { month: r.label };

      categories.forEach((key) => {
        // 👇 Read from either nested data or flat keys
        const val =
          r.data && r.data[key] != null ? r.data[key] : (r as any)[key] ?? null;

        const isFuture = i >= safeForecastStartIdx;
        const isHistLast = i === safeForecastStartIdx - 1;
        const futureOffset = i - safeForecastStartIdx;

        // historical
        row[key] = !isFuture ? val : null;

        const histVals = forecastRows
          .slice(0, safeForecastStartIdx)
          .map((x: any) => x[key])
          .filter((v: any) => v != null) as number[];

        const linFunc = linReg(
          histVals.map((_, j) => j),
          histVals
        );

        const scoreForecastVal = () => {
          const available: number[] = [];
          for (let back = i - 1; available.length < 3 && back >= 0; back--) {
            const prevRow = forecastRows[back] ?? {};
            const prev = (prevRow[`${key}_forecast_score`] ?? prevRow[key]) as
              | number
              | null
              | undefined;
            if (prev != null) available.unshift(prev);
          }
          if (available.length < 3) return null;

          const weights = [0.5, 0.3, 0.2];
          const base = weights.reduce(
            (s, wt, j) => s + wt * available[available.length - 1 - j],
            0
          );
          const progressiveFactor = 1 + futureOffset * 0.003;
          const randomFactor = 0.98 + Math.random() * 0.04;

          return base * progressiveFactor * randomFactor;
        };

        const raceVal = isFuture ? val : null;
        const aiVal =
          isFuture && val != null
            ? futureOffset < 4
              ? val * 1.03
              : val * 0.98
            : null;

        row[`${key}_forecast_linear`] = isFuture
          ? round(linFunc(i))
          : isHistLast
          ? round(val)
          : null;

        row[`${key}_forecast_score`] = isFuture
          ? round(scoreForecastVal())
          : isHistLast
          ? round(val)
          : null;

        row[`${key}_forecast_race`] = isFuture
          ? round(raceVal as number | null)
          : isHistLast
          ? round(val)
          : null;

        row[`${key}_forecast_ai`] = isFuture
          ? round(aiVal)
          : isHistLast
          ? round(val)
          : null;
      });

      forecastRows.push(row);
    }

    setChartData(forecastRows);
  }, [overallData]);

  // 2) Growth rates (same logic as old)
  const growthRates = useMemo(() => {
    const calc = (start: number | null, end: number | null) =>
      start != null && end != null && start !== 0
        ? (end / start - 1) * 100
        : null;

    let first: number | null = null;
    let last: number | null = null;
    let linearStart: number | null = null;
    let linearEnd: number | null = null;
    let scoreStart: number | null = null;
    let scoreEnd: number | null = null;
    let aiStart: number | null = null;
    let aiEnd: number | null = null;
    let raceStart: number | null = null;
    let raceEnd: number | null = null;

    for (const row of chartData) {
      if (first === null && row[selectedCat] != null) first = row[selectedCat];
      if (linearStart === null && row[`${selectedCat}_forecast_linear`] != null)
        linearStart = row[`${selectedCat}_forecast_linear`];
      if (scoreStart === null && row[`${selectedCat}_forecast_score`] != null)
        scoreStart = row[`${selectedCat}_forecast_score`];
      if (aiStart === null && row[`${selectedCat}_forecast_ai`] != null)
        aiStart = row[`${selectedCat}_forecast_ai`];
      if (raceStart === null && row[`${selectedCat}_forecast_race`] != null)
        raceStart = row[`${selectedCat}_forecast_race`];
    }

    for (let i = chartData.length - 1; i >= 0; i--) {
      const row = chartData[i];
      if (last === null && row[selectedCat] != null) last = row[selectedCat];
      if (linearEnd === null && row[`${selectedCat}_forecast_linear`] != null)
        linearEnd = row[`${selectedCat}_forecast_linear`];
      if (scoreEnd === null && row[`${selectedCat}_forecast_score`] != null)
        scoreEnd = row[`${selectedCat}_forecast_score`];
      if (aiEnd === null && row[`${selectedCat}_forecast_ai`] != null)
        aiEnd = row[`${selectedCat}_forecast_ai`];
      if (raceEnd === null && row[`${selectedCat}_forecast_race`] != null)
        raceEnd = row[`${selectedCat}_forecast_race`];
    }

    return {
      historical: calc(first, last),
      linear: calc(linearStart, linearEnd),
      score: calc(scoreStart, scoreEnd),
      ai: calc(aiStart, aiEnd),
      race: calc(raceStart, raceEnd),
    };
  }, [chartData, selectedCat]);

  const formatGrowth = (value: number | null) =>
    value == null || Number.isNaN(value) ? "–" : `${value.toFixed(1)}%`;

  // 3) Tooltip with forecast-start behavior + new styling
  const ForecastTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const currentIndex = chartData.findIndex((row) => row.month === label);
    const forecastStartIndex = chartData.findIndex(
      (row) =>
        row[`${selectedCat}_forecast_linear`] != null ||
        row[`${selectedCat}_forecast_score`] != null ||
        row[`${selectedCat}_forecast_ai`] != null ||
        row[`${selectedCat}_forecast_race`] != null
    );

    const filteredPayload =
      currentIndex === forecastStartIndex
        ? payload.filter((p: any) => p.dataKey === selectedCat)
        : payload;

    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-xl animate-fade-in">
        <p className="text-sm font-semibold mb-2">{label}</p>
        {filteredPayload.map((entry: any, index: number) => (
          <div key={index} className="flex items-baseline gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <p className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.name}:
            </p>
            <p className="text-sm font-bold">
              {Math.round(entry.value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // 4) Line configs
  const lines = useMemo(
    () => [
      {
        key: selectedCat,
        name: "Historical",
        color: catColors[selectedCat] ?? "#ffffff",
        showArea: true,
        strokeDasharray: undefined,
      },
      {
        key: `${selectedCat}_forecast_linear`,
        name: "Forecast (Stats)",
        color: forecastColors.linear,
        strokeDasharray: "5 5",
      },
      {
        key: `${selectedCat}_forecast_score`,
        name: "Forecast (Survey-based)",
        color: forecastColors.score,
        strokeDasharray: "2 2",
      },
      {
        key: `${selectedCat}_forecast_ai`,
        name: "Forecast (AI)",
        color: forecastColors.ai,
        strokeDasharray: "4 4",
      },
      {
        key: `${selectedCat}_forecast_race`,
        name: "Forecast (Race)",
        color: forecastColors.race,
        strokeDasharray: "2 4",
      },
    ],
    [selectedCat]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: catColors[selectedCat] ?? "#fff" }}
          />
          <span>{selectedCat}</span>
        </div>

        <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 border border-border/70"
            style={{ color: catColors[selectedCat] ?? "#fff" }}
          >
            <span className="font-semibold">
              {formatGrowth(growthRates.historical)}
            </span>
            <span className="opacity-80">Historical</span>
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 border border-border/70"
            style={{ color: forecastColors.linear }}
          >
            <span className="font-semibold">
              {formatGrowth(growthRates.linear)}
            </span>
            <span className="opacity-80">Forecast (Stats)</span>
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 border border-border/70"
            style={{ color: forecastColors.score }}
          >
            <span className="font-semibold">
              {formatGrowth(growthRates.score)}
            </span>
            <span className="opacity-80">Forecast (Survey)</span>
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 border border-border/70"
            style={{ color: forecastColors.ai }}
          >
            <span className="font-semibold">
              {formatGrowth(growthRates.ai)}
            </span>
            <span className="opacity-80">Forecast (AI)</span>
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 border border-border/70"
            style={{ color: forecastColors.race }}
          >
            <span className="font-semibold">
              {formatGrowth(growthRates.race)}
            </span>
            <span className="opacity-80">Forecast (Race)</span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={effectiveHeight}>
          <RechartsLineChart data={chartData} margin={chartMargin}>
            {renderGradientDefs("vertical", true)}

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.3}
            />

            <XAxis
              dataKey="month"
              tick={xTickStyle}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={isMobile ? false : { stroke: "hsl(var(--border))" }}
              minTickGap={isMobile ? 10 : 0}
            />

            <YAxis
              tick={yTickStyle}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={isMobile ? false : { stroke: "hsl(var(--border))" }}
              tickFormatter={abbreviate}
              width={isMobile ? 40 : 60}
            />

            <Tooltip content={<ForecastTooltip />} />

            <Legend
              wrapperStyle={{
                paddingTop: isMobile ? 8 : 20,
                fontSize: isMobile ? 10 : 12,
              }}
              iconSize={isMobile ? 8 : 10}
              iconType="line"
            />

            <Brush
              dataKey="month"
              height={isMobile ? 12 : 16}
              stroke="hsl(var(--border))"
              fill="hsl(var(--background))"
            />

            {lines.map((line, index) => {
              const strokeColor = getGradientFillFromColor(line.color, true);
              const areaGradientId =
                line.showArea && line.color
                  ? `${getGradientIdFromColor(line.color)}-area`
                  : undefined;

              return (
                <React.Fragment key={line.key}>
                  {line.showArea && areaGradientId && (
                    <Area
                      type="monotone"
                      dataKey={line.key}
                      stroke="none"
                      fill={`url(#${areaGradientId})`}
                      isAnimationActive={animationConfig.isAnimationActive}
                      animationDuration={CHART_ANIMATION.duration.medium}
                      animationEasing={CHART_ANIMATION.easing.easeOut}
                      animationBegin={getStaggerDelay(
                        index,
                        CHART_ANIMATION.stagger.medium
                      )}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey={line.key}
                    stroke={strokeColor}
                    strokeDasharray={line.strokeDasharray}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    name={line.name}
                    isAnimationActive={animationConfig.isAnimationActive}
                    animationDuration={CHART_ANIMATION.duration.medium}
                    animationEasing={CHART_ANIMATION.easing.easeOut}
                    animationBegin={getStaggerDelay(
                      index,
                      CHART_ANIMATION.stagger.medium
                    )}
                  />
                </React.Fragment>
              );
            })}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 'use client';

// import React from 'react';
// import { LineChart as RechartsLineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// import { cn } from '@/lib/utils';
// import { useReducedMotion } from '@/hooks/use-reduced-motion';
// import { CHART_ANIMATION, getStaggerDelay, getAnimationConfig } from '@/lib/animationConfig';
// import { renderGradientDefs, getGradientFillFromColor, getGradientIdFromColor } from '@/lib/gradientConfig';

// interface LineChartProps {
//   data: any[];
//   lines: Array<{
//     key: string;
//     name: string;
//     color?: string;
//     strokeDasharray?: string;
//     showArea?: boolean;
//   }>;
//   height?: number;
//   className?: string;
//   showGrid?: boolean;
//   showLegend?: boolean;
// }

// export function LineChart({
//   data,
//   lines,
//   height = 300,
//   className,
//   showGrid = true,
//   showLegend = true
// }: LineChartProps) {
//   const isReducedMotion = useReducedMotion();
//   const animationConfig = getAnimationConfig(isReducedMotion);
//   const CustomTooltip = ({ active, payload, label }: any) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-xl animate-fade-in">
//           <p className="text-sm font-semibold mb-2">{label}</p>
//           {payload.map((entry: any, index: number) => (
//             <div key={index} className="flex items-baseline gap-2 mb-1">
//               <div
//                 className="w-2 h-2 rounded-full"
//                 style={{ backgroundColor: entry.color }}
//               />
//               <p className="text-xs font-medium" style={{ color: entry.color }}>
//                 {entry.name}:
//               </p>
//               <p className="text-sm font-bold">
//                 {Math.round(entry.value).toLocaleString()}
//               </p>
//             </div>
//           ))}
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <div className={cn('w-full', className)} style={{ height }}>
//       <ResponsiveContainer width="100%" height="100%">
//         <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
//           {renderGradientDefs('vertical', true)}

//           {showGrid && (
//             <CartesianGrid
//               strokeDasharray="3 3"
//               stroke="hsl(var(--border))"
//               strokeOpacity={0.3}
//             />
//           )}
//           <XAxis
//             dataKey="month"
//             tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
//             axisLine={{ stroke: 'hsl(var(--border))' }}
//             tickLine={{ stroke: 'hsl(var(--border))' }}
//           />
//           <YAxis
//             tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
//             axisLine={{ stroke: 'hsl(var(--border))' }}
//             tickLine={{ stroke: 'hsl(var(--border))' }}
//           />
//           <Tooltip content={<CustomTooltip />} />
//           {showLegend && (
//             <Legend
//               wrapperStyle={{ paddingTop: '20px' }}
//               iconType="line"
//             />
//           )}

//           {lines.map((line, index) => {
//             const strokeColor = getGradientFillFromColor(line.color, true);
//             const areaGradientId = line.showArea && line.color
//               ? `${getGradientIdFromColor(line.color)}-area`
//               : undefined;

//             return (
//               <React.Fragment key={line.key}>
//                 {line.showArea && areaGradientId && (
//                   <Area
//                     type="monotone"
//                     dataKey={line.key}
//                     stroke="none"
//                     fill={`url(#${areaGradientId})`}
//                     isAnimationActive={animationConfig.isAnimationActive}
//                     animationDuration={CHART_ANIMATION.duration.medium}
//                     animationEasing={CHART_ANIMATION.easing.easeOut}
//                     animationBegin={getStaggerDelay(index, CHART_ANIMATION.stagger.medium)}
//                   />
//                 )}
//                 <Line
//                   type="monotone"
//                   dataKey={line.key}
//                   stroke={strokeColor}
//                   strokeDasharray={line.strokeDasharray}
//                   strokeWidth={2}
//                   dot={{ r: 4, strokeWidth: 2 }}
//                   activeDot={{ r: 6, strokeWidth: 2 }}
//                   name={line.name}
//                   isAnimationActive={animationConfig.isAnimationActive}
//                   animationDuration={CHART_ANIMATION.duration.medium}
//                   animationEasing={CHART_ANIMATION.easing.easeOut}
//                   animationBegin={getStaggerDelay(index, CHART_ANIMATION.stagger.medium)}
//                 />
//               </React.Fragment>
//             );
//           })}
//         </RechartsLineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }
