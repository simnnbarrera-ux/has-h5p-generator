import React from "react";

interface HasLogoProps {
  className?: string;
  size?: number;
}

export default function HasLogo({ className = "", size = 38 }: HasLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      aria-label="Logo Oficial HAS H5P Generator"
    >
      <defs>
        <linearGradient id="hasRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A51930" />
          <stop offset="100%" stopColor="#6F1020" />
        </linearGradient>
        <linearGradient id="hasCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <filter id="hasSoftShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#0F172A" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Base Squircle */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="14"
        fill="url(#hasRedGrad)"
        filter="url(#hasSoftShadow)"
      />

      {/* Inner Accent Glow Border */}
      <rect
        x="5.5"
        y="5.5"
        width="53"
        height="53"
        rx="12.5"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />

      {/* Isometric 3D Hex/Cube Node */}
      {/* Top Face */}
      <polygon points="32,13 46,21 32,29 18,21" fill="#FFFFFF" opacity="0.95" />
      {/* Left Face */}
      <polygon points="18,21 32,29 32,45 18,37" fill="#E2E8F0" opacity="0.9" />
      {/* Right Face */}
      <polygon points="32,29 46,21 46,37 32,45" fill="url(#hasCyanGrad)" />

      {/* Satellite Node Accents */}
      <circle cx="46" cy="21" r="3.5" fill="#38BDF8" />
      <circle cx="18" cy="21" r="2.5" fill="#FFFFFF" />
      <circle cx="32" cy="45" r="3" fill="#0284C7" />

      {/* 'HAS' Brand Label */}
      <text
        x="32"
        y="57"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="9"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="1"
      >
        HAS
      </text>
    </svg>
  );
}
