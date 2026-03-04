import { useEffect, useState } from "react";
import { analyticsApi, AnalyticsOverview, ticketsApi, Ticket } from "../api";

function AdminDashboardPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewData, ticketsData] = await Promise.all([
          analyticsApi.getOverview(),
          ticketsApi.listTickets(),
        ]);
        setOverview(overviewData);
        setTickets(ticketsData);
      } catch (e) {
        setError("Unable to load analytics at the moment. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="admin-page">
      <div className="kb-header">
        <h2>Admin Analytics & Tickets</h2>
        <p className="kb-subtitle">
          Operational metrics and escalated issues for the CYPADI virtual IT assistant.
        </p>
      </div>
      {loading && <p>Loading metrics...</p>}
      {error && !loading && <p className="error-text">{error}</p>}
      {overview && !loading && !error && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total Conversations</h3>
              <p>{overview.total_conversations}</p>
            </div>
            <div className="metric-card">
              <h3>Automation Rate</h3>
              <p>{(overview.automated_resolution_rate * 100).toFixed(1)}%</p>
            </div>
            <div className="metric-card">
              <h3>Average Resolution Time</h3>
              <p>{overview.average_resolution_time_minutes.toFixed(1)} min</p>
            </div>
            <div className="metric-card wide">
              <h3>Top Intents</h3>
              <ul>
                {overview.top_intents.map((i) => (
                  <li key={i.intent}>
                    {i.intent}: {i.count}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="tickets-section">
            <h3>Escalated Tickets</h3>
            {tickets.length === 0 ? (
              <p>No tickets have been escalated yet.</p>
            ) : (
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>External ID</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.external_ticket_id}</td>
                      <td>{t.category ?? "N/A"}</td>
                      <td>{t.status}</td>
                      <td>{t.source}</td>
                      <td>{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboardPage;

