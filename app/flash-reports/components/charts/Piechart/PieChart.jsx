/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMediaQuery } from 'react-responsive';

// Gradient color palette
const PALETTE = [
  { light: "#15AFE4", dark: "#0D7AAB" },
  { light: "#FFC107", dark: "#B38600" },
  { light: "#23DD1D", dark: "#149A11" },
  { light: "#A17CFF", dark: "#5E3DBD" },
  { light: "#FF8A65", dark: "#C75B39" },
  { light: "#607D8B", dark: "#37474F" },
  { light: "#FFD166", dark: "#C79B26" },
  { light: "#EF476F", dark: "#A2304A" },
  { light: "#06D6A0", dark: "#04936F" },
  { light: "#073B4C", dark: "#041E25" },
];

const getColor = (i) => PALETTE[i % PALETTE.length].light;
const getDark = (i) => PALETTE[i % PALETTE.length].dark;

// 🧠 Chart UI
const ChartWithComparison = ({ data, title, showArrow }) => {
  const isMobile = useMediaQuery({ query: '(max-width: 576px)' });

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, symbol } = payload[0].payload;
    const color = symbol === "▲" ? "green" : symbol === "▼" ? "red" : "#ccc";

    return (
      <div style={{ background: "#222", color: "#fff", padding: 8, borderRadius: 4, fontSize: 12 }}>
        <strong>{name}</strong><br />
        {value.toFixed(1)}% <span style={{ color }}>{symbol}</span>
      </div>
    );
  };

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, index, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const item = data[index];
    if (!item) return null;

    const color = item.increased ? "green" : item.decreased ? "red" : "#ccc";

    return (
      <text
        x={x}
        y={y}
        fill="#ccc"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        <tspan fill={color}>{showArrow ? item.symbol + " " : ""}</tspan>
        <tspan>{value.toFixed(1)}%</tspan>
      </text>
    );
  };

  return (
    <div className="col-md-6 col-12 mb-4">
      <h6 className="text-center fw-semibold mb-2">{title}</h6>
      <div style={{ width: "100%", height: isMobile ? 260 : 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <defs>
              {data.map((_, i) => (
                <linearGradient key={i} id={`evGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={getColor(i)} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={getDark(i)} stopOpacity={0.3} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 50 : 85}
              outerRadius={isMobile ? 90 : 120}
              paddingAngle={4}
              stroke="rgba(255,255,255,0.1)"
              labelLine={false}
              label={renderCustomLabel}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={`url(#evGrad-${i})`} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 📊 Final Chart Component
const TwoWheelerChart = ({ piedata }) => {
  const [sortedLegend, setSortedLegend] = useState([]);

  if (!piedata || piedata.length === 0) return null;

  // 🗓️ Sort months chronologically using Date
  const dateKeys = useMemo(() => {
    return Object.keys(piedata[0])
      .filter((k) => k !== "name")
      .sort((a, b) => new Date(a) - new Date(b)); // Chronological order
  }, [piedata]);

  if (dateKeys.length < 2) return null;

  // Process with earlier and later month
  const processedData = useMemo(() => {
    return piedata.map((item) => {
      const prev = parseFloat(item[dateKeys[0]]) || 0;
      const curr = parseFloat(item[dateKeys[1]]) || 0;
      let symbol = "";
      if (curr > prev) symbol = "▲";
      else if (curr < prev) symbol = "▼";
      return {
        name: item.name,
        value: curr,
        symbol,
        increased: curr > prev,
        decreased: curr < prev,
      };
    }).sort((a, b) => b.value - a.value);
  }, [piedata, dateKeys]);

  useEffect(() => {
    const sorted = [...processedData];
    const othersIndex = sorted.findIndex(item => item.name.toLowerCase().trim() === "others");
    if (othersIndex !== -1) {
      const [others] = sorted.splice(othersIndex, 1);
      others.name = "Others";
      sorted.push(others);
    }
    setSortedLegend(sorted);
  }, [processedData]);

  return (
    <div className="container-fluid px-md-5">
      <div className="row">
        {/* Earlier month on left */}
        <ChartWithComparison
          data={processedData}
          title={`MoM - ${dateKeys[0]}`}
          showArrow={true}
        />
        {/* Later month on right */}
        <ChartWithComparison
          data={processedData}
          title={`MoM - ${dateKeys[1]}`}
          showArrow={false}
        />
      </div>

      <div className="mt-4 text-center">
        <div className="d-flex flex-wrap justify-content-center gap-3">
          {sortedLegend.map((item, i) => (
            <div key={item.name} className="d-flex align-items-center">
              <div
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: getColor(i),
                  marginRight: 6,
                  borderRadius: "50%",
                }}
              />
              <span style={{ fontSize: "0.6rem" }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TwoWheelerChart;
