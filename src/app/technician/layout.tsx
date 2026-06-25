"use client";
import styles from "./layout.module.css";
import Link from "next/link";
import { Ticket, BookOpen, Activity, LogOut, Bell, User } from "lucide-react";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState({
    totalEscalated: 0,
    unresolvedEscalated: 0,
    knowledgeCount: 0,
    notificationCount: 0
  });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = () => {
    fetch("/api/technician/sidebar-stats")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setStats(data);
      })
      .catch(console.error);
  };

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div style={{ paddingBottom: "2rem", fontWeight: "bold", fontSize: "1.2rem", letterSpacing: "0.1em", color: "white" }}>
          AVISA HELPDESK
        </div>
        
        <Link href="/technician" className={styles.navItem}>
          <Activity size={20} /> Dashboard
        </Link>
        <Link href="/technician/tickets" className={styles.navItem}>
          <Ticket size={20} /> Escalated Tickets
          <div className={styles.badgeGroup}>
            <span className={styles.badgeTotal} title={stats.totalEscalated.toString() + " total escalation"}>{stats.totalEscalated}</span>
            <span className={styles.badgeUnresolved} title={stats.unresolvedEscalated.toString() + " unresolved escalation"}>{stats.unresolvedEscalated}</span>
          </div>
        </Link>
        <Link href="/technician/knowledge" className={styles.navItem}>
          <BookOpen size={20} /> Knowledge Base
          <span className={styles.badgeKnowledge}>{stats.knowledgeCount}</span>
        </Link>
        <Link href="/technician/notifications" className={styles.navItem}>
          <Bell size={20} /> Notifications
          {stats.notificationCount > 0 && <span className={styles.badgeUnresolved}>{stats.notificationCount}</span>}
        </Link>
        <Link href="/profile" className={styles.navItem}>
          <User size={20} /> My Profile
        </Link>
        
        <div style={{ marginTop: "auto" }}>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={styles.navItem}
            style={{ color: "#db2777", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
