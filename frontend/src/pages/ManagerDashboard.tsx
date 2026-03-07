import React, { useEffect, useState } from "react";

import { api } from "../api";

interface AnalyticsOverview {
  total_users: number;
  total_tickets: number;
  open_tickets: number;
  kb_articles: number;
}

type TabKey = "analytics" | "sla" | "kb-approval" | "performance";

const ManagerDashboard: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("analytics");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<AnalyticsOverview>("/analytics/overview").then((r) => setOverview(r.data)).catch(() => setError("No access"));
  }, [tab]);

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <h1>Manager Dashboard</h1>
        <p className="muted">
          Monitor ticket metrics, SLA compliance, approve KB content, review AI vs human performance,
          escalation rules
        </p>
      </div>

      <div className="tab-row">
        <button className={tab === "analytics" ? "tab active" : "tab"} onClick={() => setTab("analytics")}>
          Analytics
        </button>
        <button className={tab === "sla" ? "tab active" : "tab"} onClick={() => setTab("sla")}>
          SLA
        </button>
        <button className={tab === "kb-approval" ? "tab active" : "tab"} onClick={() => setTab("kb-approval")}>
          KB Approval
        </button>
        <button className={tab === "performance" ? "tab active" : "tab"} onClick={() => setTab("performance")}>
          Agent Performance
        </button>
      </div>

      {tab === "analytics" && (
        <div className="card">
          <h2>Ticket Resolution Metrics</h2>
          {error && <div className="error">{error}</div>}
          {overview ? (
            <div className="stats-grid">
              <div className="stat-tile">
                <div className="stat-label">Total Users</div>
                <div className="stat-value">{overview.total_users}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Total Tickets</div>
                <div className="stat-value">{overview.total_tickets}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Open Tickets</div>
                <div className="stat-value">{overview.open_tickets}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">KB Articles</div>
                <div className="stat-value">{overview.kb_articles}</div>
              </div>
            </div>
          ) : (
            <p className="muted">Loading...</p>
          )}
        </div>
      )}

      {tab === "sla" && (
        <div className="card">
          <h2>SLA Compliance</h2>
          <p className="muted">Track SLA compliance. (Integration pending)</p>
          <div className="placeholder-box">SLA tracking will appear here.</div>
        </div>
      )}

      {tab === "kb-approval" && (
        <div className="card">
          <h2>Approve Knowledge Base Content</h2>
          <p className="muted">Review and approve new KB articles. (Integration pending)</p>
          <div className="placeholder-box">KB approval queue will appear here.</div>
        </div>
      )}

      {tab === "performance" && (
        <div className="card">
          <h2>AI vs Human Agent Performance</h2>
          <p className="muted">Review agent performance. (Integration pending)</p>
          <div className="placeholder-box">Performance metrics will appear here.</div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
