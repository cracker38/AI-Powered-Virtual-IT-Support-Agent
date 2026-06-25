"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { User, Shield, Bell, Volume2, Save, Key, LogOut, ArrowLeft } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    emailUpdates: true,
    voiceEnabled: true
  });

  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setFormData({
          name: data.name || "",
          password: "",
          emailUpdates: data.notificationPreferences?.emailUpdates ?? true,
          voiceEnabled: data.notificationPreferences?.voiceEnabled ?? true
        });
        setLoading(false);
      });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("Profile updated successfully!");
        setFormData(prev => ({ ...prev, password: "" }));
      }
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading profile...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className={styles.avatarLarge}>
          <User size={48} color="white" />
        </div>
        <div className={styles.headerInfo}>
          <h1>My Profile</h1>
          <p className={styles.userRole}>
            <Shield size={14} /> {profile.role} ACCOUNT
          </p>
        </div>
      </header>

      <form onSubmit={handleUpdate} className={styles.form}>
        <div className={styles.section}>
          <h3><User size={18} /> General Information</h3>
          <div className={styles.grid}>
            <div className={styles.inputGroup}>
              <label>Full Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Email Address (Cannot be changed)</label>
              <input type="email" value={profile.email} disabled className={styles.disabled} />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3><Key size={18} /> Security</h3>
          <div className={styles.inputGroup}>
            <label>New Password (Leave blank to keep current)</label>
            <input 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({ ...formData, password: e.target.value })} 
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3><Bell size={18} /> Notification Preferences</h3>
          <div className={styles.toggleGroup}>
            <div className={styles.toggle}>
              <div>
                <h4>Email Alerts</h4>
                <p>Receive updates when tickets are resolved or assigned.</p>
              </div>
              <input 
                type="checkbox" 
                checked={formData.emailUpdates} 
                onChange={e => setFormData({ ...formData, emailUpdates: e.target.checked })} 
              />
            </div>
            <div className={styles.toggle}>
              <div>
                <h4><Volume2 size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> AI Voice Responses</h4>
                <p>Enable or disable the AI speaking back to you in chat.</p>
              </div>
              <input 
                type="checkbox" 
                checked={formData.voiceEnabled} 
                onChange={e => setFormData({ ...formData, voiceEnabled: e.target.checked })} 
              />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.logoutBtn} onClick={() => signOut()}>
            <LogOut size={18} /> Log Out
          </button>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? "Saving..." : <><Save size={18} /> Save Preferences</>}
          </button>
        </div>
      </form>
    </div>
  );
}
