'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  Rectangle,
} from 'recharts';
import '@/app/flash-reports/components/styles/chart.css';

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

const categories = ['All', '2W', '3W', 'PV', 'TRAC', 'CV', 'Total'];
const colors = {
  '2W': '#ffffff',
  '3W': '#ff1f23',
  PV: '#FFCE56',
  TRAC: '#4BC0C0',
  CV: '#9966FF',
  Total: '#FF9F40',
};

const abbrevMonthMap = {
  jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', aprl: 'Apr',
  may: 'May', jun: 'Jun', jul: 'Jul', aug: 'Aug',
  sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
};

const abbreviate = v => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1).replace(/\.0$/, '')}K`;
  return v.toString();
};

const CustomLegend = ({ selectedCat }) => {
  const categoriesToShow =
    selectedCat === 'All' ? ['2W', '3W', 'PV', 'TRAC', 'CV', 'Total'] : [selectedCat];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 20,
        color: '#fff',
      }}
    >
      {categoriesToShow.map(cat => (
        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 3, background: colors[cat], borderRadius: 2 }} />
          <span style={{ fontSize: 13 }}>{cat}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLineChart = ({ data: rawData }) => {
  const [selectedCat, setSelectedCat] = useState('All');
  const [chartHeight, setChartHeight] = useState(420);
  const chartWrapperRef = useRef(null);

  useEffect(() => {
    const updateHeight = () => {
      const isMobile = window.innerWidth < 768;
      setChartHeight(isMobile ? 280 : 420);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Transform prop data to expected format
const data = useMemo(() => {
  const parseMonthYear = (str) => {
    const [rawMonth, year] = str.trim().split(' ');
    const monthIndex = Object.keys(abbrevMonthMap).indexOf(rawMonth.toLowerCase());
    const fullYear = +('20' + year.slice(-2));
    return new Date(fullYear, monthIndex >= 0 ? monthIndex : 0);
  };

  return [...rawData]
    .map(item => {
      const dateObj = parseMonthYear(item.month);
      const shortMonth = abbrevMonthMap[item.month.trim().split(' ')[0].toLowerCase()] || '---';
      const year = item.month.trim().split(' ')[1]?.slice(-2) || '--';

      return {
        month: `${shortMonth}${year}`,
        '2W': item['2-wheeler'],
        '3W': item['3-wheeler'],
        PV: item['passenger vehicle'],
        TRAC: item.tractor,
        CV: item['commercial vehicle'],
        Total: item.total,
        _date: dateObj,
      };
    })
    .sort((a, b) => a._date - b._date);
}, [rawData]);


  const splitData = useMemo(() => {
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

    return data.map(d => {
      const [monStr, yrStr] = [d.month.slice(0, 3), d.month.slice(3)];
      const entryDate = new Date(`20${yrStr}`, Object.values(abbrevMonthMap).indexOf(monStr));
      const isCurrentMonth = entryDate.getFullYear() === currentMonthDate.getFullYear() &&
        entryDate.getMonth() === currentMonthDate.getMonth();
      const isPast = entryDate < currentMonthDate;

      const entry = { month: d.month };

      for (const cat of ['2W', '3W', 'PV', 'TRAC', 'CV', 'Total']) {
        entry[`${cat}_past`] = isPast || isCurrentMonth ? d[cat] : null;
        entry[`${cat}_future`] = isCurrentMonth || !isPast ? d[cat] : null;
      }

      return entry;
    });
  }, [data]);

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: 0 }} ref={chartWrapperRef}>
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
        <LineChart data={splitData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
            dataKey="month"
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
            dataKey="month"
            startIndex={0}
            endIndex={splitData.length - 1}
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

          {(selectedCat === 'All' ? ['2W', '3W', 'PV', 'TRAC', 'CV', 'Total'] : [selectedCat]).map(cat => (
            <React.Fragment key={cat}>
              <Line
                type="linear"
                dataKey={`${cat}_past`}
                name={`Historical ${cat}`}
                stroke={`url(#${cat}-grad)`}
                strokeWidth={1}
                dot={{ r: 2, fill: colors[cat] }}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey={`${cat}_future`}
                name={`Forecast ${cat}`}
                stroke={colors[cat] + '80'}
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </React.Fragment>
          ))}
        </LineChart>
      </ResponsiveContainer>

      <CustomLegend selectedCat={selectedCat} />
    </div>
  );
};

export default CustomLineChart;
