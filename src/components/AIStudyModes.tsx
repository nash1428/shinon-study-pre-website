"use client";

import { useState } from "react";
import { Sparkles, BookOpen, Lightbulb, Target, Layers, FileText, GraduationCap, X, Send } from "lucide-react";
import Kitsune from "./Kitsune";

const studyModes = [
  { id: "explain", label: "Explain", labelJp: "解説", icon: BookOpen, desc: "Break down concepts clearly with examples" },
  { id: "socratic", label: "Socratic", labelJp: "問答", icon: Lightbulb, desc: "Discover answers through guided questions" },
  { id: "focus", label: "Focus", labelJp: "集中", icon: Target, desc: "Deep work with Pomodoro support" },
  { id: "revision", label: "Revision", labelJp: "復習", icon: Layers, desc: "Flashcards, quizzes, spaced repetition" },
  { id: "essay", label: "Essay", labelJp: "論文", icon: FileText, desc: "Structure, arguments, academic writing" },
  { id: "exam", label: "Exam Prep", labelJp: "試験準備", icon: GraduationCap, desc: "Study plans and weak area identification" },
];

const kitsuneResponses: Record<string, string[]> = {
  explain: [
    "Let us break this into smaller parts. Consider the foundation first — what do you already understand?",
    "An analogy: think of this concept as a stone in the garden. It seems simple, but supports much that grows around it.",
  ],
  socratic: [
    "Before I guide you — what is it that draws you to this question?",
    "Consider: if you removed one element from this problem, what would change?",
  ],
  focus: [
    "For the next 25 minutes, let us focus only on this task. The garden will tend itself.",
    "Settle into your work. A quiet mind plants deep roots.",
  ],
  revision: [
    "Let us revisit what you have learned. Repetition is the water that helps knowledge take root.",
    "I will create a few questions for you. Answer without fear — mistakes are simply stones on the path.",
  ],
  essay: [
    "A strong essay, like a garden, begins with structure. What is the central argument you wish to cultivate?",
    "Let us consider your evidence. Does each piece support your thesis the way moss supports the stone?",
  ],
  exam: [
    "Let us map your knowledge. Which areas feel uncertain? We shall tend to those first.",
    "A study plan is a path through the garden. Let us lay the stones one by one.",
  ],
};

export default function AIStudyModes() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<{ role: "user" | "kitsune"; text: string }[]>([]);
  const [kitsuneExpression, setKitsuneExpression] = useState<"calm" | "speaking" | "encouraging" | "reflective">("calm");

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId);
    const responses = kitsuneResponses[modeId];
    const response = responses[Math.floor(Math.random() * responses.length)];
    setKitsuneExpression("speaking");
    setConversation([{ role: "kitsune", text: response }]);
    setTimeout(() => setKitsuneExpression("calm"), 2000);
  };

  const handleSend = () => {
    if (!input.trim() || !selectedMode) return;
    const userMsg = input.trim();
    setConversation((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");

    // Simulated Kitsune response (TODO: wire to real AI)
    setKitsuneExpression("reflective");
    setTimeout(() => {
      const responses = kitsuneResponses[selectedMode];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setKitsuneExpression("speaking");
      setConversation((prev) => [...prev, { role: "kitsune", text: response }]);
      setTimeout(() => setKitsuneExpression("encouraging"), 1000);
      setTimeout(() => setKitsuneExpression("calm"), 3000);
    }, 1500);
  };

  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
      <div className="flex items-center gap-3 mb-4">
        <Kitsune className="h-10 w-10" expression={kitsuneExpression} />
        <div>
          <h3 className="font-serif text-lg font-semibold text-ink">Fox Sensei</h3>
          <p className="text-[11px] text-ink-muted">Your study companion</p>
        </div>
      </div>

      {!selectedMode ? (
        <>
          <p className="mb-3 text-xs text-ink-soft">Choose a study mode</p>
          <div className="grid grid-cols-2 gap-2">
            {studyModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className="flex flex-col items-start gap-1 rounded-xl border border-ivory-deep/40 p-3 text-left transition-colors hover:border-moss/30 hover:bg-moss/5"
                >
                  <Icon className="h-4 w-4 text-moss" />
                  <span className="text-xs font-medium text-ink">{mode.label}</span>
                  <span className="text-[10px] text-ink-muted leading-tight">{mode.desc}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Conversation */}
          <div className="mb-3 max-h-48 space-y-2 overflow-y-auto rounded-xl bg-ivory-warm/50 p-3">
            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                    msg.role === "user"
                      ? "bg-moss text-white"
                      : "bg-white border border-ivory-deep/40 text-ink"
                  }`}
                >
                  {msg.role === "kitsune" && (
                    <span className="mb-0.5 block font-serif text-[10px] italic text-gold">Fox Sensei</span>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask Fox Sensei..."
              className="flex-1 rounded-xl border border-ivory-deep bg-white px-3.5 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-moss text-white transition-colors hover:bg-moss-dark disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setSelectedMode(null); setConversation([]); }}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-ivory-deep text-stone hover:bg-ivory-warm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
