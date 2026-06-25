"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/technician/tickets")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTickets(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading assigned tickets...</div>;

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>My Assigned Tickets</h1>
      <div style={{ background: "rgba(255, 255, 255, 0.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 1fr 100px", padding: "1rem", background: "rgba(0,0,0,0.4)", fontWeight: "bold" }}>
          <div>ID</div>
          <div>Title</div>
          <div>User</div>
          <div>Priority</div>
          <div>Status</div>
          <div>Action</div>
        </div>

        {tickets.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            No tickets assigned yet.
          </div>
        ) : (
          tickets.map((t) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 2fr 1fr 1fr 100px", padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", alignItems: "center" }}>
              <div style={{ color: "#db2777", fontSize: "0.9rem" }}>{t.ticketNumber}</div>
              <div>{t.title}</div>
              <div style={{ color: "rgba(255,255,255,0.7)" }}>{t.user.name}</div>
              <div>
                <span style={{ 
                  padding: "0.2rem 0.5rem", 
                  borderRadius: "4px", 
                  fontSize: "0.8rem",
                  background: t.priority === "CRITICAL" ? "#ef4444" : "#3b82f6" 
                }}>
                  {t.priority}
                </span>
              </div>
              <div style={{ color: t.status === "OPEN" ? "#10b981" : "#f59e0b" }}>{t.status}</div>
              <Link href={`/technician/tickets/${t.id}`} style={{ color: "#7c3aed", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
                Reply <ChevronRight size={16} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
