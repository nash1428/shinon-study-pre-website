"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "bot";
  text: string;
}

/**
 * Fox Sensei chatbot icon — uses the custom image asset.
 */
function FoxChatIcon({ size = 24 }: { size?: number }) {
  return (
    <img
      src="/app-icon.jpg"
      alt="Fox Sensei"
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Welcome to your study garden. I'm Fox Sensei — I can see your notes, tasks, and schedule. Ask me anything!" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Build context from localStorage so Fox Sensei can answer data questions
  const buildAppContext = () => {
    try {
      const context: Record<string, unknown> = {};

      // Notes
      const notesRaw = localStorage.getItem("studyspace_notes");
      if (notesRaw) {
        const notes = JSON.parse(notesRaw);
        context.notes = notes.map((n: { title: string; tag: string; excerpt: string; date: string; fullContent?: string }) => ({
          title: n.title,
          tag: n.tag,
          excerpt: n.excerpt,
          date: n.date,
          content: n.fullContent,
        }));
      }

      // Tasks
      const tasksRaw = localStorage.getItem("studyspace_tasks_all");
      if (tasksRaw) {
        const tasks = JSON.parse(tasksRaw);
        context.tasks = tasks.map((t: { title: string; content?: string; deadline?: string; done: boolean }) => ({
          title: t.title,
          content: t.content,
          deadline: t.deadline,
          done: t.done,
        }));
      }

      // Events
      const eventsRaw = localStorage.getItem("studyspace_local_events");
      if (eventsRaw) {
        const events = JSON.parse(eventsRaw);
        context.events = events.map((e: { title: string; date: string; startTime: string; endTime: string; location: string }) => ({
          title: e.title,
          date: e.date,
          startTime: e.startTime,
          endTime: e.endTime,
          location: e.location,
        }));
      }

      return context;
    } catch {
      return {};
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsThinking(true);

    try {
      const context = buildAppContext();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", text: userMsg }],
          context,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply || "I'm here. Tell me more." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "The garden is resting. Please try again in a moment." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      {/* Chat panel — opens above the icon */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[60] flex h-[400px] w-[340px] max-w-[calc(100vw-3rem)] flex-col rounded-2xl bg-white shadow-[var(--shadow-float)] border border-ivory-deep/40 page-enter">
          {/* Header with fox icon */}
          <div className="flex items-center justify-between border-b border-ivory-deep/40 px-4 py-3">
            <div className="flex items-center gap-2">
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
            {isThinking && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-ivory-warm/50 border border-ivory-deep/30 px-3 py-2">
                  <span className="mb-0.5 block font-serif text-[10px] italic text-gold">Fox Sensei</span>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-muted" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
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
                disabled={!input.trim() || isThinking}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-moss text-white transition-colors hover:bg-moss-dark disabled:opacity-40"
              >
                {isThinking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
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
        <FoxChatIcon size={32} />
      </button>
    </>
  );
}
