"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import { 
  Send, 
  User, 
  MessageSquare, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function TechnicianTicketDetail() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/escalation/track/${params.id}`);
      const data = await response.json();
      setTicket(data);
    } catch (error) {
      console.error("Failed to fetch ticket", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [params.id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket) return;

    setReplying(true);
    try {
      const response = await fetch(`/api/escalation/track/${params.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          sender: "TECHNICIAN",
          technicianId: ticket.assignedTechnicianId,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchTicket(); 
      }
    } catch (error) {
      console.error("Failed to send reply", error);
    } finally {
      setReplying(false);
    }
  };

  const handleResolve = async () => {
    if (!confirm("Are you sure you want to mark this ticket as resolved?")) return;

    try {
      const response = await fetch(`/api/escalation/track/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      if (response.ok) {
        fetchTicket(); // Refresh UI
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      console.error("Resolution error:", error);
      alert("An error occurred.");
    }
  };

  if (loading) return <div className={styles.loading}>Loading ticket for review...</div>;
  if (!ticket) return <div className={styles.error}>Ticket not found.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={20} /> Back to List
        </button>
        <div className={styles.headerInfo}>
          <h1>{ticket.ticketNumber}: {ticket.title}</h1>
          <span className={`${styles.status} ${styles[ticket.status]}`}>{ticket.status}</span>
        </div>
        <button onClick={handleResolve} className={styles.resolveBtn}>
          Mark Resolved
        </button>
      </header>

      <div className={styles.grid}>
        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <h3>User Information</h3>
            <div className={styles.userInfo}>
              <User size={20} className={styles.icon} />
              <div>
                <p><strong>{ticket.user.name}</strong></p>
                <p>{ticket.user.email}</p>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h3>AI Summary</h3>
            <p className={styles.summaryText}>{ticket.summary || "No summary generated."}</p>
          </div>

          <div className={styles.card}>
            <h3>SLA Monitor</h3>
            <p>Target: {new Date(ticket.slaBreachTime).toLocaleString()}</p>
            <p>Priority: <strong style={{ color: "#db2777" }}>{ticket.priority}</strong></p>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.chatCard}>
            <div className={styles.chatHeader}>
              <MessageSquare size={20} />
              <h3>Conversation with User</h3>
            </div>
            
            <div className={styles.messageList}>
              <div className={styles.historySection}>
                <p className={styles.historyTitle}>Initial AI Chat Context</p>
                <div className={styles.historyLog}>
                   {(() => {
                     try {
                       const history = typeof ticket.chatHistory === "string" 
                         ? JSON.parse(ticket.chatHistory) 
                         : ticket.chatHistory;
                       
                       return Array.isArray(history) ? history.map((h: any, i: number) => (
                         <div key={i} className={styles.historyItem}>
                           <strong>{h.role === "user" ? "User" : "AI"}:</strong> {h.content}
                         </div>
                       )) : <p>No chat history available.</p>;
                     } catch (e) {
                       return <pre>{ticket.chatHistory}</pre>;
                     }
                   })()}
                </div>
              </div>

              {ticket.ticketMessages?.map((msg: any) => (
                <div key={msg.id} className={`${styles.message} ${msg.sender === "USER" ? styles.user : styles.tech}`}>
                  <div className={styles.msgContent}>{msg.content}</div>
                  <div className={styles.msgTime}>{new Date(msg.createdAt).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendReply} className={styles.replyArea}>
              <textarea 
                placeholder="Type your reply to the user..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
              <div className={styles.replyActions}>
                <button type="submit" disabled={replying || !newMessage.trim()}>
                  {replying ? "Sending..." : "Send Reply to User"}
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
