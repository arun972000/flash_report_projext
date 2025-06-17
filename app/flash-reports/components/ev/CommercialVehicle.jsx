'use client';

import React from 'react';

const commercialData = [
  {
    category: "Truck Reports",
    data: [
      { metric: "Segment Split", forecast: "45%" },
      { metric: "Application Split", forecast: "58%" },
      { metric: "EV Penetration", forecast: "22%" }
    ],
  },
  {
    category: "Bus Reports",
    data: [
      { metric: "Segment Split", forecast: "38%" },
      { metric: "Application Split", forecast: "61%" },
      { metric: "EV Penetration", forecast: "29%" }
    ],
  }
];

const CommercialVehicleReport = () => {
  return (
    <div className="container my-5 position-relative">
      <h5 className="mb-4 text-center fw-bold">Commercial Vehicle Forecast Report</h5>
      
      <div className="table-responsive position-relative">
        <table className="table table-bordered table-striped align-middle">
          <thead className="table-dark">
            <tr>
              <th style={{ width: "30%" }}>Category</th>
              <th style={{ width: "40%" }}>Metric</th>
              <th style={{ width: "30%" }}>Forecast</th>
            </tr>
          </thead>
          <tbody>
            {commercialData.map((section, idx) => (
              <React.Fragment key={idx}>
                <tr className="table-secondary fw-semibold">
                  <td rowSpan={section.data.length + 1}>{section.category}</td>
                </tr>
                {section.data.map((item, subIdx) => (
                  <tr key={subIdx}>
                    <td>{item.metric}</td>
                    <td className="forecast-cell">{item.forecast}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Forecast blur and overlay */}
        <div
          style={{
            position: 'absolute',
            top: 40, // adjust based on table header height
            left: '70%',
            width: '30%',
            height: 'calc(100% - 56px)', // match table body height
            background: 'rgba(0,0,0,0.15)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#198754',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          🔒 Subscribe to the Platinum Package to access forecast values.
        </div>
      </div>
    </div>
  );
};

export default CommercialVehicleReport;
