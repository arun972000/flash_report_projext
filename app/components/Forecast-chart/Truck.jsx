'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
  Brush,
  Rectangle,
} from 'recharts';
import '../styles/chart.css'
import Link from 'next/link';

// Forecast lock logic
const isLockedMonth = (month) => ['Jun25', 'Jul25', 'Aug25'].includes(month);

// Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const isLocked = isLockedMonth(label) || label === 'May25';

  return (
    <div style={{ background: '#333', color: '#fff', padding: 10, borderRadius: 5 }}>
      <p>{label}</p>
      {isLocked ? (
        <p style={{ color: '#ccc', fontStyle: 'italic' }}>🔒 Subscribe to view details</p>
      ) : (
        payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toLocaleString()}
          </p>
        ))
      )}
    </div>
  );
};

// Data
const rawData = [
  { month: 'Jan25', '2W': 1525862 },
  { month: 'Feb25', '2W': 1353280 },
  { month: 'Mar25', '2W': 1508232 },
  { month: 'Apr25', '2W': 1686774 },
  { month: 'May25', '2W': 1756774 },
  { month: 'Jun25', '2W': 1800000 },
  { month: 'Jul25', '2W': 1500000 },
  { month: 'Aug25', '2W': 1300000 }
];

const allowedMonths = ['Jan25', 'Feb25', 'Mar25', 'Apr25', 'May25', 'Jun25', 'Jul25', 'Aug25'];

const abbreviate = (v) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return v.toString();
};

const TruckForecast = () => {
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const updateSize = () => setWindowWidth(window.innerWidth);
    updateSize(); // initial
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const isMobile = windowWidth <= 640;
  const chartHeight = isMobile ? 280 : 420;

  const filteredData = useMemo(
    () =>
      rawData
        .filter(d => allowedMonths.includes(d.month))
        .map(d => ({
          ...d,
          '2W': isLockedMonth(d.month) ? null : d['2W'],
        })),
    []
  );

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: 0 }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={filteredData}
          margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          animationDuration={2500}
          animationEasing="ease-out"
        >
          <defs>
            <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffff" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#ffff" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#FFC107', fontSize: 12 }}
            domain={['auto', 'auto']}
            tickFormatter={abbreviate}
            tickCount={5}
            interval="preserveStartEnd"
          />
          <Brush
            dataKey="month"
            startIndex={0}
            endIndex={filteredData.length - 1}
            height={12}
            stroke="rgba(255,255,255,0.4)"
            fill="rgba(255,255,255,0.08)"
            strokeWidth={1}
            tick={{
              fill: 'rgba(255,255,255,0.6)',
              fontSize: 9,
              fontFamily: 'inherit',
            }}
            tickMargin={4}
            tickFormatter={(d) => d}
            traveller={
              <Rectangle
                width={6}
                height={16}
                radius={3}
                fill="rgba(255,255,255,0.6)"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1}
                cursor="ew-resize"
              />
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ marginTop: 24 }} />
          <Line
            dataKey="2W"
            name="2W"
            stroke="url(#histGrad)"
            strokeWidth={3}
            connectNulls
            animationBegin={0}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Forecast overlay */}
      <div
        style={{
          position: 'absolute',
         top: 20,
          left: '58%',
          width: '41%',
          height: 'calc(100% - 100px)',
          background: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          borderLeft: '2px dashed rgba(255,255,255,0.3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 8px',
          textAlign: 'center',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <p className="shining-white" style={{ pointerEvents: 'none' }}>
          🔒 Subscribe to the Platinum Package to access forecast values.
        </p>
      </div>

      {/* Transparent clickable link overlay */}
      <Link
        href="/subscription"
        style={{
          position: 'absolute',
          top: 20,
          left: '58%',
          width: '41%',
          height: 'calc(100% - 100px)',
          zIndex: 2,
          pointerEvents: 'auto',
        }}
      >
        <span style={{ display: 'block', width: '100%', height: '100%' }} />
      </Link>
    </div>
  );
};

export default TruckForecast;
