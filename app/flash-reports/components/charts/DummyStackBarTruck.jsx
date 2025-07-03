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

// Raw truck volume data
const rawData = [
  { month: 'JAN-25', LCV: 52795, MCV: 4077, HCV: 27009 },
  { month: 'FEB-25', LCV: 41961, MCV: 3398, HCV: 23863 },
  { month: 'MAR-25', LCV: 46866, MCV: 3790, HCV: 26160 },
  { month: 'APR-25', LCV: 39951, MCV: 3977, HCV: 28626 },
  { month: 'MAY-25', LCV: 38381, MCV: 3278, HCV: 21721 },
  { month: 'JUN-25', LCV: 38080, MCV: 3028, HCV: 18851 },
  { month: 'JUL-25', LCV: 37500, MCV: 3150, HCV: 20222 },
  { month: 'AUG-25', LCV: 39111, MCV: 3256, HCV: 21022 },
  { month: 'SEP-25', LCV: 38555, MCV: 3332, HCV: 21511 },
  { month: 'OCT-25', LCV: 41555, MCV: 3561, HCV: 23541 },
  { month: 'NOV-25', LCV: 45122, MCV: 3974, HCV: 25122 },
  { month: 'DEC-25', LCV: 38122, MCV: 3055, HCV: 18222 },
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

const TruckSegmentChart = () => {
  return (
    <div className="w-100 px-3 py-2">
      <h5 className="text-center fw-semibold mb-3">
        Truck Segment Contribution (%)
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
              <span style={{ color: '#333' }}>{key.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TruckSegmentChart;
