// app/components/AuthModal.jsx
"use client";
import React from "react";
import { Modal, CloseButton } from "react-bootstrap";
import LoginForm from "./LoginForm";


export default function AuthModal({ show, onClose }) {

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            size="sm"
        >
            <Modal.Body className="position-relative">
                {/* Custom close button inside body */}
                <div className="position-absolute top-0 end-0 m-2">
                    <CloseButton onClick={onClose} />
                </div>

                {/* Toggle buttons with spacing and styles */}
                <div className="d-flex justify-content-center mb-3 ">
                
                        <p

                            className={'p-0 m-0 text-center text-muted mt-2'}
                        >
                            Please enter your Race Auto India login credentials below
                        </p>
        
                </div>


                <LoginForm onSuccess={onClose} />

            </Modal.Body>
        </Modal>
    );
}
