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

  // ❌ Don't render anything on mobile
  if (isMobile) return null;

  const links = [
    { label: 'Overall Automotive Industry', href: '/' },
    { label: 'Two wheeler', href: '/two-wheeler' },
    { label: 'Three wheeler', href: '/three-wheeler' },
    { label: 'Commercial Vehicles', href: '/commercial-vehicle' },
    { label: 'Passenger Vehicles', href: '/passenger-vehicle' },
    { label: 'Tractor', href: '/tractor' },
  ];

  const linkStyle = {
    fontSize: '1.5rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
  };

  return (
    <div className="text-center text-lg-start contents-container">
      <h1 style={{ marginBottom: '1rem' }}>CONTENTS</h1>

      <ul className="list-unstyled" style={{ paddingLeft: 0 }}>
        {links.map(({ label, href }) => {
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
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Contents;
