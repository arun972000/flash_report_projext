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
  { label: 'Year on Year (YoY)', value: "MAY'24" },
  { label: 'Month on Month (MoM)', value: "APR'25" },
];

const RIGHT_MONTH = "MAY'25";
const ALL_CATS = ['2W', '3W', 'PV', 'Tractor', 'CV'];
const RAW_DATA = {
  '2W': { "MAY'24": 5.5, "APR'25": 9.7, "MAY'25": 6.1 },
  '3W': { "MAY'24": 54.4, "APR'25": 57.5, "MAY'25": 56.5 },
  'PV': { "MAY'24": 4.2, "APR'25": 5.6, "MAY'25": 5.7 },
  'Tractor': { "MAY'24": 2.4, "APR'25": 1.6, "MAY'25": 2.7 },
  'CV': { "MAY'24": 7.4, "APR'25": 9.4, "MAY'25": 8.9 },
};
const BAR_COLOR = '#3ab8b4';

export default function DummyBarChart() {
  const [selectedMonth, setSelectedMonth] = useState("APR'25");

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
    <div className=" border-0 mb-4 mt-2">
    
      <div className="card-body">
        <div className="mb-3 text-center">
          <span className="me-2">Select Comparison Type:</span>
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

          {/* Right Chart - MAY'25 */}
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
                <Bar dataKey="value" fill="#81ea81" name={RIGHT_MONTH} barSize={16}>
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
