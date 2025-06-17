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

// Format percentage
const formatPercent = (value) => `${value.toFixed(1)}%`;

const CommercialSegmentChart = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  // Convert to percentage format and lowercase keys
  const formattedData = data.map((item) => {
    const total = item.LCV + item.MCV + item.HCV;
    return {
      month: item.month,
      lcv: (item.LCV / total) * 100,
      mcv: (item.MCV / total) * 100,
      hcv: (item.HCV / total) * 100,
    };
  });

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

export default CommercialSegmentChart;
