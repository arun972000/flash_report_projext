import React from 'react';

const formatValue = (num) => {
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const ForecastTable = () => {
  const startMonth = 6; // July
  const months = Array.from({ length: 7 }, (_, i) =>
    new Date(0, startMonth + i).toLocaleString('default', { month: 'short' })
  );

  const data = {
    LCV: [54321, 67890, 71234, 65432, 69876, 74321, 78900],
    MCV: [43210, 56789, 60123, 58900, 62000, 65500, 69000],
    HCV: [32100, 45678, 48000, 49500, 51000, 53000, 55000],
  };

  return (
    <div style={{ padding: 20, color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h3 style={{ marginBottom: 8 }}>Tipper Sales Performance</h3>
        <div style={{
          fontSize: '14px',
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
          {Object.keys(data).map((segment) => (
            <tr key={segment}>
              <td style={tdStyle}>{segment}</td>
              {data[segment].map((val, idx) => (
                <td key={idx} style={tdStyle}>{formatValue(val)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Horizontal Legend */}
      <div style={{
        marginTop: 20,
        display: 'flex',
        justifyContent: 'space-around',
        gap: '20px',
        fontSize: '13px',
        flexWrap: 'wrap',
        lineHeight: '1.6',
        color: '#ddd'
      }}>
        <div><strong>LCV</strong>: Light Commercial Vehicle <span style={{ color: '#aaa' }}>(2–7.5 Ton GVW)</span></div>
        <div><strong>MCV</strong>: Medium Commercial Vehicle <span style={{ color: '#aaa' }}>({'>'} 7.5 Ton GVW)</span></div>
        <div><strong>HCV</strong>: Heavy Commercial Vehicle <span style={{ color: '#aaa' }}>({'>'} 7.5 Ton GVW)</span></div>
      </div>
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
