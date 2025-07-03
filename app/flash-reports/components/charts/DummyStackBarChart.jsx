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

// New CV data
const rawData = [
  { month: 'JAN-25', LCV: 57361, MCV: 6440, HCV: 30002 },
  { month: 'FEB-25', LCV: 46719, MCV: 5815, HCV: 26157 },
  { month: 'MAR-25', LCV: 53629, MCV: 6684, HCV: 29385 },
  { month: 'APR-25', LCV: 48353, MCV: 7242, HCV: 31760 },
  { month: 'MAY-25', LCV: 45440, MCV: 6936, HCV: 24884 },
  { month: 'JUN-25', LCV: 44969, MCV: 7514, HCV: 21750 },
  { month: 'JUL-25', LCV: 44255, MCV: 6401, HCV: 23177 },
  { month: 'AUG-25', LCV: 46263, MCV: 6878, HCV: 23872 },
  { month: 'SEP-25', LCV: 45967, MCV: 7182, HCV: 24531 },
  { month: 'OCT-25', LCV: 50006, MCV: 7683, HCV: 26366 },
  { month: 'NOV-25', LCV: 53734, MCV: 8496, HCV: 28386 },
  { month: 'DEC-25', LCV: 44977, MCV: 6567, HCV: 21324 },
];

// Convert raw values into percentages
const formattedData = rawData.map(item => {
  const total = item.LCV + item.MCV + item.HCV;
  return {
    month: item.month,
    lcv: (item.LCV / total) * 100,
    mcv: (item.MCV / total) * 100,
    hcv: (item.HCV / total) * 100,
  };
});

// Gradient mapping
const GRADIENTS = {
  lcv: { id: 'grad-lcv', from: '#FFD54F', to: '#FFA000' },
  mcv: { id: 'grad-mcv', from: '#A5D6A7', to: '#388E3C' },
  hcv: { id: 'grad-hcv', from: '#4DD0E1', to: '#00838F' },
};

// Labels
const LEGEND_TITLES = {
  lcv: 'Light Commercial Vehicles',
  mcv: 'Medium Commercial Vehicles',
  hcv: 'Heavy Commercial Vehicles (incl. Others)',
};

const formatPercent = (val) => `${val.toFixed(1)}%`;

const CVSegmentChart = () => {
  return (
    <div className="w-100 px-3 py-2">
      <h5 className="text-center fw-semibold mb-3">
        Commercial Vehicle Segment Contribution (%)
      </h5>

      <div style={{ height: 440 }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={formattedData}
            margin={{ top: 10, right: 50, left: 50, bottom: 10 }}
            barCategoryGap="25%"
          >
            {/* Define gradients */}
            <defs>
              {Object.entries(GRADIENTS).map(([key, { id, from, to }]) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={from} />
                  <stop offset="100%" stopColor={to} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="2 3" stroke="#ddd" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={formatPercent} stroke="#888" fontSize={12} />
            <YAxis type="category" dataKey="month" stroke="#888" fontSize={12} width={60} />
            <Tooltip
              wrapperStyle={{ outline: 'none' }}
              contentStyle={{
                backgroundColor: '#1f1f1f',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                color: '#fff',
              }}
              formatter={(value) => `${value.toFixed(1)}%`}
              labelStyle={{ color: '#ccc' }}
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            />

            <Bar dataKey="hcv" stackId="a" fill="url(#grad-hcv)" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="hcv" position="insideRight" formatter={formatPercent} fill="#fff" fontSize={11} />
            </Bar>
            <Bar dataKey="mcv" stackId="a" fill="url(#grad-mcv)" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="mcv" position="insideRight" formatter={formatPercent} fill="#000" fontSize={11} />
            </Bar>
            <Bar dataKey="lcv" stackId="a" fill="url(#grad-lcv)" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="lcv" position="insideRight" formatter={formatPercent} fill="#000" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="text-center mt-3">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
          {Object.entries(GRADIENTS).map(([key, { from }]) => (
            <div key={key} className="d-flex align-items-center" style={{ gap: 6 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: from,
                  borderRadius: 3,
                }}
              />
              <span style={{ color: '#333' }}>{LEGEND_TITLES[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CVSegmentChart;
