"use client";

import React, { useState } from "react";
import { Modal, CloseButton } from "react-bootstrap";
import LoginForm from "./LoginForm";
import { usePathname } from "next/navigation";
import SignupForm from '@/app/components/register/signup'

export default function AuthModal({ show, onClose }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mode, setMode] = useState("login");

  return (
    <Modal show={show} onHide={isHome ? onClose : undefined} centered size="sm">
      <Modal.Body className="position-relative">
        {/* Show close button only on home path */}
        {/* {isHome && (
          <div className="position-absolute top-0 end-0 m-2">
            <CloseButton onClick={onClose} />
          </div>
        )} */}

        <CloseButton onClick={onClose} />
        <div className="d-flex justify-content-center mb-3 ">
          <div className="btn-group me-3" role="group" >
            <button

              className={`btn ${mode === 'login' ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={`btn ${mode === 'register' ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
              onClick={() => setMode('register')}
            >
              Signup
            </button>
          </div>
        </div>

        {/* Forms */}
        {mode === "login" ? (
          <>
            <div className="d-flex justify-content-center mb-3">
              <p className="p-0 m-0 text-center text-muted mt-2">
                Please enter your Race Auto India login credentials below
              </p>
            </div>
            <LoginForm onSuccess={onClose} />
          </>
        ) : (
          <>
            <div className="d-flex justify-content-center mb-3">
              <p className="p-0 m-0 text-center text-muted mt-2">
                New to Race Auto India? Create an account below
              </p>
            </div>

            <SignupForm onSuccess={onClose} />
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
