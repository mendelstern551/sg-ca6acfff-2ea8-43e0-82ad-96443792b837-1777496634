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
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* ROOM OUTER WALLS (gray #6e6e6e) */}
      <rect x="0" y="0" width="100" height="100" fill="#6e6e6e" stroke="none" />
      <rect x="4" y="4" width="92" height="92" fill="white" stroke="none" />

      {/* WINDOW (top center) */}
      <rect x="30" y="96" width="40" height="4" stroke="black" strokeWidth="2" fill="white" />

      {/* BATHROOM (bottom-left) */}
      <rect x="4" y="4" width="30" height="30" fill="#6e6e6e" stroke="none" />
      <rect x="6" y="6" width="26" height="22" fill="white" stroke="none" />

      {/* Toilet */}
      <ellipse cx="12" cy="24" rx="6" ry="4" stroke="black" strokeWidth="2" fill="white" />
      <rect x="7" y="24" width="6" height="8" stroke="black" strokeWidth="2" fill="white" />

      {/* Shower */}
      <rect x="6" y="6" width="16" height="16" stroke="black" strokeWidth="2" fill="white" />
      <line x1="6" y1="22" x2="22" y2="12" stroke="black" strokeWidth="2" />
      <line x1="6" y1="12" x2="22" y2="22" stroke="black" strokeWidth="2" />
      <circle cx="10" cy="10" r="1.2" stroke="black" strokeWidth="2" fill="none" />

      {/* Sink */}
      <rect x="22" y="8" width="10" height="10" stroke="black" strokeWidth="2" fill="white" />
      <circle cx="27" cy="13" r="4" stroke="black" strokeWidth="2" fill="none" />

      {/* Bathroom Door (inward swing) */}
      <line x1="34" y1="22" x2="34" y2="34" stroke="black" strokeWidth="2" />
      <path d="M 34 22 A 12 12 0 0 1 46 34" stroke="black" strokeWidth="2" fill="none" />

      {/* MAIN DOOR (bottom center) */}
      <path d="M 50 4 A 13 13 0 0 0 37 17" stroke="black" strokeWidth="2" fill="none" />
      <line x1="50" y1="4" x2="50" y2="17" stroke="black" strokeWidth="2" />

      {/* BEDS (4 identical beds with diamond quilt pattern) */}
      
      {/* Bed helper function implemented inline for each bed */}
      
      {/* Top-left bed (10, 72) */}
      <g>
        <rect x="10" y="72" width="24" height="16" stroke="black" strokeWidth="2" fill="white" />
        {/* Pillow (bottom side) */}
        <rect x="12" y="84" width="20" height="4" stroke="black" strokeWidth="2" fill="white" />
        {/* Diamond quilt pattern */}
        <line x1="10" y1="72" x2="34" y2="88" stroke="black" strokeWidth="2" />
        <line x1="10" y1="88" x2="34" y2="72" stroke="black" strokeWidth="2" />
        <line x1="22" y1="72" x2="34" y2="80" stroke="black" strokeWidth="2" />
        <line x1="22" y1="72" x2="10" y2="80" stroke="black" strokeWidth="2" />
        <line x1="10" y1="80" x2="22" y2="88" stroke="black" strokeWidth="2" />
        <line x1="34" y1="80" x2="22" y2="88" stroke="black" strokeWidth="2" />
      </g>

      {/* Top-right bed (66, 72) */}
      <g>
        <rect x="66" y="72" width="24" height="16" stroke="black" strokeWidth="2" fill="white" />
        {/* Pillow (bottom side) */}
        <rect x="68" y="84" width="20" height="4" stroke="black" strokeWidth="2" fill="white" />
        {/* Diamond quilt pattern */}
        <line x1="66" y1="72" x2="90" y2="88" stroke="black" strokeWidth="2" />
        <line x1="66" y1="88" x2="90" y2="72" stroke="black" strokeWidth="2" />
        <line x1="78" y1="72" x2="90" y2="80" stroke="black" strokeWidth="2" />
        <line x1="78" y1="72" x2="66" y2="80" stroke="black" strokeWidth="2" />
        <line x1="66" y1="80" x2="78" y2="88" stroke="black" strokeWidth="2" />
        <line x1="90" y1="80" x2="78" y2="88" stroke="black" strokeWidth="2" />
      </g>

      {/* Bottom-left bed (10, 52) */}
      <g>
        <rect x="10" y="52" width="24" height="16" stroke="black" strokeWidth="2" fill="white" />
        {/* Pillow (bottom side) */}
        <rect x="12" y="64" width="20" height="4" stroke="black" strokeWidth="2" fill="white" />
        {/* Diamond quilt pattern */}
        <line x1="10" y1="52" x2="34" y2="68" stroke="black" strokeWidth="2" />
        <line x1="10" y1="68" x2="34" y2="52" stroke="black" strokeWidth="2" />
        <line x1="22" y1="52" x2="34" y2="60" stroke="black" strokeWidth="2" />
        <line x1="22" y1="52" x2="10" y2="60" stroke="black" strokeWidth="2" />
        <line x1="10" y1="60" x2="22" y2="68" stroke="black" strokeWidth="2" />
        <line x1="34" y1="60" x2="22" y2="68" stroke="black" strokeWidth="2" />
      </g>

      {/* Bottom-right bed (66, 52) */}
      <g>
        <rect x="66" y="52" width="24" height="16" stroke="black" strokeWidth="2" fill="white" />
        {/* Pillow (bottom side) */}
        <rect x="68" y="64" width="20" height="4" stroke="black" strokeWidth="2" fill="white" />
        {/* Diamond quilt pattern */}
        <line x1="66" y1="52" x2="90" y2="68" stroke="black" strokeWidth="2" />
        <line x1="66" y1="68" x2="90" y2="52" stroke="black" strokeWidth="2" />
        <line x1="78" y1="52" x2="90" y2="60" stroke="black" strokeWidth="2" />
        <line x1="78" y1="52" x2="66" y2="60" stroke="black" strokeWidth="2" />
        <line x1="66" y1="60" x2="78" y2="68" stroke="black" strokeWidth="2" />
        <line x1="90" y1="60" x2="78" y2="68" stroke="black" strokeWidth="2" />
      </g>

      {/* NIGHTSTANDS (2 beside top beds) */}
      
      {/* Left nightstand (36, 78) */}
      <g>
        <rect x="36" y="78" width="10" height="10" stroke="black" strokeWidth="2" fill="white" />
        <circle cx="41" cy="83" r="2" stroke="black" strokeWidth="2" fill="none" />
        <circle cx="41" cy="83" r="0.7" stroke="black" strokeWidth="2" fill="black" />
      </g>

      {/* Right nightstand (54, 78) */}
      <g>
        <rect x="54" y="78" width="10" height="10" stroke="black" strokeWidth="2" fill="white" />
        <circle cx="59" cy="83" r="2" stroke="black" strokeWidth="2" fill="none" />
        <circle cx="59" cy="83" r="0.7" stroke="black" strokeWidth="2" fill="black" />
      </g>

      {/* CLOSET (bottom-right) */}
      <rect x="70" y="4" width="26" height="20" fill="#6e6e6e" stroke="none" />
      <rect x="72" y="6" width="22" height="16" fill="white" stroke="black" strokeWidth="2" />
      {/* Bifold door lines */}
      <line x1="72" y1="20" x2="83" y2="4" stroke="black" strokeWidth="2" />
      <line x1="94" y1="20" x2="83" y2="4" stroke="black" strokeWidth="2" />
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
