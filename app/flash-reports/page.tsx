"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Car,
  Truck,
  Tractor,
  Bus,
  ChartBar as BarChart3,
} from "lucide-react";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { ChartWrapper } from "@/components/charts/ChartWrapper";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { RegionSelector } from "@/components/ui/RegionSelector";
import { MonthSelector } from "@/components/ui/MonthSelector";
import { VehicleCategoryCard } from "@/components/ui/VehicleCategoryCard";
import { useAppContext } from "@/components/providers/Providers";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    id: "overall-automotive-industry",
    title: "Overall Automotive Industry",
    description: "Comprehensive market analysis across all vehicle categories",
    icon: BarChart3,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  {
    id: "two-wheeler",
    title: "Two Wheeler",
    description: "Motorcycles, scooters, and electric two-wheelers",
    icon: Car,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
  },
  {
    id: "three-wheeler",
    title: "Three Wheeler",
    description: "Auto-rickshaws, goods carriers, and passenger vehicles",
    icon: Car,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
  {
    id: "commercial-vehicles",
    title: "Commercial Vehicles",
    description: "Trucks, buses, and commercial transportation",
    icon: Truck,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    subCategories: ["trucks", "buses"],
  },
  {
    id: "passenger-vehicles",
    title: "Passenger Vehicles",
    description: "Cars, SUVs, and personal transportation",
    icon: Car,
    color: "text-red-400",
    bgColor: "bg-red-400/10",
  },
  {
    id: "tractor",
    title: "Tractor",
    description: "Agricultural and industrial tractors",
    icon: Tractor,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
  },
  {
    id: "construction-equipment",
    title: "Construction Equipment",
    description:
      "Heavy-duty machines used for excavation, grading, and movement on construction sites",
    icon: Truck, // placeholder, or your Construction icon
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
  },
];

// The shape returned by /api/flash-reports/overall-chart-data
type OverallApiPoint = {
  month: string; // "YYYY-MM"
  data: {
    [key: string]: number;
  };
};

// Flattened shape we’ll actually use in the dashboard
type OverallRow = {
  month: string; // "YYYY-MM"
  Total: number;
  "2W": number;
  "3W": number;
  PV: number;
  TRAC: number;
  Truck: number;
  Bus: number;
  CV: number;
  // if backend ever adds new keys, we can still index them
  [key: string]: string | number;
};

// Map category → key from OverallRow.data
const CATEGORY_SERIES_KEYS: Record<string, string> = {
  "overall-automotive-industry": "Total",
  "two-wheeler": "2W",
  "three-wheeler": "3W",
  "commercial-vehicles": "CV",
  "passenger-vehicles": "PV",
  tractor: "TRAC",
  // 'construction-equipment': 'CE', // when you have it
};

type TopOem = {
  name: string;
  current: number; // share %
  changePercent: number; // MoM change of share (approx)
};

type TileMetrics = {
  salesVolume: number;
  momGrowth: number;
  yoyGrowth: number;
  marketShare: number;
  topOEM: string;
  evPenetration?: number;
  currentMonthSales: number;
  previousMonthSales: number;
  trendData: number[];
  rank: number;
  targetProgress: number;
};

// helper: safe numeric getter
function getValue(row: OverallRow | null | undefined, key: string): number {
  if (!row) return 0;
  const raw = row[key];
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

// helper: "2025-07" -> "jul"
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
function getShortMonthFromYyyyMm(yyyymm: string): string {
  const [year, mm] = yyyymm.split("-");
  if (!year || !mm) {
    const now = new Date();
    return MONTHS_SHORT[now.getMonth()];
  }
  const idx = parseInt(mm, 10) - 1;
  return MONTHS_SHORT[idx] ?? MONTHS_SHORT[0];
}

// CONFIG: what segmentName your OEM market share backend expects for overall
// Adjust this to match your existing PieChart usage, e.g. "overall" or "overall industry"
const OVERALL_OEM_SEGMENT_NAME = "overall";

export default function FlashReportsPage() {
  const { region, month } = useAppContext();
  const [mounted, setMounted] = useState(false);

  const [overallData, setOverallData] = useState<OverallRow[]>([]);
  const [overallLoading, setOverallLoading] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);

  const [topOEMs, setTopOEMs] = useState<TopOem[]>([]);
  const [topOemError, setTopOemError] = useState<string | null>(null);
  const [topOemLoading, setTopOemLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        const apiData = (await res.json()) as OverallApiPoint[];

        if (cancelled) return;

        // flatten: { month, Total, 2W, 3W, PV, TRAC, Truck, Bus, CV }
        const flattened: OverallRow[] = apiData.map((pt) => ({
          month: pt.month,
          Total: pt.data["Total"] ?? 0,
          "2W": pt.data["2W"] ?? 0,
          "3W": pt.data["3W"] ?? 0,
          PV: pt.data["PV"] ?? 0,
          TRAC: pt.data["TRAC"] ?? 0,
          Truck: pt.data["Truck"] ?? 0,
          Bus: pt.data["Bus"] ?? 0,
          CV: pt.data["CV"] ?? 0,
        }));

        // sort by month
        flattened.sort((a, b) => a.month.localeCompare(b.month));
        setOverallData(flattened);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setOverallError(
            "Failed to load overall industry volumes from backend."
          );
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

  // Fetch overall OEM market share for "Top OEM Performance" widget
  useEffect(() => {
    let cancelled = false;

    async function loadTopOems() {
      try {
        setTopOemLoading(true);
        setTopOemError(null);

        const shortMonth = getShortMonthFromYyyyMm(month);
        const res = await fetch(
          `/api/fetchMarketData?segmentName=${encodeURIComponent(
            OVERALL_OEM_SEGMENT_NAME
          )}&selectedMonth=${shortMonth}&mode=mom&segmentType=market share`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch overall OEM data: ${res.status}`);
        }

        const json = (await res.json()) as any[];
        if (!cancelled && Array.isArray(json)) {
          const y = month.split("-")[0]; // current year
          const monthIdx = MONTHS_SHORT.indexOf(shortMonth);
          const prevShort = monthIdx > 0 ? MONTHS_SHORT[monthIdx - 1] : "dec";
          const currKey = `${shortMonth} ${y}`;
          const prevKey = `${prevShort} ${y}`;

          const processed: TopOem[] = json
            .map((row) => {
              const current = Number(row[currKey] ?? 0) || 0;
              const prev = Number(row[prevKey] ?? 0) || 0;
              const changePercent =
                prev > 0 ? ((current - prev) / prev) * 100 : 0;
              return {
                name: row.name as string,
                current,
                changePercent,
              };
            })
            .sort((a, b) => b.current - a.current);

          setTopOEMs(processed.slice(0, 6));
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setTopOemError(
            "Failed to load overall OEM market share from backend."
          );
          setTopOEMs([]);
        }
      } finally {
        if (!cancelled) setTopOemLoading(false);
      }
    }

    loadTopOems();
    return () => {
      cancelled = true;
    };
  }, [month]);

  // Derived: selected month row, previous row, last 6 months, etc.
  const {
    selectedRow,
    prevRow,
    lastYearRow,
    recentTotalSeries,
    overallGrowthRate,
  } = useMemo(() => {
    if (!overallData.length) {
      return {
        selectedRow: null,
        prevRow: null,
        lastYearRow: null,
        recentTotalSeries: [] as { month: string; actual: number }[],
        overallGrowthRate: 0,
      };
    }

    const sorted = overallData;

    // 1) Find the row matching the selected month; fallback to latest data
    let selectedIndex = sorted.findIndex((r) => r.month === month);
    if (selectedIndex === -1) {
      selectedIndex = sorted.length - 1;
    }

    const selected = sorted[selectedIndex];

    // Parse "YYYY-MM"
    const [selYearStr, selMonthStr] = selected.month.split("-");
    const selYear = Number(selYearStr);
    const selMonth = Number(selMonthStr); // 1..12

    // 2) Previous calendar month key
    const prevDate = new Date(selYear, selMonth - 2); // JS months 0..11
    const prevKey = `${prevDate.getFullYear()}-${String(
      prevDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const prevRow = sorted.find((r) => r.month === prevKey) ?? null;

    // 3) Same month last year key
    const lastYearKey = `${selYear - 1}-${selMonthStr}`;
    const lastYearRow = sorted.find((r) => r.month === lastYearKey) ?? null;

    // 4) History window: last 6 months ending at selectedIndex
    const windowEndIndex = selectedIndex;
    const windowStartIndex = Math.max(0, windowEndIndex - 5);

    // 5) Series for chart: from windowStartIndex → end of dataset
    const recent = sorted.slice(windowStartIndex).map((row) => ({
      month: row.month,
      actual: getValue(row, "Total"),
    }));

    const currTotal = getValue(selected, "Total");
    const prevTotal = getValue(prevRow, "Total");
    const overallGrowthRate =
      prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal) * 100 : 0;

    return {
      selectedRow: selected,
      prevRow,
      lastYearRow,
      recentTotalSeries: recent,
      overallGrowthRate,
    };
  }, [overallData, month]);

  console.log("recentTotalSeries", recentTotalSeries);

  // Build category tiles from overallData
  const categoryMetricsMap: Record<string, TileMetrics> = useMemo(() => {
    if (!overallData.length || !selectedRow) return {};

    const sorted = overallData;
    const selectedIndex = sorted.indexOf(selectedRow);
    const prev = prevRow;
    const lastYear = lastYearRow;
    const totalCurrent = getValue(selectedRow, "Total");

    const base: Record<string, TileMetrics> = {};

    for (const category of CATEGORIES) {
      const key = CATEGORY_SERIES_KEYS[category.id];
      if (!key) {
        // No real data yet (e.g. construction-equipment)
        base[category.id] = {
          salesVolume: 0,
          momGrowth: 0,
          yoyGrowth: 0,
          marketShare: 0,
          topOEM: "Coming soon",
          evPenetration: undefined,
          currentMonthSales: 0,
          previousMonthSales: 0,
          trendData: [],
          rank: CATEGORIES.length,
          targetProgress: 0,
        };
        continue;
      }

      const current = getValue(selectedRow, key);
      const prevVal = prevRow ? getValue(prevRow, key) : null;
      const lastYearVal = lastYearRow ? getValue(lastYearRow, key) : null;

      // Only compute if we have a positive base; else treat as "not available"
      const momGrowth =
        prevVal !== null && prevVal > 0
          ? ((current - prevVal) / prevVal) * 100
          : Number.NaN;

      const yoyGrowth =
        lastYearVal !== null && lastYearVal > 0
          ? ((current - lastYearVal) / lastYearVal) * 100
          : Number.NaN;

      const marketShare =
        key === "total" || totalCurrent === 0
          ? 100
          : (current / totalCurrent) * 100;

      const trendSlice = sorted.slice(
        Math.max(0, selectedIndex - 5),
        selectedIndex + 1
      );
      const trendData = trendSlice.map((row) => getValue(row, key));

      // EV penetration: only meaningful for some categories; for now, hard-code known ones or fill later
      const evPenetrationLookup: Record<string, number | undefined> = {
        "two-wheeler": undefined,
        "three-wheeler": undefined,
        "passenger-vehicles": undefined, // you can plug real PV EV share later
        "commercial-vehicles": undefined,
        tractor: undefined,
      };

      base[category.id] = {
        salesVolume: current,
        momGrowth,
        yoyGrowth,
        marketShare,
        topOEM: "See OEM breakdown", // optional: wire actual top OEM per segment later via fetchMarketData
        evPenetration: evPenetrationLookup[category.id],
        currentMonthSales: current,
        previousMonthSales: prevVal,
        trendData,
        rank: 0, // fill below
        targetProgress: Math.max(60, Math.min(95, marketShare + momGrowth / 2)), // synthetic, purely visual
      };
    }

    // rank categories by MoM growth (excluding overall + CE if you prefer)
    const rankableIds = Object.keys(base).filter(
      (id) => id !== "overall-automotive-industry"
    );
    rankableIds.sort((a, b) => {
      const ma = base[a].momGrowth;
      const mb = base[b].momGrowth;
      const va = Number.isNaN(ma) ? -Infinity : ma;
      const vb = Number.isNaN(mb) ? -Infinity : mb;
      return vb - va;
    });
    rankableIds.forEach((id, idx) => {
      base[id].rank = idx + 1;
    });
    // overall tile gets rank 1 by definition (or you can keep it out of ranking)
    if (base["overall-automotive-industry"]) {
      base["overall-automotive-industry"].rank = 1;
    }

    return base;
  }, [overallData, selectedRow, prevRow, lastYearRow]);

  if (!mounted) {
    return <FlashReportsPageSkeleton />;
  }

  const selectedMonthLabel = new Date(`${month}-01`).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const topOemName = topOEMs[0]?.name;
  const topOemDelta = topOEMs[0]?.changePercent ?? 0;

  return (
    <div className="min-h-screen py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs
            items={[{ label: "Flash Reports", href: "/flash-reports" }]}
            className="mb-4"
          />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Flash Reports Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monthly automotive market insights with backend-driven analytics
                across all vehicle categories
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <RegionSelector />
              <MonthSelector />
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="mb-12">
          {/* <h2 className="text-xl font-semibold mb-6">
            Market Summary – {selectedMonthLabel}
          </h2> */}

          <div className="grid lg:grid-cols-1 gap-8">
            <div className="lg:col-span-2">
              <ChartWrapper
                title="Cross-Category Sales Performance"
                summary={
                  overallError
                    ? overallError
                    : `Overall automotive market ${
                        overallGrowthRate >= 0 ? "expanded" : "contracted"
                      } by ${
                        overallGrowthRate >= 0 ? "+" : ""
                      }${overallGrowthRate.toFixed(
                        1
                      )}% month-on-month based on total industry volumes.`
                }
              >
                {overallLoading ? (
                  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                    Loading industry volumes…
                  </div>
                ) : recentTotalSeries.length ? (
                  <LineChart
                    overallData={recentTotalSeries.map((row) => ({
                      month: row.month,
                      Total: row.actual,
                    }))}
                    category="Total"
                    height={300}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                    No overall volume data available.
                  </div>
                )}
              </ChartWrapper>
            </div>

            <div>
              {/* <ChartWrapper
                title="Top OEM Performance"
                summary={
                  topOemError
                    ? topOemError
                    : topOemName
                    ? `${topOemName} leads the overall market by share, with ${
                        topOemDelta >= 0 ? "+" : ""
                      }${topOemDelta.toFixed(
                        1
                      )}% change in share vs previous month.`
                    : "OEM market share data will appear here when available."
                }
              >
                {topOemLoading ? (
                  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                    Loading OEM shares…
                  </div>
                ) : topOEMs.length ? (
                  <BarChart
                    data={topOEMs.map((oem) => ({
                      name: oem.name.split(" ")[0],
                      value: oem.current,
                    }))}
                    bars={[
                      {
                        key: "value",
                        name: "Market Share (%)",
                        color: "#007AFF",
                      },
                    ]}
                    height={300}
                    layout="horizontal"
                    showLegend={false}
                  />
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                    No OEM share data available for the selected period.
                  </div>
                )}
              </ChartWrapper> */}
            </div>
          </div>
        </div>

        {/* Category Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Vehicle Categories</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {CATEGORIES.map((category, index) => {
              const metrics = categoryMetricsMap[category.id];
              if (!metrics) return null;

              return (
                <VehicleCategoryCard
                  key={category.id}
                  id={category.id}
                  title={category.title}
                  description={category.description}
                  icon={category.icon}
                  color={category.color}
                  bgColor={category.bgColor}
                  subCategories={category.subCategories}
                  metrics={metrics}
                  index={index}
                />
              );
            })}
          </div>
        </div>

        {/* Highlights – for now partly static, can be wired to real EV/backend later */}
        <div className="bg-card/30 rounded-xl p-8">
          <h2 className="text-xl font-semibold mb-6">Key Highlights</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3 animate-fade-in">
              <TrendingUp className="w-5 h-5 text-success mt-0.5" />
              <div>
                <p className="font-medium mb-1">Overall Growth</p>
                <p className="text-sm text-muted-foreground">
                  {overallGrowthRate >= 0 ? "Expansion" : "Contraction"} of{" "}
                  {overallGrowthRate >= 0 ? "+" : ""}
                  {overallGrowthRate.toFixed(1)}% in total automotive sales vs
                  the previous month.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 animate-fade-in delay-100">
              <Car className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium mb-1">EV Adoption</p>
                <p className="text-sm text-muted-foreground">
                  EV & hybrid metrics can be wired from your PV EV backend
                  (passenger vehicle EV share) once you expose an aggregate
                  endpoint. For now this can stay as a static narrative or be
                  driven from the PV page.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 animate-fade-in delay-200">
              <BarChart3 className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium mb-1">Market Leader</p>
                <p className="text-sm text-muted-foreground">
                  {topOemName
                    ? `${topOemName} currently leads in overall market share, with ${
                        topOemDelta >= 0 ? "+" : ""
                      }${topOemDelta.toFixed(1)}% change vs previous month.`
                    : "OEM leadership will show here once overall share data is available."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlashReportsPageSkeleton() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="w-48 h-6 bg-muted rounded shimmer mb-4" />
          <div className="flex justify-between items-start">
            <div>
              <div className="w-80 h-8 bg-muted rounded shimmer mb-2" />
              <div className="w-96 h-5 bg-muted rounded shimmer" />
            </div>
            <div className="flex gap-4">
              <div className="w-32 h-10 bg-muted rounded shimmer" />
              <div className="w-40 h-10 bg-muted rounded shimmer" />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-[520px] bg-muted rounded-lg shimmer"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 'use client';

// import { useState, useEffect } from 'react';
// import Link from 'next/link';
// import { TrendingUp, Car, Truck, Tractor, Bus, ChartBar as BarChart3, ChevronRight,Construction } from 'lucide-react';
// import { LineChart } from '@/components/charts/LineChart';
// import { BarChart } from '@/components/charts/BarChart';
// import { ChartWrapper } from '@/components/charts/ChartWrapper';
// import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
// import { RegionSelector } from '@/components/ui/RegionSelector';
// import { MonthSelector } from '@/components/ui/MonthSelector';
// import { VehicleCategoryCard } from '@/components/ui/VehicleCategoryCard';
// import { useAppContext } from '@/components/providers/Providers';
// import { generateSalesData, generateOEMData, generateSegmentData } from '@/lib/mockData';

// const CATEGORIES = [
//   {
//     id: 'overall-automotive-industry',
//     title: 'Overall Automotive Industry',
//     description: 'Comprehensive market analysis across all vehicle categories',
//     icon: BarChart3,
//     color: 'text-blue-400',
//     bgColor: 'bg-blue-400/10',
//   },
//   {
//     id: 'two-wheeler',
//     title: 'Two Wheeler',
//     description: 'Motorcycles, scooters, and electric two-wheelers',
//     icon: Car,
//     color: 'text-green-400',
//     bgColor: 'bg-green-400/10',
//   },
//   {
//     id: 'three-wheeler',
//     title: 'Three Wheeler',
//     description: 'Auto-rickshaws, goods carriers, and passenger vehicles',
//     icon: Car,
//     color: 'text-purple-400',
//     bgColor: 'bg-purple-400/10',
//   },
//   {
//     id: 'commercial-vehicles',
//     title: 'Commercial Vehicles',
//     description: 'Trucks, buses, and commercial transportation',
//     icon: Truck,
//     color: 'text-amber-400',
//     bgColor: 'bg-amber-400/10',
//     subCategories: ['trucks', 'buses']
//   },
//   {
//     id: 'passenger-vehicles',
//     title: 'Passenger Vehicles',
//     description: 'Cars, SUVs, and personal transportation',
//     icon: Car,
//     color: 'text-red-400',
//     bgColor: 'bg-red-400/10',
//   },
//   {
//     id: 'tractor',
//     title: 'Tractor',
//     description: 'Agricultural and industrial tractors',
//     icon: Tractor,
//     color: 'text-orange-400',
//     bgColor: 'bg-orange-400/10',
//   },
//    {
//     id: 'construction-equipment',
//     title: 'construction-equipment',
//     description: 'heavy-duty machines used for excavation, grading, and moving on construction site',
//     icon: Construction,
//     color: 'text-teal-400',
//     bgColor: 'bg-teal-400/10',
//   },
// ];

// export default function FlashReportsPage() {
//   const { region, month } = useAppContext();
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   if (!mounted) {
//     return <FlashReportsPageSkeleton />;
//   }

//   const overallSales = generateSalesData('overall', region);
//   const topOEMs = generateOEMData('overall', region).slice(0, 6);
//   const segments = generateSegmentData('overall', region);

//   const recentSales = overallSales.slice(-6);

//   const getCategoryMetrics = (categoryId: string, rank: number) => {
//     const salesData = generateSalesData(categoryId, region);
//     const oemData = generateOEMData(categoryId, region);
//     const currentMonth = salesData[salesData.length - 1];
//     const previousMonth = salesData[salesData.length - 2];
//     const lastYearMonth = salesData[salesData.length - 13] || salesData[0];

//     const momGrowth = ((currentMonth.actual - previousMonth.actual) / previousMonth.actual) * 100;
//     const yoyGrowth = ((currentMonth.actual - lastYearMonth.actual) / lastYearMonth.actual) * 100;
//     const trendData = salesData.slice(-6).map(d => d.actual);
//     const targetProgress = Math.min(95, 75 + Math.random() * 20);

//     const evPenetrationMap: Record<string, number> = {
//       'two-wheeler': 2.8,
//       'three-wheeler': 11.5,
//       'commercial-vehicles': 1.2,
//       'passenger-vehicles': 4.2,
//       'tractor': 0.3
//     };

//     return {
//       salesVolume: currentMonth.actual,
//       momGrowth,
//       yoyGrowth,
//       marketShare: 15 + Math.random() * 15,
//       topOEM: oemData[0]?.name || 'N/A',
//       evPenetration: evPenetrationMap[categoryId],
//       currentMonthSales: currentMonth.actual,
//       previousMonthSales: previousMonth.actual,
//       trendData,
//       rank,
//       targetProgress
//     };
//   };

//   return (
//     <div className="min-h-screen py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8">
//           <Breadcrumbs
//             items={[
//               { label: 'Flash Reports', href: '/flash-reports' }
//             ]}
//             className="mb-4"
//           />

//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//             <div>
//               <h1 className="text-3xl font-bold mb-2">Flash Reports Dashboard</h1>
//               <p className="text-muted-foreground">
//                 Monthly automotive market insights with AI-powered analytics across all vehicle categories
//               </p>
//             </div>

//             <div className="flex items-center space-x-4">
//               <RegionSelector />
//               <MonthSelector />
//             </div>
//           </div>
//         </div>

//         {/* Summary Section */}
//         <div className="mb-12">
//           <h2 className="text-xl font-semibold mb-6">Market Summary - {new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>

//           <div className="grid lg:grid-cols-3 gap-8">
//             <div className="lg:col-span-2">
//               <ChartWrapper
//                 title="Cross-Category Sales Performance"
//                 summary="Overall automotive market showing positive momentum with 3.2% growth month-over-month across all categories."
//               >
//                 <LineChart
//                   data={recentSales}
//                   lines={[
//                     { key: 'actual', name: 'Actual Sales', color: '#007AFF' },
//                     { key: 'forecast', name: 'Forecast', color: '#2ECC71', strokeDasharray: '5 5' }
//                   ]}
//                   height={300}
//                 />
//               </ChartWrapper>
//             </div>

//             <div>
//               <ChartWrapper
//                 title="Top OEM Performance"
//                 summary={`${topOEMs[0]?.name} maintains market leadership with ${topOEMs[0]?.changePercent}% growth.`}
//               >
//                 <BarChart
//                   data={topOEMs.map(oem => ({ name: oem.name.split(' ')[0], value: oem.current }))}
//                   bars={[{ key: 'value', name: 'Sales', color: '#007AFF' }]}
//                   height={300}
//                   layout="horizontal"
//                   showLegend={false}
//                 />
//               </ChartWrapper>
//             </div>
//           </div>
//         </div>

//         {/* Category Grid */}
//         <div className="mb-12">
//           <h2 className="text-xl font-semibold mb-6">Vehicle Categories</h2>

//           <div className="grid md:grid-cols-2 gap-6">
//             {CATEGORIES.map((category, index) => (
//               <VehicleCategoryCard
//                 key={category.id}
//                 id={category.id}
//                 title={category.title}
//                 description={category.description}
//                 icon={category.icon}
//                 color={category.color}
//                 bgColor={category.bgColor}
//                 subCategories={category.subCategories}
//                 metrics={getCategoryMetrics(category.id, index + 1)}
//                 index={index}
//               />
//             ))}
//           </div>
//         </div>

//         {/* Recent Highlights */}
//         <div className="bg-card/30 rounded-xl p-8">
//           <h2 className="text-xl font-semibold mb-6">Key Highlights</h2>

//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <div className="flex items-start space-x-3 animate-fade-in">
//               <TrendingUp className="w-5 h-5 text-success mt-0.5" />
//               <div>
//                 <p className="font-medium mb-1">Overall Growth</p>
//                 <p className="text-sm text-muted-foreground">
//                   3.2% increase in total automotive sales compared to previous month
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-start space-x-3 animate-fade-in delay-100">
//               <Car className="w-5 h-5 text-primary mt-0.5" />
//               <div>
//                 <p className="font-medium mb-1">EV Adoption</p>
//                 <p className="text-sm text-muted-foreground">
//                   Electric vehicle market share reached 4.2%, up 0.8pp from last month
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-start space-x-3 animate-fade-in delay-200">
//               <BarChart3 className="w-5 h-5 text-warning mt-0.5" />
//               <div>
//                 <p className="font-medium mb-1">Market Leader</p>
//                 <p className="text-sm text-muted-foreground">
//                   {topOEMs[0]?.name} continues to dominate with {topOEMs[0]?.changePercent}% growth
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function FlashReportsPageSkeleton() {
//   return (
//     <div className="min-h-screen py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="mb-8">
//           <div className="w-48 h-6 bg-muted rounded shimmer mb-4"></div>
//           <div className="flex justify-between items-start">
//             <div>
//               <div className="w-80 h-8 bg-muted rounded shimmer mb-2"></div>
//               <div className="w-96 h-5 bg-muted rounded shimmer"></div>
//             </div>
//             <div className="flex gap-4">
//               <div className="w-32 h-10 bg-muted rounded shimmer"></div>
//               <div className="w-40 h-10 bg-muted rounded shimmer"></div>
//             </div>
//           </div>
//         </div>

//         <div className="grid md:grid-cols-2 gap-6">
//           {Array.from({ length: 6 }).map((_, i) => (
//             <div key={i} className="w-full h-[520px] bg-muted rounded-lg shimmer"></div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
