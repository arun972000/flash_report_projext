'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  CartesianGrid,
} from 'recharts';

// Original data
const rawData = [
  { month: 'JAN-25', LCV: 4566, MCV: 2363, HCV: 2993 },
  { month: 'FEB-25', LCV: 4758, MCV: 2417, HCV: 2294 },
  { month: 'MAR-25', LCV: 6763, MCV: 2894, HCV: 3225 },
  { month: 'APR-25', LCV: 8402, MCV: 3265, HCV: 3134 },
  { month: 'MAY-25', LCV: 7059, MCV: 3658, HCV: 3163 },
  { month: 'JUN-25', LCV: 6600, MCV: 3500, HCV: 3050 },
  { month: 'JUL-25', LCV: 6850, MCV: 3600, HCV: 2955 },
  { month: 'AUG-25', LCV: 7300, MCV: 3750, HCV: 2850 },
  { month: 'SEP-25', LCV: 7850, MCV: 3850, HCV: 3020 },
  { month: 'OCT-25', LCV: 8500, MCV: 4000, HCV: 2825 },
];


// Format raw data into percentages and lowercase keys
const formattedData = rawData.map(item => {
  const total = item.LCV + item.MCV + item.HCV;
  return {
    month: item.month,
    lcv: (item.LCV / total) * 100,
    mcv: (item.MCV / total) * 100,
    hcv: (item.HCV / total) * 100,
  };
});


// Color mapping
const COLORS = {
  lcv: '#ffc658',
  mcv: '#81ea81',
  hcv: '#3ab8b4',
};

// Legend labels
const LEGEND_TITLES = {
  lcv: 'Light Commercial Vehicles',
  mcv: 'Medium Commercial Vehicles',
  hcv: 'Heavy Commercial Vehicles (incl. Others)',
};

// Percentage formatter
const formatPercent = (value) => `${value.toFixed(1)}%`;

const StaticCommercialSegmentChart = () => {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 380 }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={formattedData}
            barCategoryGap="30%"
            margin={{ top: 10, right: 50, left: 40, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatPercent} domain={[0, 100]} />
            <YAxis dataKey="month" type="category" />
            <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
            <Bar dataKey="hcv" stackId="a" fill={COLORS.hcv}>
              <LabelList dataKey="hcv" position="insideRight" formatter={formatPercent} fill="#fff" fontSize={12} />
            </Bar>
            <Bar dataKey="mcv" stackId="a" fill={COLORS.mcv}>
              <LabelList dataKey="mcv" position="insideRight" formatter={formatPercent} fill="#000" fontSize={12} />
            </Bar>
            <Bar dataKey="lcv" stackId="a" fill={COLORS.lcv}>
              <LabelList dataKey="lcv" position="insideRight" formatter={formatPercent} fill="#000" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Hoverable Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          paddingTop: 16,
          flexWrap: 'wrap',
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
                borderRadius: 2,
              }}
            />
            <span style={{ fontSize: 14 }}>{key.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaticCommercialSegmentChart;
