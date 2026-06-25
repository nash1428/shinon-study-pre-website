"use client";

import { useState, useEffect } from "react";
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Minus, Plus, Award,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const DEFAULT_DURATION = 25; // minutes
const BREAK_DURATION = 5 * 60; // 5 minutes (fixed)
const POINTS_PER_SESSION = 10;

const startMessages = [
  "For the next few minutes, let us focus only on this task.",
  "Settle into your work. The garden will tend itself while you study.",
  "A quiet mind plants deep roots. Let us begin.",
];

const completeMessages = [
  "The path grows a little longer today.",
  "Another stone laid upon the path. Well done.",
  "Your garden flourishes with each moment of focus.",
];

const longSessionMessages = [
  "Deep work leaves lasting footprints.",
  "The moss grows thickest where one sits longest.",
  "Your dedication shapes the landscape of your knowledge.",
];

const gardenStages = [
  { name: "Young Garden", nameJp: "若草園", stage: 1 },
  { name: "Blooming Garden", nameJp: "花開園", stage: 2 },
  { name: "Scholar's Garden", nameJp: "学舎園", stage: 3 },
  { name: "Wisdom Garden", nameJp: "知恵園", stage: 4 },
  { name: "Master's Garden", nameJp: "達人園", stage: 5 },
];

export default function FocusTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(DEFAULT_DURATION);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATION * 60);
  const [completedSessions, setCompletedSessions] = useLocalStorage<number>("studyspace_focus_count", 0);
  const [totalMinutes, setTotalMinutes] = useLocalStorage<number>("studyspace_focus_minutes", 0);
  const [totalPoints, setTotalPoints] = useLocalStorage<number>("studyspace_focus_points", 0);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [kitsuneMessage, setKitsuneMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [ambientOn, setAmbientOn] = useState(false);

  const focusDuration = customMinutes * 60;

  // Update secondsLeft when customMinutes changes (only when not running and not on break)
  useEffect(() => {
    if (!isRunning && !isBreak) {
      setSecondsLeft(focusDuration);
    }
  }, [customMinutes, focusDuration, isRunning, isBreak]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Session complete
          if (!isBreak) {
            const newCount = completedSessions + 1;
            const sessionMinutes = Math.round(focusDuration / 60);
            const earned = POINTS_PER_SESSION;
            setCompletedSessions(newCount);
            setTotalMinutes(totalMinutes + sessionMinutes);
            setTotalPoints(totalPoints + earned);
            setPointsEarned(earned);
            const messages = newCount >= 3 ? longSessionMessages : completeMessages;
            setKitsuneMessage(messages[Math.floor(Math.random() * messages.length)]);
          } else {
            setKitsuneMessage("Shall we continue our work together?");
            setPointsEarned(null);
          }
          setShowMessage(true);
          setIsBreak(!isBreak);
          setIsRunning(false);
          return isBreak ? focusDuration : BREAK_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isBreak, completedSessions, setCompletedSessions, totalMinutes, setTotalMinutes, totalPoints, setTotalPoints, focusDuration]);

  const handleStart = () => {
    if (!isRunning && (isBreak ? secondsLeft === BREAK_DURATION : secondsLeft === focusDuration)) {
      setKitsuneMessage(startMessages[Math.floor(Math.random() * startMessages.length)]);
      setShowMessage(true);
      setPointsEarned(null);
      setTimeout(() => setShowMessage(false), 5000);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setSecondsLeft(focusDuration);
    setShowMessage(false);
    setPointsEarned(null);
  };

  const adjustMinutes = (delta: number) => {
    if (isRunning) return;
    const newMinutes = Math.max(5, Math.min(120, customMinutes + delta));
    setCustomMinutes(newMinutes);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const currentDuration = isBreak ? BREAK_DURATION : focusDuration;
  const progress = (currentDuration - secondsLeft) / currentDuration;
  const gardenStage = Math.min(5, Math.floor(completedSessions / 5) + 1);
  const currentStage = gardenStages[gardenStage - 1];

  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-[var(--shadow-card)] border border-ivory-deep/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg font-semibold text-ink">
          {isBreak ? "Rest" : "Focus Session"}
        </h3>
        <div className="flex items-center gap-2">
          {/* Points badge */}
          <div className="flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold-dark">
            <Award className="h-3 w-3" />
            {totalPoints} pts
          </div>
          <button
            onClick={() => setAmbientOn(!ambientOn)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-stone hover:bg-ivory-warm transition-colors"
            title="Ambient sounds"
          >
            {ambientOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Custom duration selector — only when not running and not on break */}
      {!isRunning && !isBreak && (
        <div className="mb-4 flex items-center justify-center gap-3">
          <button
            onClick={() => adjustMinutes(-5)}
            disabled={customMinutes <= 5}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ivory-deep text-ink-muted hover:bg-ivory-warm transition-colors disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="font-serif text-2xl font-bold text-ink">{customMinutes}</p>
            <p className="text-[10px] text-ink-muted">minutes</p>
          </div>
          <button
            onClick={() => adjustMinutes(5)}
            disabled={customMinutes >= 120}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ivory-deep text-ink-muted hover:bg-ivory-warm transition-colors disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Timer display */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="58" stroke="#E5DCC8" strokeWidth="4" fill="none" />
            <circle
              cx="64" cy="64" r="58"
              stroke={isBreak ? "#8FA37C" : "#7D8F69"}
              strokeWidth="4" fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - progress)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="font-serif text-2xl font-semibold text-ink">
            {formatTime(secondsLeft)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStart}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-soft)] transition-colors ${
              isRunning ? "bg-maple hover:bg-maple" : "bg-moss hover:bg-moss-dark"
            }`}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? "Pause" : isBreak ? "Start Break" : "Begin Focus"}
          </button>
          <button
            onClick={handleReset}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-ivory-deep text-stone hover:bg-ivory-warm transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Garden progress + points */}
        <div className="mt-2 w-full border-t border-ivory-deep/40 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-muted">Garden Stage</span>
            <span className="font-serif text-sm font-medium text-moss">{currentStage.name}</span>
          </div>
          <div className="mt-1.5 flex gap-1">
            {gardenStages.map((s) => (
              <div
                key={s.stage}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s.stage <= gardenStage ? "bg-moss" : "bg-ivory-deep"
                }`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-ink-muted">
            <span>{completedSessions} sessions completed</span>
            <span className="flex items-center gap-1 text-gold-dark">
              <Award className="h-3 w-3" />
              {totalPoints} total points
            </span>
          </div>
        </div>
      </div>

      {/* Kitsune message + points earned */}
      {showMessage && (kitsuneMessage || pointsEarned !== null) && (
        <div className="mt-4 rounded-xl bg-gold/10 border border-gold/20 p-3 text-center page-enter">
          {pointsEarned !== null && (
            <div className="mb-2 flex items-center justify-center gap-1.5">
              <Award className="h-4 w-4 text-gold-dark" />
              <span className="text-sm font-bold text-gold-dark">+{pointsEarned} points earned!</span>
            </div>
          )}
          {kitsuneMessage && (
            <>
              <p className="font-serif text-sm italic text-ink-soft">
                "{kitsuneMessage}"
              </p>
              <p className="mt-1 text-[10px] text-ink-muted">— Study Garden</p>
            </>
          )}
        </div>
      )}

      {/* Ambient sound (placeholder) */}
      {ambientOn && (
        <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-ink-muted">
          <Volume2 className="h-3 w-3" />
          Ambient garden soundscape
          <span className="text-gold">· active</span>
        </div>
      )}
    </div>
  );
}
