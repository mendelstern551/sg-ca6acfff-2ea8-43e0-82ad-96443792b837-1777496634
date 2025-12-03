import React from "react";

interface RoomLayoutProps extends React.SVGProps<SVGSVGElement> {
  roomNumber?: number;
  side?: "left" | "right";
}

export const RoomTypeA: React.FC<RoomLayoutProps> = ({ roomNumber, side, ...props }) => {
  return (
    <svg
      width="320"
      height="320"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.5"
      {...props}
    >
      {/* Outer perimeter walls (gray) */}
      <rect x="0" y="0" width="100" height="100" fill="#808080" stroke="none" />
      <rect x="2" y="2" width="96" height="96" fill="white" stroke="none" />

      {/* Bathroom walls */}
      <rect x="0" y="0" width="30" height="30" fill="#808080" stroke="none" />
      <rect x="2" y="2" width="26" height="20" fill="white" stroke="none" />

      {/* -------------------- BEDS (Top row) -------------------- */}
      
      {/* TOP LEFT BED */}
      <g>
        <rect x="5" y="70" width="18" height="25" fill="#f0f0f0" stroke="black" strokeWidth="0.5" />
        {/* Pillow (left side) */}
        <rect x="5.5" y="71" width="4" height="22" fill="white" stroke="black" strokeWidth="0.4" />
        {/* Quilt pattern (cross) */}
        <line x1="10" y1="72" x2="22" y2="94" stroke="#a0a0a0" strokeWidth="0.3" />
        <line x1="10" y1="94" x2="22" y2="72" stroke="#a0a0a0" strokeWidth="0.3" />
      </g>

      {/* TOP RIGHT BED */}
      <g>
        <rect x="77" y="70" width="18" height="25" fill="#f0f0f0" stroke="black" strokeWidth="0.5" />
        {/* Pillow (right side) */}
        <rect x="90.5" y="71" width="4" height="22" fill="white" stroke="black" strokeWidth="0.4" />
        {/* Quilt pattern */}
        <line x1="78" y1="72" x2="90" y2="94" stroke="#a0a0a0" strokeWidth="0.3" />
        <line x1="78" y1="94" x2="90" y2="72" stroke="#a0a0a0" strokeWidth="0.3" />
      </g>

      {/* -------------------- BEDS (Bottom row) -------------------- */}
      
      {/* BOTTOM LEFT BED */}
      <g>
        <rect x="5" y="40" width="18" height="25" fill="#f0f0f0" stroke="black" strokeWidth="0.5" />
        {/* Pillow */}
        <rect x="5.5" y="41" width="4" height="22" fill="white" stroke="black" strokeWidth="0.4" />
        {/* Quilt pattern */}
        <line x1="10" y1="42" x2="22" y2="64" stroke="#a0a0a0" strokeWidth="0.3" />
        <line x1="10" y1="64" x2="22" y2="42" stroke="#a0a0a0" strokeWidth="0.3" />
      </g>

      {/* BOTTOM RIGHT BED */}
      <g>
        <rect x="77" y="40" width="18" height="25" fill="#f0f0f0" stroke="black" strokeWidth="0.5" />
        {/* Pillow */}
        <rect x="90.5" y="41" width="4" height="22" fill="white" stroke="black" strokeWidth="0.4" />
        {/* Quilt pattern */}
        <line x1="78" y1="42" x2="90" y2="64" stroke="#a0a0a0" strokeWidth="0.3" />
        <line x1="78" y1="64" x2="90" y2="42" stroke="#a0a0a0" strokeWidth="0.3" />
      </g>

      {/* -------------------- NIGHT STANDS -------------------- */}
      
      {/* Left side night stand */}
      <g>
        <rect x="9" y="56" width="8" height="8" fill="#f0f0f0" stroke="black" strokeWidth="0.5" />
        <rect x="9" y="61.6" width="8" height="2.4" fill="white" stroke="black" strokeWidth="0.4" />
        <line x1="10.6" y1="62.8" x2="15.4" y2="62.8" stroke="black" strokeWidth="0.6" />
      </g>

      {/* Right side night stand */}
      <g>
        <rect x="83" y="56" width="8" height="8" fill="#f0f0f0" stroke="black" strokeWidth="0.5" />
        <rect x="83" y="61.6" width="8" height="2.4" fill="white" stroke="black" strokeWidth="0.4" />
        <line x1="84.6" y1="62.8" x2="89.4" y2="62.8" stroke="black" strokeWidth="0.6" />
      </g>

      {/* -------------------- CLOSET (bottom right) -------------------- */}
      
      {/* Closet structure */}
      <rect x="60" y="0" width="40" height="15" fill="#808080" stroke="none" />
      <rect x="62" y="2" width="36" height="11" fill="white" stroke="none" />
      
      {/* Hanging rod */}
      <line x1="62" y1="10.5" x2="98" y2="10.5" stroke="black" strokeWidth="0.6" />
      
      {/* Hangers */}
      {[70, 80, 90].map((hx, i) => (
        <g key={i}>
          <polyline
            points={`${hx},10.5 ${hx},8.5 ${hx-3},8.5 ${hx},8.5 ${hx+3},8.5 ${hx-3},8.5`}
            fill="none"
            stroke="black"
            strokeWidth="0.3"
          />
        </g>
      ))}

      {/* -------------------- BATHROOM FIXTURES -------------------- */}
      
      {/* Shower */}
      <g>
        <rect x="2" y="2" width="15" height="15" stroke="black" strokeWidth="0.5" fill="none" />
        <line x1="2" y1="17" x2="17" y2="4.5" stroke="black" strokeWidth="0.5" />
        <line x1="4.5" y1="17" x2="17" y2="2" stroke="black" strokeWidth="0.5" />
        <circle cx="5" cy="5" r="1" fill="none" stroke="black" strokeWidth="0.4" />
      </g>

      {/* Toilet */}
      <g>
        <rect x="4" y="22" width="4" height="8" stroke="black" strokeWidth="0.5" fill="white" />
        <ellipse cx="14" cy="26" rx="6" ry="4" stroke="black" strokeWidth="0.5" fill="white" />
      </g>

      {/* Sink */}
      <g>
        <rect x="20" y="4" width="8" height="8" stroke="black" strokeWidth="0.5" fill="white" />
        <circle cx="24" cy="8" r="3" fill="none" stroke="black" strokeWidth="0.5" />
        <rect x="23.5" y="4" width="1" height="2" fill="black" />
      </g>

      {/* -------------------- OPENINGS -------------------- */}
      
      {/* Window (top center) */}
      <g>
        <rect x="30" y="98" width="40" height="2" fill="white" stroke="none" />
        <line x1="30" y1="100" x2="70" y2="100" stroke="black" strokeWidth="0.5" />
        <line x1="30" y1="98" x2="70" y2="98" stroke="black" strokeWidth="0.5" />
        <line x1="30" y1="99" x2="70" y2="99" stroke="black" strokeWidth="0.3" />
      </g>

      {/* Main door (bottom, swing inward) */}
      <g>
        <rect x="7" y="0" width="18" height="2" fill="white" stroke="none" />
        <line x1="7" y1="2" x2="7" y2="20" stroke="black" strokeWidth="0.6" />
        <path d="M 7 2 Q 25 2 25 20" fill="none" stroke="black" strokeWidth="0.4" />
      </g>

      {/* Bathroom door (angled) */}
      <g>
        <rect x="28" y="2" width="2" height="20" fill="white" stroke="none" />
        <line x1="30" y1="22" x2="40.6" y2="32.6" stroke="black" strokeWidth="0.6" />
        <path d="M 30 22 Q 30 32.6 40.6 32.6" fill="none" stroke="black" strokeWidth="0.4" />
      </g>
    </svg>
  );
};

export const RoomTypeB: React.FC<RoomLayoutProps> = ({ roomNumber, side, ...props }) => {
  return (
    <svg
      width="110"
      height="140"
      viewBox="0 0 110 140"
      fill="none"
      stroke="black"
      strokeWidth="2"
      {...props}
    >
      {/* Room Outline */}
      <rect x="1" y="1" width="108" height="138" fill="white" />

      {/* Toilet (top-right) */}
      <circle cx="92" cy="30" r="8" />
      <rect x="84" y="22" width="12" height="16" />

      {/* Closet (top-left) */}
      <rect x="10" y="12" width="24" height="26" />
      <line x1="22" y1="12" x2="22" y2="38" />

      {/* Door (center top, left swing) */}
      <path d="M55 1 v22" />
      <path d="M55 23 a30 30 0 0 1 -30 -30" />

      {/* Beds */}
      {/* Left Bed */}
      <rect x="18" y="78" width="30" height="46" rx="2" />
      <rect x="23" y="82" width="20" height="14" rx="1" />

      {/* Right Bed */}
      <rect x="62" y="78" width="30" height="46" rx="2" />
      <rect x="67" y="82" width="20" height="14" rx="1" />

      {/* Night Table */}
      <rect x="48" y="94" width="14" height="18" rx="2" />
      <line x1="48" y1="103" x2="62" y2="103" />
    </svg>
  );
};

export const RoomTypeC: React.FC<RoomLayoutProps> = ({ roomNumber, side, ...props }) => {
  return (
    <svg
      width="110"
      height="140"
      viewBox="0 0 110 140"
      fill="none"
      stroke="black"
      strokeWidth="2"
      {...props}
    >
      {/* Room Outline */}
      <rect x="1" y="1" width="108" height="138" fill="white" />

      {/* Toilet (top-right) */}
      <circle cx="92" cy="30" r="8" />
      <rect x="84" y="22" width="12" height="16" />

      {/* Closet (top-left) */}
      <rect x="10" y="12" width="24" height="26" />
      <line x1="22" y1="12" x2="22" y2="38" />

      {/* Door (center top, left swing) */}
      <path d="M55 1 v22" />
      <path d="M55 23 a30 30 0 0 1 -30 -30" />

      {/* INTERIOR Connecting Door (right side) */}
      <path d="M109 70 h-22" />
      <path d="M87 70 a22 22 0 0 1 22 -22" />

      {/* Beds */}
      <rect x="18" y="78" width="30" height="46" rx="2" />
      <rect x="23" y="82" width="20" height="14" rx="1" />

      <rect x="62" y="78" width="30" height="46" rx="2" />
      <rect x="67" y="82" width="20" height="14" rx="1" />

      {/* Night Table */}
      <rect x="48" y="94" width="14" height="18" rx="2" />
      <line x1="48" y1="103" x2="62" y2="103" />
    </svg>
  );
};
