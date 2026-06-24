"use client";

import React from "react";

interface FoxMarkProps {
  className?: string;
  size?: number;
}

/**
 * Fox Mark — app icon for top-left sidebar.
 * Color: fox orange (#FF8C42) with warm ivory background.
 * Clicking it should navigate to Home.
 */
export default function FoxMark({ className, size = 40 }: FoxMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Fox Mark — Home"
    >
      <defs>
        <linearGradient id="fox-orange" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF9F5A" />
          <stop offset="100%" stopColor="#FF8C42" />
        </linearGradient>
      </defs>

      {/* Ears */}
      <path d="M 12 14 L 8 4 L 18 10 Z" fill="url(#fox-orange)" />
      <path d="M 36 14 L 40 4 L 30 10 Z" fill="url(#fox-orange)" />
      <path d="M 13 11 L 11 7 L 16 10 Z" fill="#F5F0E6" opacity="0.6" />
      <path d="M 35 11 L 37 7 L 32 10 Z" fill="#F5F0E6" opacity="0.6" />

      {/* Head */}
      <ellipse cx="24" cy="26" rx="16" ry="14" fill="url(#fox-orange)" />

      {/* White face */}
      <path d="M 24 18 Q 14 24 16 34 Q 24 38 32 34 Q 34 24 24 18 Z" fill="#FFFCF5" />

      {/* Eyes */}
      <ellipse cx="18" cy="25" rx="2" ry="2.5" fill="#2E2B26" />
      <ellipse cx="30" cy="25" rx="2" ry="2.5" fill="#2E2B26" />
      <circle cx="18.5" cy="24" r="0.7" fill="#FFF" />
      <circle cx="30.5" cy="24" r="0.7" fill="#FFF" />

      {/* Nose */}
      <path d="M 22 31 Q 24 33 26 31 Q 24 29 22 31 Z" fill="#2E2B26" />

      {/* Smile */}
      <path d="M 21 33 Q 24 36 27 33" stroke="#2E2B26" strokeWidth="0.8" fill="none" strokeLinecap="round" />

      {/* Whiskers */}
      <path d="M 14 30 L 8 29" stroke="#2E2B26" strokeWidth="0.5" opacity="0.4" />
      <path d="M 14 32 L 8 33" stroke="#2E2B26" strokeWidth="0.5" opacity="0.4" />
      <path d="M 34 30 L 40 29" stroke="#2E2B26" strokeWidth="0.5" opacity="0.4" />
      <path d="M 34 32 L 40 33" stroke="#2E2B26" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}
