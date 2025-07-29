'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const colors = [
  '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
  '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ab',
];

const renderLabel = ({ percent }) => `${(percent * 100).toFixed(0)}%`;

const monthsOrder = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

const ApplicationChart = ({ segmentName, segmentType = 'app' }) => {
  const [data, setData] = useState([]);
  const [month, setMonth] = useState('');

  const fetchAppData = async () => {
    try {
      const res = await fetch(`/api/fetchAppData?segmentName=${segmentName}&segmentType=${segmentType}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching app chart data:", err);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, [segmentName, segmentType]);

  const availableMonths = useMemo(() => {
    const first = data[0] || {};
    return Object.keys(first)
      .filter(key => key !== 'name')
      .sort((a, b) => {
        const [ma, ya] = a.split(' ');
        const [mb, yb] = b.split(' ');
        const da = new Date(`${ya}-${monthsOrder.indexOf(ma.toLowerCase()) + 1}-01`);
        const db = new Date(`${yb}-${monthsOrder.indexOf(mb.toLowerCase()) + 1}-01`);
        return da - db;
      });
  }, [data]);

  useEffect(() => {
    if (!availableMonths.length) return;

    // Define "effective current month"
    const today = new Date();
    const effectiveMonth = monthsOrder[today.getMonth() - 1]; // previous month
    const currentYear = today.getFullYear();
    const currentKey = `${effectiveMonth} ${currentYear}`;

    // Set month: use currentKey if exists, else fallback to latest
    const fallback = availableMonths.includes(currentKey)
      ? currentKey
      : availableMonths[availableMonths.length - 1];

    setMonth(fallback);
  }, [availableMonths]);

  const pieData = useMemo(() => {
    return data.map(item => ({
      name: item.name,
      value: item[month] ?? 0,
    }));
  }, [data, month]);

  if (!month || pieData.length === 0) {
    return <div className="text-center text-white py-5">No data available for this segment.</div>;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 450 }}>
      {/* Month Selector */}
      {availableMonths.length > 1 && (
        <div style={{ textAlign: 'right', marginBottom: 12 }}>
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ padding: '4px 8px', fontSize: 14 }}
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{m.toUpperCase()}</option>
            ))}
          </select>
        </div>
      )}

      {/* Chart Heading */}
      <h6 className="text-center text-uppercase mb-3">
        {month}
      </h6>

      {/* Pie Chart */}
      <div style={{ position: 'relative', width: '100%', height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={renderLabel}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="row justify-content-center mt-3">
        {pieData.map((entry, index) => (
          <div key={index} className="col-auto d-flex align-items-center mb-2 mx-2">
            <div
              style={{
                width: 10,
                height: 10,
                backgroundColor: colors[index % colors.length],
                borderRadius: 3,
                marginRight: 8,
              }}
            />
            <span style={{ fontSize: '0.6rem', textAlign: 'left' }}>{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicationChart;
