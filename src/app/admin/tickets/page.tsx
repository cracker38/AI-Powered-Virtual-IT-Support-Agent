"use client";

import { useEffect, useState } from "react";
import { generateTicketsPDF, generateTicketsCSV } from "@/lib/exportUtils";

interface TicketMessage {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  user?: { name: string; email: string };
  userId: string;
  ticketMessages: TicketMessage[];
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Export states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Reply state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
    // Default dates for the current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setFromDate(firstDay.toISOString().split("T")[0]);
    setToDate(now.toISOString().split("T")[0]);
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const filtered = filterTicketsByDate();
    generateTicketsPDF(filtered, fromDate, toDate);
  };

  const handleExportCSV = () => {
    const filtered = filterTicketsByDate();
    generateTicketsCSV(filtered);
  };

  const filterTicketsByDate = () => {
    if (!fromDate || !toDate) return tickets;
    const start = new Date(fromDate).getTime();
    // Add one day to 'to' date to include the whole day
    const end = new Date(toDate).getTime() + 86400000;
    
    return tickets.filter(t => {
      const tTime = new Date(t.createdAt).getTime();
      return tTime >= start && tTime <= end;
    });
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;

    setReplying(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ticketId: selectedTicket.id, 
          content: replyContent,
          userId: selectedTicket.userId 
        }),
      });

      if (res.ok) {
        setReplyContent("");
        // Reload tickets to get the new message
        await fetchTickets();
        // Update selected ticket in state
        const updatedTicket = await res.json();
        setSelectedTicket(prev => prev ? {
          ...prev, 
          ticketMessages: [...prev.ticketMessages, updatedTicket]
        } : null);
      }
    } catch (error) {
      console.error("Failed to reply", error);
    } finally {
      setReplying(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>All Support Tickets</h1>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "2rem" }}>
        Manage user tickets, reply to them, and generate exportable reports.
      </p>

      {/* Export Controls */}
      <div style={{ background: "rgba(255,255,255,0.05)", padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>From Date</label>
          <input 
            type="date" 
            value={fromDate} 
            onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white", colorScheme: "dark" }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>To Date</label>
          <input 
            type="date" 
            value={toDate} 
            onChange={(e) => setToDate(e.target.value)}
            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "white", colorScheme: "dark" }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
          <button onClick={handleExportCSV} style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10b981", border: "1px solid rgba(16,185,129,0.5)", padding: "0.75rem 1.25rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Export CSV
          </button>
          <button onClick={handleExportPDF} style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", color: "white", border: "none", padding: "0.75rem 1.25rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            Export PDF Report
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedTicket ? "1fr 1fr" : "1fr", gap: "1.5rem" }}>
        
        {/* Tickets List */}
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden", maxHeight: "600px", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "1rem", background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: "bold" }}>
            Ticket Log
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "1rem", display: "grid", gap: "1rem" }}>
            {loading ? (
              <p>Loading tickets...</p>
            ) : tickets.length === 0 ? (
              <p>No tickets found.</p>
            ) : (
              tickets.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTicket(t)}
                  style={{ 
                    padding: "1rem", 
                    borderRadius: "8px", 
                    border: selectedTicket?.id === t.id ? "1px solid #db2777" : "1px solid rgba(255,255,255,0.1)", 
                    background: selectedTicket?.id === t.id ? "rgba(219,39,119,0.1)" : "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <strong>{t.ticketNumber} - {t.title}</strong>
                    <span style={{ fontSize: "0.8rem", color: t.status === "OPEN" ? "#ef4444" : "#10b981" }}>{t.status}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)" }}>
                    From: {t.user?.name || "Unknown"} • {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details & Reply Box */}
        {selectedTicket && (
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", maxHeight: "600px" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h2 style={{ fontSize: "1.25rem", margin: 0 }}>{selectedTicket.ticketNumber}</h2>
                <button onClick={() => setSelectedTicket(null)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>✕</button>
              </div>
              <p style={{ marginTop: "0.5rem", color: "rgba(255,255,255,0.8)" }}>{selectedTicket.title}</p>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "1rem", borderRadius: "8px", marginTop: "1rem", fontSize: "0.9rem", color: "rgba(255,255,255,0.7)" }}>
                {selectedTicket.description}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {selectedTicket.ticketMessages.map((msg) => {
                const isAdmin = msg.sender === "TECHNICIAN" || msg.sender === "ADMIN";
                return (
                  <div key={msg.id} style={{ 
                    alignSelf: isAdmin ? "flex-end" : "flex-start",
                    background: isAdmin ? "rgba(219,39,119,0.2)" : "rgba(255,255,255,0.1)",
                    border: `1px solid ${isAdmin ? "rgba(219,39,119,0.4)" : "rgba(255,255,255,0.2)"}`,
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    maxWidth: "80%"
                  }}>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem", textAlign: isAdmin ? "right" : "left" }}>
                      {isAdmin ? "Admin Support" : selectedTicket.user?.name}
                    </div>
                    <div>{msg.content}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)" }}>
              <form onSubmit={submitReply} style={{ display: "flex", gap: "0.5rem" }}>
                <input 
                  type="text" 
                  value={replyContent} 
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type a reply to the user..."
                  required
                  style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "white" }}
                />
                <button type="submit" disabled={replying} style={{ background: "#7c3aed", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", opacity: replying ? 0.7 : 1 }}>
                  {replying ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
