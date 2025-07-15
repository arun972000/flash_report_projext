/* eslint-disable react/no-unescaped-entities */
'use client'
import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import './signup.css'

import { toast } from "react-toastify";

// Validation schema for form fields with strong password
const validationSchema = Yup.object().shape({
  username: Yup.string().min(3, "Username must be at least 3 characters").required("Username is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], "Passwords must match")
    .required("Confirm password is required"),
});

const SignupForm = ({ onSuccess }) => {
  const [error, setError] = useState("");


  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError("");
      await axios.post("https://raceautoindia.com/api/admin/forecast-auth-register", values);
      await axios.post('/api/admin/forecast-login', values);
      toast.info("Login success", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      onSuccess();
      window.location.reload();

    } catch (error) {
      if (error.response) {
        if (error.response.status === 409) {
          setError("Account already exists.");
        } else if (error.response.status === 400) {
          setError("Invalid data. Please check your inputs.");
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } else {
        setError("Network error. Please check your internet connection.");
      }
    } finally {
      setSubmitting(false);
    }
  };




  return (
    <div className="signup-box px-3 py-2">
      {error && <Alert variant="danger">{error}</Alert>}

      <Formik
        initialValues={{ username: "", email: "", password: "", confirmPassword: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, handleChange, values, touched, errors, isSubmitting }) => (
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Control
                type="text"
                name="username"
                value={values.username}
                onChange={handleChange}
                isInvalid={touched.username && errors.username}
                placeholder="Enter username"
                style={{ border: '1px solid #000', boxShadow: 'none' }}
              />
              <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Control
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                isInvalid={touched.email && errors.email}
                placeholder="Enter email"
                style={{ border: '1px solid #000', boxShadow: 'none' }}
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Control
                type="password"
                name="password"
                value={values.password}
                onChange={handleChange}
                isInvalid={touched.password && errors.password}
                placeholder="Password"
                style={{ border: '1px solid #000', boxShadow: 'none' }}
              />
              <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <Form.Control
                type="password"
                name="confirmPassword"
                value={values.confirmPassword}
                onChange={handleChange}
                isInvalid={touched.confirmPassword && errors.confirmPassword}
                placeholder="Confirm password"
                style={{ border: '1px solid #000', boxShadow: 'none' }}
              />
              <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
            </Form.Group>
            <Button variant="dark" type="submit" disabled={isSubmitting} className="w-100">
              {isSubmitting ? "Signing up..." : "Sign Up"}
            </Button>

          </Form>
        )}
      </Formik>

    </div>
  );
};

export default SignupForm;
