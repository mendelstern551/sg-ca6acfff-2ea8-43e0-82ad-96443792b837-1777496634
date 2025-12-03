import React from "react";

interface RoomLayoutProps extends React.SVGProps<SVGSVGElement> {
  roomNumber?: number;
  side?: "left" | "right";
}

export const RoomTypeA: React.FC<RoomLayoutProps> = ({ roomNumber, side, ...props }) => {
  return (
    <svg
      width="600"
      height="600"
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      {/* SVG Filter Definitions for Maximum Sharpness */}
      <defs>
        <filter id="sharpen-filter" x="-50%" y="-50%" width="200%" height="200%">
          {/* Gaussian Blur for base */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="0" result="blur"/>
          {/* High-pass filter for edge detection */}
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 1 0" result="color"/>
          {/* Edge enhancement */}
          <feConvolveMatrix order="3" kernelMatrix="0 -1 0   -1 5 -1   0 -1 0" in="SourceGraphic" result="sharpen"/>
          {/* Combine for maximum sharpness */}
          <feBlend mode="normal" in="sharpen" in2="SourceGraphic"/>
          {/* Contrast boost */}
          <feComponentTransfer>
            <feFuncR type="linear" slope="2.5" intercept="-0.3"/>
            <feFuncG type="linear" slope="2.5" intercept="-0.3"/>
            <feFuncB type="linear" slope="2.5" intercept="-0.3"/>
          </feComponentTransfer>
        </filter>
      </defs>

      {/* White background for maximum contrast */}
      <rect x="0" y="0" width="600" height="600" fill="white" />
      
      {/* Room layout image with aggressive sharpening and contrast */}
      <image
        href="/Gemini_Generated_Image_jlzgjcjlzgjcjlzg.png"
        x="0"
        y="0"
        width="600"
        height="600"
        preserveAspectRatio="xMidYMid slice"
        filter="url(#sharpen-filter)"
        style={{
          filter: "contrast(2.5) brightness(1.4) saturate(1.6) drop-shadow(0 0 1px rgba(0,0,0,0.8))"
        }}
      />
      
      {/* Strong border overlay for definition */}
      <rect 
        x="4" 
        y="4" 
        width="592" 
        height="592" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="6"
        rx="10"
        style={{
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
        }}
      />
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
