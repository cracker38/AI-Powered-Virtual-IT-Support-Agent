import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";

interface ChatMessage {
  from: "user" | "agent";
  text: string;
}

interface KBArticle {
  id: number;
  title: string;
  content: string;
  category?: string;
}

const GUEST_CHIPS = ["Password", "Email", "VPN", "Login", "Help"];

const GuestPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "agent",
      text: "Welcome! You're browsing as a guest. I can answer basic IT FAQs. Try a suggested topic or log in for full support.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [searchKb, setSearchKb] = useState("");
  const [kbLoading, setKbLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    const userMessage: ChatMessage = { from: "user", text: msg };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    try {
      const response = await api.post("/chat/guest-message", { message: userMessage.text });
      const reply: ChatMessage = { from: "agent", text: response.data.ai_reply };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      const reply: ChatMessage = {
        from: "agent",
        text: "Sorry, something went wrong. Please try again or log in for full support.",
      };
      setMessages((prev) => [...prev, reply]);
    } finally {
      setLoading(false);
    }
  };

  const loadKb = () => {
    setKbLoading(true);
    api
      .get<KBArticle[]>("/kb/public", { params: { q: searchKb || undefined, limit: 10 } })
      .then((r) => setArticles(r.data))
      .catch(() => setArticles([]))
      .finally(() => setKbLoading(false));
  };

  useEffect(() => {
    loadKb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="guest-page">
      <header className="guest-hero-strip">
        <div className="hero-accent-line" aria-hidden />
        <h1 className="guest-hero-title">CYPADI IT Support Agent</h1>
        <p className="guest-hero-subtitle">
          Try basic IT support as a guest. Log in for full chat, tickets, and knowledge base.
        </p>
        <div className="hero-cta-row">
          <Link to="/register" className="btn-secondary guest-cta">Register</Link>
          <Link to="/login" className="btn-primary guest-cta">Log in</Link>
        </div>
      </header>

      <div className="guest-columns">
        <aside className="column column-left">
          <div className="column-header">
            <span className="column-dot column-dot-accent" aria-hidden />
            <h2 className="column-title">AI Chat</h2>
            <span className="column-badge">Guest</span>
          </div>
          <div className="column-body">
        <div className="card chat-card guest-chat">
          <p className="muted guest-badge" style={{ display: "none" }}>Guest — simple FAQs only</p>
          {messages.length <= 1 && (
            <div className="chat-suggestions">
              {GUEST_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="chat-chip"
                  onClick={() => void sendMessage(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
          <div className="chat-window" ref={scrollRef}>
            {messages.map((m, index) => (
              <div
                key={index}
                className={`chat-message ${m.from === "user" ? "chat-message-user" : "chat-message-agent"}`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="chat-message chat-message-agent">
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="chat-input-row"
          >
            <input
              type="text"
              placeholder="Ask a simple IT question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              Send
            </button>
          </form>
        </div>
          </div>
        </aside>

        <aside className="column column-right">
          <div className="column-header">
            <span className="column-dot column-dot-success" aria-hidden />
            <h2 className="column-title">Knowledge Base</h2>
            <span className="column-badge column-badge-muted">View-only</span>
          </div>
          <div className="column-body">
        <div className="card guest-kb-card">
          <p className="muted column-desc">Log in for full search and related articles.</p>
          <div className="kb-search-row">
            <input
              value={searchKb}
              onChange={(e) => setSearchKb(e.target.value)}
              placeholder="Search articles..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  loadKb();
                }
              }}
            />
            <button onClick={loadKb} className="btn-primary" disabled={kbLoading}>
              {kbLoading ? "Searching..." : "Search"}
            </button>
          </div>
          <div className="kb-articles">
            {kbLoading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
              </div>
            ) : articles.length === 0 ? (
              <p className="muted">No articles found. Try a different search or log in for full access.</p>
            ) : (
              articles.map((a) => (
                <details key={a.id} className="kb-article">
                  <summary>{a.title}</summary>
                  <div className="kb-content">{a.content}</div>
                </details>
              ))
            )}
          </div>
        </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GuestPage;
