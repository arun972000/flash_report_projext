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
import '../styles/chart.css';

const monthMap = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

function formatMonth(input) {
  const [year, month] = input.split('-');
  return `${monthMap[month]}${year.slice(2)}`;
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

const TruckForecast = () => {
  const [windowWidth, setWindowWidth] = useState(0);
  const [data, setData] = useState([]);

  useEffect(() => {
    const updateSize = () => setWindowWidth(window.innerWidth);
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    fetch('/api/overall')
      .then(res => res.json())
      .then(apiData => {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const chartData = apiData.map(item => {
          const entryDate = new Date(item.month);
          const label = formatMonth(item.month);
          const isCurrent = entryDate.getFullYear() === currentMonth.getFullYear() &&
            entryDate.getMonth() === currentMonth.getMonth();
          const isPast = entryDate < currentMonth;

          const val = item['truck'] || 0;

          return {
            month: label,
            pastTruck: isPast || isCurrent ? val : null,
            futureTruck: isCurrent || !isPast ? val : null,
          };
        });

        setData(chartData);
      })
      .catch(e => {
        console.error('Error fetching data:', e);
        setData([]);
      });
  }, []);

  const isMobile = windowWidth <= 640;
  const chartHeight = isMobile ? 280 : 420;

  const colorTruck = '#9966FF';
  const colorForecastTruck = `${colorTruck}80`;

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
            tickFormatter={d => d}
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
            dataKey="pastTruck"
            name="Historical Truck"
            stroke={colorTruck}
            strokeWidth={3}
            dot={{ r: 3, fill: colorTruck }}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="futureTruck"
            name="Forecast Truck"
            stroke={colorForecastTruck}
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ r: 3, stroke: colorTruck, fill: colorForecastTruck }}
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
          <div style={{ width: 24, height: 3, background: colorTruck, borderRadius: 2 }} />
          <span>Historical Truck</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24,
            height: 0,
            borderTop: `2px dashed ${colorForecastTruck}`,
          }} />
          <span>Forecast Truck</span>
        </div>
      </div>
    </div>
  );
};

export default TruckForecast;
