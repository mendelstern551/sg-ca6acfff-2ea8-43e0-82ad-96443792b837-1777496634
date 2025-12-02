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
      width="420"
      height="360"
      viewBox="0 0 420 360"
      fill="none"
      stroke="black"
      strokeWidth="2"
      {...props}
    >
      {/* ROOM OUTLINE */}
      <rect x="10" y="10" width="400" height="340" fill="white" />

      {/** ---------------------- LEFT SIDE BEDS ---------------------- */}

      {/* TOP LEFT BED (Q3-L) */}
      <g transform="translate(40, 40)">
        {/* Bed frame */}
        <rect width="110" height="70" strokeWidth="2" />
        {/* Pillow on left wall */}
        <rect x="0" y="0" width="110" height="15" fill="#e6e6e6" />
      </g>

      {/* BOTTOM LEFT BED (Q3-L) */}
      <g transform="translate(40, 170)">
        <rect width="110" height="70" strokeWidth="2" />
        <rect x="0" y="0" width="110" height="15" fill="#e6e6e6" />
      </g>

      {/* NIGHT TABLE between left beds */}
      <g transform="translate(75, 130)">
        <rect width="40" height="30" strokeWidth="2" />
      </g>

      {/** ---------------------- RIGHT SIDE BEDS ---------------------- */}

      {/* TOP RIGHT BED (Q3-R) */}
      <g transform="translate(260, 40)">
        {/* Bed frame */}
        <rect width="110" height="70" strokeWidth="2" />
        {/* Pillow on right wall */}
        <rect x="0" y="0" width="110" height="15" fill="#e6e6e6" />
      </g>

      {/* BOTTOM RIGHT BED (Q3-R) */}
      <g transform="translate(260, 170)">
        <rect width="110" height="70" strokeWidth="2" />
        <rect x="0" y="0" width="110" height="15" fill="#e6e6e6" />
      </g>

      {/* NIGHT TABLE between right beds */}
      <g transform="translate(295, 130)">
        <rect width="40" height="30" strokeWidth="2" />
      </g>

      {/** ---------------------- CENTER TABLE + CHAIRS ---------------------- */}

      {/* TABLE */}
      <g transform="translate(170, 70)">
        <rect width="70" height="40" strokeWidth="2" />
      </g>

      {/* CHAIRS */}
      <g transform="translate(150, 65)">
        <rect width="30" height="20" />
      </g>

      <g transform="translate(245, 65)">
        <rect width="30" height="20" />
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
