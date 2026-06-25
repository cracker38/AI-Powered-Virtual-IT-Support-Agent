"use client";
import { useEffect, useState } from "react";

export default function TechnicianDashboard() {
  const [stats, setStats] = useState({
    open: 0,
    resolved: 0,
    total: 0
  });

  useEffect(() => {
    fetch("/api/technician/tickets")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStats({
            open: data.filter(t => t.status !== "RESOLVED").length,
            resolved: data.filter(t => t.status === "RESOLVED").length,
            total: data.length
          });
        }
      });
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Dashboard Overview</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
        
        <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem" }}>My Open Tickets</h3>
          <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#db2777" }}>{stats.open}</p>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem" }}>Resolved Tickets</h3>
          <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#10b981" }}>{stats.resolved}</p>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem" }}>Total Assigned</h3>
          <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#7c3aed" }}>{stats.total}</p>
        </div>

      </div>
    </div>
  );
}
