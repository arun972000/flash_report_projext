import React from 'react';

const ForecastTable = () => {
  const startMonth = 6; // July
  const months = Array.from({ length: 7 }, (_, i) =>
    new Date(0, startMonth + i).toLocaleString('default', { month: 'short' })
  );

  const data = {
    'Total Sales': [4257, 4022, 5015, 5856, 5122, 4568, 5950]
  };

  return (
    <div style={{ padding: 20, color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h3 style={{ marginBottom: 8 }}>Tipper Sales Performance</h3>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#ccc',
          paddingRight: '5px'
        }}>July 2025</div>
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: '#1e1e1e',
        fontSize: '14px'
      }}>
        <thead>
          <tr>
            <th style={thStyle}>Segment</th>
            {months.map((month) => (
              <th key={month} style={thStyle}>{month}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Total Sales</td>
            {data['Total Sales'].map((val, idx) => (
              <td key={idx} style={tdStyle}>{val}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const thStyle = {
  padding: '10px',
  backgroundColor: '#333',
  border: '1px solid #555',
  textAlign: 'center'
};

const tdStyle = {
  padding: '10px',
  border: '1px solid #555',
  textAlign: 'center'
};

export default ForecastTable;
