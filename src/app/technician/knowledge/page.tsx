"use client";
import { FormEvent, useEffect, useState } from "react";

type KnowledgeArticle = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
};

const categoryOptions = [
  { value: "Software", label: "Software Troubleshooting" },
  { value: "Hardware", label: "Hardware Issues" },
  { value: "Network", label: "Connectivity & Network" },
  { value: "Security", label: "Security & Passwords" },
];

export default function KnowledgeBase() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Software");
  const [tags, setTags] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/knowledge");
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      } else {
        setMessage("Unable to load knowledge articles.");
      }
    } catch (error) {
      setMessage("Connection error while fetching articles.");
    } finally {
      setLoadingList(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("Software");
    setTags("");
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const url = editingId ? `/api/knowledge/${editingId}` : "/api/knowledge";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, tags }),
      });

      if (res.ok) {
        const action = editingId ? "updated" : "saved";
        setMessage(`Article ${action} successfully! The AI Agent can now use this knowledge.`);
        resetForm();
        await fetchArticles();
      } else {
        setMessage("Error saving article.");
      }
    } catch (error) {
      setMessage("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (article: KnowledgeArticle) => {
    setEditingId(article.id);
    setTitle(article.title);
    setContent(article.content);
    setCategory(article.category);
    setTags(article.tags || "");
    setMessage("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this knowledge article? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Article deleted successfully.");
        if (editingId === id) {
          resetForm();
        }
        await fetchArticles();
      } else {
        setMessage("Error deleting article.");
      }
    } catch (error) {
      setMessage("Connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Knowledge Base Article Editor</h1>
          <p style={{ opacity: 0.8, marginTop: "0.5rem" }}>
            Create, update, or delete knowledge base articles that the AI support agent can use.
          </p>
        </div>
        {editingId && (
          <button
            onClick={resetForm}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "0.75rem 1rem", borderRadius: "8px", cursor: "pointer" }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {message && (
        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", color: "#10b981", padding: "1rem", borderRadius: "8px", marginBottom: "2rem" }}>
          {message}
        </div>
      )}

      <div style={{ display: "grid", gap: "2rem" }}>
        <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", opacity: 0.8 }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "1rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", color: "white", fontFamily: "inherit" }}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", opacity: 0.8 }}>Article Title</label>
                <input
                  type="text"
                  placeholder="e.g. Setting up Corporate VPN on Windows 11"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "1rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", color: "white", fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", opacity: 0.8 }}>Content / IT Procedure</label>
                <textarea
                  placeholder="Provide detailed step-by-step instructions..."
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  style={{ width: "100%", padding: "1rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", color: "white", fontFamily: "inherit", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", opacity: 0.8 }}>Tags</label>
                <input
                  type="text"
                  placeholder="Optional tags, comma separated"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  style={{ width: "100%", padding: "1rem", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", color: "white", fontFamily: "inherit" }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", background: "linear-gradient(135deg, #7c3aed, #db2777)", border: "none", padding: "1rem", borderRadius: "6px", color: "white", cursor: "pointer", fontSize: "1.1rem", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Publishing Knowledge..." : editingId ? "Update Knowledge Article" : "Save & Publish to AI Agent"}
              </button>
            </div>
          </form>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h2 style={{ margin: 0 }}>Existing Knowledge Articles</h2>
            <span style={{ opacity: 0.8 }}>{loadingList ? "Loading articles..." : `${articles.length} article${articles.length === 1 ? "" : "s"}`}</span>
          </div>

          {articles.length === 0 && !loadingList ? (
            <p style={{ opacity: 0.8 }}>No knowledge articles found yet. Create one to get started.</p>
          ) : null}

          <div style={{ display: "grid", gap: "1rem" }}>
            {articles.map((article) => (
              <div key={article.id} style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.25rem" }}>{article.title}</h3>
                    <p style={{ margin: "0.5rem 0", opacity: 0.75 }}>{article.category} · {new Date(article.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleEdit(article)}
                      style={{ background: "#7c3aed", border: "none", padding: "0.75rem 1rem", borderRadius: "8px", color: "white", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(article.id)}
                      style={{ background: "#ef4444", border: "none", padding: "0.75rem 1rem", borderRadius: "8px", color: "white", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p style={{ marginTop: "1rem", color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>{article.content}</p>
                {article.tags ? (
                  <div style={{ marginTop: "1rem", opacity: 0.75 }}><strong>Tags:</strong> {article.tags}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
