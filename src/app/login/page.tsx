"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession, signOut } from "next-auth/react";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect if already logged in or after successful login
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // @ts-ignore
      const role = session.user.role;
      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "TECHNICIAN") {
        router.push("/technician");
      } else {
        router.push("/chat");
      }
    }
  }, [status, session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid corporate credentials. Please check your email and password.");
      setLoading(false);
    }
    // Redirection is handled by the useEffect once the session status updates
  };

  // Show a neutral loading state while the session is being resolved
  // This prevents flashing the form for already-authenticated users
  if (status === "loading") {
    return (
      <div className={styles.container}>
        <div className={styles.loginCard} style={{ textAlign: "center", color: "rgba(255,255,255,0.6)", padding: "3rem" }}>
          Checking session...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/" style={{ position: "absolute", top: "2rem", left: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.7)", textDecoration: "none", transition: "color 0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = "white"} onMouseOut={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}>
        <ArrowLeft size={20} /> Back to Home
      </Link>
      <div className={styles.loginCard}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <Image 
            src="/cypadi trancyparent logo.png" 
            alt="CYPADI Logo" 
            width={60} 
            height={60} 
            priority
            style={{ objectFit: "contain" }}
          />
        </div>
        <h1 className={styles.title}>Welcome Back</h1>
        
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: "0.8rem", borderRadius: "6px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}
        
        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Corporate Email Address</label>
            <input 
              type="email" 
              className={styles.input} 
              placeholder="name@cypadi.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input 
              type="password" 
              className={styles.input} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Authenticating via AD..." : "Sign In"}
          </button>
        </form>

        <div className={styles.footer}>
          Locked out or forgot password? <br/>
          <Link href="/reset-password" className={styles.link}>Request IT Account Recovery</Link>
          <br />
          Need a standard account? <Link href="/register" className={styles.link}>Create one here</Link>
        </div>
      </div>
    </div>
  );
}
