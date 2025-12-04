"use client";

import { useState, useEffect, useMemo } from "react";
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { RegionSelector } from "@/components/ui/RegionSelector";
import { MonthSelector } from "@/components/ui/MonthSelector";
import { CompareToggle } from "@/components/ui/CompareToggle";
import { useAppContext } from "@/components/providers/Providers";
import { generateSegmentData, formatNumber } from "@/lib/mockData";

const MONTHS_SHORT = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

type MarketBackendRow = {
  name: string;
  [key: string]: string | number;
};

type CompareRow = {
  name: string;
  current: number;
  previous: number;
  symbol: "" | "▲" | "▼";
  deltaPct: number | null;
};

// Helper: "YYYY-MM" → "jan" etc.
function getShortMonthFromYyyyMm(yyyymm: string): string {
  const parts = yyyymm.split("-");
  if (parts.length !== 2) {
    const now = new Date();
    return MONTHS_SHORT[now.getMonth()];
  }
  const idx = parseInt(parts[1], 10) - 1;
  return MONTHS_SHORT[idx] ?? MONTHS_SHORT[0];
}

// Build compare rows (same logic as other pages)
function buildCompareData(
  raw: MarketBackendRow[],
  effectiveMonthYyyyMm: string,
  compareMode: "mom" | "yoy"
): {
  chartData: CompareRow[];
  totalCurrent: number;
  totalPrev: number;
  prevKey: string;
  currKey: string;
} | null {
  if (!raw.length) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const lastYear = currentYear - 1;

  const shortMonth = getShortMonthFromYyyyMm(effectiveMonthYyyyMm);
  const monthIndex = MONTHS_SHORT.indexOf(shortMonth);
  const prevMonthShort = monthIndex > 0 ? MONTHS_SHORT[monthIndex - 1] : "dec";

  const currKey = `${shortMonth} ${currentYear}`;
  const prevKey =
    compareMode === "mom"
      ? `${prevMonthShort} ${currentYear}`
      : `${shortMonth} ${lastYear}`;

  const rows: CompareRow[] = raw
    .map((item) => {
      const prev = parseFloat(String(item[prevKey] ?? "0")) || 0;
      const curr = parseFloat(String(item[currKey] ?? "0")) || 0;
      let symbol: "" | "▲" | "▼" = "";
      if (curr > prev) symbol = "▲";
      else if (curr < prev) symbol = "▼";

      const deltaPct = prev > 0 ? ((curr - prev) / prev) * 100 : null;

      return {
        name: item.name,
        current: curr,
        previous: prev,
        symbol,
        deltaPct,
      };
    })
    .sort((a, b) => b.current - a.current);

  const othersIndex = rows.findIndex(
    (r) => r.name.toLowerCase().trim() === "others"
  );
  if (othersIndex !== -1) {
    const [others] = rows.splice(othersIndex, 1);
    others.name = "Others";
    rows.push(others);
  }

  const totalCurrent = rows.reduce((sum, r) => sum + r.current, 0);
  const totalPrev = rows.reduce((sum, r) => sum + r.previous, 0);

  return {
    chartData: rows,
    totalCurrent,
    totalPrev,
    prevKey,
    currKey,
  };
}

// Pick tractor series from overallData row
function pickSeries(row: any, keys: string[]): number {
  if (!row) return 0;

  const source = row.data && typeof row.data === "object" ? row.data : row;
  const lowerMap: Record<string, number> = {};

  for (const [k, v] of Object.entries(source)) {
    if (typeof v === "number") {
      lowerMap[k.toLowerCase()] = v;
    }
  }

  for (const key of keys) {
    const val = lowerMap[key.toLowerCase()];
    if (typeof val === "number") return val;
  }

  return 0;
}

// Tooltip factory for compare charts
function createCompareTooltip(computed: any) {
  return (props: any) => {
    const { active, payload } = props;
    if (!active || !payload || !payload.length || !computed) return null;

    const row = payload[0].payload as CompareRow;
    const delta = row.deltaPct ?? 0;
    const symbol = row.symbol || (delta > 0 ? "▲" : delta < 0 ? "▼" : "•");

    const colorClass =
      delta > 0
        ? "text-emerald-400"
        : delta < 0
        ? "text-rose-400"
        : "text-muted-foreground";

    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold mb-2">{row.name}</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="font-medium">
              {computed.prevKey.toUpperCase()}:
            </span>
            <span className="font-semibold">{row.previous.toFixed(1)}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="font-medium">
              {computed.currKey.toUpperCase()}:
            </span>
            <span className="font-semibold">{row.current.toFixed(1)}%</span>
          </div>
          <div className={`flex items-baseline gap-2 ${colorClass}`}>
            <span className="font-bold">{symbol}</span>
            <span className="font-medium">Change:</span>
            <span className="font-semibold">
              {delta == null || Number.isNaN(delta)
                ? "–"
                : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
            </span>
          </div>
        </div>
      </div>
    );
  };
}

export default function TractorPage() {
  const { region, month } = useAppContext();
  const [mounted, setMounted] = useState(false);

  // OEM chart state
  const [oemCompare, setOemCompare] = useState<"mom" | "yoy">("mom");
  const [oemCurrentMonth, setOemCurrentMonth] = useState(month);
  const [oemRaw, setOemRaw] = useState<MarketBackendRow[]>([]);
  const [oemLoading, setOemLoading] = useState(false);
  const [oemError, setOemError] = useState<string | null>(null);

  // Overall timeseries (for tractor forecast & summary)
  const [overallData, setOverallData] = useState<any[]>([]);
  const [overallLoading, setOverallLoading] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);

  // Application chart (tractor application split)
  const [appRaw, setAppRaw] = useState<any[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [appMonth, setAppMonth] = useState("");

  // Segment donut (no legacy backend for HP split)
  const segmentData = generateSegmentData("tractor", region);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ---- Fetch OEM data (tractor, market share) ----
  useEffect(() => {
    let cancelled = false;

    async function loadOemData() {
      try {
        setOemLoading(true);
        setOemError(null);

        const effectiveMonth = oemCurrentMonth || month;
        const shortMonth = getShortMonthFromYyyyMm(effectiveMonth);

        const res = await fetch(
          `/api/fetchMarketData?segmentName=${encodeURIComponent(
            "tractor"
          )}&selectedMonth=${shortMonth}&mode=${oemCompare}&segmentType=market share`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch tractor OEM data: ${res.status}`);
        }

        const json = (await res.json()) as MarketBackendRow[];
        if (!cancelled) {
          setOemRaw(json || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setOemError("Failed to load tractor OEM market share data");
          setOemRaw([]);
        }
      } finally {
        if (!cancelled) setOemLoading(false);
      }
    }

    loadOemData();
    return () => {
      cancelled = true;
    };
  }, [oemCompare, oemCurrentMonth, month]);

  // ---- Fetch overall timeseries (for TRAC series) ----
  useEffect(() => {
    let cancelled = false;

    async function loadOverall() {
      try {
        setOverallLoading(true);
        setOverallError(null);

        const res = await fetch("/api/flash-reports/overall-chart-data", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch overall chart data: ${res.status}`);
        }

        const data = await res.json();
        if (!cancelled) {
          setOverallData(data || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setOverallError("Failed to load tractor volume timeseries data");
          setOverallData([]);
        }
      } finally {
        if (!cancelled) setOverallLoading(false);
      }
    }

    loadOverall();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Fetch application data (/api/fetchAppData) ----
  useEffect(() => {
    let cancelled = false;

    async function loadAppData() {
      try {
        setAppLoading(true);
        setAppError(null);

        const res = await fetch(
          `/api/fetchAppData?segmentName=${encodeURIComponent(
            "tractor"
          )}&segmentType=app`
        );

        if (!res.ok) {
          throw new Error(
            `Failed to fetch tractor application data: ${res.status}`
          );
        }

        const json = await res.json();
        if (!cancelled) {
          setAppRaw(json || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setAppError("Failed to load tractor application data");
          setAppRaw([]);
        }
      } finally {
        if (!cancelled) setAppLoading(false);
      }
    }

    loadAppData();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Application available months & default month ----
  const appAvailableMonths = useMemo(() => {
    if (!appRaw.length) return [] as string[];

    const first = appRaw[0] || {};
    return Object.keys(first)
      .filter((key) => key !== "name")
      .sort((a, b) => {
        const [ma, ya] = a.split(" ");
        const [mb, yb] = b.split(" ");

        const ia = MONTHS_SHORT.indexOf(ma.toLowerCase());
        const ib = MONTHS_SHORT.indexOf(mb.toLowerCase());

        const da = new Date(Number(ya), ia === -1 ? 0 : ia, 1);
        const db = new Date(Number(yb), ib === -1 ? 0 : ib, 1);

        return da.getTime() - db.getTime();
      });
  }, [appRaw]);

  useEffect(() => {
    if (!appAvailableMonths.length) return;

    setAppMonth((prev) => {
      if (prev) return prev;

      const today = new Date();
      let idx = today.getMonth() - 1;
      if (idx < 0) idx = 11;

      const effectiveMonth = MONTHS_SHORT[idx];
      const currentYear = today.getFullYear();
      const currentKey = `${effectiveMonth} ${currentYear}`;

      const fallback = appAvailableMonths.includes(currentKey)
        ? currentKey
        : appAvailableMonths[appAvailableMonths.length - 1];

      return fallback;
    });
  }, [appAvailableMonths]);

  const appChartData = useMemo(() => {
    if (!appMonth || !appRaw.length) return [];

    return appRaw
      .map((item: any) => ({
        name: item.name,
        value: Number(item[appMonth] ?? 0) || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [appRaw, appMonth]);

  const appTotal = appChartData.reduce((sum, item) => sum + item.value, 0);
  const leadingApp = appChartData[0];
  const secondApp = appChartData[1];

  // ---- Process OEM data ----
  const oemComputed = useMemo(
    () => buildCompareData(oemRaw, oemCurrentMonth || month, oemCompare),
    [oemRaw, oemCurrentMonth, oemCompare, month]
  );

  const oemChartData = oemComputed?.chartData.slice(0, 6) ?? [];
  const topOem = oemComputed?.chartData[0];
  const topOemDelta = topOem?.deltaPct ?? 0;

  const oemSummary = useMemo(() => {
    if (!oemComputed || !oemComputed.chartData.length) {
      return "No tractor OEM market share data available for the selected period.";
    }
    const top = oemComputed.chartData[0];
    const delta = top.deltaPct ?? 0;
    const compareLabel =
      oemCompare === "mom" ? "month-on-month" : "year-on-year";

    return `${top.name} dominates tractors with ${top.current.toFixed(
      1
    )}% market share, showing ${
      Number.isNaN(delta)
        ? "no"
        : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`
    } ${compareLabel} change versus ${
      oemCompare === "mom" ? "previous month" : "same month last year"
    }.`;
  }, [oemComputed, oemCompare]);

  const renderOemTooltip = useMemo(
    () => createCompareTooltip(oemComputed),
    [oemComputed]
  );

  // ---- Summary metrics from overallData (TRAC volumes) ----
  const latestPoint =
    overallData.length > 0 ? overallData[overallData.length - 1] : null;
  const prevPoint =
    overallData.length > 1 ? overallData[overallData.length - 2] : null;

  const latestTractor = pickSeries(latestPoint, ["TRAC", "tractor"]);
  const prevTractor = pickSeries(prevPoint, ["TRAC", "tractor"]);
  const growthRate =
    prevTractor > 0
      ? Math.round(((latestTractor - prevTractor) / prevTractor) * 100)
      : 0;

  const pageMonthLabel = new Date(`${month}-01`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const segmentTotal = segmentData.reduce((sum, item) => sum + item.value, 0);
  const leadingSegment = segmentData[0];

  if (!mounted) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: "Flash Reports", href: "/flash-reports" },
              { label: "Tractor" },
            ]}
            className="mb-4"
          />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Tractor Market</h1>
              <p className="text-muted-foreground">
                Agricultural and farm equipment tractor market analysis across
                horsepower segments
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <RegionSelector />
              <MonthSelector />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8 p-6 bg-card/30 rounded-lg border border-border/50">
          <h2 className="text-lg font-semibold mb-3">
            Market Summary - {pageMonthLabel}
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">
                Total Tractor Sales:
              </span>
              <span className="ml-2 font-medium">
                {formatNumber(latestTractor || 0)} units
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Growth Rate:</span>
              <span
                className={`ml-2 font-medium ${
                  growthRate >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {growthRate >= 0 ? "+" : ""}
                {growthRate}% MoM
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Leading OEM:</span>
              <span className="ml-2 font-medium text-primary">
                {topOem?.name ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-8">
          {/* 1) Tractor OEM Performance */}
          <ChartWrapper
            title="Tractor OEM Performance"
            summary={oemSummary}
            controls={
              <div className="flex items-center space-x-3">
                <CompareToggle value={oemCompare} onChange={setOemCompare} />
                <MonthSelector
                  value={oemCurrentMonth}
                  onChange={setOemCurrentMonth}
                  label="Current Month"
                />
              </div>
            }
          >
            {oemError ? (
              <p className="text-sm text-destructive">{oemError}</p>
            ) : oemLoading ? (
              <div className="h-[350px] flex items-center justify-center text-sm text-muted-foreground">
                Loading tractor OEM market share…
              </div>
            ) : oemChartData.length ? (
              <BarChart
                data={oemChartData}
                bars={[
                  {
                    key: "current",
                    name: "Current Period",
                    color: "#007AFF",
                    useGradient: true,
                  },
                  {
                    key: "previous",
                    name:
                      oemCompare === "mom" ? "Previous Month" : "Previous Year",
                    color: "#6B7280",
                  },
                ]}
                height={350}
                layout="horizontal"
                tooltipRenderer={renderOemTooltip}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No tractor OEM market share data available for the selected
                period.
              </p>
            )}
          </ChartWrapper>

          {/* 2) Tractor Sales Forecast (TRAC series from overallData) */}
          <ChartWrapper
            title="Tractor Sales Forecast"
            summary={
              overallError
                ? overallError
                : "Monsoon performance, crop realizations, and government schemes drive tractor demand. Medium HP segment expected to lead growth."
            }
          >
            {overallLoading ? (
              <div className="h-[350px] flex items-center justify-center text-sm text-muted-foreground">
                Loading tractor timeseries…
              </div>
            ) : (
              <LineChart
                overallData={overallData}
                category="TRAC"
                height={350}
              />
            )}
          </ChartWrapper>

          {/* 3) Application + 4) HP Segment Distribution */}
          <div className="grid lg:grid-cols-2 gap-8">
            <ChartWrapper
              title="Tractor Application Chart"
              summary={
                leadingApp && appTotal
                  ? `${
                      leadingApp.name
                    } remains the primary application at ${Math.round(
                      (leadingApp.value / appTotal) * 100
                    )}% of tractor usage, with ${
                      secondApp?.name ?? "other uses"
                    } gaining traction in non-agri markets.`
                  : appError
                  ? appError
                  : "No tractor application distribution data available."
              }
              controls={
                appAvailableMonths.length > 1 && (
                  <select
                    value={appMonth}
                    onChange={(e) => setAppMonth(e.target.value)}
                    className="border border-border bg-background rounded-md px-3 py-1 text-xs sm:text-sm"
                  >
                    {appAvailableMonths.map((m) => (
                      <option key={m} value={m}>
                        {m.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )
              }
            >
              {appError ? (
                <p className="text-sm text-destructive">{appError}</p>
              ) : appLoading ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Loading tractor application data…
                </div>
              ) : appChartData.length ? (
                <BarChart
                  data={appChartData}
                  bars={[
                    {
                      key: "value",
                      name: "Usage",
                      color: "#007AFF",
                      useGradient: true,
                    },
                  ]}
                  height={300}
                  layout="horizontal"
                  showLegend={false}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tractor application distribution data available.
                </p>
              )}
            </ChartWrapper>

            <ChartWrapper
              title="Tractor Horsepower Segment Distribution"
              summary={
                leadingSegment
                  ? `${leadingSegment.name} category leads with ${Math.round(
                      ((leadingSegment.value ?? 0) / (segmentTotal || 1)) * 100
                    )}% market share, driven by mechanisation in small and medium holdings.`
                  : "No tractor segment distribution data available."
              }
            >
              <DonutChart data={segmentData} height={300} showLegend={true} />
            </ChartWrapper>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="w-80 h-6 bg-muted rounded shimmer mb-4"></div>
          <div className="flex justify-between items-start">
            <div>
              <div className="w-64 h-8 bg-muted rounded shimmer mb-2"></div>
              <div className="w-96 h-5 bg-muted rounded shimmer"></div>
            </div>
            <div className="flex gap-4">
              <div className="w-32 h-10 bg-muted rounded shimmer"></div>
              <div className="w-40 h-10 bg-muted rounded shimmer"></div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-96 bg-muted rounded-lg shimmer"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 'use client';

// import { useState, useEffect } from 'react';
// import { ChartWrapper } from '@/components/charts/ChartWrapper';
// import { LineChart } from '@/components/charts/LineChart';
// import { BarChart } from '@/components/charts/BarChart';
// import { DonutChart } from '@/components/charts/DonutChart';
// import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
// import { RegionSelector } from '@/components/ui/RegionSelector';
// import { MonthSelector } from '@/components/ui/MonthSelector';
// import { CompareToggle } from '@/components/ui/CompareToggle';
// import { useAppContext } from '@/components/providers/Providers';
// import { generateSalesData, generateOEMData, generateApplicationData, generateSegmentData, formatNumber } from '@/lib/mockData';

// export default function TractorPage() {
//   const { region, month } = useAppContext();
//   const [mounted, setMounted] = useState(false);
//   const [oemCompare, setOemCompare] = useState<'mom' | 'yoy'>('mom');
//   const [oemCurrentMonth, setOemCurrentMonth] = useState(month);
//   const [appMonth, setAppMonth] = useState(month);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   if (!mounted) {
//     return <PageSkeleton />;
//   }

//   const salesData = generateSalesData('tractor', region);
//   const oemData = generateOEMData('tractor', region, oemCompare);
//   const applicationData = generateApplicationData('tractor', region, appMonth);
//   const segmentData = generateSegmentData('tractor', region);

//   const forecastData = salesData.map(item => ({
//     month: item.month,
//     actual: item.actual,
//     forecast: item.forecast || null,
//   }));

//   const oemChartData = oemData.slice(0, 6).map(oem => ({
//     name: oem.name,
//     current: oem.current,
//     previous: oem.previous,
//   }));

//   const latestSales = salesData[salesData.length - 1];
//   const growthRate = oemData[0]?.changePercent || 0;

//   return (
//     <div className="min-h-screen py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8">
//           <Breadcrumbs
//             items={[
//               { label: 'Flash Reports', href: '/flash-reports' },
//               { label: 'Tractor' }
//             ]}
//             className="mb-4"
//           />

//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//             <div>
//               <h1 className="text-3xl font-bold mb-2">Tractor Market</h1>
//               <p className="text-muted-foreground">
//                 Agricultural and farm equipment tractors market analysis across horsepower segments
//               </p>
//             </div>

//             <div className="flex items-center space-x-4">
//               <RegionSelector />
//               <MonthSelector />
//             </div>
//           </div>
//         </div>

//         {/* Summary */}
//         <div className="mb-8 p-6 bg-card/30 rounded-lg border border-border/50">
//           <h2 className="text-lg font-semibold mb-3">
//             Market Summary - {new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
//           </h2>
//           <div className="grid md:grid-cols-3 gap-4 text-sm">
//             <div>
//               <span className="text-muted-foreground">Total Sales:</span>
//               <span className="ml-2 font-medium">
//                 {formatNumber(latestSales?.actual || 0)} units
//               </span>
//             </div>
//             <div>
//               <span className="text-muted-foreground">Growth Rate:</span>
//               <span className={`ml-2 font-medium ${growthRate >= 0 ? 'text-success' : 'text-destructive'}`}>
//                 {growthRate >= 0 ? '+' : ''}{growthRate}% MoM
//               </span>
//             </div>
//             <div>
//               <span className="text-muted-foreground">Leading OEM:</span>
//               <span className="ml-2 font-medium text-primary">
//                 {oemData[0]?.name}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Charts */}
//         <div className="space-y-8">
//           <ChartWrapper
//             title="Tractor OEM Performance"
//             summary={`${oemData[0]?.name} dominates with ${formatNumber(oemData[0]?.current)} units and ${oemData[0]?.marketShare}% market share, showing ${oemData[0]?.changePercent >= 0 ? '+' : ''}${oemData[0]?.changePercent}% ${oemCompare.toUpperCase()} growth.`}
//             controls={
//               <div className="flex items-center space-x-3">
//                 <CompareToggle value={oemCompare} onChange={setOemCompare} />
//                 <MonthSelector
//                   value={oemCurrentMonth}
//                   onChange={setOemCurrentMonth}
//                   label="Current Month"
//                 />
//               </div>
//             }
//           >
//             <BarChart
//               data={oemChartData}
//               bars={[
//                 { key: 'current', name: 'Current', color: '#007AFF' },
//                 { key: 'previous', name: oemCompare === 'mom' ? 'Previous Month' : 'Previous Year', color: '#6B7280' }
//               ]}
//               height={350}
//               layout="horizontal"
//             />
//           </ChartWrapper>

//           <ChartWrapper
//             title="Tractor Sales Forecast"
//             summary="Monsoon performance and government schemes drive optimistic outlook. Medium horsepower segment expected to lead growth momentum."
//           >
//             <LineChart
//               data={forecastData.slice(-12)}
//               lines={[
//                 { key: 'actual', name: 'Actual Sales', color: '#007AFF', showArea: true },
//                 { key: 'forecast', name: 'Forecast', color: '#2ECC71', strokeDasharray: '5 5' }
//               ]}
//               height={350}
//             />
//           </ChartWrapper>

//           <div className="grid lg:grid-cols-2 gap-8">
//             <ChartWrapper
//               title="Tractor Application Chart"
//               summary={`Agriculture remains primary application at ${applicationData[0]?.share}% with construction and industrial segments gaining traction in non-traditional markets.`}
//               controls={
//                 <MonthSelector
//                   value={appMonth}
//                   onChange={setAppMonth}
//                   label="Application Month"
//                 />
//               }
//             >
//               <BarChart
//                 data={applicationData.map(item => ({ name: item.application, value: item.value }))}
//                 bars={[{ key: 'value', name: 'Usage', color: '#007AFF' }]}
//                 height={300}
//                 layout="horizontal"
//                 showLegend={false}
//               />
//             </ChartWrapper>

//             <ChartWrapper
//               title="Tractor Horsepower Segment Distribution"
//               summary={`${segmentData[0]?.name} category leads with ${Math.round((segmentData[0]?.value / segmentData.reduce((sum, item) => sum + item.value, 0)) * 100)}% market share, driven by medium farm mechanization demand.`}
//             >
//               <DonutChart
//                 data={segmentData}
//                 height={300}
//                 showLegend={true}
//               />
//             </ChartWrapper>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function PageSkeleton() {
//   return (
//     <div className="min-h-screen py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="mb-8">
//           <div className="w-80 h-6 bg-muted rounded shimmer mb-4"></div>
//           <div className="flex justify-between items-start">
//             <div>
//               <div className="w-64 h-8 bg-muted rounded shimmer mb-2"></div>
//               <div className="w-96 h-5 bg-muted rounded shimmer"></div>
//             </div>
//             <div className="flex gap-4">
//               <div className="w-32 h-10 bg-muted rounded shimmer"></div>
//               <div className="w-40 h-10 bg-muted rounded shimmer"></div>
//             </div>
//           </div>
//         </div>

//         <div className="space-y-8">
//           {Array.from({ length: 3 }).map((_, i) => (
//             <div key={i} className="w-full h-96 bg-muted rounded-lg shimmer"></div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
