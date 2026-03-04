import { useEffect, useState } from "react";
import { kbApi, KBArticle } from "../api";

function KBPage() {
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await kbApi.listArticles({
          query: query || undefined,
          language: language || undefined,
        });
        setArticles(data);
      } catch (e) {
        setError("Unable to load knowledge base articles. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [query, language]);

  return (
    <div className="kb-page">
      <div className="kb-header">
        <h2>Knowledge Base</h2>
        <p className="kb-subtitle">Curated solutions to common issues across CYPADI.</p>
      </div>
      <div className="kb-toolbar">
        <input
          className="kb-search"
          placeholder="Search articles (e.g. VPN, Outlook, password)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="kb-filter"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="">All languages</option>
          <option value="en">English</option>
          <option value="rw">Kinyarwanda</option>
          <option value="fr">French</option>
        </select>
      </div>
      {loading && <p>Loading articles...</p>}
      {error && !loading && <p className="error-text">{error}</p>}
      {!loading && !error && articles.length === 0 && <p>No articles available yet.</p>}
      <ul className="kb-list">
        {articles.map((a) => (
          <li key={a.id} className="kb-item">
            <h3>{a.title}</h3>
            <p className="kb-meta">
              Language: {a.language.toUpperCase()} • Tags: {a.tags ?? "None"}
            </p>
            <pre className="kb-body">{a.body_markdown.slice(0, 300)}...</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default KBPage;

