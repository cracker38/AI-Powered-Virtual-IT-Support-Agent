import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";
import { useToast } from "../Toast";

import ChatPage from "./ChatPage";

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface KBArticle {
  id: number;
  title: string;
  content: string;
  category?: string;
}

type TabKey = "overview" | "chat" | "tickets" | "kb";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "chat", label: "AI Chat" },
  { key: "tickets", label: "My Tickets" },
  { key: "kb", label: "Knowledge Base" },
];

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const variant =
    s === "open"
      ? "eu-status-open"
      : s === "resolved" || s === "closed"
        ? "eu-status-resolved"
        : "eu-status-pending";
  const label = status.replace(/_/g, " ");
  return <span className={`eu-status-badge ${variant}`}>{label}</span>;
}

const EndUserDashboard: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("overview");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [searchKb, setSearchKb] = useState("");
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState<string>("medium");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSearched, setKbSearched] = useState(false);
  const { show } = useToast();

  const fetchTickets = useCallback(() => {
    setTicketsLoading(true);
    setTicketsError(null);
    api
      .get<Ticket[]>("/tickets/")
      .then((res) => setTickets(res.data))
      .catch(() => {
        setTicketsError("Could not load tickets.");
        setTickets([]);
      })
      .finally(() => setTicketsLoading(false));
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (tab === "kb" && !kbSearched) {
      setKbLoading(true);
      api
        .get<KBArticle[]>("/kb/", { params: { q: "" } })
        .then((r) => setArticles(r.data))
        .catch(() => setArticles([]))
        .finally(() => {
          setKbLoading(false);
          setKbSearched(true);
        });
    }
  }, [tab, kbSearched]);

  const loadKb = useCallback(() => {
    setKbLoading(true);
    api
      .get<KBArticle[]>("/kb/", { params: { q: searchKb } })
      .then((r) => setArticles(r.data))
      .catch(() => setArticles([]))
      .finally(() => setKbLoading(false));
  }, [searchKb]);

  const createTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim()) return;
    setTicketSubmitting(true);
    api
      .post("/tickets/", {
        title: newTicketTitle.trim(),
        description: newTicketDesc.trim() || undefined,
        priority: newTicketPriority,
      })
      .then(() => {
        setNewTicketTitle("");
        setNewTicketDesc("");
        fetchTickets();
        show("Ticket submitted successfully", "success");
      })
      .catch(() => show("Failed to submit ticket", "error"))
      .finally(() => setTicketSubmitting(false));
  };

  const openTickets = tickets.filter(
    (t) => t.status.toLowerCase() !== "resolved" && t.status.toLowerCase() !== "closed"
  );
  const resolvedCount = tickets.length - openTickets.length;

  return (
    <div className="eu-dashboard">
      <header className="eu-header">
        <div>
          <h1 className="eu-title">Dashboard</h1>
          <p className="eu-subtitle">Chat, tickets, and knowledge base in one place.</p>
        </div>
      </header>

      <div className="eu-stats">
        <div className="eu-stat">
          <span className="eu-stat-value">{tickets.length}</span>
          <span className="eu-stat-label">Total tickets</span>
        </div>
        <div className="eu-stat">
          <span className="eu-stat-value">{openTickets.length}</span>
          <span className="eu-stat-label">Open</span>
        </div>
        <div className="eu-stat">
          <span className="eu-stat-value">{resolvedCount}</span>
          <span className="eu-stat-label">Resolved</span>
        </div>
      </div>

      <nav className="eu-tabs" role="tablist">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`eu-tab ${tab === key ? "eu-tab-active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="eu-content">
        {tab === "overview" && (
          <div className="eu-overview">
            <section className="eu-section eu-actions-section">
              <h2 className="eu-section-title">Quick actions</h2>
              <div className="eu-actions">
                <Link to="/chat" className="eu-action-card">
                  <span className="eu-action-icon">💬</span>
                  <span className="eu-action-label">Open AI Chat</span>
                  <span className="eu-action-hint">Get help with issues</span>
                </Link>
                <button
                  type="button"
                  className="eu-action-card"
                  onClick={() => setTab("tickets")}
                >
                  <span className="eu-action-icon">📋</span>
                  <span className="eu-action-label">Submit a ticket</span>
                  <span className="eu-action-hint">Request support</span>
                </button>
                <button
                  type="button"
                  className="eu-action-card"
                  onClick={() => setTab("kb")}
                >
                  <span className="eu-action-icon">📚</span>
                  <span className="eu-action-label">Knowledge Base</span>
                  <span className="eu-action-hint">Search articles</span>
                </button>
              </div>
            </section>
            <section className="eu-section eu-tickets-section">
              <h2 className="eu-section-title">Recent tickets</h2>
              {ticketsLoading ? (
                <div className="eu-loading">
                  <div className="loading-spinner" />
                  <span>Loading tickets…</span>
                </div>
              ) : ticketsError ? (
                <div className="eu-empty eu-empty-error">{ticketsError}</div>
              ) : tickets.length === 0 ? (
                <div className="eu-empty">
                  <p>No tickets yet.</p>
                  <button
                    type="button"
                    className="btn-primary eu-cta"
                    onClick={() => setTab("tickets")}
                  >
                    Submit your first ticket
                  </button>
                </div>
              ) : (
                <ul className="eu-ticket-cards">
                  {tickets.slice(0, 5).map((t) => (
                    <li key={t.id} className="eu-ticket-card">
                      <div className="eu-ticket-card-main">
                        <span className="eu-ticket-id">#{t.id}</span>
                        <span className="eu-ticket-title">{t.title}</span>
                      </div>
                      <div className="eu-ticket-card-meta">
                        <StatusBadge status={t.status} />
                        <span className="eu-ticket-date">{formatDate(t.created_at)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {tab === "chat" && (
          <div className="eu-chat-wrap">
            <ChatPage />
          </div>
        )}

        {tab === "tickets" && (
          <div className="eu-tickets-view">
            <section className="eu-section eu-form-section">
              <h2 className="eu-section-title">New ticket</h2>
              <form onSubmit={createTicket} className="form eu-form">
                <label>
                  Title
                  <input
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                    placeholder="Brief description of the issue"
                    required
                    maxLength={200}
                  />
                </label>
                <label>
                  Description <span className="eu-optional">(optional)</span>
                  <textarea
                    value={newTicketDesc}
                    onChange={(e) => setNewTicketDesc(e.target.value)}
                    placeholder="Add details, steps to reproduce, etc."
                    rows={3}
                  />
                </label>
                <label>
                  Priority
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={ticketSubmitting}
                >
                  {ticketSubmitting ? "Submitting…" : "Submit ticket"}
                </button>
              </form>
            </section>
            <section className="eu-section eu-list-section">
              <h2 className="eu-section-title">My tickets</h2>
              {ticketsLoading ? (
                <div className="eu-loading">
                  <div className="loading-spinner" />
                  <span>Loading…</span>
                </div>
              ) : ticketsError ? (
                <div className="eu-empty eu-empty-error">{ticketsError}</div>
              ) : tickets.length === 0 ? (
                <div className="eu-empty">No tickets yet. Submit one above.</div>
              ) : (
                <div className="eu-table-wrap">
                  <table className="table eu-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => (
                        <tr key={t.id}>
                          <td className="eu-table-id">#{t.id}</td>
                          <td className="eu-table-title">{t.title}</td>
                          <td>
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="eu-table-priority">{t.priority}</td>
                          <td className="eu-table-date">{formatDate(t.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {tab === "kb" && (
          <section className="eu-section eu-kb-section">
            <div className="eu-kb-search">
              <input
                type="search"
                value={searchKb}
                onChange={(e) => setSearchKb(e.target.value)}
                placeholder="Search knowledge base…"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), loadKb())}
                className="eu-kb-input"
              />
              <button
                type="button"
                className="btn-primary"
                onClick={loadKb}
                disabled={kbLoading}
              >
                {kbLoading ? "Searching…" : "Search"}
              </button>
            </div>
            <div className="eu-kb-results">
              {kbLoading && !articles.length ? (
                <div className="eu-loading">
                  <div className="loading-spinner" />
                  <span>Loading articles…</span>
                </div>
              ) : articles.length === 0 ? (
                <div className="eu-empty">
                  No articles found. Try a different search or browse without a query.
                </div>
              ) : (
                <ul className="eu-kb-list">
                  {articles.map((a) => (
                    <li key={a.id}>
                      <details className="kb-article eu-kb-article">
                        <summary>{a.title}</summary>
                        <div className="kb-content">{a.content}</div>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default EndUserDashboard;
