"use client";

import React from "react";

interface KitsuneProps {
  className?: string;
  expression?: "calm" | "speaking" | "encouraging" | "reflective";
}

export default function Kitsune({ className, expression = "calm" }: KitsuneProps) {
  const eyeShape =
    expression === "speaking" ? "M 38 42 Q 42 45 46 42" :
    expression === "encouraging" ? "M 38 41 Q 42 44 46 41" :
    expression === "reflective" ? "M 38 43 L 46 43" :
    "M 38 42 Q 42 44 46 42";

  const mouthShape =
    expression === "speaking" ? "M 39 52 Q 42 56 45 52" :
    expression === "encouraging" ? "M 39 52 Q 42 55 45 52" :
    expression === "reflective" ? "M 40 53 L 44 53" :
    "M 39 52 Q 42 54 45 52";

  return (
    <svg
      viewBox="0 0 84 84"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Study Garden"
    >
      <defs>
        <linearGradient id="kitsune-fur" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFCF5" />
          <stop offset="100%" stopColor="#F0EDE3" />
        </linearGradient>
        <linearGradient id="kitsune-haori" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EDE6D8" />
          <stop offset="100%" stopColor="#E5DCC8" />
        </linearGradient>
      </defs>

      {/* Ears */}
      <path d="M 22 18 L 18 6 L 30 14 Z" fill="url(#kitsune-fur)" stroke="#D5CCBE" strokeWidth="0.5" />
      <path d="M 62 18 L 66 6 L 54 14 Z" fill="url(#kitsune-fur)" stroke="#D5CCBE" strokeWidth="0.5" />
      <path d="M 23 15 L 22 10 L 27 13 Z" fill="#C9A86A" opacity="0.3" />
      <path d="M 61 15 L 62 10 L 57 13 Z" fill="#C9A86A" opacity="0.3" />

      {/* Head */}
      <ellipse cx="42" cy="36" rx="22" ry="20" fill="url(#kitsune-fur)" stroke="#D5CCBE" strokeWidth="0.5" />

      {/* Face markings (shrine red) */}
      <path d="M 34 28 Q 36 24 38 28" stroke="#C44B3C" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M 46 28 Q 48 24 50 28" stroke="#C44B3C" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />
      <path d="M 42 22 L 42 28" stroke="#C44B3C" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round" />

      {/* Eyes — golden */}
      <path d={eyeShape} stroke="#C9A86A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="42" cy="42.5" r="1" fill="#B89456" />

      {/* Nose */}
      <ellipse cx="42" cy="48" rx="1.5" ry="1" fill="#8A857A" />

      {/* Mouth */}
      <path d={mouthShape} stroke="#8A857A" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Whiskers */}
      <path d="M 32 49 Q 28 49 26 48" stroke="#D5CCBE" strokeWidth="0.5" />
      <path d="M 32 51 Q 28 51 26 52" stroke="#D5CCBE" strokeWidth="0.5" />
      <path d="M 52 49 Q 56 49 58 48" stroke="#D5CCBE" strokeWidth="0.5" />
      <path d="M 52 51 Q 56 51 58 52" stroke="#D5CCBE" strokeWidth="0.5" />

      {/* Haori (academic jacket) */}
      <path d="M 26 54 Q 22 58 20 66 L 24 70 Q 30 66 32 60 Z" fill="url(#kitsune-haori)" stroke="#D5CCBE" strokeWidth="0.5" />
      <path d="M 58 54 Q 62 58 64 66 L 60 70 Q 54 66 52 60 Z" fill="url(#kitsune-haori)" stroke="#D5CCBE" strokeWidth="0.5" />
      <path d="M 30 58 L 42 60 L 54 58 Q 56 64 54 72 L 30 72 Q 28 64 30 58 Z" fill="url(#kitsune-haori)" stroke="#D5CCBE" strokeWidth="0.5" />

      {/* Small notebook on belt */}
      <rect x="36" y="66" width="8" height="5" rx="1" fill="#8A857A" opacity="0.4" />
      <line x1="40" y1="66" x2="40" y2="71" stroke="#F5F0E6" strokeWidth="0.5" />

      {/* Tail */}
      <path d="M 62 56 Q 72 50 74 60 Q 72 66 64 64 Z" fill="url(#kitsune-fur)" stroke="#D5CCBE" strokeWidth="0.5" />
      <path d="M 67 56 Q 72 54 72 60" stroke="#F0EDE3" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  );
}
