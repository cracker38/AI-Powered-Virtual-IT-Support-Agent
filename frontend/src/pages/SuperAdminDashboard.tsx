import React, { useEffect, useState } from "react";

import { api } from "../api";

interface AnalyticsOverview {
  total_users: number;
  total_tickets: number;
  open_tickets: number;
  kb_articles: number;
}

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
}

interface UserRow {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  department?: string;
  last_login_at?: string | null;
}

interface AccessLogRow {
  id: number;
  email?: string | null;
  ip_address?: string | null;
  success: boolean;
  created_at: string;
}

type TabKey = "overview" | "users" | "tickets" | "kb" | "access" | "permissions" | "integrations";

const SuperAdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("overview");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [logs, setLogs] = useState<AccessLogRow[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    api.get<AnalyticsOverview>("/analytics/overview").then((r) => setOverview(r.data)).catch(() => {});
    api.get<Ticket[]>("/tickets/all").then((r) => setTickets(r.data)).catch(() => {});
    api.get<UserRow[]>("/users").then((r) => setUsers(r.data)).catch(() => {});
    api.get<AccessLogRow[]>("/users/access-logs?limit=50").then((r) => setLogs(r.data)).catch(() => {});
    api.get<Record<string, Record<string, boolean>>>("/users/permissions-matrix").then((r) => setPermissions(r.data)).catch(() => {});
  }, [tab]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const res = await api.patch<UserRow>(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
    } catch {
      alert("Failed to update role.");
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <h1>Super Admin Dashboard</h1>
        <p className="muted">
          Full access: users/roles, AI settings, integrations, audit logs, SSO/MFA, system workflows
        </p>
      </div>

      <div className="tab-row">
        <button className={tab === "overview" ? "tab active" : "tab"} onClick={() => setTab("overview")}>
          Overview
        </button>
        <button className={tab === "users" ? "tab active" : "tab"} onClick={() => setTab("users")}>
          Users &amp; Roles
        </button>
        <button className={tab === "tickets" ? "tab active" : "tab"} onClick={() => setTab("tickets")}>
          Tickets
        </button>
        <button className={tab === "kb" ? "tab active" : "tab"} onClick={() => setTab("kb")}>
          KB
        </button>
        <button className={tab === "access" ? "tab active" : "tab"} onClick={() => setTab("access")}>
          Access Logs
        </button>
        <button className={tab === "permissions" ? "tab active" : "tab"} onClick={() => setTab("permissions")}>
          Permissions
        </button>
        <button className={tab === "integrations" ? "tab active" : "tab"} onClick={() => setTab("integrations")}>
          Integrations
        </button>
      </div>

      {tab === "overview" && overview && (
        <div className="card">
          <h2>System Overview</h2>
          <div className="stats-grid">
            <div className="stat-tile">
              <div className="stat-label">Users</div>
              <div className="stat-value">{overview.total_users}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Tickets</div>
              <div className="stat-value">{overview.total_tickets}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Open</div>
              <div className="stat-value">{overview.open_tickets}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">KB Articles</div>
              <div className="stat-value">{overview.kb_articles}</div>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="card">
          <h2>User Directory &amp; Role Management</h2>
          {users.length === 0 ? (
            <p className="muted">No users.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.full_name ?? "-"}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="end_user">End User</option>
                        <option value="it_admin">IT Admin</option>
                        <option value="manager">Manager</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td>{u.is_active ? "Active" : "Disabled"}</td>
                    <td>{u.department ?? "-"}</td>
                    <td>{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "tickets" && (
        <div className="card">
          <h2>All Tickets</h2>
          {tickets.length === 0 ? (
            <p className="muted">No tickets.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.title}</td>
                    <td>{t.status}</td>
                    <td>{t.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "kb" && (
        <div className="card">
          <h2>Knowledge Base</h2>
          <p className="muted">Full KB management. (Create/edit UI can be extended)</p>
        </div>
      )}

      {tab === "access" && (
        <div className="card">
          <h2>Access Log (Login History)</h2>
          {logs.length === 0 ? (
            <p className="muted">No log entries.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>IP</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.created_at).toLocaleString()}</td>
                    <td>{l.email ?? "-"}</td>
                    <td>{l.ip_address ?? "-"}</td>
                    <td>{l.success ? "Success" : "Failed"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "permissions" && (
        <div className="card">
          <h2>Permission Matrix</h2>
          {Object.keys(permissions).length === 0 ? (
            <p className="muted">No data.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Role</th>
                  {Object.keys(Object.values(permissions)[0]).map((f) => (
                    <th key={f}>{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissions).map(([role, feats]) => (
                  <tr key={role}>
                    <td>{role}</td>
                    {Object.entries(feats).map(([f, allowed]) => (
                      <td key={f}>{allowed ? "✓" : "✕"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "integrations" && (
        <div className="card">
          <h2>Integrations &amp; API</h2>
          <p className="muted">Configure AI settings, integration APIs, workflows, SSO, MFA. (Integration pending)</p>
          <div className="placeholder-box">Integration hub will appear here.</div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
