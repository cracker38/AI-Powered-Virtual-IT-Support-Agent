"use client";

import { useEffect, useState } from "react";

interface BroadcastAlert {
  id: string;
  message: string;
  isActive: boolean;
  createdAt: string;
}

export default function MonitoringHub() {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [alerts, setAlerts] = useState<BroadcastAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [healthStatus] = useState([
    { component: "Core Database", status: "OPERATIONAL" },
    { component: "AI Engine (Groq)", status: "OPERATIONAL" },
    { component: "Authentication Service", status: "OPERATIONAL" },
    { component: "Jira Integration", status: "DEGRADED" }
  ]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/broadcasts");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!broadcastMessage.trim()) {
      setError("Enter a broadcast message before sending.");
      return;
    }

    try {
      const response = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMessage.trim() }),
      });
      if (response.ok) {
        setBroadcastMessage("");
        await fetchAlerts();
      } else {
        setError("Unable to create broadcast alert.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while creating the broadcast.");
    }
  };

  const toggleAlert = async (id: string, active: boolean) => {
    try {
      const response = await fetch("/api/admin/broadcasts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: active }),
      });
      if (response.ok) {
        await fetchAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Proactive Monitoring & System Health</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {healthStatus.map((health) => (
          <div key={health.component} style={{ background: "rgba(255,255,255,0.06)", padding: "1.25rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>{health.component}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: health.status === "OPERATIONAL" ? "#10b981" : health.status === "DEGRADED" ? "#f59e0b" : "#ef4444" }} />
              <span style={{ fontWeight: "bold", color: health.status === "OPERATIONAL" ? "#10b981" : health.status === "DEGRADED" ? "#f59e0b" : "#ef4444" }}>{health.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.06)", padding: "1.75rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "1.75rem" }}>
        <h3 style={{ marginBottom: "0.75rem" }}>Broadcast Alerts</h3>
        <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: "1rem" }}>Compose alerts that appear instantly for active chat users.</p>

        <form onSubmit={handleBroadcast} style={{ display: "grid", gap: "1rem" }}>
          <input
            type="text"
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="e.g. Scheduled maintenance tonight at 11:00 PM"
            style={{ width: "100%", padding: "1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "white" }}
          />
          {error ? <div style={{ color: "#f87171" }}>{error}</div> : null}
          <button type="submit" style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", border: "none", padding: "1rem", borderRadius: "10px", color: "white", cursor: "pointer" }}>
            Broadcast Now
          </button>
        </form>
      </div>

      <div style={{ background: "rgba(255,255,255,0.06)", padding: "1.75rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3>Active Alerts</h3>
          <span style={{ opacity: 0.8 }}>{loading ? "Refreshing..." : `${alerts.length} total`}</span>
        </div>
        {alerts.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.75)" }}>No broadcast alerts have been created yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {alerts.map((alert) => (
              <div key={alert.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "1rem", borderRadius: "12px", background: alert.isActive ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div>
                  <p style={{ marginBottom: "0.5rem" }}>{alert.message}</p>
                  <small style={{ color: "rgba(255,255,255,0.7)" }}>{new Date(alert.createdAt).toLocaleString()}</small>
                </div>
                <button
                  onClick={() => toggleAlert(alert.id, !alert.isActive)}
                  style={{ border: "none", padding: "0.75rem 1rem", borderRadius: "10px", cursor: "pointer", background: alert.isActive ? "#ef4444" : "#10b981", color: "white" }}
                >
                  {alert.isActive ? "Disable" : "Activate"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
