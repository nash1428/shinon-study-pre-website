"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";

interface Message {
  role: "user" | "bot";
  text: string;
}

const botResponses = [
  "The garden grows with each step you take. What shall we work on?",
  "Consider: what is the foundation of this concept?",
  "Let us break this into smaller parts.",
  "A quiet mind plants deep roots. Take your time.",
  "What small step would move today's work forward?",
  "Consistency is becoming your strength.",
];

/**
 * Fox Chatbot Icon — used in both closed (docked) and open (header) states.
 * SVG placeholder matching the fox theme (fox orange #FF8C42).
 * TODO: Replace with final EXPRESSION icon assets from the design collection.
 */
function FoxChatIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ears */}
      <path d="M 12 14 L 8 4 L 18 10 Z" fill="#FF8C42" />
      <path d="M 36 14 L 40 4 L 30 10 Z" fill="#FF8C42" />
      <path d="M 13 11 L 11 7 L 16 10 Z" fill="#FFF" opacity="0.5" />
      <path d="M 35 11 L 37 7 L 32 10 Z" fill="#FFF" opacity="0.5" />

      {/* Head */}
      <ellipse cx="24" cy="26" rx="15" ry="13" fill="#FF8C42" />

      {/* White face */}
      <path d="M 24 18 Q 15 24 17 33 Q 24 36 31 33 Q 33 24 24 18 Z" fill="#FFFCF5" />

      {/* Eyes — happy expression */}
      <circle cx="18" cy="25" r="2" fill="#2E2B26" />
      <circle cx="30" cy="25" r="2" fill="#2E2B26" />
      <circle cx="18.7" cy="24.3" r="0.6" fill="#FFF" />
      <circle cx="30.7" cy="24.3" r="0.6" fill="#FFF" />

      {/* Nose */}
      <path d="M 22 30 Q 24 32 26 30 Q 24 28 22 30 Z" fill="#2E2B26" />

      {/* Smile */}
      <path d="M 21 32 Q 24 35 27 32" stroke="#2E2B26" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Welcome to your study garden. How may I guide you today?" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");

    setTimeout(() => {
      const response = botResponses[Math.floor(Math.random() * botResponses.length)];
      setMessages((prev) => [...prev, { role: "bot", text: response }]);
    }, 1200);
  };

  return (
    <>
      {/* Chat panel — opens above the icon */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[60] flex h-[400px] w-[340px] max-w-[calc(100vw-3rem)] flex-col rounded-2xl bg-white shadow-[var(--shadow-float)] border border-ivory-deep/40 page-enter">
          {/* Header with fox icon */}
          <div className="flex items-center justify-between border-b border-ivory-deep/40 px-4 py-3">
            <div className="flex items-center gap-2">
              {/* TODO: Replace with final EXPRESSION chatbot icon asset */}
              <FoxChatIcon size={20} />
              <span className="font-serif text-sm font-semibold text-ink">Fox Sensei</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-ivory-warm transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                    msg.role === "user"
                      ? "bg-moss text-white"
                      : "bg-ivory-warm/50 border border-ivory-deep/30 text-ink"
                  }`}
                >
                  {msg.role === "bot" && (
                    <span className="mb-0.5 block font-serif text-[10px] italic text-gold">Fox Sensei</span>
                  )}
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-ivory-deep/40 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask anything..."
                className="flex-1 rounded-xl border border-ivory-deep bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-moss text-white transition-colors hover:bg-moss-dark disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating icon — fox face, always visible at bottom-right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[var(--shadow-float)] transition-transform hover:scale-105 active:scale-95 border border-ivory-deep/40"
        title="Chat with Fox Sensei"
      >
        {/* TODO: Replace with final EXPRESSION chatbot icon asset */}
        <FoxChatIcon size={32} />
      </button>
    </>
  );
}
