import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../api";
import { useToast } from "../Toast";

const MIN_PASSWORD_LENGTH = 6;

const RegistrationPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });
      show("Account created. You can now sign in.", "success");
      navigate("/login");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err &&
        typeof (err as { response?: { data?: { detail?: string } } }).response?.data?.detail === "string"
          ? (err as { response: { data: { detail: string } } }).response.data.detail
          : "Registration failed. Try again.";
      setError(message);
      show("Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
    <div className="card auth-card">
      <h2>Create account</h2>
      <p className="muted">Register as an end user to access chat, tickets, and the knowledge base.</p>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Full name (optional)
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError(null);
            }}
            placeholder="Your name"
            autoComplete="name"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="you@company.com"
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            placeholder="Repeat password"
            required
            autoComplete="new-password"
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem", marginBottom: 0, textAlign: "center" }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
    </div>
  );
};

export default RegistrationPage;
