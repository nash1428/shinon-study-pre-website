"use client";

import React from "react";

interface GardenSceneProps {
  stage: number; // 1-5
  className?: string;
}

export default function GardenScene({ stage, className }: GardenSceneProps) {
  const hasPond = stage >= 2;
  const hasKoi = stage >= 3;
  const hasTeaHouse = stage >= 3;
  const hasMapleGrove = stage >= 4;
  const hasLibrary = stage >= 5;

  return (
    <svg
      viewBox="0 0 800 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5F0E6" />
          <stop offset="100%" stopColor="#EDE6D8" />
        </linearGradient>
        <linearGradient id="moss-ground" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9CAE8B" />
          <stop offset="100%" stopColor="#7D8F69" />
        </linearGradient>
        <linearGradient id="water" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A8C4B8" />
          <stop offset="100%" stopColor="#8FAE9E" />
        </linearGradient>
        <radialGradient id="lantern-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C9A86A" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#C9A86A" stopOpacity="0" />
        </radialGradient>
        <filter id="soft-blur">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Sky background */}
      <rect width="800" height="400" fill="url(#sky)" />

      {/* Distant mist */}
      <ellipse cx="200" cy="180" rx="300" ry="40" fill="#F5F0E6" opacity="0.5" filter="url(#soft-blur)" className="animate-mist" />
      <ellipse cx="600" cy="160" rx="250" ry="30" fill="#F5F0E6" opacity="0.4" filter="url(#soft-blur)" />

      {/* Maple trees (stage 4+) */}
      {hasMapleGrove && (
        <>
          <circle cx="120" cy="160" r="50" fill="#B98A62" opacity="0.25" />
          <circle cx="140" cy="145" r="35" fill="#C49B72" opacity="0.2" />
          <rect x="135" y="190" width="6" height="60" fill="#6E716A" opacity="0.4" rx="2" />
          <circle cx="680" cy="155" r="45" fill="#B98A62" opacity="0.22" />
          <circle cx="660" cy="140" r="30" fill="#C49B72" opacity="0.18" />
          <rect x="675" y="185" width="5" height="55" fill="#6E716A" opacity="0.4" rx="2" />
        </>
      )}

      {/* Falling leaves (stage 4+) */}
      {hasMapleGrove && (
        <>
          <ellipse cx="130" cy="100" rx="4" ry="2" fill="#B98A62" opacity="0.5" className="animate-leaf" style={{ animationDelay: "0s" }} transform="rotate(30 130 100)" />
          <ellipse cx="650" cy="80" rx="4" ry="2" fill="#C49B72" opacity="0.5" className="animate-leaf" style={{ animationDelay: "3s" }} transform="rotate(45 650 80)" />
          <ellipse cx="400" cy="50" rx="4" ry="2" fill="#B98A62" opacity="0.4" className="animate-leaf" style={{ animationDelay: "5s" }} transform="rotate(60 400 50)" />
        </>
      )}

      {/* Ground / moss */}
      <path d="M 0 280 Q 400 260 800 280 L 800 400 L 0 400 Z" fill="url(#moss-ground)" />

      {/* Stone pathway */}
      <ellipse cx="350" cy="340" rx="35" ry="8" fill="#A8ABA2" opacity="0.6" />
      <ellipse cx="380" cy="360" rx="30" ry="7" fill="#8A8D84" opacity="0.5" />
      <ellipse cx="350" cy="380" rx="28" ry="6" fill="#A8ABA2" opacity="0.6" />
      <ellipse cx="410" cy="375" rx="25" ry="5" fill="#8A8D84" opacity="0.4" />

      {/* Koi pond (stage 2+) */}
      {hasPond && (
        <>
          <ellipse cx="600" cy="340" rx="100" ry="35" fill="url(#water)" opacity="0.7" />
          <ellipse cx="600" cy="340" rx="95" ry="32" fill="#8FAE9E" opacity="0.3" />
          {/* Ripples */}
          <ellipse cx="590" cy="335" rx="20" ry="6" stroke="#A8C4B8" strokeWidth="0.5" fill="none" opacity="0.4" className="animate-ripple" />
          <ellipse cx="620" cy="345" rx="15" ry="5" stroke="#A8C4B8" strokeWidth="0.5" fill="none" opacity="0.3" className="animate-ripple" style={{ animationDelay: "1.5s" }} />

          {/* Koi fish (stage 3+) */}
          {hasKoi && (
            <g className="animate-koi">
              <ellipse cx="580" cy="338" rx="8" ry="3" fill="#C9A86A" opacity="0.7" />
              <path d="M 572 338 L 568 335 L 568 341 Z" fill="#C9A86A" opacity="0.7" />
              <ellipse cx="582" cy="337" rx="1" ry="1" fill="#2E2B26" opacity="0.5" />
            </g>
          )}
        </>
      )}

      {/* Stone lantern (stage 1+) */}
      <g transform="translate(700, 250)">
        {/* Glow */}
        <circle cx="0" cy="0" r="30" fill="url(#lantern-glow)" className="animate-glow" />
        {/* Base */}
        <rect x="-12" y="40" width="24" height="8" rx="2" fill="#8A8D84" opacity="0.5" />
        {/* Pillar */}
        <rect x="-6" y="15" width="12" height="28" rx="1" fill="#A8ABA2" opacity="0.6" />
        {/* Lantern body */}
        <rect x="-12" y="-5" width="24" height="22" rx="3" fill="#E5DCC8" opacity="0.8" stroke="#D5CCBE" strokeWidth="0.5" />
        {/* Light */}
        <rect x="-8" y="-1" width="16" height="14" rx="2" fill="#C9A86A" opacity="0.3" />
        {/* Roof */}
        <path d="M -16 -5 L 0 -15 L 16 -5 Z" fill="#8A8D84" opacity="0.6" />
        <ellipse cx="0" cy="-15" rx="3" ry="2" fill="#6E716A" opacity="0.5" />
      </g>

      {/* Tea house / Pavilion (stage 3+) */}
      {hasTeaHouse && (
        <g transform="translate(100, 200)">
          <rect x="-30" y="20" width="60" height="40" rx="2" fill="#E5DCC8" opacity="0.6" stroke="#D5CCBE" strokeWidth="0.5" />
          <path d="M -40 20 L 0 -5 L 40 20 Z" fill="#8A8D84" opacity="0.5" />
          <rect x="-8" y="30" width="16" height="30" rx="1" fill="#8A8D84" opacity="0.3" />
          <rect x="-25" y="35" width="10" height="15" rx="1" fill="#C9A86A" opacity="0.15" />
          <rect x="15" y="35" width="10" height="15" rx="1" fill="#C9A86A" opacity="0.15" />
        </g>
      )}

      {/* Library / Ancient structure (stage 5) */}
      {hasLibrary && (
        <g transform="translate(500, 170)">
          <rect x="-50" y="10" width="100" height="60" rx="2" fill="#E5DCC8" opacity="0.5" stroke="#D5CCBE" strokeWidth="0.5" />
          <path d="M -55 10 L 0 -15 L 55 10 Z" fill="#8A8D84" opacity="0.4" />
          <rect x="-35" y="20" width="12" height="20" rx="1" fill="#C9A86A" opacity="0.12" />
          <rect x="-15" y="20" width="12" height="20" rx="1" fill="#C9A86A" opacity="0.12" />
          <rect x="5" y="20" width="12" height="20" rx="1" fill="#C9A86A" opacity="0.12" />
          <rect x="25" y="20" width="12" height="20" rx="1" fill="#C9A86A" opacity="0.12" />
        </g>
      )}

      {/* Small plants / moss patches */}
      <ellipse cx="200" cy="340" rx="40" ry="6" fill="#7D8F69" opacity="0.3" />
      <ellipse cx="450" cy="350" rx="30" ry="5" fill="#7D8F69" opacity="0.25" />
      <g className="animate-sway" style={{ transformOrigin: "180px 340px" }}>
        <path d="M 180 340 L 175 325 M 180 340 L 182 322 M 180 340 L 185 328" stroke="#7D8F69" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      </g>
      <g className="animate-sway" style={{ transformOrigin: "430px 345px", animationDelay: "1s" }}>
        <path d="M 430 345 L 425 330 M 430 345 L 432 327 M 430 345 L 435 332" stroke="#7D8F69" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
