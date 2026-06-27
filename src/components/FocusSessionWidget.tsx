"use client";

import { Play, Pause, RotateCcw, Volume2, VolumeX, Award } from "lucide-react";
import { useFocusSession } from "@/lib/FocusSessionContext";

/**
 * Global floating Focus Session widget.
 * Renders as a fixed bar at bottom-right — visible on every page.
 * Shows timer, play/pause, reset, and ambient toggle.
 */
export default function FocusSessionWidget() {
  const {
    isRunning, isBreak, secondsLeft, ambientOn,
    totalPoints, start, reset, toggleAmbient, formatTime,
  } = useFocusSession();

  // Don't show widget if timer is at full duration and not running (idle)
  const isIdle = !isRunning && !isBreak && secondsLeft === 25 * 60;
  if (isIdle) return null;

  return (
    <div className="fixed bottom-20 right-6 z-[55] flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-[var(--shadow-float)] border border-ivory-deep/40 backdrop-blur-lg">
      {/* Timer display */}
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isRunning ? "bg-moss animate-pulse" : "bg-gold"}`} />
        <span className="font-serif text-sm font-semibold text-ink">
          {formatTime(secondsLeft)}
        </span>
      </div>

      {/* Status label */}
      <span className="text-[10px] text-ink-muted hidden sm:inline">
        {isRunning ? (isBreak ? "On break" : "Focusing") : "Paused"}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={start}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-moss text-white transition-colors hover:bg-moss-dark"
          title={isRunning ? "Pause" : "Resume"}
        >
          {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={reset}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-ivory-deep text-stone hover:bg-ivory-warm transition-colors"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={toggleAmbient}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-stone hover:bg-ivory-warm transition-colors"
          title="Lo-fi music"
        >
          {ambientOn ? <Volume2 className="h-3.5 w-3.5 text-moss" /> : <VolumeX className="h-3.5 w-3.5" />}
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
