"use client";

import { useEffect, useMemo, useState } from "react";

interface Transcript {
  id: string;
  userId: string;
  role: string;
  content: string;
  sentiment: string | null;
  detectedIntent: string | null;
  confidence: number | null;
  createdAt: string;
}

const INTENT_OPTIONS = ["ALL", "PASSWORD_RESET", "VPN_ISSUE", "SOFTWARE_CRASH", "SECURITY", "GENERAL"];
const SENTIMENT_OPTIONS = ["ALL", "POSITIVE", "NEUTRAL", "NEGATIVE"];

export default function AITrainingModule() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [selectedIntent, setSelectedIntent] = useState("ALL");
  const [selectedSentiment, setSelectedSentiment] = useState("ALL");
  const [minConfidence, setMinConfidence] = useState(0);
  const [corrections, setCorrections] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTranscripts();
  }, []);

  const fetchTranscripts = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      const data = await response.json();
      setTranscripts(data.transcripts || []);
    } catch (error) {
      console.error("Failed to load transcripts:", error);
    }
  };

  const handleCorrectionChange = (id: string, value: string) => {
    setCorrections((current) => ({ ...current, [id]: value }));
  };

  const saveIntentCorrection = async (id: string) => {
    const newIntent = corrections[id];
    if (!newIntent) return;
    try {
      const response = await fetch("/api/admin/analytics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, newIntent }),
      });
      if (response.ok) {
        setTranscripts((current) => current.map((item) => item.id === id ? { ...item, detectedIntent: newIntent } : item));
      }
    } catch (error) {
      console.error("Failed to update intent:", error);
    }
  };

  const filteredTranscripts = useMemo(() => {
    return transcripts.filter((item) => {
      const matchesIntent = selectedIntent === "ALL" || item.detectedIntent === selectedIntent;
      const matchesSentiment = selectedSentiment === "ALL" || item.sentiment === selectedSentiment;
      const confidence = item.confidence ?? 0;
      return matchesIntent && matchesSentiment && confidence >= minConfidence;
    });
  }, [transcripts, selectedIntent, selectedSentiment, minConfidence]);

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>AI Training Review</h1>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem" }}>Review recent transcripts and correct intent labels to improve the model's accuracy.</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <select value={selectedIntent} onChange={(e) => setSelectedIntent(e.target.value)} style={{ padding: "0.9rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "white" }}>
          {INTENT_OPTIONS.map((intent) => <option key={intent} value={intent}>{intent}</option>)}
        </select>
        <select value={selectedSentiment} onChange={(e) => setSelectedSentiment(e.target.value)} style={{ padding: "0.9rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "white" }}>
          {SENTIMENT_OPTIONS.map((sentiment) => <option key={sentiment} value={sentiment}>{sentiment}</option>)}
        </select>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", color: "rgba(255,255,255,0.8)" }}>
          Min Confidence
          <input type="number" min={0} max={100} value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} style={{ width: "80px", padding: "0.75rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "white" }} />
          %
        </label>
      </div>

      <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.9fr 0.8fr", gap: "1rem", padding: "1rem", background: "rgba(0,0,0,0.4)", fontWeight: "700" }}>
          <div>Message</div>
          <div>Intent</div>
          <div>Confidence</div>
          <div>Sentiment</div>
          <div>Actions</div>
        </div>
        {filteredTranscripts.length === 0 ? (
          <div style={{ padding: "1.5rem", color: "rgba(255,255,255,0.75)" }}>No transcripts match the selected filters.</div>
        ) : filteredTranscripts.map((entry) => (
          <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.9fr 0.8fr", gap: "1rem", padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", alignItems: "center" }}>
            <div style={{ wordBreak: "break-word" }}>{entry.content}</div>
            <div>{entry.detectedIntent || "Unknown"}</div>
            <div style={{ color: entry.confidence && entry.confidence >= 75 ? "#10b981" : "#f59e0b" }}>{entry.confidence ? `${Math.round(entry.confidence * 100)}%` : "N/A"}</div>
            <div>{entry.sentiment || "NEUTRAL"}</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <select value={corrections[entry.id] ?? entry.detectedIntent ?? "GENERAL"} onChange={(e) => handleCorrectionChange(entry.id, e.target.value)} style={{ padding: "0.6rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "white" }}>
                {INTENT_OPTIONS.filter((option) => option !== "ALL").map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <button onClick={() => saveIntentCorrection(entry.id)} style={{ background: "#2563eb", border: "none", color: "white", borderRadius: "8px", padding: "0.7rem 1rem", cursor: "pointer" }}>
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
