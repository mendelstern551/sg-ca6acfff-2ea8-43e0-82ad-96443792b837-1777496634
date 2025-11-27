
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

      {/* Top-left bed */}
      <g transform="translate(30, 30)">
        <rect x="0" y="0" width="70" height="40" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="0" y="-10" width="70" height="10" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
      </g>

      {/* Top-right bed */}
      <g transform="translate(220, 30)">
        <rect x="0" y="0" width="70" height="40" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="0" y="-10" width="70" height="10" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
      </g>

      {/* Bottom-left bed */}
      <g transform="translate(30, 100)">
        <rect x="0" y="0" width="70" height="40" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="0" y="-10" width="70" height="10" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
      </g>

      {/* Bottom-right bed */}
      <g transform="translate(220, 100)">
        <rect x="0" y="0" width="70" height="40" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="0" y="-10" width="70" height="10" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
      </g>

      {/* Toilet (bottom-left corner) */}
      <g transform="translate(35, 175)">
        <circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="2" width="14" height="6" fill="none" stroke="currentColor" strokeWidth="2" rx="1"/>
      </g>

      {/* Closet (bottom-right corner) */}
      <g transform="translate(250, 170)">
        <rect x="0" y="0" width="40" height="35" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
        <line x1="20" y1="0" x2="20" y2="35" stroke="currentColor" strokeWidth="2"/>
      </g>

      {/* Door (bottom center) */}
      <g transform="translate(130, 218)">
        <line x1="0" y1="0" x2="60" y2="0" stroke="currentColor" strokeWidth="4"/>
        <path d="M 0 0 A 60 60 0 0 0 60 -60" fill="none" stroke="currentColor" strokeWidth="2"/>
      </g>

      {/* Room number label (centered) */}
      {roomNumber && (
        <g transform="translate(160, 110)">
          <rect x="-28" y="-16" width="56" height="32" fill={bgColor} rx="8" ry="8"/>
          <text 
            x="0" 
            y="6" 
            textAnchor="middle" 
            fill="white"
            fontSize="18"
            fontWeight="700"
          >
            {roomNumber}
          </text>
        </g>
      )}
    </svg>
  );
};

export const RoomTypeB: React.FC<RoomLayoutProps> = ({ roomNumber, side, ...props }) => {
  const bedCount = 2;
  const bgColor = side === "left" ? "#007bff" : "#ff6600";
  
  return (
    <svg width={320} height={220} viewBox="0 0 320 220" {...props}>
      {/* Room border */}
      <rect x="2" y="2" width="316" height="216" stroke="currentColor" fill="white" strokeWidth="3" rx="8" />

      {/* Left bed (bottom) */}
      <g transform="translate(70, 160)">
        <rect x="0" y="0" width="70" height="40" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="0" y="-10" width="70" height="10" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
      </g>

      {/* Right bed (bottom) */}
      <g transform="translate(180, 160)">
        <rect x="0" y="0" width="70" height="40" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="0" y="-10" width="70" height="10" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
      </g>

      {/* Toilet (top-right corner) */}
      <g transform="translate(260, 25)">
        <circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="2" width="14" height="6" fill="none" stroke="currentColor" strokeWidth="2" rx="1"/>
      </g>

      {/* Closet (top-left corner) */}
      <g transform="translate(30, 25)">
        <rect x="0" y="0" width="40" height="35" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
        <line x1="20" y1="0" x2="20" y2="35" stroke="currentColor" strokeWidth="2"/>
      </g>

      {/* Door (top center) */}
      <g transform="translate(130, 2)">
        <line x1="0" y1="0" x2="60" y2="0" stroke="currentColor" strokeWidth="4"/>
        <path d="M 0 0 A 60 60 0 0 1 60 60" fill="none" stroke="currentColor" strokeWidth="2"/>
      </g>

      {/* Room number label (centered) */}
      {roomNumber && (
        <g transform="translate(160, 110)">
          <rect x="-28" y="-16" width="56" height="32" fill={bgColor} rx="8" ry="8"/>
          <text 
            x="0" 
            y="6" 
            textAnchor="middle" 
            fill="white"
            fontSize="18"
            fontWeight="700"
          >
            {roomNumber}
          </text>
        </g>
      )}
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

      {/* Left bed (bottom) */}
      <g transform="translate(70, 160)">
        <rect x="0" y="0" width="70" height="40" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="0" y="-10" width="70" height="10" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
      </g>

      {/* Right bed (bottom) */}
      <g transform="translate(180, 160)">
        <rect x="0" y="0" width="70" height="40" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="0" y="-10" width="70" height="10" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
      </g>

      {/* Toilet (top-right corner) */}
      <g transform="translate(260, 25)">
        <circle cx="15" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="2" width="14" height="6" fill="none" stroke="currentColor" strokeWidth="2" rx="1"/>
      </g>

      {/* Closet (top-left corner) */}
      <g transform="translate(30, 25)">
        <rect x="0" y="0" width="40" height="35" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
        <line x1="20" y1="0" x2="20" y2="35" stroke="currentColor" strokeWidth="2"/>
      </g>

      {/* Main door (top center) */}
      <g transform="translate(130, 2)">
        <line x1="0" y1="0" x2="60" y2="0" stroke="currentColor" strokeWidth="4"/>
        <path d="M 0 0 A 60 60 0 0 1 60 60" fill="none" stroke="currentColor" strokeWidth="2"/>
      </g>

      {/* Interior connection door (right side) */}
      <g transform="translate(318, 90)">
        <line x1="0" y1="0" x2="0" y2="40" stroke="currentColor" strokeWidth="4"/>
        <path d="M 0 0 A 40 40 0 0 1 -40 40" fill="none" stroke="currentColor" strokeWidth="2"/>
      </g>

      {/* Room number label (centered) */}
      {roomNumber && (
        <g transform="translate(160, 110)">
          <rect x="-28" y="-16" width="56" height="32" fill={bgColor} rx="8" ry="8"/>
          <text 
            x="0" 
            y="6" 
            textAnchor="middle" 
            fill="white"
            fontSize="18"
            fontWeight="700"
          >
            {roomNumber}
          </text>
        </g>
      )}
    </svg>
  );
};
