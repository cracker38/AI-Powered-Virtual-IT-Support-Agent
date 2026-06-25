"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./page.module.css";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User, 
  Send,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";

export default function TicketTracking() {
  const params = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");

  const router = useRouter();

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
    // In a real app, we might poll or use websockets
    const interval = setInterval(fetchTicket, 30000);
    return () => clearInterval(interval);
  }, [params.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket) return;

    try {
      const response = await fetch(`/api/escalation/track/${params.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          sender: "USER",
          userId: ticket.userId,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchTicket(); // Refresh to show the message
      }
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  if (loading) return <div className={styles.loading}>Loading ticket details...</div>;
  if (!ticket) return <div className={styles.error}>Ticket not found.</div>;

  const steps = ["CREATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
  const currentStepIndex = steps.indexOf(ticket.status === "OPEN" ? "CREATED" : ticket.status);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button type="button" className={styles.backButton} onClick={() => router.back()}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className={styles.ticketHeader}>
            <div className={styles.ticketTitleGroup}>
              <h1>Ticket #{ticket.ticketNumber || ticket.id.substring(0, 8)}</h1>
              {ticket.title && <p className={styles.ticketSubtitle}>{ticket.title}</p>}
            </div>
            <div className={`${styles.priorityBadge} ${styles[(ticket.priority || "LOW").toLowerCase()]}`}>
              {ticket.priority || "LOW"} Priority
            </div>
          </div>
        </div>
      </header>

      <main className={styles.grid}>
        <section className={styles.leftCol}>
          <div className={styles.card}>
            <h3>Issue Overview</h3>
            <div className={styles.issueMeta}>
              <div>
                <p className={styles.issueLabel}>Title</p>
                <strong>{ticket.title || "Untitled ticket"}</strong>
              </div>
              <div>
                <p className={styles.issueLabel}>Issue Type</p>
                <strong>{ticket.category?.name || ticket.detectedIntent || "General"}</strong>
              </div>
            </div>
            {ticket.summary && (
              <div className={styles.issueField}>
                <p className={styles.issueLabel}>Summary</p>
                <span>{ticket.summary}</span>
              </div>
            )}
            <div className={styles.issueField}>
              <p className={styles.issueLabel}>Description</p>
              <span>{ticket.description || "No description provided."}</span>
            </div>
            {ticket.category?.description && (
              <p className={styles.categoryDescription}>{ticket.category.description}</p>
            )}
          </div>

          <div className={styles.card}>
            <h3>Progress Tracking</h3>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <div className={styles.steps}>
              {steps.map((step, i) => (
                <div key={step} className={`${styles.step} ${i <= currentStepIndex ? styles.completed : ""}`}>
                  {i <= currentStepIndex ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  <span>{step.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h3>Assigned Technician</h3>
            {ticket.assignedTechnician ? (
              <div className={styles.technicianInfo}>
                <div className={styles.avatar}>
                  <User size={24} />
                </div>
                <div>
                  <p className={styles.techName}>{ticket.assignedTechnician.user.name}</p>
                  <p className={styles.techStatus}>Online | Active</p>
                </div>
              </div>
            ) : (
              <div className={styles.unassigned}>
                <Clock size={20} />
                <span>Searching for available technician...</span>
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h3>SLA Details</h3>
            <div className={styles.slaInfo}>
              <p>Resolution Target: <strong>{new Date(ticket.slaBreachTime).toLocaleString()}</strong></p>
              {new Date() > new Date(ticket.slaBreachTime) && (
                <div className={styles.breachAlert}>
                  <ShieldAlert size={18} />
                  <span>SLA Breached - Escalated to Level {ticket.escalationLevel + 1}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={styles.rightCol}>
          <div className={`${styles.card} ${styles.chatCard}`}>
            <h3>Technician Chat</h3>
            <div className={styles.messageList}>
              <div className={styles.systemMsg}>
                Ticket created. Chat history from bot session has been linked for technician review.
              </div>
              {ticket.ticketMessages?.map((msg: any) => (
                <div key={msg.id} className={`${styles.message} ${msg.sender === "USER" ? styles.user : styles.tech}`}>
                  <p>{msg.content}</p>
                  <span className={styles.time}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className={styles.chatInput}>
              <input 
                type="text" 
                placeholder="Message technician..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit"><Send size={18} /></button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
