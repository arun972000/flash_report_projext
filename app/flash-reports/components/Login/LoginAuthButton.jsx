"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import AuthModal from "./LoginModal";
import { useAuthModal } from "@/utils/AuthModalcontext";
import { useRouter } from "next/navigation"; // ✅ Import useRouter

const LoginNavButton = () => {
  const [token, setToken] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const { show, open, close } = useAuthModal();
  const router = useRouter(); // ✅ Initialize router

  useEffect(() => {
    setIsMounted(true);
    const cookieToken = Cookies.get("authToken") || null;
    setToken(cookieToken);

    if (!cookieToken) {
      open(); // auto open modal if not logged in
    }
  }, []);

  if (!isMounted) return null;

  const handleLogout = () => {
    Cookies.remove("authToken");
    setToken(null);
    router.refresh(); // ✅ Refresh the current path
  };

  return (
    <>
      {!token ? (
        <>
          <button
            className="nav-btn ms-auto"
            onClick={open}
            style={{ cursor: "pointer" }}
          >
            Login
          </button>
          {show && <AuthModal show={show} onClose={close} />}
        </>
      ) : (
        <button
          className="nav-btn ms-auto"
          onClick={handleLogout}
          style={{ cursor: "pointer", backgroundColor: "#cc2936", color: "#fff" }}
        >
          Logout
        </button>
      )}

      <style>
        {`.nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #1F2023;
          color: #15AFE4;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          transition:
            background 300ms ease-in-out,
            color 300ms ease-in-out,
            box-shadow 300ms ease-in-out,
            transform 200ms ease-in-out;
        }

        .nav-btn:hover {
          background: linear-gradient(135deg, var(--accent), var(--surface));
          color: #fff;
          box-shadow: 0 6px 16px rgba(0,0,0,0.3);
          transform: translateY(-2px);
        }`}
      </style>
    </>
  );
};

export default LoginNavButton;
