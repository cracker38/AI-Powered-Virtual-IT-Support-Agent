import { FormEvent, useState } from "react";
import { chatApi, ChatQueryResponse } from "../api";

interface Message {
  sender: "user" | "bot";
  text: string;
}

type LanguageCode = "en" | "rw" | "fr";

function ChatPage() {
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [botTyping, setBotTyping] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setBotTyping(true);

    try {
      const response: ChatQueryResponse = await chatApi.query({
        conversation_id: conversationId,
        message: input,
        language_hint: language,
      });
      setConversationId(response.conversation_id);

      // Simulate typing delay for better UX
      setTimeout(() => {
        const botMessage: Message = { sender: "bot", text: response.reply };
        setMessages((prev) => [...prev, botMessage]);
        setBotTyping(false);
      }, 350);
    } catch (error) {
      const botMessage: Message = {
        sender: "bot",
        text: "Sorry, something went wrong contacting the support service.",
      };
      setMessages((prev) => [...prev, botMessage]);
      setBotTyping(false);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.sender}`}>
            <div className="bubble">{msg.text}</div>
          </div>
        ))}
        {botTyping && (
          <div className="chat-message bot">
            <div className="bubble typing-indicator">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>
      <form className="chat-input-row" onSubmit={handleSubmit}>
        <select
          className="lang-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          disabled={loading}
        >
          <option value="en">EN</option>
          <option value="rw">RW</option>
          <option value="fr">FR</option>
        </select>
        <input
          type="text"
          placeholder="Describe your IT issue..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default ChatPage;

