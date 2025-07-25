'use client';

import React from "react";
import { useMediaQuery } from 'react-responsive';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Gradient palette
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
  { light: "#F4A261", dark: "#B87434" },
  { light: "#9B5DE5", dark: "#6630A6" },
  { light: "#FEE440", dark: "#C6B000" },
  { light: "#00F5D4", dark: "#00A88F" },
  { light: "#C0CA33", dark: "#8A9A16" },
];

const getColor = (i) => PALETTE[i % PALETTE.length].light;
const getDark = (i) => PALETTE[i % PALETTE.length].dark;

const companyData = [
  { name: "TATA MOTORS LTD", May25: 37.90, Jun25: 35.11, Jun24: 39.05 },
  { name: "MAHINDRA & MAHINDRA LIMITED", May25: 1.33, Jun25: 2.00, Jun24: 1.55 },
  { name: "ASHOK LEYLAND LTD", May25: 14.50, Jun25: 14.21, Jun24: 13.80 },
  { name: "VE COMMERCIAL VEHICLES LTD", May25: 14.36, Jun25: 17.14, Jun24: 16.11 },
  { name: "FORCE MOTORS LIMITED", May25: 18.72, Jun25: 17.86, Jun24: 17.19 },
  { name: "DAIMLER INDIA COMMERCIAL VEHICLES PVT. LTD", May25: 2.02, Jun25: 2.15, Jun24: 1.34 },
  { name: "SML ISUZU LTD", May25: 8.74, Jun25: 8.79, Jun24: 9.98 },
  { name: "OTHERS", May25: 2.45, Jun25: 2.73, Jun24: 0.97 },
];

const companyNames = companyData.map(item => item.name);

const getComparisonData = (currentKey, compareKey, showSymbol) =>
  companyData.map((item) => {
    const currentValue = item[currentKey];
    const compareValue = item[compareKey];
    let symbol = "";
    let increased = false;
    let decreased = false;

    if (showSymbol) {
      if (currentValue > compareValue) {
        symbol = "▲";
        increased = true;
      } else if (currentValue < compareValue) {
        symbol = "▼";
        decreased = true;
      }
    }

    return {
      name: item.name,
      value: currentValue,
      symbol,
      increased,
      decreased,
    };
  });

const ChartWithComparison = ({ current, compare, title }) => {
  const isMobile = useMediaQuery({ query: '(max-width: 576px)' });
  const showSymbol = current === "Jun25";
  const data = getComparisonData(current, compare, showSymbol);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, symbol } = payload[0].payload;
    return (
      <div style={{
        background: '#222',
        color: '#fff',
        padding: 8,
        borderRadius: 4,
        fontSize: 10,
      }}>
        <strong>{name}</strong><br />
        Value: {value.toFixed(2)}% {symbol}
      </div>
    );
  };

  const renderCustomLabel = ({
    cx, cy, midAngle, outerRadius, index, value,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const item = data[index];
    if (!item) return null;

    let arrowColor = "#ccc";
    if (item.increased) arrowColor = "green";
    else if (item.decreased) arrowColor = "red";

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
        <tspan fill={arrowColor}>{item.symbol} </tspan>
        <tspan>{value.toFixed(1)}%</tspan>
      </text>
    );
  };

  return (
    <div className="col-lg-6 mb-4">
      <h6 className="text-center fw-semibold mb-2">{title}</h6>
      <div style={{ width: "100%", height: isMobile ? 250 : 500 }}>
        <ResponsiveContainer>
          <PieChart>
            <defs>
              {data.map((_, i) => (
                <linearGradient
                  key={i}
                  id={`sliceGrad-${i}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
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
                <Cell key={i} fill={`url(#sliceGrad-${i})`} />
              ))}
            </Pie>

            <Tooltip content={<CustomTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Bus_PieChart = () => {
  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col text-center">
          <h4 style={{ color: "#ffdc00" }}>Bus OEM Market Share Comparison</h4>
        </div>
      </div>

      <div className="row">
        <ChartWithComparison current="May25" compare="Jun24" title="Month on Month (MoM) - May 25" />
        <ChartWithComparison current="Jun25" compare="May25" title="Month on Month (MoM) - Jun 25" />
        <ChartWithComparison current="Jun24" compare="Jun25" title="Year on Year (YoY) - Jun 24" />
        <ChartWithComparison current="Jun25" compare="Jun24" title="Year on Year (YoY) - Jun 25" />
      </div>

      <div className="mt-3">
        <div
          className="d-flex flex-wrap justify-content-center gap-2"
          style={{ fontSize: '9px', lineHeight: '1.2' }}
        >
          {companyNames.map((name, i) => (
            <div
              key={name}
              className="d-flex align-items-center"
              style={{ margin: '4px 6px', maxWidth: '45%' }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: getColor(i),
                  marginRight: 4,
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bus_PieChart;
