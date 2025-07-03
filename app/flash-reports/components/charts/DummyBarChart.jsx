'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  CartesianGrid,
} from 'recharts';
import Form from 'react-bootstrap/Form';

const COMPARISON_OPTIONS = [
  { label: 'Month on Month (MoM)', value: "MAY'25" },
];

const RIGHT_MONTH = "JUN'25";
const ALL_CATS = ['2W', '3W', 'PV', 'Tractor', 'CV'];

// New data for May and Jun
const RAW_DATA = {
  '2W': { "MAY'25": 6.1, "JUN'25": 6.5 },
  '3W': { "MAY'25": 56.5, "JUN'25": 79 },
  'PV': { "MAY'25": 5.7, "JUN'25": 15.2 },
  'Tractor': { "MAY'25": 2.7, "JUN'25": 0.1 },
  'CV': { "MAY'25": 8.9, "JUN'25": 9.2 },
};

const BAR_COLOR = '#3ab8b4';

export default function DummyBarChart() {
  const [selectedMonth, setSelectedMonth] = useState("MAY'25");

  const toggleMonth = (month) => {
    setSelectedMonth(prev => (prev === month ? '' : month));
  };

  const leftData = useMemo(() =>
    ALL_CATS.map(cat => ({
      category: cat,
      value: RAW_DATA[cat][selectedMonth] || 0,
    }))
    , [selectedMonth]);

  const rightData = useMemo(() =>
    ALL_CATS.map(cat => {
      const base = RAW_DATA[cat][selectedMonth] || 0;
      const current = RAW_DATA[cat][RIGHT_MONTH] || 0;
      const delta = parseFloat((current - base).toFixed(1));
      return {
        category: cat,
        value: current,
        delta,
      };
    })
    , [selectedMonth]);

  const renderDelta = ({ x, y, value }) => {
    const symbol = value > 0 ? '▲' : value < 0 ? '▼' : '';
    const color = value > 0 ? 'green' : value < 0 ? 'red' : 'gray';
    return (
      <text x={x + 5} y={y + 32} fontSize={14} fill={color}>
        {symbol}{Math.abs(value)}%
      </text>
    );
  };

  return (
    <div className="border-0 mb-4 mt-2">
      <div className="card-body">
        <div className="mb-3 text-center">
          <span className="me-2">Comparison Type:</span>
          {COMPARISON_OPTIONS.map(({ label, value }) => (
            <Form.Check
              inline
              key={value}
              label={label}
              type="checkbox"
              id={`check-${value}`}
              style={{ color: '#ffdc00' }}
              checked={selectedMonth === value}
              onChange={() => toggleMonth(value)}
            />
          ))}
        </div>

        <div className="row">
          {/* Left Chart - Comparison Month */}
          {selectedMonth && (
            <div className="col-md-6">
              <h6 className="text-center mb-2">{selectedMonth}</h6>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  layout="vertical"
                  data={leftData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid stroke="#e9ecef" horizontal={false} vertical={false} />
                  <XAxis type="number" tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="category" />
                  <Tooltip formatter={v => `${v}%`} />
                  <Bar dataKey="value" fill={BAR_COLOR} name={selectedMonth} barSize={16}>
                    <LabelList dataKey="value" position="right" formatter={val => `${val.toFixed(1)}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Right Chart - JUN'25 */}
          <div className={`col-md-${selectedMonth ? '6' : '12'}`}>
            <h6 className="text-center mb-2">{RIGHT_MONTH}</h6>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={rightData}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid stroke="#e9ecef" horizontal={false} vertical={false} />
                <XAxis type="number" tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="category" />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="value" fill="#fec602" name={RIGHT_MONTH} barSize={16}>
                  <LabelList dataKey="value" position="right" formatter={val => `${val.toFixed(1)}%`} />
                  <LabelList dataKey="delta" content={renderDelta} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
