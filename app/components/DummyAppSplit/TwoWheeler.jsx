'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Private use', value: 69.5 },
  { name: 'Delivery & logistics', value: 8.55 },
  { name: 'Rental/sharing services', value: 6.85 },
  { name: 'Business/corporate fleets', value: 3.15 },
  { name: 'Others (govt/exports)', value: 11.95 },
];

// 🎨 One color per slice, matching the order of data
const colors = [
  '#4e79a7', // Private use
  '#f28e2c', // Delivery & logistics
  '#e15759', // Rental/sharing services
  '#76b7b2', // Business/corporate fleets
  '#59a14f', // Others
];

const renderLabel = ({ percent }) => `${(percent * 100).toFixed(0)}%`;

const DummyTwoWheelerApp = () => {
  const router = useRouter();
  const [hovering, setHovering] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', height: 450 }}>
      <div
        style={{ position: 'relative', width: '100%', height: 350 }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={renderLabel}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="row justify-content-center mt-3">
        {data.map((entry, index) => (
          <div
            key={index}
            className="col-auto d-flex align-items-center mb-2 mx-2"
          >
            <div
              style={{
                width: 10,
                height: 10,
                backgroundColor: colors[index % colors.length],
                borderRadius: 3,
                marginRight: 8,
              }}
            />
            <span style={{ fontSize: '0.6rem', textAlign: 'left' }}>
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DummyTwoWheelerApp;
