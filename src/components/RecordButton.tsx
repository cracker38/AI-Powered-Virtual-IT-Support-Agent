"use client";

import React from "react";
import { Mic, MicOff } from "lucide-react";

interface Props {
  isRecording: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function RecordButton({ isRecording, disabled, onStart, onStop }: Props) {
  const handleClick = () => {
    if (disabled) return;
    if (isRecording) onStop();
    else onStart();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={isRecording}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: isRecording ? "linear-gradient(90deg,#ef4444,#f97316)" : "transparent",
        color: isRecording ? "white" : "#e2e8f0",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
      {isRecording ? "Stop Recording" : "Record Voice"}
    </button>
  );
}
