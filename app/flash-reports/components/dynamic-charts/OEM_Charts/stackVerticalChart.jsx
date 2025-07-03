'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  CartesianGrid
} from 'recharts';

const rawData = [
  { month: 'APR-25', LCV: 46751, MCV: 7638, HCV: 31657, Others: 451 },
  { month: 'MAR-25', LCV: 52380, MCV: 7200, HCV: 29436, Others: 574 },
  { month: 'FEB-25', LCV: 45742, MCV: 6212, HCV: 26094, Others: 471 },
  { month: 'JAN-25', LCV: 56410, MCV: 6975, HCV: 30061, Others: 597 },
];

// Combine HCV + Others and calculate percentages
const data = rawData.map(item => {
  const hcvWithOthers = item.HCV + item.Others;
  const total = item.LCV + item.MCV + hcvWithOthers;
  return {
    month: item.month,
    LCV: (item.LCV / total) * 100,
    MCV: (item.MCV / total) * 100,
    HCV: (hcvWithOthers / total) * 100
  };
});

const COLORS = {
  LCV: '#004c6d',
  MCV: '#f79256',
  HCV: '#227c32'
};

const LEGEND_TITLES = {
  LCV: 'Light Commercial Vehicles',
  MCV: 'Medium Commercial Vehicles',
  HCV: 'Heavy Commercial Vehicles'
};

const CustomStackBarChart = () => {
  const [chartHeight, setChartHeight] = useState(420);

  useEffect(() => {
    const updateSize = () => {
      setChartHeight(window.innerWidth < 768 ? 280 : 420);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div style={{ width: '100%' }}>
      {/* Chart */}
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 20, right: 50, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(tick) => `${tick}%`}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="month"
              tick={{ fontWeight: 'bold', fontSize: 12 }}
              width={80}
            />
            <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />

            {['LCV', 'MCV', 'HCV'].map((key) => (
              <Bar key={key} dataKey={key} stackId="a" fill={COLORS[key]}>
                <LabelList
                  dataKey={key}
                  position="inside"
                  formatter={(val) => `${val.toFixed(1)}%`}
                  fill="#fff"
                  fontSize={12}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend Below Chart */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          paddingTop: 16,
          flexWrap: 'wrap'
        }}
      >
        {Object.entries(COLORS).map(([key, color]) => (
          <div
            key={key}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title={LEGEND_TITLES[key]}
          >
            <div
              style={{
                width: 14,
                height: 14,
                backgroundColor: color,
                borderRadius: 2
              }}
            />
            <span style={{ fontSize: 14 }}>{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomStackBarChart;
