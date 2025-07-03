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

// Raw monthly data
const rawData = [
  { month: 'JAN-25', LCV: 4566, MCV: 2363, HCV: 2993 },
  { month: 'FEB-25', LCV: 4758, MCV: 2417, HCV: 2294 },
  { month: 'MAR-25', LCV: 6763, MCV: 2894, HCV: 3225 },
  { month: 'APR-25', LCV: 8402, MCV: 3265, HCV: 3134 },
  { month: 'MAY-25', LCV: 7059, MCV: 3658, HCV: 3163 },
  { month: 'JUN-25', LCV: 6889, MCV: 4486, HCV: 2899 },
  { month: 'JUL-25', LCV: 6755, MCV: 3251, HCV: 2955 },
  { month: 'AUG-25', LCV: 7152, MCV: 3622, HCV: 2850 },
  { month: 'SEP-25', LCV: 7412, MCV: 3850, HCV: 3020 },
  { month: 'OCT-25', LCV: 8451, MCV: 4122, HCV: 2825 },
  { month: 'NOV-25', LCV: 8612, MCV: 4522, HCV: 3264 },
  { month: 'DEC-25', LCV: 6855, MCV: 3512, HCV: 3102 },
];

// Convert to % format
const formattedData = rawData.map(item => {
  const total = item.LCV + item.MCV + item.HCV;
  return {
    month: item.month,
    lcv: (item.LCV / total) * 100,
    mcv: (item.MCV / total) * 100,
    hcv: (item.HCV / total) * 100,
  };
});

// Gradient styles
const GRADIENTS = {
  lcv: { id: 'grad-lcv', from: '#FFD54F', to: '#FFA000' },
  mcv: { id: 'grad-mcv', from: '#A5D6A7', to: '#388E3C' },
  hcv: { id: 'grad-hcv', from: '#4DD0E1', to: '#00838F' },
};

// Label formatting
const formatPercent = (val) => `${val.toFixed(1)}%`;

const StaticCommercialSegmentChart = () => {
  return (
    <div className="w-100 px-3 py-2">
      <h5 className="text-center fw-semibold mb-3">
        Commercial Vehicle Segment Mix (%)
      </h5>

      <div style={{ height: 440 }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={formattedData}
            margin={{ top: 10, right: 50, left: 50, bottom: 10 }}
            barCategoryGap="25%"
          >
            {/* Gradient Definitions */}
            <defs>
              {Object.entries(GRADIENTS).map(([key, { id, from, to }]) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={from} />
                  <stop offset="100%" stopColor={to} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid strokeDasharray="2 3" stroke="#ddd" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={formatPercent}
              stroke="#888"
              fontSize={12}
            />
            <YAxis
              dataKey="month"
              type="category"
              stroke="#888"
              fontSize={12}
              width={60}
            />
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

      {/* Legend */}
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
              <span style={{ color: '#333' }}>{key.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaticCommercialSegmentChart;
