'use client';

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMediaQuery } from "react-responsive";

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
  { light: "#F4A261", dark: "#B87434" },
];

const getColor = (i) => PALETTE[i % PALETTE.length].light;
const getDark = (i) => PALETTE[i % PALETTE.length].dark;

const companyData = [
  { name: "TVS Motor", Jun24: 17.54, May25: 24.53, Jun25: 24.01 },
  { name: "Ola Electric", Jun24: 46.07, May25: 18.37, Jun25: 19.18 },
  { name: "Bajaj Auto/Chetak", Jun24: 11.31, May25: 21.74, Jun25: 21.85 },
  { name: "Ather Energy", Jun24: 7.77, May25: 12.90, Jun25: 13.78 },
  { name: "Hero Motocorp", Jun24: 3.85, May25: 7.12, Jun25: 7.28 },
  { name: "Ampere/Greaves", Jun24: 3.52, May25: 4.15, Jun25: 4.01 },
  { name: "Pur Energy", Jun24: 0.42, May25: 1.26, Jun25: 1.36 },
  { name: "BGauss Auto", Jun24: 1.33, May25: 1.06, Jun25: 1.85 },
  { name: "Kinetic Green", Jun24: 0.57, May25: 1.12, Jun25: 0.73 },
  { name: "River Mobility", Jun24: 0.25, May25: 0.95, Jun25: 1.18 },
  { name: "Others", Jun24: 7.37, May25: 6.80, Jun25: 4.77 },
];

const companyNames = companyData.map((item) => item.name);

const getComparisonData = (currentKey, compareKey, showSymbol) =>
  companyData.map((item) => {
    let symbol = "";
    if (showSymbol) {
      if (item[currentKey] > item[compareKey]) symbol = "▲";
      else if (item[currentKey] < item[compareKey]) symbol = "▼";
    }
    return {
      name: item.name,
      value: item[currentKey],
      symbol,
      increased: item[currentKey] > item[compareKey],
      decreased: item[currentKey] < item[compareKey],
    };
  });

const ChartWithComparison = ({ current, compare, title }) => {
  const isMobile = useMediaQuery({ query: "(max-width: 576px)" });
  const showSymbol = current === "Jun25";
  const data = getComparisonData(current, compare, showSymbol);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, symbol } = payload[0].payload;
    const arrowColor = symbol === "▲" ? "green" : symbol === "▼" ? "red" : "#ccc";
    return (
      <div style={{
        background: "#222",
        color: "#fff",
        padding: 8,
        borderRadius: 4,
        fontSize: 12,
      }}>
        <strong>{name}</strong>
        <br />
        Value: {value.toFixed(2)}%{" "}
        <span style={{ color: arrowColor, fontWeight: "bold" }}>{symbol}</span>
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

const TwoWheelerEV = () => {
  return (
    <div className="container-fluid px-md-5">
      <div className="row mb-4">
        <div className="col text-center">
          <h4 style={{ color: "#59bea0" }}>
            2-Wheeler EV Electric Share Comparison
          </h4>
        </div>
      </div>

      <div className="row">
        <ChartWithComparison current="May25" compare="Jun24" title="Month on Month (MoM) - May 25" />
        <ChartWithComparison current="Jun25" compare="May25" title="Month on Month (MoM) - Jun 25" />
        <ChartWithComparison current="Jun24" compare="Jun25" title="Year on Year (YoY) - Jun 24" />
        <ChartWithComparison current="Jun25" compare="Jun24" title="Year on Year (YoY) - Jun 25" />
      </div>

      <div className="mt-4 text-center">
        <div className="d-flex flex-wrap justify-content-center gap-3">
          {companyNames.map((name, i) => (
            <div key={name} className="d-flex align-items-center">
              <div
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: getColor(i),
                  marginRight: 6,
                  borderRadius: "50%",
                }}
              />
              <span style={{ fontSize: "0.6rem", minWidth: 80, textAlign: "left" }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TwoWheelerEV;
