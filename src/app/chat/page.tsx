"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import styles from "./page.module.css";
import { Send, LifeBuoy, User, LogOut } from "lucide-react";
import EscalationModal from "@/components/EscalationModal";
import NotificationBell from "@/components/NotificationBell";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const RecordButton = dynamic(() => import("@/components/RecordButton"), { ssr: false });

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  sentiment?: string;
  intent?: string;
  confidence?: number;
}

interface DiagnosticFlow {
  step: number;
  options: string[];
}

const DEFAULT_MESSAGE: Message = {
  id: "welcome",
  role: "bot",
  content: "Bonjour ! Je suis AVISA, votre agent virtuel de support informatique. Comment puis-je vous aider aujourd'hui ? / Hello! I am AVISA, your Virtual IT Support Agent. How can I assist you today?",
};

export default function ChatInterface() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPrompt, setRecordingPrompt] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const [isEscalationOpen, setIsEscalationOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("auto");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [diagnosticFlow, setDiagnosticFlow] = useState<DiagnosticFlow | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const userId = (session?.user as any)?.id ?? "anonymous";

  useEffect(() => {
    if (status === "loading") return;
    fetchHistory();
    fetchBroadcast();
    // fetch user preferences (voiceEnabled)
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setVoiceEnabled(!!data.notificationPreferences?.voiceEnabled);
        }
      } catch (err) {
        console.warn("Could not fetch user preferences for voice:", err);
      }
    })();
    const intervalId = window.setInterval(fetchBroadcast, 30000);
    return () => window.clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = selectedLanguage === "auto" ? "en-US" : selectedLanguage;

    recognition.onstart = () => {
      setRecordingPrompt("Listening... speak now");
      setIsRecording(true);
      if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = window.setTimeout(() => {
        if (recognition && recognition.state === "recording") {
          recognition.stop();
        }
      }, 12000);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        await handleSpeechText(transcript);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "bot", content: "I couldn't understand the audio. Please type your message instead." },
        ]);
      }
    };

    recognition.onnomatch = () => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "bot", content: "I did not recognize speech. Please try again." },
      ]);
    };

    recognition.onerror = (event: any) => {
      // Normalize the event which may be a string, an Error-like object, or a SpeechRecognitionErrorEvent
      const err: any = (() => {
        if (!event) return null;
        if (typeof event === "string") return event;
        if (typeof event === "object") return event.error ?? event;
        return String(event);
      })();

      // Treat benign, expected errors quietly (no-speech, permissions) and show friendly messages
      if (err === "no-speech" || err?.name === "NoSpeechError") {
        console.debug("Speech recognition: no-speech received");
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "bot", content: "I didn't hear anything — please try speaking again." },
        ]);
      } else if (err === "not-allowed" || err?.name === "NotAllowedError") {
        console.debug("Speech recognition: permission denied");
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "bot", content: "Microphone access denied. Please enable microphone permissions for this site." },
        ]);
      } else {
        // Unexpected errors: log in console and inform the user
        console.error("Speech recognition error:", err);
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "bot", content: "Voice recognition encountered an issue. Please try again or type your message." },
        ]);
      }

      // Ensure UI state cleanup
      setIsRecording(false);
      setRecordingPrompt(null);
      if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
    };

    recognition.onend = () => {
      // ensure UI state is always reset when recognition stops
      setIsRecording(false);
      setRecordingPrompt(null);
      if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
    };

    recognitionRef.current = recognition;
  }, [selectedLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const speak = (text: string, lang: string = "en") => {
    if (!voiceEnabled) return;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "fr" ? "fr-FR" : "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((v) => v.lang.startsWith(lang) && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium"))) || voices.find((v) => v.lang.startsWith(lang));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.length > 0 ? data : [DEFAULT_MESSAGE]);
      } else {
        setMessages([DEFAULT_MESSAGE]);
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setMessages([DEFAULT_MESSAGE]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBroadcast = async () => {
    try {
      const response = await fetch("/api/admin/broadcasts");
      if (response.ok) {
        const data = await response.json();
        setBroadcastMessage(data?.[0]?.message || null);
      }
    } catch (error) {
      console.warn("Could not fetch broadcast alerts:", error);
    }
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, history: nextMessages, userId }),
      });

      const data = await response.json();
      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: data.reply || "I am experiencing a service interruption. Please try again shortly.",
        sentiment: data.sentiment,
        intent: data.intent,
        confidence: data.confidence,
      };
      setMessages((prev) => [...prev, botReply]);
      setSuggestedQuestions(Array.isArray(data.suggestedQuestions) ? data.suggestedQuestions : []);
      setDiagnosticFlow(data.diagnosticFlow || null);
      speak(botReply.content, data.language);

      if (data.shouldEscalate) {
        setTimeout(() => setIsEscalationOpen(true), 1200);
      }
    } catch (error) {
      console.error("Error communicating with AI:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "bot",
          content: "I could not reach the support agent. Please try again later.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const getSupportedAudioMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  };

  const handleSpeechText = async (text: string) => {
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsTyping(true);

    try {
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, history: nextMessages, userId }),
      });

      if (!chatResponse.ok) {
        throw new Error("Chat request failed");
      }

      const chatData = await chatResponse.json();
      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: chatData.reply || "I am currently undergoing maintenance and couldn't process your request.",
        sentiment: chatData.sentiment,
        intent: chatData.intent,
        confidence: chatData.confidence,
      };
      setMessages((prev) => [...prev, botReply]);
      setSuggestedQuestions(Array.isArray(chatData.suggestedQuestions) ? chatData.suggestedQuestions : []);
      setDiagnosticFlow(chatData.diagnosticFlow || null);
      speak(botReply.content, chatData.language);
    } catch (error) {
      console.error("Error sending voice message to chat:", error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "bot", content: "There was an error sending your voice message. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    if (!voiceEnabled) {
      alert("Voice-to-text is disabled in your profile settings. Enable 'AI Voice Responses' in My Profile to use voice input.");
      return;
    }
    if (typeof window !== "undefined" && recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedLanguage === "auto" ? "en-US" : selectedLanguage;
        recognitionRef.current.start();
        setIsRecording(true);
        return;
      } catch (error) {
        console.warn("Web Speech API start error, falling back to MediaRecorder:", error);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        const blobType = chunks[0]?.type || "audio/webm";
        const audioBlob = new Blob(chunks, { type: blobType });
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.onerror = (event: any) => {
        console.error("MediaRecorder error:", event.error || event);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone or start recording. Please check permissions and try again.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setRecordingPrompt(null);
      if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
      return;
    }

    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      setRecordingPrompt(null);
      if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setRecordingPrompt("Uploading audio...");
    setIsTyping(true);
    console.debug("processAudio: sending audio blob", { size: audioBlob.size, type: audioBlob.type });
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-note.webm");
      if (selectedLanguage !== "auto") formData.append("language", selectedLanguage);

      // notify user UI that upload started
      setMessages((prev) => [...prev, { id: `upload-${Date.now()}`, role: "bot", content: "Uploading voice note..." }]);

      const response = await fetch("/api/speech-to-text", { method: "POST", body: formData });
      console.debug("processAudio: speech-to-text response status", response.status);
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Transcription request failed (${response.status}) ${text}`);
      }

      const data = await response.json();

      if (data.text) {
        // remove the uploading notice
        setMessages((prev) => prev.filter((m) => !String(m.id).startsWith("upload-")));
        await handleSpeechText(data.text);
      } else {
        setMessages((prev) => [...prev.filter((m) => !String(m.id).startsWith("upload-")), { id: Date.now().toString(), role: "bot", content: "I couldn't understand the audio. Please type your message instead." }]);
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      setMessages((prev) => [...prev.filter((m) => !String(m.id).startsWith("upload-")), { id: Date.now().toString(), role: "bot", content: "There was an error processing your voice note. Please try again." }]);
    } finally {
      setRecordingPrompt(null);
      setIsTyping(false);
    }
  };

  const latestBotMessage = useMemo(() => {
    return [...messages].reverse().find((msg) => msg.role === "bot");
  }, [messages]);

  return (
    <div className={styles.container}>
      <header className={styles.headerBar}>
        <div>
          <h1>AVISA Virtual IT Support</h1>
          <p className={styles.subline}>Your real-time assistant for passwords, VPN, software, and IT operations.</p>
        </div>
        <div className={styles.headerActions}>
          <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className={styles.selectInput}>
            <option value="auto">Auto Detect</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="rw">Kinyarwanda</option>
          </select>

          <NotificationBell userId={userId} />

          <Link href="/profile">
            <button type="button" className={styles.secondaryBtn}>
              <User size={16} /> My Profile
            </button>
          </Link>

          <button type="button" className={styles.secondaryBtn} onClick={() => {
            setMessages([DEFAULT_MESSAGE]);
            setSuggestedQuestions([]);
            setDiagnosticFlow(null);
            setInput("");
          }}>
            Clear Chat
          </button>

          <button type="button" className={styles.primaryBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      {broadcastMessage ? (
        <div className={styles.broadcastBanner}>
          <strong>Notice:</strong> {broadcastMessage}
        </div>
      ) : null}

      <main className={styles.chatMain}>
        <section className={styles.chatPane}>
          <div className={styles.messagesList}>
            {loading ? (
              <div className={styles.loader}>Loading chat history...</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={msg.role === "bot" ? styles.botMessage : styles.userMessage}>
                  <div className={styles.messageHeader}>
                    <span>{msg.role === "bot" ? "AVISA" : "You"}</span>
                    {msg.role === "bot" && msg.sentiment ? <span className={styles.sentimentBadge}>{msg.sentiment}</span> : null}
                  </div>
                  <p className={styles.messageBody}>{msg.content}</p>
                </div>
              ))
            )}
            {isTyping && (
              <div className={styles.botMessage}>
                <div className={styles.typingIndicator}>AVISA is typing...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className={styles.chatForm} onSubmit={handleSend}>
            <textarea
              className={styles.chatInput}
              placeholder="Type your question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              disabled={isTyping}
            />
            <div className={styles.formActions}>
              <div className={styles.recordingGroup}>
                <RecordButton
                  isRecording={isRecording}
                  disabled={isTyping || !voiceEnabled}
                  onStart={startRecording}
                  onStop={stopRecording}
                />
                {!voiceEnabled && <small style={{ color: '#94a3b8', marginLeft: 12 }}>Voice input disabled in profile</small>}
                {recordingPrompt ? <span className={styles.recordingPrompt}>{recordingPrompt}</span> : null}
              </div>
              <button type="submit" className={styles.primaryBtn} disabled={!input.trim() || isTyping}>
                <Send size={18} /> Send
              </button>
            </div>
          </form>
        </section>

        <aside className={styles.sidebarPanel}>
          <div className={styles.card}>
            <h2>Quick Actions</h2>
            <button className={styles.tagButton} onClick={() => handleQuickAction("I need help with password reset")}>Password Reset</button>
            <button className={styles.tagButton} onClick={() => handleQuickAction("My VPN connection keeps dropping")}>VPN Help</button>
            <button className={styles.tagButton} onClick={() => handleQuickAction("The software is crashing when I open it")}>Software Crash</button>
          </div>

          {suggestedQuestions.length > 0 ? (
            <div className={styles.card}>
              <h2>Suggested Questions</h2>
              {suggestedQuestions.map((suggestion, idx) => (
                <button key={idx} className={styles.tagButton} onClick={() => handleQuickAction(suggestion)}>{suggestion}</button>
              ))}
            </div>
          ) : null}

          {diagnosticFlow ? (
            <div className={styles.card}>
              <h2>Diagnostic Steps</h2>
              {diagnosticFlow.options.map((option, idx) => (
                <button key={idx} className={styles.tagButton} onClick={() => handleQuickAction(option)}>{option}</button>
              ))}
            </div>
          ) : null}

          <div className={styles.escalationCard}>
            <LifeBuoy size={20} className={styles.promoIcon} />
            <p>Still unresolved? Escalate directly to a technician.</p>
            <button className={styles.escalateBtn} onClick={() => setIsEscalationOpen(true)}>Escalate Now</button>
          </div>
        </aside>
      </main>

      <footer className={styles.footerBar}>
        <span>Need additional help? </span>
        <Link href="/reset-password">Reset password</Link>
      </footer>

      <EscalationModal
        isOpen={isEscalationOpen}
        onClose={() => setIsEscalationOpen(false)}
        userId={userId}
        chatHistory={messages}
        onSuccess={(ticketId) => {
          setIsEscalationOpen(false);
          router.push(`/ticket-tracking/${ticketId}`);
        }}
      />
    </div>
  );
}
