
import React from "react";

interface RoomLayoutProps extends React.SVGProps<SVGSVGElement> {
  roomNumber?: number;
  side?: "left" | "right";
}

export const RoomTypeA: React.FC<RoomLayoutProps> = ({ roomNumber, side, ...props }) => {
  const bedCount = 4;
  const bgColor = side === "left" ? "#007bff" : "#ff6600";
  
  return (
    <svg width={320} height={220} viewBox="0 0 320 220" {...props}>
      {/* Room border */}
      <rect x="2" y="2" width="316" height="216" stroke="currentColor" fill="white" strokeWidth="3" rx="8" />

      {/* Top-left bed - vertical, pillow against left wall */}
      <g transform="translate(15, 45)">
        {/* Mattress */}
        <rect x="0" y="0" width="70" height="120" rx="6" ry="6" stroke="currentColor" strokeWidth="2" fill="white"/>
        {/* Blanket outline */}
        <rect x="4" y="20" width="62" height="95" rx="6" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        {/* Pillow */}
        <rect x="10" y="3" width="50" height="18" rx="4" ry="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </g>

      {/* Top-right bed - vertical, pillow against right wall */}
      <g transform="translate(235, 45)">
        {/* Mattress */}
        <rect x="0" y="0" width="70" height="120" rx="6" ry="6" stroke="currentColor" strokeWidth="2" fill="white"/>
        {/* Blanket outline */}
        <rect x="4" y="20" width="62" height="95" rx="6" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        {/* Pillow */}
        <rect x="10" y="3" width="50" height="18" rx="4" ry="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </g>

      {/* Bottom-left bed - vertical, pillow against left wall */}
      <g transform="translate(95, 45)">
        {/* Mattress */}
        <rect x="0" y="0" width="70" height="120" rx="6" ry="6" stroke="currentColor" strokeWidth="2" fill="white"/>
        {/* Blanket outline */}
        <rect x="4" y="20" width="62" height="95" rx="6" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        {/* Pillow */}
        <rect x="10" y="3" width="50" height="18" rx="4" ry="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </g>

      {/* Bottom-right bed - vertical, pillow against right wall */}
      <g transform="translate(155, 45)">
        {/* Mattress */}
        <rect x="0" y="0" width="70" height="120" rx="6" ry="6" stroke="currentColor" strokeWidth="2" fill="white"/>
        {/* Blanket outline */}
        <rect x="4" y="20" width="62" height="95" rx="6" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        {/* Pillow */}
        <rect x="10" y="3" width="50" height="18" rx="4" ry="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </g>

      {/* Toilet (top-left corner) */}
      <g transform="translate(25, 10)">
        <circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="2" width="14" height="6" fill="none" stroke="currentColor" strokeWidth="2" rx="1"/>
      </g>

      {/* Closet (top-right corner) */}
      <g transform="translate(255, 10)">
        <rect x="0" y="0" width="40" height="35" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
        <line x1="20" y1="0" x2="20" y2="35" stroke="currentColor" strokeWidth="2"/>
      </g>

      {/* Door (bottom center) */}
      <g transform="translate(130, 218)">
        <line x1="0" y1="0" x2="60" y2="0" stroke="currentColor" strokeWidth="4"/>
        <path d="M 0 0 A 60 60 0 0 0 60 -60" fill="none" stroke="currentColor" strokeWidth="2"/>
      </g>
    </svg>
  );
};

export const RoomTypeB: React.FC<RoomLayoutProps> = ({ roomNumber, side, ...props }) => {
  // ROOM DIMENSIONS (must match real Softgen container!)
  const ROOM_WIDTH = 220;
  const ROOM_HEIGHT = 260;

  // BED DIMENSIONS
  const BED_WIDTH = 60;
  const BED_HEIGHT = 110;

  // PERFECT CENTERING FORMULA
  const totalBedsWidth = BED_WIDTH * 2;
  const spaceLeft = (ROOM_WIDTH - totalBedsWidth) / 2;

  return (
    <svg
      width={ROOM_WIDTH}
      height={ROOM_HEIGHT}
      viewBox={`0 0 ${ROOM_WIDTH} ${ROOM_HEIGHT}`}
      {...props}
    >
      {/* OUTER ROOM BORDER */}
      <rect x="0" y="0" width={ROOM_WIDTH} height={ROOM_HEIGHT} fill="white" stroke="currentColor" strokeWidth="2"/>

      {/* CLOSET – top left */}
      <rect x="10" y="10" width="40" height="40" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="30" y1="10" x2="30" y2="50" stroke="currentColor" strokeWidth="2"/>

      {/* DOOR ARC – centered top */}
      <line x1={ROOM_WIDTH / 2 - 30} y1="0" x2={ROOM_WIDTH / 2 + 30} y2="0" stroke="currentColor" strokeWidth="4"/>
      <path
        d={`M ${ROOM_WIDTH / 2 + 30} 0 A 30 30 0 0 0 ${ROOM_WIDTH / 2 - 30} 30`}
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* TOILET – top right */}
      <circle cx={ROOM_WIDTH - 30} cy={30} r="18" fill="none" stroke="currentColor" strokeWidth="2"/>
      <rect x={ROOM_WIDTH - 40} y="10" width="20" height="10" fill="none" stroke="currentColor" strokeWidth="2"/>

      {/* LEFT BED */}
      <g transform={`translate(${spaceLeft}, ${ROOM_HEIGHT - BED_HEIGHT - 10}) rotate(180, ${BED_WIDTH / 2}, ${BED_HEIGHT / 2})`}>
        <rect width={BED_WIDTH} height={BED_HEIGHT} rx="6" ry="6" stroke="currentColor" strokeWidth="2" fill="white"/>
        <rect x="3" y="20" width={BED_WIDTH - 6} height={BED_HEIGHT - 25} rx="6" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="8" y="3" width={BED_WIDTH - 16} height="18" rx="4" ry="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </g>

      {/* RIGHT BED */}
      <g transform={`translate(${spaceLeft + BED_WIDTH}, ${ROOM_HEIGHT - BED_HEIGHT - 10}) rotate(180, ${BED_WIDTH / 2}, ${BED_HEIGHT / 2})`}>
        <rect width={BED_WIDTH} height={BED_HEIGHT} rx="6" ry="6" stroke="currentColor" strokeWidth="2" fill="white"/>
        <rect x="3" y="20" width={BED_WIDTH - 6} height={BED_HEIGHT - 25} rx="6" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="8" y="3" width={BED_WIDTH - 16} height="18" rx="4" ry="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </g>
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
