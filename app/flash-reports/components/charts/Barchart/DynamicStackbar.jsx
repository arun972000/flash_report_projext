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
  CartesianGrid,
} from 'recharts';

const GRADIENTS = {
  lcv: { id: 'grad-lcv', from: '#FFD54F', to: '#FFA000' },
  mcv: { id: 'grad-mcv', from: '#A5D6A7', to: '#388E3C' },
  hcv: { id: 'grad-hcv', from: '#4DD0E1', to: '#00838F' },
};

const LEGEND_TITLES = {
  lcv: 'Light Commercial Vehicles',
  mcv: 'Medium Commercial Vehicles',
  hcv: 'Heavy Commercial Vehicles (incl. Others)',
};

const formatPercent = (val) => `${val.toFixed(1)}%`;

const CVSegmentChart = ({ segmentName }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchSegmentSplit = async () => {
      try {
        const res = await fetch(`/api/fetchCVSegmentSplit?segmentName=${encodeURIComponent(segmentName)}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('CV Segment Chart error:', err);
      }
    };

    if (segmentName) {
      fetchSegmentSplit();
    }
  }, [segmentName]);

  return (
    <div className="w-100 px-3 py-2">
      <h5 className="text-center fw-semibold mb-3">
        Commercial Vehicle Segment Contribution (%)
      </h5>

      <div style={{ height: 440 }}>
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 50, left: 50, bottom: 10 }}
            barCategoryGap="25%"
          >
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
              type="category"
              dataKey="month"
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

            <Bar dataKey="hcv" stackId="a" fill="url(#grad-hcv)">
              <LabelList dataKey="hcv" position="insideRight" formatter={formatPercent} fill="#fff" fontSize={11} />
            </Bar>
            <Bar dataKey="mcv" stackId="a" fill="url(#grad-mcv)">
              <LabelList dataKey="mcv" position="insideRight" formatter={formatPercent} fill="#000" fontSize={11} />
            </Bar>
            <Bar dataKey="lcv" stackId="a" fill="url(#grad-lcv)">
              <LabelList dataKey="lcv" position="insideRight" formatter={formatPercent} fill="#000" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center mt-3">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            flexWrap: 'wrap',
            fontSize: 13,
          }}
        >
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
