import React, { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { api, setAuthToken } from "./api";
import ChatPage from "./pages/ChatPage";
import GuestPage from "./pages/GuestPage";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import EndUserDashboard from "./pages/EndUserDashboard";
import ITAdminDashboard from "./pages/ITAdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

type UserRole = "end_user" | "it_admin" | "manager" | "super_admin";

interface User {
  id: number;
  email: string;
  full_name?: string;
  role: UserRole;
}

function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "end_user":
      return "/dashboard";
    case "it_admin":
      return "/it-admin";
    case "manager":
      return "/manager";
    case "super_admin":
      return "/super-admin";
    default:
      return "/dashboard";
  }
}

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setAuthToken(token);
    // Only call /auth/me if we have a token that looks like a JWT (avoid sending invalid tokens)
    const hasValidToken = token && token.length > 20 && token.includes(".");
    if (hasValidToken) {
      api
        .get<User>("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem("token");
          setAuthToken(null);
        });
    } else {
      if (token) {
        localStorage.removeItem("token");
        setToken(null);
        setAuthToken(null);
      }
      setUser(null);
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setAuthToken(null);
    navigate("/");
  };

  if (token && !user) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="brand">CYPADI IT Support Agent</div>
        </header>
        <main className="app-main">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p className="muted">Loading your session...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">CYPADI IT Support Agent</div>
        <nav className="nav-links">
          {user ? (
            <>
              <Link to={getDashboardPath(user.role)}>Dashboard</Link>
              <Link to="/chat">Chat</Link>
              {user.role === "it_admin" && <Link to="/it-admin">IT Admin</Link>}
              {user.role === "manager" && <Link to="/manager">Manager</Link>}
              {user.role === "super_admin" && <Link to="/super-admin">Super Admin</Link>}
            </>
          ) : (
            <Link to="/">Home</Link>
          )}
        </nav>
        <div className="user-section">
          {user ? (
            <>
              <span className="user-email">{user.email}</span>
              <button className="btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="btn-secondary">
                Register
              </Link>
              <Link to="/login" className="btn-primary">
                Login
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={getDashboardPath(user.role)} replace />
              ) : (
                <GuestPage />
              )
            }
          />
          <Route
            path="/register"
            element={
              user ? (
                <Navigate to={getDashboardPath(user.role)} replace />
              ) : (
                <RegistrationPage />
              )
            }
          />
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={getDashboardPath(user.role)} replace />
              ) : (
                <LoginPage
                  onLoginSuccess={(newToken) => {
                    setToken(newToken);
                    localStorage.setItem("token", newToken);
                    setAuthToken(newToken);
                    // Call /auth/me immediately with the token we just got (don't wait for useEffect)
                    api
                      .get<User>("/auth/me", {
                        headers: { Authorization: `Bearer ${newToken}` },
                      })
                      .then((res) => {
                        setUser(res.data);
                        navigate(getDashboardPath(res.data.role));
                      })
                      .catch(() => {
                        setUser(null);
                        setToken(null);
                        localStorage.removeItem("token");
                        setAuthToken(null);
                      });
                  }}
                />
              )
            }
          />
          <Route
            path="/chat"
            element={
              token ? (
                <ChatPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              token && user ? (
                user.role === "end_user" ? (
                  <EndUserDashboard />
                ) : (
                  <Navigate to={getDashboardPath(user.role)} replace />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/it-admin"
            element={
              token && user && user.role === "it_admin" ? (
                <ITAdminDashboard />
              ) : (
                <Navigate to={user ? getDashboardPath(user.role) : "/login"} replace />
              )
            }
          />
          <Route
            path="/manager"
            element={
              token && user && user.role === "manager" ? (
                <ManagerDashboard />
              ) : (
                <Navigate to={user ? getDashboardPath(user.role) : "/login"} replace />
              )
            }
          />
          <Route
            path="/super-admin"
            element={
              token && user && user.role === "super_admin" ? (
                <SuperAdminDashboard />
              ) : (
                <Navigate to={user ? getDashboardPath(user.role) : "/login"} replace />
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;

