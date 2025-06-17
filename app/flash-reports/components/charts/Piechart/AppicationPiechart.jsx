'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// 🎨 Color palette
const colors = [
  '#4e79a7',
  '#f28e2c',
  '#e15759',
  '#76b7b2',
  '#59a14f',
  '#edc948',
  '#b07aa1',
  '#ff9da7',
  '#9c755f',
  '#bab0ab',
];

const renderLabel = ({ percent }) => `${(percent * 100).toFixed(0)}%`;

/**
 * @param {{
 *   data: Array<{ name: string, [month: string]: number }>
 * }} props
 */
const ApplicationChart = ({ data = [] }) => {
  const router = useRouter();

  const availableMonths = useMemo(() => {
    const first = data[0] || {};
    return Object.keys(first).filter(key => key !== 'name').sort((a, b) => {
      const parseMonth = str => {
        const [mon, yr] = str.split(' ');
        const monthIndex = [
          'jan', 'feb', 'mar', 'apr', 'may', 'jun',
          'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
        ].indexOf(mon.toLowerCase());
        return new Date(`20${yr}`, monthIndex).getTime();
      };
      return parseMonth(a) - parseMonth(b);
    });
  }, [data]);

  const [month, setMonth] = useState(availableMonths.at(-1)); // default to latest month

  const pieData = useMemo(() => {
    return data.map(item => ({
      name: item.name,
      value: item[month] ?? 0,
    }));
  }, [data, month]);

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
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

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
