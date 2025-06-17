'use client';

import React, { useState, useEffect } from 'react';
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

const getComparisonData = (data, currentKey, compareKey) =>
  data.map((item) => {
    const curr = parseFloat(item[currentKey]) || 0;
    const prev = parseFloat(item[compareKey]) || 0;
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
  });

const ChartWithComparison = ({
  data,
  current,
  compare,
  title,
  showArrow,
  onSortedData,
}) => {
  const isMobile = useMediaQuery({ query: "(max-width: 576px)" });

  const pieData = getComparisonData(data, current, compare)
    .sort((a, b) => b.value - a.value);

  useEffect(() => {
    if (onSortedData) {
      // Move 'Others' to the end and normalize its label
      const othersIndex = pieData.findIndex(
        (item) => item.name.trim().toLowerCase() === "others"
      );
      let sorted = [...pieData];
      if (othersIndex !== -1) {
        const [othersItem] = sorted.splice(othersIndex, 1);
        othersItem.name = "Others";
        sorted.push(othersItem);
      }
      onSortedData(sorted);
    }
  }, [onSortedData, pieData]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value, symbol } = payload[0].payload;
    const arrowColor = symbol === "▲" ? "green" : symbol === "▼" ? "red" : "#ccc";
    return (
      <div style={{ background: "#222", color: "#fff", padding: 8, borderRadius: 4, fontSize: 12 }}>
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
    const item = pieData[index];
    if (!item) return null;

    let arrowColor = "#ccc";
    if (showArrow) {
      if (item.increased) arrowColor = "green";
      else if (item.decreased) arrowColor = "red";
    }

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
        <tspan fill={arrowColor}>{showArrow ? item.symbol + " " : ""}</tspan>
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
              {pieData.map((_, i) => (
                <linearGradient key={i} id={`evGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={getColor(i)} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={getDark(i)} stopOpacity={0.3} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={pieData}
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
              {pieData.map((_, i) => (
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

const DynamicPieChart = ({ piedata }) => {
  const [sortedLegend, setSortedLegend] = useState([]);

  if (!piedata || piedata.length === 0) return null;

  const dateKeys = Object.keys(piedata[0]).filter((k) => k !== "name");
  if (dateKeys.length < 2) return null;

  return (
    <div className="container-fluid px-md-5">
      <div className="row">
        <ChartWithComparison
          data={piedata}
          current={dateKeys[1]}
          compare={dateKeys[0]}
          title={`MoM - ${dateKeys[1]}`}
          showArrow={false}
          onSortedData={setSortedLegend}
        />
        <ChartWithComparison
          data={piedata}
          current={dateKeys[0]}
          compare={dateKeys[1]}
          title={`MoM - ${dateKeys[0]}`}
          showArrow={true}
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
              <span style={{ fontSize: "0.6rem", textAlign: "center" }}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DynamicPieChart;
