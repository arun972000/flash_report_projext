'use client'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion';
import Link from 'next/link';
import "./Header.css"
import LoginNavButton from '@/app/flash-reports/components/Login/LoginAuthButton'

const Header = () => {
  const [isLogoHover, setLogoHover] = useState(false);
  const [edition, setEdition] = useState(null);

  useEffect(() => {
    fetch('/api/admin/flash-dynamic/flash-reports-text')
      .then(res => res.json())
      .then(data => {
        if (data?.flash_reports_edition) {
          setEdition(data.flash_reports_edition);
        }
      })
      .catch(console.error);
  }, []);

  return (

    <div className="app-header position-relative px-3 py-2 d-flex align-items-center justify-content-between w-100">
      {/* Logo - Left */}
      <Link href="/" passHref>
        <motion.div
          className="logo-container"
          onMouseEnter={() => setLogoHover(true)}
          onMouseLeave={() => setLogoHover(false)}
          animate={{
            scale: isLogoHover ? 1.05 : 1,
            filter: isLogoHover
              ? "drop-shadow(0 0 12px var(--accent, #FFDC00)) brightness(1.2) saturate(1.3)"
              : "none"
          }}
          transition={{
            scale: { type: "spring", stiffness: 300, damping: 20 },
            filter: { duration: 0.2 }
          }}
        >
          <Image
                  src="/images/race analyics new logo white.png"
                  alt="Race Auto India"
                  width={Math.round(160 * 1.5)}
                  height={Math.round(60 * 1.5)}
                />
        </motion.div>
      </Link>

      {/* Edition Label - Centered Absolute */}
      {edition && (
        <div
          className="position-absolute start-50 translate-middle-x text-center"
          style={{ color: '#ffc107', fontWeight: 'bold', fontSize: '1rem' }}
        >
          {edition}
        </div>
      )}

      {/* Login - Right */}
      <div className="ms-auto">
        <LoginNavButton />
      </div>
    </div>


  );
};

export default Header;
