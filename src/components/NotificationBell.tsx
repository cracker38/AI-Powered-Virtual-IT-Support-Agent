"use client";

import { useState, useEffect } from "react";
import { Bell, X, Megaphone } from "lucide-react";
import styles from "./NotificationBell.module.css";
import Link from "next/link";

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
  isBroadcast?: boolean;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [broadcasts, setBroadcasts] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const response = await fetch('/api/admin/broadcasts');
      if (response.ok) {
        const data = await response.json();
        const activeBroadcasts = data.filter((b: any) => b.isActive).map((b: any) => ({
          id: b.id,
          message: b.message,
          isRead: false,
          actionUrl: null,
          createdAt: b.createdAt,
          isBroadcast: true
        }));
        setBroadcasts(activeBroadcasts);
      }
    } catch (error) {
      console.error("Failed to fetch broadcasts", error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchBroadcasts();
      const interval = setInterval(() => {
        fetchNotifications();
        fetchBroadcasts();
      }, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    const unreadUserNotifs = notifications.filter((n) => !n.isRead).length;
    setUnreadCount(unreadUserNotifs + broadcasts.length);
  }, [notifications, broadcasts]);

  const markAsRead = async (id: string, isBroadcast: boolean) => {
    if (isBroadcast) return; // Broadcasts are managed by admins
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

  const combinedItems = [...broadcasts, ...notifications];

  return (
    <div className={styles.notificationWrapper}>
      <button 
        className={styles.bellBtn} 
        onClick={() => setIsOpen(!isOpen)}
        title="Check notifications"
      >
        <Bell size={22} color="white" />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h4>Notifications & Broadcasts</h4>
            <button onClick={() => setIsOpen(false)}><X size={18} /></button>
          </div>
          <div className={styles.list}>
            {combinedItems.length === 0 ? (
              <p className={styles.empty}>No new notifications</p>
            ) : (
              combinedItems.map((n) => (
                <div 
                  key={n.id} 
                  className={`${styles.item} ${!n.isRead || n.isBroadcast ? styles.unread : ""}`}
                  onClick={() => markAsRead(n.id, !!n.isBroadcast)}
                  style={n.isBroadcast ? { borderLeft: "3px solid #db2777", background: "rgba(219, 39, 119, 0.1)" } : {}}
                >
                  <Link href={n.actionUrl || "#"} className={styles.link} style={{ cursor: n.actionUrl ? "pointer" : "default" }}>
                    <p className={styles.msg}>
                      {n.isBroadcast && <Megaphone size={14} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} color="#db2777" />}
                      <span style={{ verticalAlign: "middle" }}>{n.message}</span>
                    </p>
                    <span className={styles.time}>{n.isBroadcast ? "SYSTEM BROADCAST" : new Date(n.createdAt).toLocaleDateString()}</span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
