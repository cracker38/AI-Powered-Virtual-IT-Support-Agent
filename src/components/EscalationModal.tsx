"use client";

import { useState, useEffect } from "react";
import styles from "./EscalationModal.module.css";
import { X, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  chatHistory: any[];
  onSuccess: (ticketId: string) => void;
}

export default function EscalationModal({ isOpen, onClose, userId, chatHistory, onSuccess }: EscalationModalProps) {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("LOW");
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && chatHistory.length > 0) {
      fetchSummary();
    }
  }, [isOpen]);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await fetch("/api/escalation/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: chatHistory }),
      });
      const data = await response.json();
      setSummary(data.summary || "");
    } catch (err) {
      console.error("Failed to fetch summary", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select or describe a reason for escalation.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/escalation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: reason,
          description: `User requested escalation. Reason: ${reason}`,
          summary: summary || reason,
          priority,
          chatHistory: JSON.stringify(chatHistory),
        }),
      });

      if (!response.ok) throw new Error("Failed to create ticket");
      
      const ticket = await response.json();
      onSuccess(ticket.id);
    } catch (err) {
      setError("An error occurred while creating your ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <header className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <AlertCircle className={styles.headerIcon} />
            <h2>Escalate to Human Technician</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X size={20} /></button>
        </header>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>Why are you escalating this issue?</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className={styles.select}
              required
            >
              <option value="">Select a reason...</option>
              <option value="Troubleshooting failed">Troubleshooting steps provided didn't work</option>
              <option value="Hardware issue">Physical hardware damage/failure</option>
              <option value="Account Access">Cannot log in even after password reset</option>
              <option value="Urgent Business Impact">Critical issue affecting production</option>
              <option value="Other">Other (Complex issue)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>AI-Generated Issue Summary</label>
            <div className={styles.summaryBox}>
              {loadingSummary ? (
                <div className={styles.loadingArea}>
                  <Loader2 className={styles.spin} size={18} />
                  <span>Generating summary...</span>
                </div>
              ) : (
                <textarea 
                  value={summary} 
                  onChange={(e) => setSummary(e.target.value)}
                  className={styles.textarea}
                  placeholder="The AI will summarize your problem here..."
                />
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Priority Level</label>
            <div className={styles.priorityGrid}>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.priorityBtn} ${priority === p ? styles.active : ""} ${styles[p.toLowerCase()]}`}
                  onClick={() => setPriority(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <footer className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? "Creating Ticket..." : "Submit Ticket"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
