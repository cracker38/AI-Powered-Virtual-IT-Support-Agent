"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Upload, Laptop, CheckCircle, XCircle } from "lucide-react";
import styles from "./page.module.css";

// Mock data for troubleshooting flows
const MOCK_FLOWS = [
  {
    id: "f1",
    name: "Internet Connectivity Issues",
    description: "Troubleshoot WiFi, VPN, or network drops.",
    startStep: "s1"
  },
  {
    id: "f2",
    name: "Software Crashing",
    description: "Help with applications that freeze or close unexpectedly.",
    startStep: "s3"
  }
];

const MOCK_STEPS: Record<string, any> = {
  s1: {
    question: "Are you trying to connect from the office or remotely?",
    options: ["Office (Corporate WiFi)", "Remote (Home/Cafe)", "VPN"],
    next: {
      "Office (Corporate WiFi)": "s2",
      "Remote (Home/Cafe)": "s_remote",
      "VPN": "s_vpn"
    }
  },
  s2: {
    question: "Is your device showing 'Connected, no internet'?",
    options: ["Yes", "No, it won't connect at all"],
    next: {
      "Yes": "sol_1",
      "No, it won't connect at all": "sol_2"
    }
  },
  s_remote: {
    question: "Have you tried restarting your home router?",
    options: ["Yes", "No"],
    next: {
      "Yes": "sol_3",
      "No": "sol_4"
    }
  },
  sol_1: {
    solution: "Please run the Network Troubleshooter in Windows Settings. If it doesn't work, forget the 'CYPADI_CORP' network and reconnect."
  },
  sol_2: {
    solution: "Your device certificate might have expired. Please escalate to a technician to renew your WiFi certificate."
  },
  sol_3: {
    solution: "Please check if your VPN client is trying to reconnect in a loop. If so, disconnect, wait 30 seconds, and reconnect."
  },
  sol_4: {
    solution: "Please restart your home router, wait 2 minutes, and try connecting again."
  }
};

export default function Troubleshoot() {
  const [selectedFlow, setSelectedFlow] = useState<any>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"solved" | "not_solved" | null>(null);

  const handleSelectFlow = (flow: any) => {
    setSelectedFlow(flow);
    setCurrentStepId(flow.startStep);
    setHistory([flow.startStep]);
    setFeedback(null);
  };

  const handleOptionClick = (option: string) => {
    if (!currentStepId) return;
    const step = MOCK_STEPS[currentStepId];
    const nextStepId = step.next[option];
    if (nextStepId) {
      setCurrentStepId(nextStepId);
      setHistory([...history, nextStepId]);
    }
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentStepId(newHistory[newHistory.length - 1]);
      setFeedback(null);
    } else {
      setSelectedFlow(null);
      setCurrentStepId(null);
      setHistory([]);
      setFeedback(null);
    }
  };

  const renderFlowSelection = () => (
    <div className={styles.flowSelection}>
      <h2>Select an Issue to Troubleshoot</h2>
      <div className={styles.grid}>
        {MOCK_FLOWS.map(flow => (
          <div key={flow.id} className={styles.card} onClick={() => handleSelectFlow(flow)}>
            <h3>{flow.name}</h3>
            <p>{flow.description}</p>
            <div className={styles.cardAction}>
              Start Diagnostics <ChevronRight size={16} />
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.toolsArea}>
        <h3>Quick Tools</h3>
        <div className={styles.toolButtons}>
          <button className={styles.secondaryBtn}>
            <Laptop size={16} /> Auto-Collect System Info
          </button>
          <button className={styles.secondaryBtn}>
            <Upload size={16} /> Upload Screenshot
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    if (!currentStepId) return null;
    const step = MOCK_STEPS[currentStepId];
    if (!step) return <div>Step not found</div>;

    if (step.solution) {
      return (
        <div className={styles.solutionView}>
          <div className={styles.solutionBox}>
            <h3>Suggested Solution</h3>
            <p>{step.solution}</p>
          </div>
          
          <div className={styles.feedbackArea}>
            <p>Did this solve your problem?</p>
            <div className={styles.feedbackButtons}>
              <button 
                className={`${styles.feedbackBtn} ${feedback === 'solved' ? styles.activeSolved : ''}`}
                onClick={() => setFeedback("solved")}
              >
                <CheckCircle size={18} /> Yes, Solved
              </button>
              <button 
                className={`${styles.feedbackBtn} ${feedback === 'not_solved' ? styles.activeNotSolved : ''}`}
                onClick={() => setFeedback("not_solved")}
              >
                <XCircle size={18} /> No, Still Broken
              </button>
            </div>
            {feedback === "not_solved" && (
              <div className={styles.escalateBox}>
                <p>We're sorry this didn't help. We can automatically create a ticket with your troubleshooting history.</p>
                <Link href="/chat">
                  <button className={styles.primaryBtn}>Escalate to Technician</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.questionView}>
        <h3>{step.question}</h3>
        <div className={styles.optionsList}>
          {step.options.map((opt: string) => (
            <button key={opt} className={styles.optionBtn} onClick={() => handleOptionClick(opt)}>
              {opt} <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/chat" className={styles.backLink}>
            <ArrowLeft size={18} /> Back to Chat
          </Link>
          <h1 className={styles.title}>Automated Troubleshooting</h1>
        </div>
      </header>

      <main className={styles.main}>
        {selectedFlow ? (
          <div className={styles.flowView}>
            <div className={styles.flowHeader}>
              <button onClick={goBack} className={styles.iconBtn}><ArrowLeft size={16} /> Back</button>
              <span className={styles.progress}>Step {history.length}</span>
            </div>
            {renderStep()}
          </div>
        ) : (
          renderFlowSelection()
        )}
      </main>
    </div>
  );
}
