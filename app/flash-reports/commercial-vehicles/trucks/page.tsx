'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RegionSelector } from '@/components/ui/RegionSelector';
import { MonthSelector } from '@/components/ui/MonthSelector';
import { CompareToggle } from '@/components/ui/CompareToggle';
import { useAppContext } from '@/components/providers/Providers';
import { formatNumber } from '@/lib/mockData';
import TipperTable from '@/components/charts/TipperTable';
import TractorTrailerForecast from '@/components/charts/TractorTrailorTable';

const MONTHS_SHORT = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

type MarketBackendRow = {
  name: string;
  [key: string]: string | number;
};

type CompareRow = {
  name: string;
  current: number;
  previous: number;
  symbol: '' | '▲' | '▼';
  deltaPct: number | null;
};

type CvSegmentRow = {
  month: string;
  lcv: number;
  mcv: number;
  hcv: number;
};

// Helper: "YYYY-MM" → "jan" etc.
function getShortMonthFromYyyyMm(yyyymm: string): string {
  const parts = yyyymm.split('-');
  if (parts.length !== 2) {
    const now = new Date();
    return MONTHS_SHORT[now.getMonth()];
  }
  const idx = parseInt(parts[1], 10) - 1;
  return MONTHS_SHORT[idx] ?? MONTHS_SHORT[0];
}

// Helper to pick Truck series from overallData, robust to casing + nesting
function pickSeries(row: any, keys: string[]): number {
  if (!row) return 0;

  const source = row.data && typeof row.data === 'object' ? row.data : row;
  const lowerMap: Record<string, number> = {};

  for (const [k, v] of Object.entries(source)) {
    if (typeof v === 'number') {
      lowerMap[k.toLowerCase()] = v;
    }
  }

  for (const key of keys) {
    const val = lowerMap[key.toLowerCase()];
    if (typeof val === 'number') return val;
  }

  return 0;
}

export default function TrucksPage() {
  const { region, month } = useAppContext();
  const [mounted, setMounted] = useState(false);

  // ---- OEM chart (truck market share) ----
  const [oemCompare, setOemCompare] = useState<'mom' | 'yoy'>('mom');
  const [oemCurrentMonth, setOemCurrentMonth] = useState(month);
  const [oemRaw, setOemRaw] = useState<MarketBackendRow[]>([]);
  const [oemLoading, setOemLoading] = useState(false);
  const [oemError, setOemError] = useState<string | null>(null);

  // ---- Overall timeseries (for Truck forecast) ----
  const [overallData, setOverallData] = useState<any[]>([]);
  const [overallLoading, setOverallLoading] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);

  // ---- Segment split donut (LCV/MCV/HCV for trucks) ----
  const [segmentRows, setSegmentRows] = useState<CvSegmentRow[]>([]);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [segmentError, setSegmentError] = useState<string | null>(null);

  // ---- Application chart (backend via /api/fetchAppData) ----
  const [appRaw, setAppRaw] = useState<any[]>([]);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [appMonth, setAppMonth] = useState(''); // e.g. 'jan 2025'

  useEffect(() => {
    setMounted(true);
  }, []);

  // ---------- FETCH OEM DATA (truck, market share) ----------
  useEffect(() => {
    let cancelled = false;

    async function loadOemData() {
      try {
        setOemLoading(true);
        setOemError(null);

        const effectiveMonth = oemCurrentMonth || month;
        const shortMonth = getShortMonthFromYyyyMm(effectiveMonth);
        const segmentName = 'truck';

        const res = await fetch(
          `/api/fetchMarketData?segmentName=${encodeURIComponent(
            segmentName
          )}&selectedMonth=${shortMonth}&mode=${oemCompare}&segmentType=market share`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch truck OEM data: ${res.status}`);
        }

        const json = (await res.json()) as MarketBackendRow[];
        if (!cancelled) {
          setOemRaw(json || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setOemError('Failed to load truck OEM market share data');
          setOemRaw([]);
        }
      } finally {
        if (!cancelled) {
          setOemLoading(false);
        }
      }
    }

    loadOemData();
    return () => {
      cancelled = true;
    };
  }, [oemCompare, oemCurrentMonth, month]);

  // ---------- PROCESS OEM DATA ----------
  const oemComputed = useMemo(() => {
    if (!oemRaw.length) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;

    const shortMonth = getShortMonthFromYyyyMm(oemCurrentMonth || month);
    const monthIndex = MONTHS_SHORT.indexOf(shortMonth);
    const prevMonthShort = monthIndex > 0 ? MONTHS_SHORT[monthIndex - 1] : 'dec';

    const currKey = `${shortMonth} ${currentYear}`;
    const prevKey =
      oemCompare === 'mom'
        ? `${prevMonthShort} ${currentYear}`
        : `${shortMonth} ${lastYear}`;

    const rows: CompareRow[] = oemRaw
      .map((item) => {
        const prev = parseFloat(String(item[prevKey] ?? '0')) || 0;
        const curr = parseFloat(String(item[currKey] ?? '0')) || 0;
        let symbol: '' | '▲' | '▼' = '';
        if (curr > prev) symbol = '▲';
        else if (curr < prev) symbol = '▼';

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

    // move "Others" to bottom
    const othersIndex = rows.findIndex(
      (r) => r.name.toLowerCase().trim() === 'others'
    );
    if (othersIndex !== -1) {
      const [others] = rows.splice(othersIndex, 1);
      others.name = 'Others';
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
  }, [oemRaw, oemCurrentMonth, oemCompare, month]);

  const oemSummary = useMemo(() => {
    if (!oemComputed || !oemComputed.chartData.length) {
      return 'No truck OEM market share data available for the selected period.';
    }
    const top = oemComputed.chartData[0];
    const delta = top.deltaPct ?? 0;
    const compareLabel =
      oemCompare === 'mom' ? 'month-on-month' : 'year-on-year';

    return `${top.name} leads the truck segment with ${top.current.toFixed(
      1
    )}% market share, showing ${
      Number.isNaN(delta)
        ? 'no'
        : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
    } ${compareLabel} change versus ${
      oemCompare === 'mom' ? 'previous month' : 'same month last year'
    }.`;
  }, [oemComputed, oemCompare]);

  const renderOemTooltip = (props: any) => {
    const { active, payload } = props;
    if (!active || !payload || !payload.length || !oemComputed) return null;

    const row = payload[0].payload as CompareRow;
    const delta = row.deltaPct ?? 0;
    const symbol = row.symbol || (delta > 0 ? '▲' : delta < 0 ? '▼' : '•');

    const colorClass =
      delta > 0
        ? 'text-emerald-400'
        : delta < 0
        ? 'text-rose-400'
        : 'text-muted-foreground';

    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-xl">
        <p className="text-sm font-semibold mb-2">{row.name}</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="font-medium">
              {oemComputed.prevKey.toUpperCase()}:
            </span>
            <span className="font-semibold">{row.previous.toFixed(1)}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="font-medium">
              {oemComputed.currKey.toUpperCase()}:
            </span>
            <span className="font-semibold">{row.current.toFixed(1)}%</span>
          </div>
          <div className={`flex items-baseline gap-2 ${colorClass}`}>
            <span className="font-bold">{symbol}</span>
            <span className="font-medium">Change:</span>
            <span className="font-semibold">
              {delta == null || Number.isNaN(delta)
                ? '–'
                : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ---------- FETCH OVERALL TIMESERIES (for Truck forecast) ----------
  useEffect(() => {
    let cancelled = false;

    async function loadOverall() {
      try {
        setOverallLoading(true);
        setOverallError(null);

        const res = await fetch('/api/flash-reports/overall-chart-data', {
          cache: 'no-store',
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
          setOverallError('Failed to load truck volume timeseries data');
          setOverallData([]);
        }
      } finally {
        if (!cancelled) {
          setOverallLoading(false);
        }
      }
    }

    loadOverall();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- FETCH SEGMENT SPLIT (LCV/MCV/HCV for trucks) ----------
  useEffect(() => {
    let cancelled = false;

    async function loadSegments() {
      try {
        setSegmentLoading(true);
        setSegmentError(null);

        const res = await fetch(
          `/api/fetchCVSegmentSplit?segmentName=${encodeURIComponent('truck')}`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch truck segment split: ${res.status}`);
        }

        const json = (await res.json()) as CvSegmentRow[];
        if (!cancelled) {
          setSegmentRows(json || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setSegmentError('Failed to load truck segment split data');
          setSegmentRows([]);
        }
      } finally {
        if (!cancelled) {
          setSegmentLoading(false);
        }
      }
    }

    loadSegments();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Segment donut data ----------
  const segmentDonutData = useMemo(() => {
    if (!segmentRows.length) return [];

    const latest = segmentRows[segmentRows.length - 1];

    const segments = [
      { name: 'LCV', key: 'lcv', color: '#0EA5E9' },
      { name: 'MCV', key: 'mcv', color: '#22C55E' },
      { name: 'HCV + Others', key: 'hcv', color: '#F97316' },
    ];

    const arr = segments
      .map(({ name, key, color }) => ({
        name,
        value: Number((latest as any)[key] ?? 0) || 0,
        color,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return arr;
  }, [segmentRows]);

  const segmentTotal = segmentDonutData.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const leadingSegment = segmentDonutData[0];

  // ---------- FETCH APPLICATION DATA (backend) ----------
  useEffect(() => {
    let cancelled = false;

    async function loadAppData() {
      try {
        setAppLoading(true);
        setAppError(null);

        const res = await fetch(
          `/api/fetchAppData?segmentName=${encodeURIComponent(
            'truck'
          )}&segmentType=app`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch truck application data: ${res.status}`);
        }

        const json = await res.json();
        if (!cancelled) {
          setAppRaw(json || []);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setAppError('Failed to load truck application data');
          setAppRaw([]);
        }
      } finally {
        if (!cancelled) {
          setAppLoading(false);
        }
      }
    }

    loadAppData();
    return () => {
      cancelled = true;
    };
  }, []);

  const appAvailableMonths = useMemo(() => {
    if (!appRaw.length) return [] as string[];

    const first = appRaw[0] || {};
    return Object.keys(first)
      .filter((key) => key !== 'name')
      .sort((a, b) => {
        const [ma, ya] = a.split(' ');
        const [mb, yb] = b.split(' ');

        const ia = MONTHS_SHORT.indexOf(ma.toLowerCase());
        const ib = MONTHS_SHORT.indexOf(mb.toLowerCase());

        const da = new Date(Number(ya), ia === -1 ? 0 : ia, 1);
        const db = new Date(Number(yb), ib === -1 ? 0 : ib, 1);

        return da.getTime() - db.getTime();
      });
  }, [appRaw]);

  // default application month (previous month if present, else latest)
  useEffect(() => {
    if (!appAvailableMonths.length) return;

    setAppMonth((prev) => {
      if (prev) return prev;

      const today = new Date();
      let idx = today.getMonth() - 1; // previous month
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

  // ---------- Summary metrics ----------
  const latestPoint =
    overallData.length > 0 ? overallData[overallData.length - 1] : null;
  const prevPoint =
    overallData.length > 1 ? overallData[overallData.length - 2] : null;

  const latestTruck = pickSeries(latestPoint, ['Truck', 'truck']);
  const prevTruck = pickSeries(prevPoint, ['Truck', 'truck']);
  const growthRate =
    prevTruck > 0 ? Math.round(((latestTruck - prevTruck) / prevTruck) * 100) : 0;

  const pageMonthLabel = new Date(`${month}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (!mounted) {
    return <PageSkeleton />;
  }

  const oemChartData = oemComputed?.chartData.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Flash Reports', href: '/flash-reports' },
              {
                label: 'Commercial Vehicles',
                href: '/flash-reports/commercial-vehicles',
              },
              { label: 'Trucks' },
            ]}
            className="mb-4"
          />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Trucks Market</h1>
              <p className="text-muted-foreground">
                Light, medium, and heavy commercial truck market analysis
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
              <span className="text-muted-foreground">Total Truck Sales:</span>
              <span className="ml-2 font-medium">
                {formatNumber(latestTruck || 0)} units
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Truck Growth Rate:</span>
              <span
                className={`ml-2 font-medium ${
                  growthRate >= 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                {growthRate >= 0 ? '+' : ''}
                {growthRate}% MoM
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Leading Segment:</span>
              <span className="ml-2 font-medium text-primary">
                {leadingSegment?.name ?? '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-8">
          {/* 1) OEM Performance – backend market share */}
          <ChartWrapper
            title="Truck OEM Performance"
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
                Loading truck OEM market share…
              </div>
            ) : oemChartData.length ? (
              <BarChart
                data={oemChartData}
                bars={[
                  { key: 'current', name: 'Current Period', color: '#007AFF' },
                  {
                    key: 'previous',
                    name:
                      oemCompare === 'mom' ? 'Previous Month' : 'Previous Year',
                    color: '#6B7280',
                  },
                ]}
                height={350}
                layout="horizontal"
                tooltipRenderer={renderOemTooltip}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No truck OEM market share data available for the selected
                period.
              </p>
            )}
          </ChartWrapper>

          {/* 2) Segment split (backend) + 3) Forecast (backend) */}
          <div className="grid lg:grid-cols-2 gap-8">
            <ChartWrapper
              title="Trucks Segment Contribution"
              summary={
                leadingSegment
                  ? `${leadingSegment.name} accounts for ${Math.round(
                      ((leadingSegment.value ?? 0) / (segmentTotal || 1)) * 100
                    )}% of truck sales, with other segments supporting freight and construction demand.`
                  : segmentError
                  ? segmentError
                  : 'No truck segment distribution data available.'
              }
            >
              {segmentError ? (
                <p className="text-sm text-destructive">{segmentError}</p>
              ) : segmentLoading ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Loading truck segment split…
                </div>
              ) : segmentDonutData.length ? (
                <DonutChart
                  data={segmentDonutData}
                  height={300}
                  showLegend={true}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No truck segment distribution data available.
                </p>
              )}
            </ChartWrapper>

            <ChartWrapper
              title="Trucks Sales Forecast"
              summary={
                overallError
                  ? overallError
                  : 'Forecast based on recent truck volume trends across light, medium, and heavy segments.'
              }
            >
              {overallLoading ? (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Loading truck timeseries…
                </div>
              ) : (
                <LineChart overallData={overallData} category="Truck" height={300} />
              )}
            </ChartWrapper>
          </div>

          {/* 4) Application Chart (backend) */}
          <ChartWrapper
            title="Trucks Application Chart"
            summary={
              leadingApp && appTotal
                ? `${leadingApp.name} dominates at ${Math.round(
                    (leadingApp.value / appTotal) * 100
                  )}% share, with other applications supporting logistics and construction growth.`
                : appError
                ? appError
                : 'No application distribution data available.'
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
                Loading truck application data…
              </div>
            ) : appChartData.length ? (
              <BarChart
                data={appChartData}
                bars={[{ key: 'value', name: 'Applications', color: '#007AFF' }]}
                height={300}
                layout="horizontal"
                showLegend={false}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No application distribution data available.
              </p>
            )}
          </ChartWrapper>

          {/* 5) Tipper & Tractor Trailer (passcode-gated line charts) */}
          <div className="mt-8 space-y-8">
            <TipperTable />
            <TractorTrailerForecast />
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
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full h-96 bg-muted rounded-lg shimmer"></div>
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
// import { generateSalesData, generateOEMData, generateSegmentData, generateApplicationData, generateTipperTractorData } from '@/lib/mockData';

// export default function TrucksPage() {
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

//   const salesData = generateSalesData('trucks', region);
//   const oemData = generateOEMData('trucks', region, oemCompare);
//   const segmentData = generateSegmentData('trucks', region);
//   const applicationData = generateApplicationData('trucks', region, appMonth);
//   const tipperTractorData = generateTipperTractorData(region);

//   const forecastData = salesData.map(item => ({
//     month: item.month,
//     actual: item.actual,
//     forecast: item.forecast || null,
//   }));

//   const oemChartData = oemData.slice(0, 6).map(oem => ({
//     name: oem.name,
//     current: oem.current,
//     previous: oem.previous,
//     change: oem.changePercent,
//   }));

//   const appChartData = applicationData;

//   return (
//     <div className="min-h-screen py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8">
//           <Breadcrumbs
//             items={[
//               { label: 'Flash Reports', href: '/flash-reports' },
//               { label: 'Commercial Vehicles', href: '/flash-reports/commercial-vehicles' },
//               { label: 'Trucks' }
//             ]}
//             className="mb-4"
//           />
          
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//             <div>
//               <h1 className="text-3xl font-bold mb-2">Trucks Market</h1>
//               <p className="text-muted-foreground">
//                 Light, medium, and heavy commercial truck market analysis
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
//                 {salesData[salesData.length - 1]?.actual.toLocaleString()} units
//               </span>
//             </div>
//             <div>
//               <span className="text-muted-foreground">Growth Rate:</span>
//               <span className="ml-2 font-medium text-success">+15.2% MoM</span>
//             </div>
//             <div>
//               <span className="text-muted-foreground">Leading Segment:</span>
//               <span className="ml-2 font-medium text-primary">
//                 {segmentData[0]?.name}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Charts */}
//         <div className="space-y-8">
//           <ChartWrapper
//             title="Truck OEM Performance"
//             summary={`${oemData[0]?.name} leads truck segment with ${oemData[0]?.current.toLocaleString()} units and ${oemData[0]?.changePercent}% ${oemCompare.toUpperCase()} growth.`}
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

//           <div className="grid lg:grid-cols-2 gap-8">
//             <ChartWrapper
//               title="Trucks Segment Contribution"
//               summary={`${segmentData[0]?.name} accounts for ${Math.round((segmentData[0]?.value / segmentData.reduce((sum, item) => sum + item.value, 0)) * 100)}% of truck sales.`}
//             >
//               <DonutChart
//                 data={segmentData}
//                 height={300}
//                 showLegend={true}
//               />
//             </ChartWrapper>

//             <ChartWrapper
//               title="Trucks Sales Forecast"
//               summary="Infrastructure development and logistics growth drive strong forecast with sustained momentum expected."
//             >
//               <LineChart
//                 data={forecastData.slice(-8)}
//                 lines={[
//                   { key: 'actual', name: 'Actual Sales', color: '#007AFF' },
//                   { key: 'forecast', name: 'Forecast', color: '#2ECC71', strokeDasharray: '5 5' }
//                 ]}
//                 height={300}
//                 showLegend={false}
//               />
//             </ChartWrapper>
//           </div>

//           <ChartWrapper
//             title="Trucks Application Chart"
//             summary={`Construction sector dominates at ${Math.round((appChartData[0]?.value / appChartData.reduce((sum, item) => sum + item.value, 0)) * 100)}% with logistics showing rapid growth.`}
//             controls={
//               <MonthSelector 
//                 value={appMonth} 
//                 onChange={setAppMonth}
//                 label="Application Month"
//               />
//             }
//           >
//             <BarChart
//               data={appChartData.map(item => ({ name: item.application, value: item.value }))}
//               bars={[{ key: 'value', name: 'Applications', color: '#007AFF' }]}
//               height={300}
//               layout="horizontal"
//               showLegend={false}
//             />
//           </ChartWrapper>

//          <ChartWrapper
//               title="Tipper Sales Performance"
//               summary="Tipper segment performance driven by construction and mining demand over recent months."
//             >
//               <LineChart
//                 data={tipperTractorData}
//                 lines={[
//                   { key: 'tipper', name: 'Tipper Sales', color: '#FFC043' },
//                 ]}
//                 height={300}
//                 showLegend={true}
//               />
//             </ChartWrapper>

//             <ChartWrapper
//               title="Tractor Trailer Sales Performance"
//               summary="Tractor trailer sales trend supported by long-haul logistics and freight movement."
//             >
//               <LineChart
//                 data={tipperTractorData}
//                 lines={[
//                   { key: 'tractorTrailer', name: 'Tractor Trailer Sales', color: '#8B5CF6' },
//                 ]}
//                 height={300}
//                 showLegend={true}
//               />
//             </ChartWrapper>
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
//           {Array.from({ length: 6 }).map((_, i) => (
//             <div key={i} className="w-full h-96 bg-muted rounded-lg shimmer"></div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }