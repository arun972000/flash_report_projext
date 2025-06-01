'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Contents = () => {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 575);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const links = [
    { label: 'Overall Automotive Industry', href: '/' },
    { label: 'Two wheeler', href: '/two-wheeler' },
    { label: 'Three wheeler', href: '/three-wheeler' },
    { label: 'Commercial Vehicles', href: '/commercial-vehicle' },
    { label: 'Passenger Vehicles', href: '/passenger-vehicle' },
    { label: 'Tractor', href: '/tractor' },
  ];

  const headingStyle = isMobile
    ? { fontSize: '1rem', marginBottom: '0.5rem' }
    : {};

  const linkStyle = isMobile
    ? { fontSize: '0.9rem', paddingTop: '0.3rem', paddingBottom: '0.3rem' }
    : { fontSize: '1.5rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' };

  // Full width separator for all lines on mobile
  const separatorFull = {
    width: '100%',
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    margin: '6px 0',
    borderRadius: '1px',
  };

  return (
    <div className="text-center text-lg-start contents-container">
      <h1 style={headingStyle}>CONTENTS</h1>

      {/* Full width line above first item on mobile */}
      {isMobile && <div style={separatorFull} />}

      <ul className="list-unstyled" style={{ paddingLeft: 0 }}>
        {links.map(({ label, href }, idx) => {
          const isActive = pathname === href;

          return (
            <li key={href} style={{ ...linkStyle, position: 'relative' }}>
              <Link
                href={href}
                className={`text-decoration-none fw-${isActive ? 'bold' : 'normal'} ${
                  isActive ? 'text-primary' : 'text-white'
                } custom-hover`}
              >
                {label}
              </Link>

              {/* Full width separator line below each item except the last */}
              {isMobile && idx !== links.length - 1 && <div style={separatorFull} />}
            </li>
          );
        })}
      </ul>

      {/* Full width line below last item on mobile */}
      {isMobile && <div style={separatorFull} />}
    </div>
  );
};

export default Contents;
