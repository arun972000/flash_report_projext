'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function ReportsFooter() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const toggleDisclaimer = () => {
    setShowDisclaimer(!showDisclaimer);
  };

  return (
    <>
      <footer className="app-footer">
        <span className="copyright">
          © Copyright 2025 RACE EDITORIALE LLP – All Rights Reserved.
        </span>
        <nav className="links">
          <Link href="https://raceautoindia.com/page/terms-conditions" legacyBehavior>
            <a className="footer-link">Terms & Conditions</a>
          </Link>
          <span className="separator">•</span>
          <Link href="https://raceautoindia.com/page/privacy" legacyBehavior>
            <a className="footer-link">Privacy Policy</a>
          </Link>
          <span className="separator">•</span>
          <Link href="https://raceautoindia.com/page/contact" legacyBehavior>
            <a className="footer-link">Contact Us</a>
          </Link>
          <span className="separator">•</span>
          {/* Disclaimer Button */}
          <button className="footer-link disclaimer-button" onClick={toggleDisclaimer}>
            Disclaimer
          </button>
        </nav>
      </footer>

      {/* Disclaimer Popup */}
      <div className={`disclaimer-popup ${showDisclaimer ? 'show' : ''}`}>
        <button className="close-button" onClick={toggleDisclaimer}>
          &times;
        </button>
        <div className="disclaimer-content">
          <p>
            Race Editoriale LLP considers its sources reliable and verifies as much data as possible. However,
            reporting inaccuracies can occur, consequently, readers using this information do so at their own risk.
          </p>
          <p>
            While every effort has been made to ensure that information is correct at the time of publishing, Race
            Editoriale LLP cannot be held responsible for the outcome of any action or decision based on the
            information contained in this publication.
          </p>
          <p>
            © Race Editoriale LLP 2024. All rights reserved. No part of this publication may be reproduced, stored
            in a retrieval system, or transmitted in any form without prior written permission of the publisher.
          </p>
          <p>
            Permission is only deemed valid if approval is in writing. Race Editoriale LLP by all rights to
            contributions, text, and images, unless previously agreed to in writing.
          </p>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .app-footer {
          margin-top: 1rem;
          padding: 1rem 0;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          background: var(--bg);
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-align: center;
          margin-bottom: 0;
        }

        @media (max-width: 575px) {
    .app-footer {
      margin-bottom: 65px; /* 50px bottom margin ONLY on mobile */
    }
  }

        .links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }

        .separator {
          color: rgba(255, 255, 255, 0.5);
        }

        .footer-link {
          color: inherit;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          transition: color 200ms ease, transform 200ms ease;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          font: inherit;
        }

        .footer-link:hover {
          color: var(--accent);
          transform: translateY(-0.125rem);
        }

        @media (min-width: 40rem) {
          .app-footer {
            flex-direction: row;
            justify-content: center;
            text-align: left;
            gap: 1rem;
            padding: 1rem 2rem;
          }
          .links {
            gap: 0.75rem;
          }
        }

        @media (min-width: 64rem) {
          .app-footer {
            margin-top: 1.5rem;
            padding: 1.25rem 0;
            gap: 1rem;
          }
          .links {
            gap: 1rem;
          }
        }

        .disclaimer-popup {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          background: #111;
          color: #eee;
          padding: 1rem 1.5rem;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          max-height: 250px;
          overflow-y: auto;
          font-size: 0.875rem;
          line-height: 1.5;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          transform: translateY(100%);
          opacity: 0;
          visibility: hidden;
          transition: transform 0.4s ease, opacity 0.4s ease, visibility 0.4s;
        }

        .disclaimer-popup.show {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }

        .disclaimer-content p {
          margin: 0.5rem 0;
          text-align: justify;
        }

        .close-button {
          position: absolute;
          top: 0.5rem;
          right: 1rem;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
        }

        .close-button:hover {
          color: var(--accent);
        }
      `}</style>
    </>
  );
}
