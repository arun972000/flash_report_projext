'use client';

import React, { useState, useMemo, useEffect } from 'react';
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

export default function DummyBarChart({ segmentName }) {
  const [rawData, setRawData] = useState({});
  const [monthKeys, setMonthKeys] = useState([]);

  useEffect(() => {
    const fetchBarData = async () => {
      if (!segmentName) return;

      try {
        const res = await fetch(`/api/fetchMarketBarData?segmentName=${segmentName}`);
        const json = await res.json();
        setRawData(json);

        // auto-pick keys
        const first = Object.values(json)?.[0];
        if (first) {
          const keys = Object.keys(first);
          setMonthKeys(keys);
        }
      } catch (err) {
        console.error("Error fetching bar chart data:", err);
      }
    };

    fetchBarData();
  }, [segmentName]);

  const [leftMonth, rightMonth] = monthKeys;

  const leftData = useMemo(() =>
    ALL_CATS.map(cat => ({
      category: cat,
      value: rawData?.[cat]?.[leftMonth] || 0,
    })), [rawData, leftMonth]
  );

  const rightData = useMemo(() =>
    ALL_CATS.map(cat => {
      const base = rawData?.[cat]?.[leftMonth] || 0;
      const current = rawData?.[cat]?.[rightMonth] || 0;
      const delta = parseFloat((current - base).toFixed(1));
      return {
        category: cat,
        value: current,
        delta,
      };
    }), [rawData, leftMonth, rightMonth]
  );

  const renderDelta = ({ x, y, value }) => {
    const symbol = value > 0 ? '▲' : value < 0 ? '▼' : '';
    const color = value > 0 ? 'green' : value < 0 ? 'red' : 'gray';
    return (
      <text x={x + 5} y={y + 32} fontSize={14} fill={color}>
        {symbol}{Math.abs(value)}%
      </text>
    );
  };

  const hasData = leftMonth && rightMonth;

  return (
    <div className="border-0 mb-4 mt-2">
      <div className="card-body">
        {hasData ? (
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-center mb-2">{leftMonth}</h6>
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
                  <Bar dataKey="value" fill={BAR_COLOR} name={leftMonth} barSize={16}>
                    <LabelList dataKey="value" position="right" formatter={val => `${val.toFixed(1)}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="col-md-6">
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
                  <Bar dataKey="value" fill="#fec602" name={rightMonth} barSize={16}>
                    <LabelList dataKey="value" position="right" formatter={val => `${val.toFixed(1)}%`} />
                    <LabelList dataKey="delta" content={renderDelta} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center text-white py-5">No data available for this segment.</div>
        )}
      </div>
    </div>
  );
}
