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
      width="180"
      height="180"
      viewBox="0 0 180 180"
      fill="none"
      stroke="black"
      strokeWidth="2"
      {...props}
    >
      {/* Room outline */}
      <rect x="5" y="5" width="170" height="170" />

      {/* LEFT QUEEN BED */}
      <g transform="translate(15, 60) scale(0.9)">
        <rect x="5" y="5" width="70" height="10" />
        <rect x="5" y="15" width="70" height="70" />
        <rect x="5" y="85" width="70" height="10" />
        <rect x="12" y="20" width="25" height="15" rx="3" />
        <rect x="43" y="20" width="25" height="15" rx="3" />
      </g>

      {/* RIGHT QUEEN BED */}
      <g transform="translate(95, 60) scale(0.9)">
        <rect x="5" y="5" width="70" height="10" />
        <rect x="5" y="15" width="70" height="70" />
        <rect x="5" y="85" width="70" height="10" />
        <rect x="12" y="20" width="25" height="15" rx="3" />
        <rect x="43" y="20" width="25" height="15" rx="3" />
      </g>

      {/* NIGHT TABLE BETWEEN BEDS */}
      <g transform="translate(78, 100) scale(1)">
        <rect x="0" y="0" width="25" height="30" rx="2" />
        <line x1="0" y1="12" x2="25" y2="12" />
        <circle cx="12.5" cy="8" r="2" />
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
