'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  Rectangle,
} from 'recharts';
import '../styles/chart.css';
import Link from 'next/link';

// Tooltip component
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

// Raw Data
const rawData = [
  { month: 'Jan25', '2W': 1525862, '3W': 107033, PV: 465920, TRAC: 93381, CV: 99425, Total: 2342621 },
  { month: 'Feb25', '2W': 1353280, '3W': 94181, PV: 303398, TRAC: 65574, CV: 82763, Total: 1902196 },
  { month: 'Mar25', '2W': 1508232, '3W': 99376, PV: 350603, TRAC: 74013, CV: 94764, Total: 2125988 },
  { month: 'Apr25', '2W': 1686774, '3W': 99766, PV: 349939, TRAC: 60915, CV: 90558, Total: 2296952 },
  { month: 'May25', '2W': 1756774, '3W': 120000, PV: 800000, TRAC: 100000, CV: 400000, Total: 2000000 },
  { month: 'Jun25', '2W': 1800000, '3W': 95000, PV: 600000, TRAC: 200000, CV: 150000, Total: 1800000 },
  { month: 'Jul25', '2W': 1500000, '3W': 1700000, PV: 900000, TRAC: 350000, CV: 450000, Total: 1500000 },
  { month: 'Aug25', '2W': 1300000, '3W': 2100000, PV: 1000000, TRAC: 400000, CV: 500000, Total: 1300000 },
];

const categories = ['All', '2W', '3W', 'PV', 'TRAC', 'CV', 'Total'];
const colors = {
  '2W': '#ffff',
  '3W': '#ff1f23',
  PV: '#FFCE56',
  TRAC: '#4BC0C0',
  CV: '#9966FF',
  Total: '#FF9F40',
};

const abbreviate = v => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return v.toString();
};

const allowedMonths = ['Jan25', 'Feb25', 'Mar25', 'Apr25', 'May25', 'Jun25', 'Jul25', 'Aug25'];
const isLockedMonth = month => ['Jun25', 'Jul25', 'Aug25'].includes(month);

const CustomLineChart = () => {
  const [selectedCat, setSelectedCat] = useState('All');
  const [chartHeight, setChartHeight] = useState(420);
  const chartWrapperRef = useRef(null);

  // Responsive height
  useEffect(() => {
    const updateHeight = () => {
      const isMobile = window.innerWidth < 768;
      setChartHeight(isMobile ? 280 : 420);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const filteredData = useMemo(() => {
    return rawData
      .filter(d => allowedMonths.includes(d.month))
      .map(d => {
        const newData = { ...d, year: d.month };
        if (isLockedMonth(d.month)) {
          for (let key of ['2W', '3W', 'PV', 'TRAC', 'CV', 'Total']) {
            newData[key] = null;
          }
        }
        return newData;
      });
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: 0 }} ref={chartWrapperRef}>
      {/* Dropdown */}
      <div style={{ marginBottom: 16, textAlign: 'left' }}>
        <select
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          style={{ padding: '4px 8px', fontSize: 14 }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={filteredData}
          margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
          animationDuration={2500}
          animationEasing="ease-out"
        >
          <defs>
            {categories.filter(cat => cat !== 'All').map(cat => (
              <linearGradient id={`${cat}-grad`} x1="0" y1="0" x2="0" y2="1" key={cat}>
                <stop offset="0%" stopColor={colors[cat]} stopOpacity={0.9} />
                <stop offset="100%" stopColor={colors[cat]} stopOpacity={0.3} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            domain={['auto', 'auto']}
            tickFormatter={abbreviate}
            tickCount={5}
            interval="preserveStartEnd"
          />
          <Brush
            dataKey="year"
            startIndex={0}
            endIndex={filteredData.length - 1}
            height={12}
            stroke="rgba(255,255,255,0.4)"
            fill="rgba(255,255,255,0.08)"
            strokeWidth={1}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 9 }}
            tickMargin={4}
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

          {(selectedCat === 'All' ? ['2W', '3W', 'PV', 'TRAC', 'CV', 'Total'] : [selectedCat]).map(key => (
            <Line
              key={key}
              type="linear"
              dataKey={key}
              name={key}
              stroke={`url(#${key}-grad)`}
              strokeWidth={3}
              dot={{ r: 3 }}
              connectNulls
              animationBegin={0}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Blurred visual overlay (non-clickable) */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: '58%',
          width: '41%',
          height: 'calc(100% - 145px)',
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
          top: 60,
          left: '58%',
          width: '41%',
          height: 'calc(100% - 145px)',
          zIndex: 2,
          pointerEvents: 'auto',
        }}
      >
        <span style={{ display: 'block', width: '100%', height: '100%' }} />
      </Link>
    </div>
  );
};

export default CustomLineChart;
