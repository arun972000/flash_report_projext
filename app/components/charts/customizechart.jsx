'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

const ALL_CATS = ['2W', '3W', 'PV', 'Tractor', 'CV'];
const BAR_COLOR = '#3ab8b4';

export default function DualBarComparison() {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [rightMonth, setRightMonth] = useState('');
  const [rawData, setRawData] = useState({});
  const [comparisonOptions, setComparisonOptions] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/overall-bar');
        const data = await res.json();

        const monthMap = (monthStr) => {
          const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
          const [year, month] = monthStr.split('-');
          return `${months[parseInt(month, 10) - 1]}'${year.slice(2)}`;
        };

        const transformed = {};
        const monthSet = new Set();

        ALL_CATS.forEach(cat => {
          transformed[cat] = {};
        });

        data.forEach(row => {
          const monthKey = monthMap(row.month);
          monthSet.add(monthKey);
          transformed['2W'][monthKey] = row['2-wheeler'] ?? 0;
          transformed['3W'][monthKey] = row['3-wheeler'] ?? 0;
          transformed['PV'][monthKey] = row['passenger'] ?? 0;
          transformed['Tractor'][monthKey] = row['tractor'] ?? 0;
          transformed['CV'][monthKey] = row['cv'] ?? 0;
        });

        const sortedMonths = Array.from(monthSet).sort((a, b) => {
          const parseMonth = m => {
            const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
            const mon = monthNames.indexOf(m.slice(0, 3));
            const year = parseInt('20' + m.slice(4), 10);
            return year * 12 + mon;
          };
          return parseMonth(a) - parseMonth(b);
        });

        const latestMonth = sortedMonths[sortedMonths.length - 1];

        setRightMonth(latestMonth);

        const options = sortedMonths
          .filter(m => m !== latestMonth)
          .map(m => {
            const label = `Compare with ${m}`;
            return { label, value: m };
          });

        setComparisonOptions(options);

        if (options.length > 0) {
          setSelectedMonth(options[options.length - 1].value);
        }

        setRawData(transformed);
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    }

    fetchData();
  }, []);

  const toggleMonth = (month) => {
    setSelectedMonth(prev => (prev === month ? '' : month));
  };

  const leftData = useMemo(() =>
    ALL_CATS.map(cat => ({
      category: cat,
      value: rawData[cat]?.[selectedMonth] ?? 0,
    })), [selectedMonth, rawData]);

  const rightData = useMemo(() =>
    ALL_CATS.map(cat => {
      const base = rawData[cat]?.[selectedMonth] ?? 0;
      const current = rawData[cat]?.[rightMonth] ?? 0;
      const delta = parseFloat((current - base).toFixed(1));
      return {
        category: cat,
        value: current,
        delta,
      };
    }), [selectedMonth, rawData, rightMonth]);

  const renderDelta = ({ x, y, value }) => {
    const symbol = value > 0 ? '▲' : value < 0 ? '▼' : '';
    const color = value > 0 ? 'green' : value < 0 ? 'red' : 'gray';
    return (
      <text x={x + 5} y={y + 32} fontSize={14} fill={color}>
        {symbol}{Math.abs(value)}%
      </text>
    );
  };

  if (!rightMonth || Object.keys(rawData).length === 0) {
    return <div>Loading data...</div>;
  }

  return (
    <div className="border-0 mb-4 mt-2">
      <div className="card-body">
        <div className="mb-3 text-center">
          <span className="me-2">Select Comparison Type:</span>
          {comparisonOptions.map(({ label, value }) => (
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
          {/* Left Chart */}
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

          {/* Right Chart */}
          <div className={`col-md-${selectedMonth ? '6' : '12'}`}>
            <h6 className="text-center mb-2">{rightMonth}</h6>
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
                <Bar dataKey="value" fill="#81ea81" name={rightMonth} barSize={16}>
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
