"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { Bell, CheckCircle2, MessageSquare, Clock } from "lucide-react";

export default function TechnicianNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      // Get current user session to find technician's userId
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const userId = session?.user?.id || "clxt8f6u7000008j7... (we need the actual ID from seed)";
      
      // For this demo, we'll use the tech's email to get the ID if session is missing
      const url = session?.user?.id ? `/api/notifications?userId=${session.user.id}` : "/api/notifications?role=TECHNICIAN";
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Filter out notifications that are meant for users (e.g., "Your ticket...")
        const filtered = data.filter((n: any) => !n.message.startsWith("Your ticket") && !n.message.startsWith("A technician has responded"));
        setNotifications(filtered);
        setError(null);
      } else {
        setError("Failed to load notifications.");
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  if (loading) return <div className={styles.loading}>Loading notifications...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Bell size={28} className={styles.titleIcon} />
        <h1>Technician Notifications</h1>
      </header>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <CheckCircle2 size={48} color="rgba(255,255,255,0.1)" />
            <p>You're all caught up! No new notifications.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`${styles.notificationItem} ${!n.isRead ? styles.unread : ""}`}
              onClick={() => markAsRead(n.id)}
            >
              <div className={styles.iconWrapper}>
                <MessageSquare size={20} />
              </div>
              <div className={styles.content}>
                <p className={styles.message}>{n.message}</p>
                <div className={styles.meta}>
                  <span className={styles.time}>
                    <Clock size={12} /> {new Date(n.createdAt).toLocaleString()}
                  </span>
                  {!n.isRead && <span className={styles.unreadTag}>New</span>}
                </div>
                {n.actionUrl && (
                  <Link href={n.actionUrl} className={styles.actionLink}>
                    View Ticket Details
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
