
import React from "react";

export const RoomTypeA: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width={320} height={220} viewBox="0 0 320 220" {...props}>
    {/* Room Type A Layout */}
    <rect x="2" y="2" width="316" height="216" stroke="black" fill="white" strokeWidth="3" />

    {/* Beds - placeholders */}
    <rect x="20" y="20" width="80" height="40" stroke="black" fill="none" strokeWidth="2" />
    <rect x="220" y="20" width="80" height="40" stroke="black" fill="none" strokeWidth="2" />
    <rect x="20" y="80" width="80" height="40" stroke="black" fill="none" strokeWidth="2" />
    <rect x="220" y="80" width="80" height="40" stroke="black" fill="none" strokeWidth="2" />

    {/* Toilet */}
    <circle cx="40" cy="180" r="16" stroke="black" fill="none" strokeWidth="2" />

    {/* Closet */}
    <rect x="240" y="160" width="60" height="40" stroke="black" fill="none" strokeWidth="2" />

    {/* Door (bottom center, swinging left) */}
    <line x1="140" y1="218" x2="200" y2="218" stroke="black" strokeWidth="4" />
    <path d="M140 218 A 60 60 0 0 0 200 158" stroke="black" fill="none" strokeWidth="2" />
  </svg>
);

export const RoomTypeB: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width={320} height={220} viewBox="0 0 320 220" {...props}>
    {/* Room Type B Layout */}
    <rect x="2" y="2" width="316" height="216" stroke="black" fill="white" strokeWidth="3" />

    {/* Beds */}
    <rect x="80" y="160" width="70" height="40" stroke="black" fill="none" strokeWidth="2" />
    <rect x="170" y="160" width="70" height="40" stroke="black" fill="none" strokeWidth="2" />

    {/* Toilet */}
    <circle cx="260" cy="40" r="16" stroke="black" fill="none" strokeWidth="2" />

    {/* Closet */}
    <rect x="20" y="20" width="60" height="40" stroke="black" fill="none" strokeWidth="2" />

    {/* Door (top center, swinging left) */}
    <line x1="140" y1="2" x2="200" y2="2" stroke="black" strokeWidth="4" />
    <path d="M140 2 A 60 60 0 0 1 200 62" stroke="black" fill="none" strokeWidth="2" />
  </svg>
);

export const RoomTypeC: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg width={320} height={220} viewBox="0 0 320 220" {...props}>
    {/* Room Type C Layout (Type B + Internal Door) */}
    <rect x="2" y="2" width="316" height="216" stroke="black" fill="white" strokeWidth="3" />

    {/* Beds */}
    <rect x="80" y="160" width="70" height="40" stroke="black" fill="none" strokeWidth="2" />
    <rect x="170" y="160" width="70" height="40" stroke="black" fill="none" strokeWidth="2" />

    {/* Toilet */}
    <circle cx="260" cy="40" r="16" stroke="black" fill="none" strokeWidth="2" />

    {/* Closet */}
    <rect x="20" y="20" width="60" height="40" stroke="black" fill="none" strokeWidth="2" />

    {/* Door (top center, swinging left) */}
    <line x1="140" y1="2" x2="200" y2="2" stroke="black" strokeWidth="4" />
    <path d="M140 2 A 60 60 0 0 1 200 62" stroke="black" fill="none" strokeWidth="2" />

    {/* Interior Connection Door */}
    <line x1="318" y1="110" x2="318" y2="150" stroke="black" strokeWidth="4" />
    <path d="M318 110 A 40 40 0 0 1 278 150" stroke="black" fill="none" strokeWidth="2" />
  </svg>
);
