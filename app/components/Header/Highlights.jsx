'use client'

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./Header.css"

const Highlights = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [highlights, setHighlights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 575);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/admin/flash-dynamic/flash-reports-text'); // your API endpoint
        setHighlights(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load highlights');
        setLoading(false);
      }
    };

    fetchHighlights();
  }, []);

  const fontSize = isMobile ? 14 : 20; // smaller font on mobile
  const paddingVertical = isMobile ? 4 : 6; // less vertical padding on mobile

  if (loading) return <div>Loading highlights...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div
      style={{
        color: 'white',
        paddingLeft: isMobile ? '1rem' : '3rem',
        paddingRight: isMobile ? '1rem' : '3rem',
        paddingBottom: isMobile ? '1rem' : '1.5rem',
        paddingTop: isMobile ? '0.5rem' : '0.5rem',
      }}
      className="px-lg-5 pb-lg-4 pt-lg-2"
    >
      <h2 style={{ fontSize: isMobile ? '1.25rem' : '2rem' }}>
        Highlights of the Report
      </h2>
      <ul style={{ fontSize }}>
  {[
    { label: 'Two-Wheelers (2W)', key: 'highlighted_twowheeler' },
    { label: 'Three-Wheelers (3W)', key: 'highlighted_threewheeler' },
    { label: 'Passenger Vehicles (PV)', key: 'highlighted_passengervehicle' },
    { label: 'Commercial Vehicles (CV)', key: 'highlighted_commercialvehicle' },
    { label: 'Tractors', key: 'highlighted_tractor' },
  ].map(({ label, key }) => (
    <li
      key={key}
      style={{ padding: `${paddingVertical}px 0`, textAlign: 'justify' }}
    >
      <span style={{ color: '#0CDFFF', fontWeight: 'bold', marginRight: 6 }}>
        {label}:
      </span>
      <span
        style={{ display: 'inline' }}
        className="highlight-content"
        dangerouslySetInnerHTML={{
          __html: highlights?.[key] || 'No data available.',
        }}
      />
    </li>
  ))}
</ul>


    </div>
  );
};

export default Highlights;
