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
  { light: "#15AFE4", dark: "#0D7AAB" },   // Bright cyan-blue
  { light: "#FFC107", dark: "#B38600" },   // Vivid amber
  { light: "#23DD1D", dark: "#149A11" },   // Pure green
  { light: "#A17CFF", dark: "#5E3DBD" },   // Soft purple
  { light: "#FF8A65", dark: "#C75B39" },   // Coral
  { light: "#607D8B", dark: "#37474F" },   // Slate blue-gray
  { light: "#FFD166", dark: "#C79B26" },   // Yellow-orange
  { light: "#EF476F", dark: "#A2304A" },   // Crimson red
  { light: "#06D6A0", dark: "#04936F" },   // Teal-green
  { light: "#073B4C", dark: "#041E25" },   // Navy-black
  { light: "#F4A261", dark: "#B87434" },   // Desert tan
  { light: "#9B5DE5", dark: "#6630A6" },   // Violet
  { light: "#FEE440", dark: "#C6B000" },   // Bold yellow
  { light: "#00F5D4", dark: "#00A88F" },   // Bright aqua
  { light: "#C0CA33", dark: "#8A9A16" },   // Yellow-lime
  { light: "#FF7043", dark: "#BF360C" },   // Rich orange
  { light: "#8D6E63", dark: "#5D4037" },   // Mocha brown
  { light: "#FF6F00", dark: "#C45000" },   // Deep orange
  { light: "#1E88E5", dark: "#125EA9" },   // Primary blue
  { light: "#43A047", dark: "#2B702F" },   // Forest green
  { light: "#D81B60", dark: "#991042" },   // Rose red
  { light: "#F4511E", dark: "#B2360F" },   // Rust
  { light: "#3949AB", dark: "#27317C" },   // Indigo
  { light: "#00897B", dark: "#005F56" },   // Dark teal
  { light: "#90A4AE", dark: "#607D8B" },   // Muted steel
  { light: "#B0EB00", dark: "#7DA300" },   // Neon lime
];



const getColor = (i) => PALETTE[i % PALETTE.length].light;
const getDark = (i) => PALETTE[i % PALETTE.length].dark;

const companyData = [
  { name: "BAJAJ AUTO", May25: 39.17, Apr25: 39.08, May24: 29.61 },
  { name: "MAHINDRA LAST MILE MOBILITY", May25: 36.36, Apr25: 34.36, May24: 39.20 },
  { name: "TVS MOTOR", May25: 10.56, Apr25: 9.19, May24: 0.23 },
  { name: "PIAGGIO VEHICLES", May25: 5.80, Apr25: 7.62, May24: 15.90 },
  { name: "TI CLEAN MOBILITY", May25: 3.31, Apr25: 3.83, May24: 4.41 },
  { name: "OMEGA SEIKI", May25: 0.82, Apr25: 1.08, May24: 0.87 },
  { name: "others", May25: 3.99, Apr25: 4.84, May24: 9.79 }
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
  const showSymbol = current === "Apr25";
  const data = getComparisonData(current, compare, showSymbol);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, symbol } = payload[0].payload;
    const arrowColor = symbol === "▲" ? "green" : symbol === "▼" ? "red" : "#ccc";
    return (
      <div
        style={{
          background: "#222",
          color: "#fff",
          padding: 8,
          borderRadius: 4,
          fontSize: 12,
        }}
      >
        <strong>{name}</strong>
        <br />
        Value: {value.toFixed(2)}%{" "}
        <span style={{ color: arrowColor, fontWeight: "bold" }}>{symbol}</span>
      </div>
    );
  };

  // Custom label with colored arrow and percent
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    index,
    value,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20; // outside the pie slice
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
                <linearGradient
                  key={i}
                  id={`evGrad-${i}`}
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

const Dummy4Wheeler = () => {
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
  <ChartWithComparison current="Apr25" compare="May24" title="Month on Month (MoM) - Apr 25" />
  <ChartWithComparison current="May25" compare="Apr25" title="Month on Month (MoM) - May 25" />
  <ChartWithComparison current="May24" compare="May25" title="Year on Year (YoY) - May 24" />
  <ChartWithComparison current="May25" compare="May24" title="Year on Year (YoY) - May 25" />
</div>

      {/* Shared Legend */}
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

export default Dummy4Wheeler;
