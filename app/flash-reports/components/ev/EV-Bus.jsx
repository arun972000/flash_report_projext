'use client';

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#003f5c", "#2f4b7c", "#665191", "#a05195", "#d45087",
  "#f95d6a", "#ff7c43", "#ffa600", "#84c0c6", "#bc5090", "#dd5182"
];

const companyData = [
  { name: "PMI ELECTRO MOBILITY", Apr25: 66.2, Mar25: 9.03 },
  { name: "JBM AUTO", Apr25: 16.2, Mar25: 1.44 },
  { name: "OLECTRA GREENTECH", Apr25: 8.8, Mar25: 27.44 },
  { name: "VE COMMERCIAL VEHICLES", Apr25: 4.2, Mar25: 0 },
  { name: "TATA MOTORS", Apr25: 2.1, Mar25: 8.66 },
  { name: "PINNACLE MOBILITY", Apr25: 1.1, Mar25: 0.36 },
  { name: "VEERA VIDYUTH VAHANA", Apr25: 0.7, Mar25: 1.44 },
  { name: "MYTRAH MOBILITY", Apr25: 0.4, Mar25: 0 },
  { name: "VEERA VAHANA UDYOG", Apr25: 0.4, Mar25: 0.72 },
  { name: "AEROEAGLE AUTOMOBILES", Apr25: 0, Mar25: 10.11 },
  { name: "SWITCH MOBILITY AUTOMOTIVE", Apr25: 0, Mar25: 40.79 },
];

const momMonths = ["Apr25", "Mar25"];
const companyNames = companyData.map(item => item.name);
const colorMap = {};
companyNames.forEach((name, index) => {
  colorMap[name] = COLORS[index % COLORS.length];
});

const EVMarketShare = () => {
  const [selectedMoM, setSelectedMoM] = useState("Apr25");

  const getData = (monthKey) =>
    companyData
      .filter(item => item[monthKey] && item[monthKey] > 0)
      .map(item => ({
        name: item.name,
        value: item[monthKey],
      }));

  const renderLabel = ({ percent }) =>
    `${(percent * 100).toFixed(1)}%`;

  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col text-center">
          <h5>Electric Bus Market Share – {selectedMoM}</h5>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12 mb-4">
          <label className="form-label fw-semibold">Month</label>
          <select
            value={selectedMoM}
            onChange={(e) => setSelectedMoM(e.target.value)}
            className="form-select mb-3"
            style={{ maxWidth: 160 }}
          >
            {momMonths.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={getData(selectedMoM)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={90}
                  label={renderLabel}
                >
                  {getData(selectedMoM).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colorMap[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Shared Legend */}
      <div className="mt-4 text-center">
        <div className="d-flex flex-wrap justify-content-center gap-3">
          {companyNames.map((name) => (
            <div key={name} className="d-flex align-items-center">
              <div
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: colorMap[name],
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

export default EVMarketShare;
