import React, { useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";
import { useToast } from "../Toast";

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("ange@gmail.com");
  const [password, setPassword] = useState("Ange@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      show("Welcome back!", "success");
      onLoginSuccess(response.data.access_token);
    } catch (err) {
      setError("Invalid email or password");
      show("Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
    <div className="card auth-card">
      <h2>Sign in</h2>
      <p className="muted">
        Default: <strong>ange@gmail.com</strong> / <strong>Ange@123</strong>
      </p>
      <form onSubmit={handleSubmit} className="form">
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
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: "1rem", marginBottom: 0, textAlign: "center" }}>
        No account? <Link to="/register">Register as end user</Link>
      </p>
    </div>
    </div>
  );
};

export default LoginPage;
