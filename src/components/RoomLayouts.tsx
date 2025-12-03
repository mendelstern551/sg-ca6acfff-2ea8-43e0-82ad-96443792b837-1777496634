import React from "react";

interface RoomLayoutProps extends React.SVGProps<SVGSVGElement> {
  roomNumber?: number;
  side?: "left" | "right";
}

export const QueenBed = () => (
  <svg width="80" height="100" viewBox="0 0 80 100" fill="none" stroke="black" strokeWidth="2">
    {/* Headboard */}
    <rect x="5" y="5" width="70" height="10" />

    {/* Mattress */}
    <rect x="5" y="15" width="70" height="70" />

    {/* Footboard */}
    <rect x="5" y="85" width="70" height="10" />

    {/* Pillows */}
    <rect x="12" y="20" width="25" height="15" rx="3" />
    <rect x="43" y="20" width="25" height="15" rx="3" />
  </svg>
);

export const NightTable = () => (
  <svg width="25" height="30" viewBox="0 0 25 30" fill="none" stroke="black" strokeWidth="2">
    <rect x="3" y="3" width="19" height="24" rx="2" />
    <line x1="3" y1="12" x2="22" y2="12" />
    <circle cx="12.5" cy="8" r="2" />
  </svg>
);

export const RoomTypeA: React.FC<RoomLayoutProps> = ({ roomNumber, side, ...props }) => {
  return (
    <svg
      width="320"
      height="280"
      viewBox="0 0 320 280"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      {/* ROOM OUTLINE - gray walls */}
      <rect x="5" y="5" width="310" height="270" fill="white" stroke="#9ca3af" strokeWidth="8" />

      {/* TOP WINDOW (centered) */}
      <rect x="135" y="1" width="50" height="8" fill="white" stroke="#6b7280" strokeWidth="2" />
      <line x1="160" y1="1" x2="160" y2="9" stroke="#6b7280" strokeWidth="2" />

      {/** ---------------------- LEFT SIDE BEDS (2 beds) ---------------------- */}

      {/* TOP LEFT BED with diamond pattern */}
      <g transform="translate(25, 30)">
        {/* Bed frame */}
        <rect width="85" height="65" fill="white" strokeWidth="2" />
        {/* Pillow on top (against wall) */}
        <rect x="0" y="0" width="85" height="12" fill="#e5e7eb" strokeWidth="1.5" />
        {/* Diamond pattern on mattress */}
        <line x1="20" y1="20" x2="42.5" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="20" x2="20" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="20" x2="65" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="20" x2="42.5" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="20" y1="42.5" x2="42.5" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="42.5" x2="20" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="42.5" x2="65" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="42.5" x2="42.5" y2="65" strokeWidth="1" opacity="0.4" />
        {/* Night stand next to bed */}
        <rect x="90" y="20" width="20" height="25" fill="white" strokeWidth="2" rx="2" />
      </g>

      {/* BOTTOM LEFT BED with diamond pattern */}
      <g transform="translate(25, 140)">
        <rect width="85" height="65" fill="white" strokeWidth="2" />
        <rect x="0" y="0" width="85" height="12" fill="#e5e7eb" strokeWidth="1.5" />
        {/* Diamond pattern */}
        <line x1="20" y1="20" x2="42.5" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="20" x2="20" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="20" x2="65" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="20" x2="42.5" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="20" y1="42.5" x2="42.5" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="42.5" x2="20" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="42.5" x2="65" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="42.5" x2="42.5" y2="65" strokeWidth="1" opacity="0.4" />
        {/* Night stand */}
        <rect x="90" y="20" width="20" height="25" fill="white" strokeWidth="2" rx="2" />
      </g>

      {/* LEFT SIDE CIRCULAR ELEMENT (table or decoration) between beds */}
      <circle cx="40" cy="115" r="12" fill="white" strokeWidth="2" />
      <circle cx="40" cy="115" r="4" fill="none" strokeWidth="1.5" />

      {/** ---------------------- RIGHT SIDE BEDS (2 beds) ---------------------- */}

      {/* TOP RIGHT BED with diamond pattern */}
      <g transform="translate(210, 30)">
        <rect width="85" height="65" fill="white" strokeWidth="2" />
        <rect x="0" y="0" width="85" height="12" fill="#e5e7eb" strokeWidth="1.5" />
        {/* Diamond pattern */}
        <line x1="20" y1="20" x2="42.5" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="20" x2="20" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="20" x2="65" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="20" x2="42.5" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="20" y1="42.5" x2="42.5" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="42.5" x2="20" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="42.5" x2="65" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="42.5" x2="42.5" y2="65" strokeWidth="1" opacity="0.4" />
        {/* Night stand */}
        <rect x="-25" y="20" width="20" height="25" fill="white" strokeWidth="2" rx="2" />
      </g>

      {/* BOTTOM RIGHT BED with diamond pattern */}
      <g transform="translate(210, 140)">
        <rect width="85" height="65" fill="white" strokeWidth="2" />
        <rect x="0" y="0" width="85" height="12" fill="#e5e7eb" strokeWidth="1.5" />
        {/* Diamond pattern */}
        <line x1="20" y1="20" x2="42.5" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="20" x2="20" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="20" x2="65" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="20" x2="42.5" y2="42.5" strokeWidth="1" opacity="0.4" />
        <line x1="20" y1="42.5" x2="42.5" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="42.5" x2="20" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="42.5" y1="42.5" x2="65" y2="65" strokeWidth="1" opacity="0.4" />
        <line x1="65" y1="42.5" x2="42.5" y2="65" strokeWidth="1" opacity="0.4" />
        {/* Night stand */}
        <rect x="-25" y="20" width="20" height="25" fill="white" strokeWidth="2" rx="2" />
      </g>

      {/* RIGHT SIDE CIRCULAR ELEMENT between beds */}
      <circle cx="280" cy="115" r="12" fill="white" strokeWidth="2" />
      <circle cx="280" cy="115" r="4" fill="none" strokeWidth="1.5" />

      {/** ---------------------- BATHROOM AREA (bottom left) ---------------------- */}

      {/* Bathroom walls */}
      <rect x="5" y="215" width="90" height="60" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="3" />

      {/* Toilet */}
      <ellipse cx="30" cy="235" rx="10" ry="12" fill="white" strokeWidth="1.5" />
      <rect x="20" y="240" width="20" height="5" fill="white" strokeWidth="1.5" rx="2" />

      {/* Sink (corner) */}
      <path d="M 15 255 Q 15 265 25 265 L 35 265 Q 45 265 45 255 Z" fill="white" strokeWidth="1.5" />
      <circle cx="30" cy="262" r="3" fill="none" strokeWidth="1" />

      {/* Shower/Bath area */}
      <rect x="50" y="225" width="38" height="45" fill="white" strokeWidth="1.5" rx="2" />
      <line x1="55" y1="230" x2="55" y2="265" strokeWidth="1" opacity="0.3" />
      <line x1="60" y1="230" x2="60" y2="265" strokeWidth="1" opacity="0.3" />
      <line x1="65" y1="230" x2="65" y2="265" strokeWidth="1" opacity="0.3" />
      <line x1="70" y1="230" x2="70" y2="265" strokeWidth="1" opacity="0.3" />
      <line x1="75" y1="230" x2="75" y2="265" strokeWidth="1" opacity="0.3" />
      <line x1="80" y1="230" x2="80" y2="265" strokeWidth="1" opacity="0.3" />
      <line x1="83" y1="230" x2="83" y2="265" strokeWidth="1" opacity="0.3" />

      {/** ---------------------- CLOSET AREA (bottom right) ---------------------- */}

      {/* Closet structure */}
      <rect x="225" y="215" width="90" height="60" fill="#fef3c7" stroke="#9ca3af" strokeWidth="3" />
      
      {/* Closet doors/panels */}
      <line x1="245" y1="220" x2="245" y2="270" strokeWidth="2" opacity="0.4" />
      <line x1="260" y1="220" x2="260" y2="270" strokeWidth="2" opacity="0.4" />
      <line x1="275" y1="220" x2="275" y2="270" strokeWidth="2" opacity="0.4" />
      <line x1="290" y1="220" x2="290" y2="270" strokeWidth="2" opacity="0.4" />
      <line x1="305" y1="220" x2="305" y2="270" strokeWidth="2" opacity="0.4" />
      
      {/* Closet shelves (horizontal lines) */}
      <line x1="230" y1="235" x2="310" y2="235" strokeWidth="1.5" opacity="0.3" />
      <line x1="230" y1="250" x2="310" y2="250" strokeWidth="1.5" opacity="0.3" />
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
