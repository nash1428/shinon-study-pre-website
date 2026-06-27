"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LoFiMusic } from "@/lib/lofi-music";

const DEFAULT_DURATION = 25; // minutes
const BREAK_DURATION = 5 * 60; // 5 minutes
const POINTS_PER_SESSION = 10;

interface FocusSessionContextValue {
  isRunning: boolean;
  isBreak: boolean;
  secondsLeft: number;
  customMinutes: number;
  ambientOn: boolean;
  completedSessions: number;
  totalMinutes: number;
  totalPoints: number;
  pointsEarned: number | null;
  kitsuneMessage: string;
  showMessage: boolean;
  start: () => void;
  reset: () => void;
  adjustMinutes: (delta: number) => void;
  toggleAmbient: () => void;
  formatTime: (s: number) => string;
}

const FocusSessionContext = createContext<FocusSessionContextValue | null>(null);

export function useFocusSession() {
  const ctx = useContext(FocusSessionContext);
  if (!ctx) throw new Error("useFocusSession must be used within FocusSessionProvider");
  return ctx;
}

export function FocusSessionProvider({ children }: { children: ReactNode }) {
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

  // Persistent LoFiMusic instance — survives navigation
  const lofiRef = useRef<LoFiMusic | null>(null);
  // Refs for interval callback (avoids stale closures)
  const isBreakRef = useRef(isBreak);
  const completedSessionsRef = useRef(completedSessions);
  const totalMinutesRef = useRef(totalMinutes);
  const totalPointsRef = useRef(totalPoints);
  const customMinutesRef = useRef(customMinutes);

  isBreakRef.current = isBreak;
  completedSessionsRef.current = completedSessions;
  totalMinutesRef.current = totalMinutes;
  totalPointsRef.current = totalPoints;
  customMinutesRef.current = customMinutes;

  const focusDuration = customMinutes * 60;

  // Start/stop lo-fi music
  useEffect(() => {
    if (ambientOn) {
      if (!lofiRef.current) lofiRef.current = new LoFiMusic();
      lofiRef.current.start();
    } else {
      lofiRef.current?.stop();
    }
  }, [ambientOn]);

  // Clean up on unmount (only when provider unmounts = app closes)
  useEffect(() => {
    return () => { lofiRef.current?.stop(); };
  }, []);

  // Update secondsLeft when customMinutes changes
  useEffect(() => {
    if (!isRunning && !isBreak) {
      setSecondsLeft(focusDuration);
    }
  }, [customMinutes, focusDuration, isRunning, isBreak]);

  // Timer interval — lives in the provider, not the page component
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          const currentFocusDuration = customMinutesRef.current * 60;
          const currentIsBreak = isBreakRef.current;

          if (!currentIsBreak) {
            const newCount = completedSessionsRef.current + 1;
            const sessionMinutes = Math.round(currentFocusDuration / 60);
            const earned = POINTS_PER_SESSION;
            setCompletedSessions(newCount);
            setTotalMinutes(totalMinutesRef.current + sessionMinutes);
            setTotalPoints(totalPointsRef.current + earned);
            setPointsEarned(earned);
            setKitsuneMessage(newCount >= 3
              ? "Deep work leaves lasting footprints."
              : "The path grows a little longer today.");
          } else {
            setKitsuneMessage("Shall we continue our work together?");
            setPointsEarned(null);
          }
          setShowMessage(true);
          setIsBreak(!currentIsBreak);
          setIsRunning(false);
          return currentIsBreak ? currentFocusDuration : BREAK_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, setCompletedSessions, setTotalMinutes, setTotalPoints]);

  const start = useCallback(() => {
    if (!isRunning) {
      const currentDuration = isBreak ? BREAK_DURATION : customMinutesRef.current * 60;
      if (secondsLeft === currentDuration) {
        setKitsuneMessage("Settle into your work. The garden will tend itself while you study.");
        setShowMessage(true);
        setPointsEarned(null);
        setTimeout(() => setShowMessage(false), 5000);
      }
    }
    setIsRunning(!isRunning);
  }, [isRunning, isBreak, secondsLeft]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setSecondsLeft(customMinutesRef.current * 60);
    setShowMessage(false);
    setPointsEarned(null);
  }, []);

  const adjustMinutes = useCallback((delta: number) => {
    if (isRunning) return;
    setCustomMinutes((prev) => Math.max(5, Math.min(120, prev + delta)));
  }, [isRunning]);

  const toggleAmbient = useCallback(() => {
    setAmbientOn((prev) => !prev);
  }, []);

  const formatTime = useCallback((s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }, []);

  return (
    <FocusSessionContext.Provider
      value={{
        isRunning, isBreak, secondsLeft, customMinutes, ambientOn,
        completedSessions, totalMinutes, totalPoints, pointsEarned,
        kitsuneMessage, showMessage,
        start, reset, adjustMinutes, toggleAmbient, formatTime,
      }}
    >
      {children}
    </FocusSessionContext.Provider>
  );
}
