import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import KBPage from "./pages/KBPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LoginPage from "./pages/LoginPage";
import { authApi } from "./api";

const tokenKey = "cypadi_admin_token";

function App() {
  const isAuthenticated = !!localStorage.getItem(tokenKey);

  function RequireAuth({ children }: { children: JSX.Element }) {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo">CYPADI Virtual IT Support</div>
        <div className="header-right">
          <span className="env-pill">DEV</span>
          <div className="user-pill">
            <span className="avatar-dot" />
            <span className="user-name">{isAuthenticated ? "Signed in" : "Guest"}</span>
            {isAuthenticated && (
              <button
                className="logout-btn"
                onClick={() => {
                  authApi.logout();
                  window.location.href = "/";
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="app-shell">
        <aside className="sidebar">
          <nav className="nav-links">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <span className="nav-dot" />
              <span>Chat</span>
            </NavLink>
            <NavLink to="/kb" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <span className="nav-dot" />
              <span>Knowledge Base</span>
            </NavLink>
            {isAuthenticated ? (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                <span className="nav-dot" />
                <span>Admin Dashboard</span>
              </NavLink>
            ) : (
              <NavLink to="/login" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
                <span className="nav-dot" />
                <span>Login</span>
              </NavLink>
            )}
          </nav>
          <div className="sidebar-footer">
            <p className="sidebar-caption">Virtual IT Assistant for CYPADI Ltd</p>
          </div>
        </aside>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/kb" element={<KBPage />} />
            <Route
              path="/admin"
              element={(
                <RequireAuth>
                  <AdminDashboardPage />
                </RequireAuth>
              )}
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;

