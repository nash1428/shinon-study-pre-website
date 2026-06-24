"use client";

import React from "react";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Study Garden Logo"
    >
      <defs>
        {/* Gradient: Dusty Lavender → Pale Mint Green */}
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C8B6E2" />
          <stop offset="100%" stopColor="#B6E2C8" />
        </linearGradient>

        {/* Subtle glow filter for glassmorphism */}
        <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* S-curved vertical path connecting the nodes */}
      <path
        d="M 18 8 C 30 14, 18 22, 30 28 C 18 34, 18 38, 30 40"
        stroke="url(#logo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {/* Three soft rounded nodes along the S-curve */}
      <g filter="url(#logo-glow)">
        {/* Top node */}
        <circle cx="18" cy="8" r="4" fill="url(#logo-gradient)" />

        {/* Middle node */}
        <circle cx="30" cy="22" r="4" fill="url(#logo-gradient)" />

        {/* Bottom node */}
        <circle cx="24" cy="40" r="4" fill="url(#logo-gradient)" />
      </g>
    </svg>
  );
}
