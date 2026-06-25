import React, { useEffect, useRef, useState } from "react";

import { api } from "../api";

interface ChatMessage {
  from: "user" | "agent";
  text: string;
}

const SUGGESTED_CHIPS = [
  "Password reset",
  "Email not working",
  "VPN connection issue",
  "Outlook problems",
  "Computer slow",
];

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "agent",
      text: "Hello! I'm your virtual IT support agent. How can I help you today? Try a suggested question below or describe your issue.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
      const response = await api.post("/chat/message", {
        message: userMessage.text,
        language: "en",
      });
      const reply: ChatMessage = { from: "agent", text: response.data.ai_reply };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      const reply: ChatMessage = {
        from: "agent",
        text: "Sorry, something went wrong. Please try again or submit a ticket for assistance.",
      };
      setMessages((prev) => [...prev, reply]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  return (
    <div className="card chat-card">
      <h2>IT Support Chat</h2>
      <p className="muted">Describe your issue or choose a suggested question</p>
      {messages.length <= 1 && (
        <div className="chat-suggestions">
          {SUGGESTED_CHIPS.map((chip) => (
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
      <form onSubmit={handleSubmit} className="chat-input-row">
        <input
          type="text"
          placeholder="Describe your IT issue..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
