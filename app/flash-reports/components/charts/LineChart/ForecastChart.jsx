'use client';

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Brush,
  Rectangle,
} from 'recharts';

const monthOrder = [
  'jan', 'feb', 'mar', 'apr', 'aprl', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

// Utility to parse and normalize month string to a sortable key
function parseMonthKey(monthStr) {
  const [monRaw, year] = monthStr.toLowerCase().split(' ');
  const mon = monRaw === 'aprl' ? 'apr' : monRaw.slice(0, 3); // fix 'aprl'
  const monIndex = monthOrder.indexOf(mon);
  return monIndex >= 0 ? `${year}-${String(monIndex + 1).padStart(2, '0')}` : '';
}

const abbreviate = (v) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return v.toString();
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: '#333', color: '#fff', padding: 10, borderRadius: 5 }}>
      <p>{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const ForecastChart = ({ inputData = [] }) => {
  const [windowWidth, setWindowWidth] = useState(0);
  const [data, setData] = useState([]);

  useEffect(() => {
    const updateSize = () => setWindowWidth(window.innerWidth);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sorted = [...inputData].sort((a, b) => {
      const aKey = parseMonthKey(a.month);
      const bKey = parseMonthKey(b.month);
      return aKey.localeCompare(bKey);
    });

    const chartData = sorted.map(item => {
      const normalizedKey = parseMonthKey(item.month);
      const entryDate = new Date(normalizedKey + '-01');
      const label = item.month.replace(/\b\w/g, l => l.toUpperCase()); // Capitalize

      const isCurrent = entryDate.getFullYear() === currentMonth.getFullYear() &&
        entryDate.getMonth() === currentMonth.getMonth();
      const isPast = entryDate < currentMonth;

      return {
        month: label,
        past2W: isPast || isCurrent ? item.value : null,
        future2W: isCurrent || !isPast ? item.value : null,
      };
    });

    setData(chartData);
  }, [inputData]);

  const isMobile = windowWidth <= 640;
  const chartHeight = isMobile ? 280 : 420;

  const color2W = '#ffffff';
  const colorForecast2W = `${color2W}80`;

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: 0 }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
        >
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
            endIndex={data.length - 1}
            height={12}
            stroke="rgba(255,255,255,0.4)"
            fill="rgba(255,255,255,0.08)"
            strokeWidth={1}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 9 }}
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
          <Line
            type="linear"
            dataKey="past2W"
            name="Historical 2W"
            stroke={color2W}
            strokeWidth={1}
            dot={{ r: 2, fill: color2W }}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="future2W"
            name="Forecast 2W"
            stroke={colorForecast2W}
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div style={{
        marginTop: 24,
        display: 'flex',
        justifyContent: 'center',
        gap: 24,
        color: '#fff',
        fontSize: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 3, background: color2W, borderRadius: 2 }} />
          <span>Historical 2W</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24,
            height: 0,
            borderTop: `2px dashed ${colorForecast2W}`,
          }} />
          <span>Forecast 2W</span>
        </div>
      </div>
    </div>
  );
};

export default ForecastChart;
