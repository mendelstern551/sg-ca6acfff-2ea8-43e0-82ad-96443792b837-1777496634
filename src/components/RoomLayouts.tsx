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
    <svg width="180" height="180" viewBox="0 0 180 180" {...props}>

      {/* ROOM OUTLINE */}
      <rect x="5" y="5" width="170" height="170" fill="white" stroke="currentColor" strokeWidth="2" />

      {/* CLOSET */}
      <rect x="10" y="10" width="30" height="30" stroke="currentColor" fill="none" strokeWidth="2" />

      {/* DOOR ARC */}
      <path d="M 90 10 A 40 40 0 0 1 130 50" stroke="currentColor" strokeWidth="2" fill="none" />

      {/* TOILET */}
      <circle cx="145" cy="35" r="10" stroke="currentColor" strokeWidth="2" fill="none" />

      {/* --- BEDS SECTION --- */}

      {/* LEFT BED */}
      <rect x="35" y="115" width="40" height="55" rx="3" stroke="currentColor" fill="none" strokeWidth="2" />
      {/* LEFT PILLOW */}
      <rect x="38" y="118" width="34" height="12" rx="2" stroke="currentColor" fill="none" strokeWidth="1.5" />

      {/* RIGHT BED */}
      <rect x="105" y="115" width="40" height="55" rx="3" stroke="currentColor" fill="none" strokeWidth="2" />
      {/* RIGHT PILLOW */}
      <rect x="108" y="118" width="34" height="12" rx="2" stroke="currentColor" fill="none" strokeWidth="1.5" />

      {/* NIGHT TABLE BETWEEN */}
      <rect x="78" y="130" width="25" height="25" rx="3" stroke="currentColor" fill="none" strokeWidth="2" />

    </svg>
  );
};

export const RoomTypeC: React.FC<RoomLayoutProps> = ({ roomNumber, side, ...props }) => {
  const bedCount = 2;
  const bgColor = side === "left" ? "#007bff" : "#ff6600";
  
  return (
    <svg width={320} height={220} viewBox="0 0 320 220" {...props}>
      {/* Room border */}
      <rect x="2" y="2" width="316" height="216" stroke="currentColor" fill="white" strokeWidth="3" rx="8" />

      {/* Left bed (bottom wall, rotated 90 degrees) - pillow touches bottom wall */}
      <g transform="translate(50, 148) rotate(-90)">
        {/* Mattress */}
        <rect x="0" y="0" width="70" height="120" rx="6" ry="6" stroke="currentColor" strokeWidth="2" fill="white"/>
        {/* Blanket outline */}
        <rect x="4" y="20" width="62" height="95" rx="6" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        {/* Pillow */}
        <rect x="10" y="3" width="50" height="18" rx="4" ry="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </g>

      {/* Right bed (bottom wall, rotated 90 degrees) - pillow touches bottom wall */}
      <g transform="translate(200, 148) rotate(-90)">
        {/* Mattress */}
        <rect x="0" y="0" width="70" height="120" rx="6" ry="6" stroke="currentColor" strokeWidth="2" fill="white"/>
        {/* Blanket outline */}
        <rect x="4" y="20" width="62" height="95" rx="6" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        {/* Pillow */}
        <rect x="10" y="3" width="50" height="18" rx="4" ry="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </g>

      {/* Toilet (top-right corner) */}
      <g transform="translate(260, 15)">
        <circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="2" width="14" height="6" fill="none" stroke="currentColor" strokeWidth="2" rx="1"/>
      </g>

      {/* Closet (top-left corner) */}
      <g transform="translate(25, 15)">
        <rect x="0" y="0" width="40" height="35" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
        <line x1="20" y1="0" x2="20" y2="35" stroke="currentColor" strokeWidth="2"/>
      </g>

      {/* Main door (top center) */}
      <g transform="translate(130, 2)">
        <line x1="0" y1="0" x2="60" y2="0" stroke="currentColor" strokeWidth="4"/>
        <path d="M 0 0 A 60 60 0 0 1 60 60" fill="none" stroke="currentColor" strokeWidth="2"/>
      </g>

      {/* Interior connection door (right side) - connects to room 109 */}
      <g transform="translate(318, 90)">
        <line x1="0" y1="0" x2="0" y2="40" stroke="currentColor" strokeWidth="4"/>
        <path d="M 0 0 A 40 40 0 0 1 -40 40" fill="none" stroke="currentColor" strokeWidth="2"/>
      </g>
    </svg>
  );
};
