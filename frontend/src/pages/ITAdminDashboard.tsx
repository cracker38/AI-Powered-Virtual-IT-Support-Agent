import React, { useEffect, useState } from "react";

import { api } from "../api";

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_by: number;
  assigned_to?: number | null;
}

interface KBArticle {
  id: number;
  title: string;
  content: string;
  category?: string;
  is_published: boolean;
}

type TabKey = "tickets" | "kb" | "ai-logs" | "diagnostics";

const ITAdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Ticket[]>("/tickets/all").then((r) => setTickets(r.data)).catch(() => setError("No access"));
    api.get<KBArticle[]>("/kb/", { params: { include_unpublished: true } }).then((r) => setArticles(r.data)).catch(() => {});
  }, [tab]);

  return (
    <div className="dashboard-layout">
      <div className="dashboard-header">
        <h1>IT Admin Dashboard</h1>
        <p className="muted">
          View & manage tickets, troubleshooting logs, AI intent/confidence, KB articles, assign
          tickets, diagnostics
        </p>
      </div>

      <div className="tab-row">
        <button className={tab === "tickets" ? "tab active" : "tab"} onClick={() => setTab("tickets")}>
          Tickets
        </button>
        <button className={tab === "kb" ? "tab active" : "tab"} onClick={() => setTab("kb")}>
          KB Management
        </button>
        <button className={tab === "ai-logs" ? "tab active" : "tab"} onClick={() => setTab("ai-logs")}>
          AI Intent &amp; Logs
        </button>
        <button className={tab === "diagnostics" ? "tab active" : "tab"} onClick={() => setTab("diagnostics")}>
          Diagnostics
        </button>
      </div>

      {tab === "tickets" && (
        <div className="card">
          <h2>All Tickets</h2>
          {error && <div className="error">{error}</div>}
          {tickets.length === 0 ? (
            <p className="muted">No tickets or insufficient permissions.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.title}</td>
                    <td>{t.status}</td>
                    <td>{t.priority}</td>
                    <td>{t.assigned_to ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "kb" && (
        <div className="card">
          <h2>Knowledge Base Management</h2>
          {articles.length === 0 ? (
            <p className="muted">No articles. Create one via API or future UI.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Published</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.title}</td>
                    <td>{a.category ?? "-"}</td>
                    <td>{a.is_published ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "ai-logs" && (
        <div className="card">
          <h2>AI Intent Recognition &amp; Confidence</h2>
          <p className="muted">Admin view of AI intent and confidence scores. (Integration pending)</p>
          <div className="placeholder-box">AI conversation logs and intent analysis will appear here.</div>
        </div>
      )}

      {tab === "diagnostics" && (
        <div className="card">
          <h2>System Diagnostics</h2>
          <p className="muted">Access system diagnostics tools. (Integration pending)</p>
          <div className="placeholder-box">Diagnostics tools will appear here.</div>
        </div>
      )}
    </div>
  );
};

export default ITAdminDashboard;
