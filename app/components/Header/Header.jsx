'use client'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion';
import Link from 'next/link';
import "./Header.css"

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
    <div className="app-header px-3 py-2 d-flex flex-column flex-md-row align-items-center justify-content-between w-100">

      <Link href="/" passHref>
        <motion.div
          className="logo-container mb-2 mb-md-0"
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
            src="/images/rai.png"
            alt="Race Auto India"
            className="app-logo"
            width={230}
            height={80}
          />
        </motion.div>
      </Link>

      {edition && (
        <div
          className="edition-label text-center text-md-end"
          style={{ color: '#ffc107', fontWeight: 'bold', fontSize: '1rem' }}
        >
          {edition}
        </div>
      )}
    </div>
  );
};

export default Header;
