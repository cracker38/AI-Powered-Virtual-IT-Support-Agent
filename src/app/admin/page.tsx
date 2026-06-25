"use client";

import { useEffect, useState } from "react";

interface AnalyticsMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  aiResolved: number;
  humanResolved: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  avgResolutionMinutes: number;
  totalUsers: number;
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/analytics");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const sentimentTotal = metrics ? metrics.positiveCount + metrics.neutralCount + metrics.negativeCount : 0;

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>System Analytics & Reporting</h1>

      {loading ? (
        <div>Loading live analytics...</div>
      ) : metrics ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "1.75rem", borderRadius: "14px", border: "1px solid rgba(16,185,129,0.25)" }}>
              <h3 style={{ color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem" }}>Total Tickets</h3>
              <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#10b981" }}>{metrics.totalTickets}</p>
              <p style={{ opacity: 0.8 }}>Open: {metrics.openTickets} • Resolved: {metrics.resolvedTickets}</p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "1.75rem", borderRadius: "14px", border: "1px solid rgba(59,130,246,0.25)" }}>
              <h3 style={{ color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem" }}>AI Resolution Ratio</h3>
              <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#3b82f6" }}>{metrics.aiResolved}</p>
              <p style={{ opacity: 0.8 }}>Human resolved: {metrics.humanResolved}</p>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "1.75rem", borderRadius: "14px", border: "1px solid rgba(249,115,22,0.25)" }}>
              <h3 style={{ color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem" }}>Average Resolution Time</h3>
              <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#f97316" }}>{Math.round(metrics.avgResolutionMinutes)} min</p>
              <p style={{ opacity: 0.8 }}>Users served: {metrics.totalUsers}</p>
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "2rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Live Sentiment Trend</h2>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "1rem", alignItems: "center" }}>
                <span>Positive</span>
                <div style={{ background: "rgba(16,185,129,0.2)", borderRadius: "999px", height: "24px", overflow: "hidden" }}>
                  <div style={{ width: `${sentimentTotal ? (metrics.positiveCount / sentimentTotal) * 100 : 0}%`, background: "#10b981", height: "100%" }} />
                </div>
                <strong>{sentimentTotal ? `${Math.round((metrics.positiveCount / sentimentTotal) * 100)}%` : "0%"}</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "1rem", alignItems: "center" }}>
                <span>Neutral</span>
                <div style={{ background: "rgba(245,158,11,0.2)", borderRadius: "999px", height: "24px", overflow: "hidden" }}>
                  <div style={{ width: `${sentimentTotal ? (metrics.neutralCount / sentimentTotal) * 100 : 0}%`, background: "#f59e0b", height: "100%" }} />
                </div>
                <strong>{sentimentTotal ? `${Math.round((metrics.neutralCount / sentimentTotal) * 100)}%` : "0%"}</strong>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: "1rem", alignItems: "center" }}>
                <span>Negative</span>
                <div style={{ background: "rgba(239,68,68,0.2)", borderRadius: "999px", height: "24px", overflow: "hidden" }}>
                  <div style={{ width: `${sentimentTotal ? (metrics.negativeCount / sentimentTotal) * 100 : 0}%`, background: "#ef4444", height: "100%" }} />
                </div>
                <strong>{sentimentTotal ? `${Math.round((metrics.negativeCount / sentimentTotal) * 100)}%` : "0%"}</strong>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div>Unable to fetch analytics at this time.</div>
      )}
    </div>
  );
}
