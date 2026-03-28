// src/components/ui/Logo.jsx
import React from "react";

export default function Logo({ width = 48, height = 48 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Orange gradient background circle */}
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF7F00" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#grad)" />

      {/* White chat bubble */}
      <path
        d="M20 40V24C20 22.3431 21.3431 21 23 21H41C42.6569 21 44 22.3431 44 24V40C44 41.6569 42.6569 43 41 43H24L20 47V40Z"
        fill="white"
      />

      {/* Optional: stylized C inside bubble */}
      <text
        x="32"
        y="32"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="18"
        fontWeight="bold"
        fill="#FFA500"
      >
        C
      </text>
    </svg>
  );
}
