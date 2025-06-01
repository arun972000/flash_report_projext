'use client';

import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMediaQuery } from "react-responsive";
import axios from "axios";

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
  { light: "#9B5DE5", dark: "#6630A6" },
  { light: "#FEE440", dark: "#C6B000" },
  { light: "#00F5D4", dark: "#00A88F" },
  { light: "#C0CA33", dark: "#8A9A16" },
  { light: "#FF7043", dark: "#BF360C" },
  { light: "#8D6E63", dark: "#5D4037" },
  { light: "#FF6F00", dark: "#C45000" },
  { light: "#1E88E5", dark: "#125EA9" },
  { light: "#43A047", dark: "#2B702F" },
  { light: "#D81B60", dark: "#991042" },
  { light: "#F4511E", dark: "#B2360F" },
  { light: "#3949AB", dark: "#27317C" },
  { light: "#00897B", dark: "#005F56" },
  { light: "#90A4AE", dark: "#607D8B" },
  { light: "#B0EB00", dark: "#7DA300" },
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

// Helper to format the title nicely
const formatTitle = (type, dateKey) => {
  const typeMap = {
    MoM: "Month on Month (MoM)",
    YoY: "Year on Year (YoY)",
  };
  const formattedDate = dateKey.replace("_", " ");
  return `${typeMap[type] || type} - ${formattedDate}`;
};

const ChartWithComparison = ({ data, current, compare, title, showArrow }) => {
  const isMobile = useMediaQuery({ query: "(max-width: 576px)" });

  const pieData = getComparisonData(data, current, compare);

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
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const item = pieData[index];
    if (!item) return null;

    // Only show colored arrow if showArrow prop is true (i.e., on the right-side chart)
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

const TwoWheelerApplication = () => {
  const [data, setData] = useState([]);
  const [dateKeys, setDateKeys] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get("/api/2w-ev"); // Replace with real endpoint
      const payload = res.data || [];
      setData(payload);
      if (payload.length > 0) {
        const keys = Object.keys(payload[0]).filter(k => k !== "name");
        setDateKeys(keys);
      }
    };
    fetchData();
  }, []);

  const companyNames = data.map((item) => item.name);

  if (!data.length || dateKeys.length < 3) return null; // need at least 3 date keys for your charts

  return (
    <div className="container-fluid px-md-5">
      <div className="row mb-4">
        <div className="col text-center">
          <h4 style={{ color: "#59bea0" }}>2-Wheeler Application Segment</h4>
        </div>
      </div>

      <div className="row">
        {/* Left charts without colored arrow */}
        <ChartWithComparison
          data={data}
          current={dateKeys[1]}
          compare={dateKeys[0]}
          title={formatTitle("MoM", dateKeys[1])}
          showArrow={false}
        />
        {/* Right charts with colored arrow */}
        <ChartWithComparison
          data={data}
          current={dateKeys[2]}
          compare={dateKeys[1]}
          title={formatTitle("MoM", dateKeys[2])}
          showArrow={true}
        />
        {/* Left charts without colored arrow */}
        <ChartWithComparison
          data={data}
          current={dateKeys[0]}
          compare={dateKeys[2]}
          title={formatTitle("YoY", dateKeys[0])}
          showArrow={false}
        />
        {/* Right charts with colored arrow */}
        <ChartWithComparison
          data={data}
          current={dateKeys[2]}
          compare={dateKeys[0]}
          title={formatTitle("YoY", dateKeys[2])}
          showArrow={true}
        />
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

export default TwoWheelerApplication;
