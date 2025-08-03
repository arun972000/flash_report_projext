'use client'

import Link from 'next/link'
import { FaMotorcycle, FaTruckPickup, FaCarSide, FaTractor, FaHome } from 'react-icons/fa'
import { MdOutlineBikeScooter } from 'react-icons/md'

const BottomMenuBar = () => (
  <>
    <nav className="bottom-menu">
      <Link href="/flash-reports" aria-label="Home" className="menu-item">
        <div className="icon-wrapper">
          <FaHome size={24} />
          <span className="label">Home</span>
        </div>
      </Link>

      <Link href="/flash-reports/two-wheeler" aria-label="Two Wheeler" className="menu-item">
        <div className="icon-wrapper">
          <FaMotorcycle size={24} />
          <span className="label">2W</span>
        </div>
      </Link>

      <Link href="/flash-reports/three-wheeler" aria-label="Three Wheeler" className="menu-item">
        <div className="icon-wrapper">
          <MdOutlineBikeScooter size={24} />
          <span className="label">3W</span>
        </div>
      </Link>

      <Link href="/flash-reports/passenger-vehicle" aria-label="Passenger Vehicle" className="menu-item">
        <div className="icon-wrapper">
          <FaCarSide size={24} />
          <span className="label">PV</span>
        </div>
      </Link>

      <Link href="/flash-reports/commercial-vehicle" aria-label="Commercial Vehicle" className="menu-item">
        <div className="icon-wrapper">
          <FaTruckPickup size={24} />
          <span className="label">CV</span>
        </div>
      </Link>

      <Link href="/flash-reports/tractor" aria-label="Tractor" className="menu-item">
        <div className="icon-wrapper">
          <FaTractor size={24} />
          <span className="label">Tractor</span>
        </div>
      </Link>
    </nav>

    <style jsx>{`
      .bottom-menu {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: #fff;
        border-top: 1px solid #ddd;
        display: flex;
        justify-content: space-around;
        align-items: center;
        z-index: 1000;
      }

      .menu-item {
        color: #444;
        text-decoration: none;
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        font-size: 12px;
        transition: color 0.3s ease;
      }

      .menu-item:hover,
      .menu-item:focus {
        color: black;
      }

      .icon-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .label {
        font-size: 11px;
        margin-top: 2px;
      }

      @media (min-width: 769px) {
        .bottom-menu {
          display: none;
        }
      }
    `}</style>
  </>
)

export default BottomMenuBar

