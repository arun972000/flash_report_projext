"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { CiLogin } from "react-icons/ci";
import AuthModal from "./LoginModal";

const LoginNavButton = () => {
  const [token, setToken] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const cookieToken = Cookies.get("authToken");
    setToken(cookieToken);
  }, []);

  if (!token) {
    return (
      <>
        <button className='btn btn-primary ms-auto'
          onClick={() => setShowAuth(true)}
          style={{ cursor: "pointer" }}
        >Login</button>
        <AuthModal show={showAuth} onClose={() => setShowAuth(false)} />
      </>
    );
  }

  return null;
};

export default LoginNavButton;
