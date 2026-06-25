"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "EMAIL" | "NEW_PASSWORD" | "SUCCESS";

export default function ResetPassword() {
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/reset?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok || !data.found) {
        setError("No matching user account was found for that email.");
        return;
      }

      setStep("NEW_PASSWORD");
    } catch (err) {
      console.error(err);
      setError("Unable to verify your account at this time. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to update password. Please try again.");
        return;
      }

      setStep("SUCCESS");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error(err);
      setError("Unable to complete password reset. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.resetCard}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <Image
            src="/cypadi trancyparent logo.png"
            alt="CYPADI Logo"
            width={50}
            height={50}
            priority
            style={{ objectFit: "contain" }}
          />
        </div>

        {step === "EMAIL" && (
          <>
            <h1 className={styles.title}>Account Recovery</h1>
            <p className={styles.subtitle}>Enter your email to verify your account and reset your password.</p>

            <form className={styles.form} onSubmit={handleEmailSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Corporate Email Address</label>
                <input
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cypadi.com"
                  required
                />
              </div>

              {error ? <p className={styles.error}>{error}</p> : null}

              <div className={styles.actionRow}>
                <Link href="/login" style={{ flex: 1 }}>
                  <button type="button" className={styles.secondaryBtn} style={{ width: "100%" }}>
                    Cancel
                  </button>
                </Link>
                <button type="submit" className={styles.primaryBtn} disabled={loading || !email.trim()}>
                  {loading ? "Verifying..." : "Continue"}
                </button>
              </div>
            </form>
          </>
        )}

        {step === "NEW_PASSWORD" && (
          <>
            <h1 className={styles.title}>Set New Password</h1>
            <p className={styles.subtitle}>Please enter and confirm your new password.</p>

            <form className={styles.form} onSubmit={handlePasswordSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>New Password</label>
                <input
                  type="password"
                  className={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  className={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error ? <p className={styles.error}>{error}</p> : null}

              <div className={styles.actionRow}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setStep("EMAIL")}>Back</button>
                <button type="submit" className={styles.primaryBtn} disabled={loading || !newPassword.trim() || !confirmPassword.trim()}>
                  {loading ? "Saving..." : "Save Password"}
                </button>
              </div>
            </form>
          </>
        )}

        {step === "SUCCESS" && (
          <>
            <h1 className={styles.title}>Password Reset Successful</h1>
            <p className={styles.subtitle}>Your password has been successfully updated.</p>

            <div className={styles.successBox} style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <p>You will be redirected to the login page shortly.</p>
            </div>

            <Link href="/login">
              <button className={styles.primaryBtn} style={{ width: "100%" }}>
                Return to Login Now
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
