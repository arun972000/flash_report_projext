'use client';

import { useState, useEffect } from 'react';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RegionSelector } from '@/components/ui/RegionSelector';
import { MonthSelector } from '@/components/ui/MonthSelector';
import { CompareToggle } from '@/components/ui/CompareToggle';
import { useAppContext } from '@/components/providers/Providers';
import {
  generateSalesData,
  generateOEMData,
  generateEVData,
  generateApplicationData,
  generateSegmentData,
  formatNumber
} from '@/lib/mockData';

export default function ConstructionEquipmentPage() {
  const { region, month } = useAppContext();
  const [mounted, setMounted] = useState(false);
  const [oemCompare, setOemCompare] = useState<'mom' | 'yoy'>('mom');
  const [oemCurrentMonth, setOemCurrentMonth] = useState(month);
  const [evCompare, setEvCompare] = useState<'mom' | 'yoy'>('mom');
  const [evCurrentMonth, setEvCurrentMonth] = useState(month);
  const [appMonth, setAppMonth] = useState(month);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <PageSkeleton />;
  }

  // NOTE: Keeping the key 'two-wheeler' here so existing mockData continues to work.
  // If you add separate construction-equipment data, you can swap the key later.
  const salesData = generateSalesData('two-wheeler', region);
  const oemData = generateOEMData('two-wheeler', region, oemCompare);
  const evData = generateEVData(region, 'two-wheeler');
  const applicationData = generateApplicationData('two-wheeler', region, appMonth);
  const segmentData = generateSegmentData('two-wheeler', region);

  const forecastData = salesData.map(item => ({
    month: item.month,
    actual: item.actual,
    forecast: item.forecast || null,
  }));

  const oemChartData = oemData.slice(0, 6).map(oem => ({
    name: oem.name,
    current: oem.current,
    previous: oem.previous,
  }));

  // EV / Alt-fuel Share comparison - current vs previous
  const currentEV = evData[evData.length - 1];
  const previousEV = evData[evData.length - 2];

  const evShareData = [
    {
      name: 'Electric Share',
      current: currentEV?.evShare || 0,
      previous: previousEV?.evShare || 0,
    },
    {
      name: 'CNG Share',
      current: currentEV?.cngShare || 0,
      previous: previousEV?.cngShare || 0,
    },
    {
      name: 'Hybrid Share',
      current: currentEV?.hybridShare || 0,
      previous: previousEV?.hybridShare || 0,
    }
  ];

  const latestSales = salesData[salesData.length - 1];
  const growthRate = oemData[0]?.changePercent || 0;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Flash Reports', href: '/flash-reports' },
              { label: 'Construction Equipment' }
            ]}
            className="mb-4"
          />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Construction Equipment Market</h1>
              <p className="text-muted-foreground">
                Excavators, loaders, cranes, road machinery, and other construction equipment market analysis.
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
            Market Summary - {new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Equipment Sales:</span>
              <span className="ml-2 font-medium">
                {formatNumber(latestSales?.actual || 0)} units
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Growth Rate:</span>
              <span className={`ml-2 font-medium ${growthRate >= 0 ? 'text-success' : 'text-destructive'}`}>
                {growthRate >= 0 ? '+' : ''}{growthRate}% MoM
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Electric / Alt-fuel Adoption:</span>
              <span className="ml-2 font-medium text-primary">
                {currentEV?.evShare}%
              </span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-8">
          <ChartWrapper
            title="Construction Equipment OEM Performance"
            summary={`${oemData[0]?.name} leads with ${formatNumber(oemData[0]?.current)} units, showing ${oemData[0]?.changePercent >= 0 ? '+' : ''}${oemData[0]?.changePercent}% ${oemCompare.toUpperCase()} growth in construction equipment sales.`}
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
            <BarChart
              data={oemChartData}
              bars={[
                { key: 'current', name: 'Current', color: '#007AFF' },
                { key: 'previous', name: oemCompare === 'mom' ? 'Previous Month' : 'Previous Year', color: '#6B7280' }
              ]}
              height={350}
              layout="horizontal"
            />
          </ChartWrapper>

          <ChartWrapper
            title="Construction Equipment Electric / Alt-fuel Share Comparison"
            summary={`Electric and alternative-fuel equipment share increased to ${currentEV?.evShare}% from ${previousEV?.evShare}%, showing ${((currentEV?.evShare - previousEV?.evShare) || 0).toFixed(1)}pp growth in low-emission equipment penetration.`}
            controls={
              <div className="flex items-center space-x-3">
                <CompareToggle value={evCompare} onChange={setEvCompare} />
                <MonthSelector
                  value={evCurrentMonth}
                  onChange={setEvCurrentMonth}
                  label="Current Month"
                />
              </div>
            }
          >
            <BarChart
              data={evShareData}
              bars={[
                { key: 'current', name: 'Current Month', color: '#2ECC71' },
                { key: 'previous', name: 'Previous Month', color: '#6B7280' }
              ]}
              height={300}
              layout="vertical"
            />
          </ChartWrapper>

          <ChartWrapper
            title="Construction Equipment Sales Forecast"
            summary="Steady growth driven by infrastructure, mining, and real estate projects. The forecast points to sustained demand across key construction clusters and rental fleets."
          >
            <LineChart
              data={forecastData.slice(-12)}
              lines={[
                { key: 'actual', name: 'Actual Sales', color: '#007AFF', showArea: true },
                { key: 'forecast', name: 'Forecast', color: '#2ECC71', strokeDasharray: '5 5' }
              ]}
              height={350}
            />
          </ChartWrapper>

          <div className="grid lg:grid-cols-2 gap-8">
            <ChartWrapper
              title="Construction Equipment Application Mix"
              summary={`Earthmoving and road construction applications dominate with ${applicationData[0]?.share}% share, while rental and infrastructure projects show strong momentum.`}
              controls={
                <MonthSelector
                  value={appMonth}
                  onChange={setAppMonth}
                  label="Application Month"
                />
              }
            >
              <BarChart
                data={applicationData.map(item => ({ name: item.application, value: item.value }))}
                bars={[{ key: 'value', name: 'Usage', color: '#007AFF' }]}
                height={300}
                layout="horizontal"
                showLegend={false}
              />
            </ChartWrapper>

            <ChartWrapper
              title="Construction Equipment Segment Distribution"
              summary={`${segmentData[0]?.name} leads with ${Math.round(
                (segmentData[0]?.value /
                  segmentData.reduce((sum, item) => sum + item.value, 0)) * 100
              )}% market share, with compact and rental-focused equipment gaining traction in urban projects.`}
            >
              <DonutChart
                data={segmentData}
                height={300}
                showLegend={true}
              />
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
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-full h-96 bg-muted rounded-lg shimmer"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
