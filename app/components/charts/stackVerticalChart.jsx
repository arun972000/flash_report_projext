'use client'

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

const renderLabel = (props) => {
  const { x, y, width, height, value } = props;
  return (
    <text
      x={x + width + 5} // position right of the bar
      y={y + height / 2}
      fill="#000"
      textAnchor="start"
      dominantBaseline="middle"
      fontSize={12}
    >
      {value}%
    </text>
  );
};

const CommercialSegmentChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await fetch('/api/commercial-segment');
        const json = await res.json();

        const formatted = json.map((item) => ({
          month: item.month,
          hcv: Number(item.hcv),
          mcv: Number(item.mcv),
          lcv: Number(item.lcv),
        }));

        setData(formatted);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, []);

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 50, left: 40, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="month" type="category" />
          <Tooltip />
          <Legend />
          <Bar dataKey="hcv" stackId="a" fill="#8884d8">
            <LabelList content={renderLabel} />
          </Bar>
          <Bar dataKey="mcv" stackId="a" fill="#82ca9d">
            <LabelList content={renderLabel} />
          </Bar>
          <Bar dataKey="lcv" stackId="a" fill="#ffc658">
            <LabelList content={renderLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CommercialSegmentChart;
