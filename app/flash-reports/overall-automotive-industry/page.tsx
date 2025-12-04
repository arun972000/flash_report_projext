// app/flash-reports/overall/page.tsx
import {
  getOverallChartData,
  getOverallText,
  getMarketBarRawData,
} from '@/lib/flashReportsServer';
import { OverallAutomotiveIndustryClient } from './OverallAutomotiveIndustryClient';

export const dynamic = 'force-dynamic';

export default async function OverallAutomotiveIndustryPage() {
  const [overallData, overAllText, altFuelRaw] = await Promise.all([
    getOverallChartData(),
    getOverallText(),
    getMarketBarRawData('alternative fuel'),
  ]);

  return (
    <OverallAutomotiveIndustryClient
      initialOverallData={overallData}
      overAllText={overAllText}
      altFuelRaw={altFuelRaw}
    />
  );
}




// 'use client';

// import { useState, useEffect } from 'react';
// import { ChartWrapper } from '@/components/charts/ChartWrapper';
// import { LineChart } from '@/components/charts/LineChart'; // unified version above
// import { BarChart } from '@/components/charts/BarChart';
// import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
// import { RegionSelector } from '@/components/ui/RegionSelector';
// import { MonthSelector } from '@/components/ui/MonthSelector';
// import { useAppContext } from '@/components/providers/Providers';
// import { generateAlternativeFuelData } from '@/lib/mockData'; // keep mock alt-fuel for now

// // ----- helpers / types -----

// const monthsList = [
//   'jan', 'feb', 'mar', 'apr', 'may', 'jun',
//   'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
// ];

// type OverallChartPoint = {
//   month: string; // "YYYY-MM"
//   data: {
//     [key: string]: number; // 2W, 3W, PV, TRAC, Truck, Bus, CV, Total
//   };
// };

// // Map backend keys -> chart category keys
// function mapBackendKeyToCategory(normalizedKey: string): string | null {
//   if (normalizedKey === 'two wheeler' || normalizedKey === '2-wheeler' || normalizedKey === 'two-wheeler') {
//     return '2W';
//   }
//   if (normalizedKey === 'three wheeler' || normalizedKey === '3-wheeler' || normalizedKey === 'three-wheeler') {
//     return '3W';
//   }
//   if (
//     normalizedKey === 'passenger' ||
//     normalizedKey === 'passenger vehicle' ||
//     normalizedKey === 'pv'
//   ) {
//     return 'PV';
//   }
//   if (normalizedKey === 'tractor' || normalizedKey === 'trac') {
//     return 'TRAC';
//   }
//   if (normalizedKey === 'cv' || normalizedKey === 'commercial vehicle') {
//     return 'CV';
//   }
//   if (normalizedKey === 'truck') {
//     return 'Truck';
//   }
//   if (normalizedKey === 'bus') {
//     return 'Bus';
//   }
//   return null;
// }

// // Equivalent to old transformOverallChartData, but shaped for new LineChart
// async function fetchOverallChartData(): Promise<OverallChartPoint[]> {
//   const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
//   if (!baseUrl) {
//     throw new Error('NEXT_PUBLIC_BACKEND_URL is not set');
//   }

//   // NOTE: replace this with your real auth handling
//   const token = 'your-very-strong-random-string-here';

//   const [hierarchyRes, volumeRes] = await Promise.all([
//     fetch(`${baseUrl}api/contentHierarchy`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//     }),
//     fetch(`${baseUrl}api/volumeData`, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//     }),
//   ]);

//   if (!hierarchyRes.ok || !volumeRes.ok) {
//     throw new Error('Failed to fetch content hierarchy or volume data');
//   }

//   const hierarchyData = await hierarchyRes.json();
//   const volumeData = await volumeRes.json();

//   // MAIN ROOT > flash-reports > overall
//   const mainRoot = hierarchyData.find(
//     (n: any) => n.name.toLowerCase() === 'main root'
//   );
//   if (!mainRoot) return [];

//   const flashReports = hierarchyData.find(
//     (n: any) =>
//       n.name.toLowerCase() === 'flash-reports' && n.parent_id === mainRoot.id
//   );
//   if (!flashReports) return [];

//   const overall = hierarchyData.find(
//     (n: any) =>
//       n.name.toLowerCase() === 'overall' && n.parent_id === flashReports.id
//   );
//   if (!overall) return [];

//   // Year nodes under "overall"
//   const yearNodes = hierarchyData.filter(
//     (n: any) => n.parent_id === overall.id
//   );

//   // 10 target months: from 3 months before to 6 months after previous month
//   const now = new Date();
//   const currentMonthRef = new Date(now.getFullYear(), now.getMonth() - 1);

//   const targetMonthsSet = new Set<string>();
//   for (let offset = -3; offset <= 6; offset++) {
//     const d = new Date(
//       currentMonthRef.getFullYear(),
//       currentMonthRef.getMonth() + offset
//     );
//     const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
//       2,
//       '0'
//     )}`;
//     targetMonthsSet.add(key);
//   }

//   const result: OverallChartPoint[] = [];

//   for (const yearNode of yearNodes) {
//     const year = yearNode.name;
//     const monthNodes = hierarchyData.filter(
//       (n: any) => n.parent_id === yearNode.id
//     );

//     for (const monthNode of monthNodes) {
//       const monthIndex = monthsList.indexOf(
//         monthNode.name.toLowerCase()
//       );
//       if (monthIndex === -1) continue;

//       const formattedMonth = `${year}-${String(monthIndex + 1).padStart(
//         2,
//         '0'
//       )}`;
//       if (!targetMonthsSet.has(formattedMonth)) continue;

//       const streamPath = [
//         mainRoot.id,
//         flashReports.id,
//         overall.id,
//         yearNode.id,
//         monthNode.id,
//       ].join(',');

//       const matchedEntry = volumeData.find(
//         (v: any) => v.stream === streamPath
//       );
//       if (!matchedEntry || !matchedEntry.data) continue;

//       const data: Record<string, number> = {};

//       for (const [key, value] of Object.entries(matchedEntry.data)) {
//         const normalizedKey = key.toLowerCase().trim();
//         const catKey = mapBackendKeyToCategory(normalizedKey);
//         if (!catKey) continue;
//         data[catKey] = Number(value);
//       }

//       const catKeys = ['2W', '3W', 'PV', 'TRAC', 'Truck', 'Bus', 'CV'];
//       const total = catKeys.reduce(
//         (sum, k) => sum + (data[k] || 0),
//         0
//       );
//       data['Total'] = total;

//       result.push({
//         month: formattedMonth,
//         data,
//       });
//     }
//   }

//   result.sort(
//     (a, b) =>
//       new Date(`${a.month}-01`).getTime() -
//       new Date(`${b.month}-01`).getTime()
//   );

//   return result;
// }

// // ----- page component -----

// export default function OverallAutomotiveIndustryPage() {
//   const { region, month } = useAppContext();
//   const [mounted, setMounted] = useState(false);

//   const [overallData, setOverallData] = useState<OverallChartPoint[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     let cancelled = false;

//     async function load() {
//       try {
//         setLoading(true);
//         const data = await fetchOverallChartData();
//         if (!cancelled) {
//           setOverallData(data);
//           setError(null);
//         }
//       } catch (err) {
//         console.error(err);
//         if (!cancelled) {
//           setError('Failed to load overall chart data');
//         }
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     }

//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   if (!mounted || loading) {
//     return <PageSkeleton />;
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen py-8">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <p className="text-destructive">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   // Simple derived summary from backend data
//   const latestPoint = overallData[overallData.length - 1];
//   const latestTotal = latestPoint?.data?.Total ?? 0;
//   const previousTotal =
//     overallData.length > 1
//       ? overallData[overallData.length - 2].data?.Total ?? 0
//       : 0;

//   let momGrowthLabel = '–';
//   if (latestTotal && previousTotal) {
//     const growth = ((latestTotal / previousTotal) - 1) * 100;
//     momGrowthLabel = `${growth.toFixed(1)}%`;
//   }

//   // Keep alt-fuel chart mock for now (we'll wire later)
//   const altFuelData = generateAlternativeFuelData(region);
//   const comparisonData = altFuelData.map((item) => ({
//     fuel: item.fuel,
//     current: item.current,
//     previous: item.previous,
//   }));

//   const pageMonth = new Date(`${month}-01`).toLocaleDateString(
//     'en-US',
//     { month: 'long', year: 'numeric' }
//   );

//   return (
//     <div className="min-h-screen py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8">
//           <Breadcrumbs
//             items={[
//               { label: 'Flash Reports', href: '/flash-reports' },
//               { label: 'Overall Automotive Industry' },
//             ]}
//             className="mb-4"
//           />

//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//             <div>
//               <h1 className="text-3xl font-bold mb-2">
//                 Overall Automotive Industry
//               </h1>
//               <p className="text-muted-foreground">
//                 Comprehensive market analysis across all vehicle categories and segments
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
//             Market Summary - {pageMonth}
//           </h2>
//           <div className="grid md:grid-cols-3 gap-4 text-sm">
//             <div>
//               <span className="text-muted-foreground">Total Market Size:</span>
//               <span className="ml-2 font-medium">
//                 {latestTotal.toLocaleString()} units
//               </span>
//             </div>
//             <div>
//               <span className="text-muted-foreground">Growth Rate:</span>
//               <span
//                 className={`ml-2 font-medium ${
//                   momGrowthLabel.startsWith('-')
//                     ? 'text-destructive'
//                     : 'text-success'
//                 }`}
//               >
//                 {momGrowthLabel} MoM
//               </span>
//             </div>
//             <div>
//               {/* Placeholder until we derive from backend */}
//               <span className="text-muted-foreground">EV Penetration:</span>
//               <span className="ml-2 font-medium text-primary">4.2%</span>
//             </div>
//           </div>
//         </div>

//         {/* Charts */}
//         <div className="space-y-8">
//           <ChartWrapper
//             title="Sales & Forecast"
//             summary="Forecast indicates trajectory based on historical volumes and computed projections."
//           >
//             <LineChart overallData={overallData} category="Total" height={350} />
//           </ChartWrapper>

//           <ChartWrapper
//             title="Alternative Fuel Adoption - Previous vs Current Month"
//             summary="(Mock) Alternative fuel adoption view. We'll wire this to backend later."
//           >
//             <BarChart
//               data={comparisonData}
//               bars={[
//                 { key: 'previous', name: 'Previous Month', color: '#6B7280' },
//                 { key: 'current', name: 'Current Month', color: '#007AFF' },
//               ]}
//               height={350}
//               layout="vertical"
//             />
//           </ChartWrapper>
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
//           <div className="w-64 h-6 bg-muted rounded shimmer mb-4"></div>
//           <div className="flex justify-between items-start">
//             <div>
//               <div className="w-96 h-8 bg-muted rounded shimmer mb-2"></div>
//               <div className="w-80 h-5 bg-muted rounded shimmer"></div>
//             </div>
//             <div className="flex gap-4">
//               <div className="w-32 h-10 bg-muted rounded shimmer"></div>
//               <div className="w-40 h-10 bg-muted rounded shimmer"></div>
//             </div>
//           </div>
//         </div>

//         <div className="space-y-8">
//           <div className="w-full h-96 bg-muted rounded-lg shimmer"></div>
//           <div className="w-full h-96 bg-muted rounded-lg shimmer"></div>
//         </div>
//       </div>
//     </div>
//   );
// }



// 'use client';

// import { useState, useEffect } from 'react';
// import { ChartWrapper } from '@/components/charts/ChartWrapper';
// import { LineChart } from '@/components/charts/LineChart';
// import { BarChart } from '@/components/charts/BarChart';
// import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
// import { RegionSelector } from '@/components/ui/RegionSelector';
// import { MonthSelector } from '@/components/ui/MonthSelector';
// import { useAppContext } from '@/components/providers/Providers';
// import { generateSalesData, generateAlternativeFuelData } from '@/lib/mockData';

// export default function OverallAutomotiveIndustryPage() {
//   const { region, month } = useAppContext();
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   if (!mounted) {
//     return <PageSkeleton />;
//   }

//   const salesData = generateSalesData('overall', region);
//   const altFuelData = generateAlternativeFuelData(region);

//   const forecastData = salesData.map(item => ({
//     month: item.month,
//     actual: item.actual,
//     forecast: item.forecast || null,
//   }));

//   const comparisonData = altFuelData.map(item => ({
//     fuel: item.fuel,
//     current: item.current,
//     previous: item.previous,
//   }));

//   return (
//     <div className="min-h-screen py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8">
//           <Breadcrumbs
//             items={[
//               { label: 'Flash Reports', href: '/flash-reports' },
//               { label: 'Overall Automotive Industry' }
//             ]}
//             className="mb-4"
//           />
          
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
//             <div>
//               <h1 className="text-3xl font-bold mb-2">Overall Automotive Industry</h1>
//               <p className="text-muted-foreground">
//                 Comprehensive market analysis across all vehicle categories and segments
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
//               <span className="text-muted-foreground">Total Market Size:</span>
//               <span className="ml-2 font-medium">
//                 {salesData[salesData.length - 1]?.actual.toLocaleString()} units
//               </span>
//             </div>
//             <div>
//               <span className="text-muted-foreground">Growth Rate:</span>
//               <span className="ml-2 font-medium text-success">+3.2% MoM</span>
//             </div>
//             <div>
//               <span className="text-muted-foreground">EV Penetration:</span>
//               <span className="ml-2 font-medium text-primary">4.2%</span>
//             </div>
//           </div>
//         </div>

//         {/* Charts */}
//         <div className="space-y-8">
//           <ChartWrapper
//             title="Sales & Forecast"
//             summary="Forecast indicates steady growth trajectory with +3.2% MoM increase. Strong momentum expected through Q4 2025."
//           >
//             <LineChart
//               data={forecastData}
//               lines={[
//                 { key: 'actual', name: 'Actual Sales', color: '#007AFF' },
//                 { key: 'forecast', name: 'Forecast', color: '#2ECC71', strokeDasharray: '5 5' }
//               ]}
//               height={350}
//             />
//           </ChartWrapper>

//           <ChartWrapper
//             title="Alternative Fuel Adoption - Previous vs Current Month"
//             summary="EV share +0.8pp vs last month, leading alternative fuel adoption. CNG maintains steady market presence."
//           >
//             <BarChart
//               data={comparisonData}
//               bars={[
//                 { key: 'previous', name: 'Previous Month', color: '#6B7280' },
//                 { key: 'current', name: 'Current Month', color: '#007AFF' }
//               ]}
//               height={350}
//               layout="vertical"
//             />
//           </ChartWrapper>
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
//           <div className="w-64 h-6 bg-muted rounded shimmer mb-4"></div>
//           <div className="flex justify-between items-start">
//             <div>
//               <div className="w-96 h-8 bg-muted rounded shimmer mb-2"></div>
//               <div className="w-80 h-5 bg-muted rounded shimmer"></div>
//             </div>
//             <div className="flex gap-4">
//               <div className="w-32 h-10 bg-muted rounded shimmer"></div>
//               <div className="w-40 h-10 bg-muted rounded shimmer"></div>
//             </div>
//           </div>
//         </div>
        
//         <div className="space-y-8">
//           <div className="w-full h-96 bg-muted rounded-lg shimmer"></div>
//           <div className="w-full h-96 bg-muted rounded-lg shimmer"></div>
//         </div>
//       </div>
//     </div>
//   );
// }