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
  { name: "MAHINDRA & MAHINDRA LIMITED (TRACTOR)", May25: 23.72, Jun25: 23.29, Jun24: 23.49 },
  { name: "MAHINDRA & MAHINDRA LIMITED (SWARAJ DIVISION)", May25: 19.60, Jun25: 18.99, Jun24: 19.13 },
  { name: "INTERNATIONAL TRACTORS LIMITED", May25: 13.81, Jun25: 13.47, Jun24: 13.30 },
  { name: "ESCORTS KUBOTA LIMITED (AGRI MACHINERY GROUP)", May25: 11.73, Jun25: 11.22, Jun24: 10.85 },
  { name: "TAFE LIMITED", May25: 10.77, Jun25: 13.04, Jun24: 12.44 },
  { name: "JOHN DEERE INDIA PVT LTD (TRACTOR DEVISION)", May25: 8.40, Jun25: 8.19, Jun24: 7.87 },
  { name: "EICHER TRACTORS", May25: 6.19, Jun25: 6.24, Jun24: 6.65 },
  { name: "CNH INDUSTRIAL (INDIA) PVT LTD", May25: 4.34, Jun25: 4.45, Jun24: 4.08 },
  { name: "KUBOTA AGRICULTURAL MACHINERY INDIA PVT.LTD.", May25: 1.14, Jun25: 0.84, Jun24: 1.76 },
  { name: "Others", May25: 0.29, Jun25: 0.27, Jun24: 0.43 },
];

const companyNames = companyData.map(item => item.name);

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
        Value: {value.toFixed(2)}% {symbol}
      </div>
    );
  };

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    outerRadius,
    index,
    value,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const item = data[index];
    if (!item) return null;

    let arrowColor = "white";
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
    <div className="col-12 col-sm-6 col-md-6 mb-4">
      <h6 className="text-center fw-semibold mb-2">{title}</h6>
      <div style={{ width: "100%", height: isMobile ? 260 : 300 }}>
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

const Tractor_PieChart = () => {
  return (
    <div className="container-fluid px-md-5">
      <div className="row mb-4">
        <div className="col text-center">
          <h5 className="text-warning fs-5 fs-md-4">Tractor Overall OEM Share Comparison</h5>
        </div>
      </div>

      <div className="row">
        <ChartWithComparison current="May25" compare="Jun24" title="Month on Month (MoM) - May 25" />
        <ChartWithComparison current="Jun25" compare="May25" title="Month on Month (MoM) - Jun 25" />
        <ChartWithComparison current="Jun24" compare="Jun25" title="Year on Year (YoY) - Jun 24" />
        <ChartWithComparison current="Jun25" compare="Jun24" title="Year on Year (YoY) - Jun 25" />
      </div>

      {/* Shared Legend */}
      <div className="mt-1 text-center">
        <div className="d-flex flex-wrap justify-content-center gap-3" style={{ fontSize: '9px', lineHeight: '1.2' }}>
          {companyNames.map((name, i) => (
            <div key={name} className="d-flex align-items-center">
              <div
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: getColor(i),
                  marginRight: 6,
                  borderRadius: "50%",
                }}
              />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tractor_PieChart;
