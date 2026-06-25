"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { UserPlus, Edit, Trash2, Shield, User, Mail, Search } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER"
  });

  const fetchData = async () => {
    try {
      const [uRes, lRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/logs")
      ]);
      setUsers(await uRes.json());
      setAccessLogs(await lRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
    const method = editingUser ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ name: "", email: "", password: "", role: "USER" });
        fetchData();
      } else {
        alert("Action failed. Check logs.");
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>User Management</h1>
          <p>Control system access and assign roles</p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditingUser(null); setShowModal(true); }}>
          <UserPlus size={20} /> Add New User
        </button>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>Loading data...</td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      {user.role === "ADMIN" ? <Shield size={16} /> : <User size={16} />}
                    </div>
                    <div>
                      <div className={styles.userName}>{user.name || "N/A"}</div>
                      <div className={styles.userEmail}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className={styles.actions}>
                  <button onClick={() => {
                    setEditingUser(user);
                    setFormData({ name: user.name || "", email: user.email || "", password: "", role: user.role });
                    setShowModal(true);
                  }}>
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteUser(user.id)} className={styles.deleteBtn}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editingUser ? "Edit User" : "Create New User"}</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Password {editingUser && "(Leave blank to keep current)"}</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className={styles.formGroup}>
                <label>System Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="USER">Standard User</option>
                  <option value="TECHNICIAN">IT Technician</option>
                  <option value="ADMIN">System Admin</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>{editingUser ? "Save Changes" : "Create User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
