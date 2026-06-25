"use client";

import { useEffect, useState } from "react";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  createdAt: string;
}

export default function KnowledgePortal() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/knowledge");
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error("Failed to load knowledge articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = articles.filter((article) => {
    const query = search.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query) ||
      article.tags.toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Knowledge Portal</h1>
          <p style={{ color: "rgba(255,255,255,0.7)" }}>Browse support articles, troubleshooting guides, and IT policies.</p>
        </div>
        <input
          type="search"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "0.95rem 1rem", borderRadius: "12px", width: "320px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "white" }}
        />
      </div>

      {loading ? (
        <div>Loading articles...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "rgba(255,255,255,0.75)" }}>No articles match your search.</div>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {filtered.map((article) => (
            <article key={article.id} style={{ background: "rgba(255,255,255,0.05)", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{article.title}</h2>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{new Date(article.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <span style={{ background: "rgba(16,185,129,0.1)", color: "#a7f3d0", padding: "0.4rem 0.75rem", borderRadius: "999px", fontSize: "0.85rem" }}>{article.category}</span>
                <span style={{ background: "rgba(59,130,246,0.1)", color: "#bfdbfe", padding: "0.4rem 0.75rem", borderRadius: "999px", fontSize: "0.85rem" }}>{article.tags}</span>
              </div>
              <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, whiteSpace: "pre-wrap" }}>{article.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
