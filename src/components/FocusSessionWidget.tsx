"use client";

import { Play, Pause, RotateCcw, Volume2, VolumeX, Award } from "lucide-react";
import { useFocusSession } from "@/lib/FocusSessionContext";

/**
 * Focus Session widget — inline in the header bar.
 * Shows timer, play/pause, reset, and ambient toggle.
 * Same row as the Language toggle.
 */
export default function FocusSessionWidget() {
  const {
    isRunning, isBreak, secondsLeft, ambientOn,
    totalPoints, start, reset, toggleAmbient, formatTime,
  } = useFocusSession();

  // Don't show widget if idle
  const isIdle = !isRunning && !isBreak && secondsLeft === 25 * 60;
  if (isIdle) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-1.5 shadow-sm border border-ivory-deep/40">
      {/* Timer display */}
      <div className="flex items-center gap-1.5">
        <div className={`h-2 w-2 rounded-full ${isRunning ? "bg-moss animate-pulse" : "bg-gold"}`} />
        <span className="font-serif text-sm font-semibold text-ink">
          {formatTime(secondsLeft)}
        </span>
      </div>

      {/* Status label */}
      <span className="text-[10px] text-ink-muted hidden sm:inline">
        {isRunning ? (isBreak ? "Break" : "Focus") : "Paused"}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={start}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-moss text-white transition-colors hover:bg-moss-dark"
          title={isRunning ? "Pause" : "Resume"}
        >
          {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>
        <button
          onClick={reset}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-ivory-deep text-stone hover:bg-ivory-warm transition-colors"
          title="Reset"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
        <button
          onClick={toggleAmbient}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-stone hover:bg-ivory-warm transition-colors"
          title="Lo-fi music"
        >
          {ambientOn ? <Volume2 className="h-3 w-3 text-moss" /> : <VolumeX className="h-3 w-3" />}
        </button>
      </div>

      {/* Points badge */}
      <div className="hidden sm:flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold-dark">
        <Award className="h-2.5 w-2.5" />
        {totalPoints}
      </div>
    </div>
  );
}
