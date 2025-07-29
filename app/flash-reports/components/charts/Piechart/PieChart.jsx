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

const ChartWithComparison = ({ data, title, showArrow, colorMap }) => {
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
              {data.map((entry, i) => (
                <Cell key={i} fill={colorMap[entry.name] || getColor(i)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const monthsList = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const systemMonthIndex = new Date().getMonth();
const effectiveCurrentMonthIndex = systemMonthIndex - 1 >= 0 ? systemMonthIndex - 1 : 11;
const availableMonths = monthsList.slice(0, effectiveCurrentMonthIndex + 1);

const TwoWheelerChart = ({ segmentName, segmentType }) => {
  const [piedata, setPiedata] = useState([]);
  const [mode, setMode] = useState("mom");
  const [selectedMonth, setSelectedMonth] = useState(monthsList[effectiveCurrentMonthIndex]);
  const [sortedLegend, setSortedLegend] = useState([]);
console.log(segmentName)
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/fetchMarketData?segmentName=${segmentName}&selectedMonth=${selectedMonth}&mode=${mode}&segmentType=${segmentType}`);
      const json = await res.json();
      setPiedata(json);
    } catch (err) {
      console.error("Client fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mode, selectedMonth]);

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const monthIndex = monthsList.indexOf(selectedMonth);
  const prevMonth = monthsList[monthIndex - 1] || "dec";

  const [prevKey, currKey] = useMemo(() => {
    const currentMonthKey = `${selectedMonth} ${currentYear}`;
    const previousMonthKey = mode === 'mom'
      ? `${prevMonth} ${currentYear}`
      : `${selectedMonth} ${lastYear}`;
    return [previousMonthKey, currentMonthKey];
  }, [selectedMonth, mode, currentYear, lastYear, prevMonth]);

  const processedData = useMemo(() => {
    return piedata.map((item) => {
      const prev = parseFloat(item[prevKey]) || 0;
      const curr = parseFloat(item[currKey]) || 0;
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
  }, [piedata, prevKey, currKey]);

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

  const colorMap = useMemo(() => {
    const map = {};
    processedData.forEach((item, i) => {
      map[item.name] = getColor(i);
    });
    return map;
  }, [processedData]);

  const hasData = piedata.length > 0 && piedata[0][currKey] !== undefined && piedata[0][prevKey] !== undefined;

  return (
    <div className="container-fluid px-md-5">
      <div className="mb-3 text-center d-flex flex-wrap justify-content-center gap-2">
        <button className={`btn ${mode === "mom" ? "btn-primary" : "btn-light"}`} onClick={() => setMode("mom")}>Month on Month</button>
        <button className={`btn ${mode === "yoy" ? "btn-primary" : "btn-light"}`} onClick={() => setMode("yoy")}>Year on Year</button>
        <select
          className="form-select w-auto"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {availableMonths.map((m) => (
            <option key={m} value={m}>{m.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {hasData ? (
        <>
          <div className="row">
            <ChartWithComparison
              data={piedata.map((d) => ({
                name: d.name,
                value: parseFloat(d[prevKey]) || 0,
              }))}
              title={`${prevKey.toUpperCase()}`}
              showArrow={false}
              colorMap={colorMap}
            />
            <ChartWithComparison
              data={processedData}
              title={`${currKey.toUpperCase()}`}
              showArrow={true}
              colorMap={colorMap}
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
                      backgroundColor: colorMap[item.name],
                      marginRight: 6,
                      borderRadius: "50%",
                    }}
                  />
                  <span style={{ fontSize: "0.6rem" }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-white py-5">No data available for this selected month.</div>
      )}
    </div>
  );
};

export default TwoWheelerChart;
