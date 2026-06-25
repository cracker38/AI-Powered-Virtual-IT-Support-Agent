"use client";
import styles from "./layout.module.css";
import Link from "next/link";
import { BarChart, Brain, Webhook, ShieldAlert, LogOut, Users, User, BookOpen, Ticket, History } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div style={{ paddingBottom: "2rem", fontWeight: "bold", fontSize: "1.2rem", letterSpacing: "0.1em" }}>
          AVISA ADMIN
        </div>
        
        <Link href="/admin" className={styles.navItem}>
          <BarChart size={20} /> Analytics
        </Link>
        <Link href="/admin/users" className={styles.navItem}>
          <Users size={20} /> User Management
        </Link>
        <Link href="/profile" className={styles.navItem}>
          <User size={20} /> My Profile
        </Link>
        <Link href="/admin/monitoring" className={styles.navItem}>
          <ShieldAlert size={20} /> Proactive Alerts
        </Link>
        <Link href="/admin/integrations" className={styles.navItem}>
          <Webhook size={20} /> Integrations
        </Link>
        <Link href="/admin/training" className={styles.navItem}>
          <Brain size={20} /> AI Training
        </Link>
        <Link href="/admin/knowledge" className={styles.navItem}>
          <BookOpen size={20} /> Knowledge Base
        </Link>
        <Link href="/admin/tickets" className={styles.navItem}>
          <Ticket size={20} /> All Tickets
        </Link>
        <Link href="/admin/access-logs" className={styles.navItem}>
          <History size={20} /> Access Logs
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
