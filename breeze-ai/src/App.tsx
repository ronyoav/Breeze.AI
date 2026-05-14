import { useEffect, useRef, useState } from "react";
import type { ChatMessage, TravelPreferences } from "./types";
import { STEPS } from "./steps";
import { ChatBubble } from "./components/ChatBubble";
import { InputArea } from "./components/InputArea";
import { SummaryCard } from "./components/SummaryCard";
import "./App.css";

function makeId() {
  return Math.random().toString(36).slice(2);
}

type Phase = "chat" | "summary" | "done";

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: makeId(), role: "agent", text: STEPS[0].agentMessage },
  ]);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("chat");
  const [prefs, setPrefs] = useState<Partial<TravelPreferences>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, phase]);

  const handleAnswer = (value: string) => {
    const currentStep = STEPS[stepIndex];

    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      text: value,
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrefs((prev) => ({ ...prev, [currentStep.prefKey]: value }));

    const nextIndex = stepIndex + 1;

    if (nextIndex >= STEPS.length) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const doneMsg: ChatMessage = {
          id: makeId(),
          role: "agent",
          text: "Perfect! I've got a full picture of your trip. Here's a summary — once you confirm I'll put together your personalised tour guide!",
        };
        setMessages((prev) => [...prev, doneMsg]);
        setPhase("summary");
      }, 800);
    } else {
      setStepIndex(nextIndex);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const agentMsg: ChatMessage = {
          id: makeId(),
          role: "agent",
          text: STEPS[nextIndex].agentMessage,
        };
        setMessages((prev) => [...prev, agentMsg]);
      }, 700);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/travel-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
    } catch {
      // Server not yet available — handled gracefully
    } finally {
      setLoading(false);
      setSubmitted(true);
      setPhase("done");
      const confirmMsg: ChatMessage = {
        id: makeId(),
        role: "agent",
        text: "🎉 You're all set! I'm now crafting your personalised tour guide with the best local spots, hidden gems, and experiences tailored just for you. It'll be ready before you land!",
      };
      setMessages((prev) => [...prev, confirmMsg]);
    }
  };

  const currentStep = STEPS[stepIndex];
  const inputActive = phase === "chat" && !isTyping;

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <span className="header-plane">🗺️</span>
          <div>
            <span className="header-title">Marco</span>
            <span className="header-sub">AI Tour Guide</span>
          </div>
        </div>
        <div className="header-badge">
          <span className="dot" />
          Online
        </div>
      </header>

      <main className="chat-window">
        <div className="messages">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div className="bubble-row agent-row">
              <div className="avatar">
                <span>🗺️</span>
              </div>
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {phase === "summary" && (
            <SummaryCard
              prefs={prefs as TravelPreferences}
              onSubmit={handleFinalSubmit}
              loading={loading}
              submitted={submitted}
            />
          )}

          <div ref={bottomRef} />
        </div>

        {inputActive && (
          <InputArea
            step={currentStep}
            onSubmit={handleAnswer}
            disabled={!inputActive}
          />
        )}
      </main>
    </div>
  );
}

export default App;
