"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * useLocalStorage — a drop-in replacement for useState that
 * automatically persists every state change to localStorage.
 * No manual save needed — every mutation is saved instantly.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Auto-save to localStorage on every value change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors (quota, private mode, etc.)
    }
  }, [key, value]);

  // Support functional updates like useState
  const set = useCallback(
    (val: T | ((prev: T) => T)) => {
      setValue((prev) =>
        typeof val === "function" ? (val as (prev: T) => T)(prev) : val
      );
    },
    []
  );

  return [value, set] as const;
}
