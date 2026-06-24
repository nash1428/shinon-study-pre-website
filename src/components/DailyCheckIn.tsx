"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const morningPrompts = [
  "What knowledge shall we cultivate today?",
  "The garden awaits. What shall we plant this morning?",
  "A new day, a new path. Where shall we begin?",
];

const eveningPrompts = [
  "What lesson will you carry forward from today's work?",
  "As the sun sets, reflect: what grew in your garden today?",
  "Before the lanterns dim — what did you learn that you did not know before?",
];

const weeklyPrompts = [
  "Which part of your garden has grown most this week?",
  "Look back on seven days of study. What took root? What still needs tending?",
];

interface CheckIn {
  date: string;
  response: string;
}

export default function DailyCheckIn() {
  const [checkIns, setCheckIns] = useLocalStorage<CheckIn[]>("studyspace_checkins", []);
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const hour = new Date().getHours();
  const isMorning = hour < 12;
  const isWeekly = new Date().getDay() === 0; // Sunday

  const prompt = isWeekly
    ? weeklyPrompts[Math.floor(Math.random() * weeklyPrompts.length)]
    : isMorning
    ? morningPrompts[Math.floor(Math.random() * morningPrompts.length)]
    : eveningPrompts[Math.floor(Math.random() * eveningPrompts.length)];

  const todayKey = new Date().toDateString();
  const hasCheckedInToday = checkIns.some((c) => c.date === todayKey);

  useEffect(() => {
    setSubmitted(hasCheckedInToday);
  }, [hasCheckedInToday]);

  const handleSubmit = () => {
    if (!response.trim()) return;
    const newCheckIn: CheckIn = { date: todayKey, response: response.trim() };
    setCheckIns([...checkIns, newCheckIn]);
    setSubmitted(true);
    setResponse("");
  };

  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
      <div className="mb-3 flex items-center gap-2">
        {isMorning ? (
          <Sun className="h-4 w-4 text-gold" />
        ) : (
          <Moon className="h-4 w-4 text-moss" />
        )}
        <h3 className="font-serif text-lg font-semibold text-ink">
          {isMorning ? "Morning Check-in" : "Evening Reflection"}
        </h3>
      </div>

      {submitted ? (
        <div className="rounded-xl bg-moss/5 p-4 text-center">
          <Sparkles className="mx-auto mb-2 h-5 w-5 text-gold opacity-50" />
          <p className="font-serif text-sm italic text-ink-soft">
            "The garden has been tended today."
          </p>
          <p className="mt-1 text-[10px] text-ink-muted">— Study Garden</p>
          {checkIns.length > 1 && (
            <p className="mt-2 text-[11px] text-ink-muted">
              {checkIns.length} reflections recorded
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-serif text-sm italic text-ink-soft">
            "{prompt}"
          </p>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your reflection..."
            rows={3}
            className="w-full rounded-xl border border-ivory-deep bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10 resize-y min-h-[70px]"
          />
          <button
            onClick={handleSubmit}
            disabled={!response.trim()}
            className="w-full rounded-xl bg-moss py-2.5 text-xs font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-40"
          >
            Reflect
          </button>
        </div>
      )}
    </div>
  );
}
