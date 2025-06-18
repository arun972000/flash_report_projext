"use client";

import React from "react";
import { Modal, CloseButton } from "react-bootstrap";
import LoginForm from "./LoginForm";
import { usePathname } from "next/navigation";

export default function AuthModal({ show, onClose }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <Modal show={show} onHide={isHome ? onClose : undefined} centered size="sm">
      <Modal.Body className="position-relative">
        {/* Show close button only on home path */}
        {isHome && (
          <div className="position-absolute top-0 end-0 m-2">
            <CloseButton onClick={onClose} />
          </div>
        )}

        <div className="d-flex justify-content-center mb-3">
          <p className="p-0 m-0 text-center text-muted mt-2">
            Please enter your Race Auto India login credentials below
          </p>
        </div>

        <LoginForm onSuccess={onClose} />
      </Modal.Body>
    </Modal>
  );
}
