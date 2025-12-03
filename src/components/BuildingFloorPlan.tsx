import { Room } from "@/services/buildingService";
import { RoomTypeA, RoomTypeB, RoomTypeC } from "./RoomLayouts";

interface BuildingFloorPlanProps {
  buildingName: string;
  rooms: Room[];
  onRoomClick: (room: Room) => void;
}

// Hardcoded room type mapping as specified
const ROOM_TYPES: Record<number, "A" | "B" | "C"> = {
  101: "A",
  102: "A",
  103: "A",
  104: "B",
  105: "B",
  106: "B",
  107: "A",
  108: "A",
  109: "A",
  110: "C",
  111: "B",
  112: "B"
};

// Bed counts by room type
const BED_COUNT = {
  A: 4,
  B: 2,
  C: 2
};

export function BuildingFloorPlan({ buildingName, rooms, onRoomClick }: BuildingFloorPlanProps) {
  const isBuilding1 = buildingName.includes("Building #1");
  
  // Extract room number from room name (e.g., "Room 101" -> 101)
  const getRoomNumber = (roomName: string): number => {
    const match = roomName.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  
  // Get room type from room number
  const getRoomType = (roomNumber: number): "A" | "B" | "C" => {
    return ROOM_TYPES[roomNumber] || "B";
  };
  
  // Get room type component based on room number
  const getRoomComponent = (roomNumber: number) => {
    const type = getRoomType(roomNumber);
    if (type === "A") return RoomTypeA;
    if (type === "C") return RoomTypeC;
    return RoomTypeB;
  };

  // For Building #1, organize rooms into the correct 3×2 layout
  // LEFT SIDE: 101-106 (Top: 101,102,103 | Bottom: 104,105,106)
  // RIGHT SIDE: 107-112 (Top: 107,108,109 | Bottom: 110,111,112)
  
  const leftTopRooms = rooms.filter(r => {
    const num = getRoomNumber(r.name);
    return num >= 101 && num <= 103;
  }).sort((a, b) => getRoomNumber(a.name) - getRoomNumber(b.name));
  
  const leftBottomRooms = rooms.filter(r => {
    const num = getRoomNumber(r.name);
    return num >= 104 && num <= 106;
  }).sort((a, b) => getRoomNumber(a.name) - getRoomNumber(b.name));
  
  const rightTopRooms = rooms.filter(r => {
    const num = getRoomNumber(r.name);
    return num >= 107 && num <= 109;
  }).sort((a, b) => getRoomNumber(a.name) - getRoomNumber(b.name));
  
  const rightBottomRooms = rooms.filter(r => {
    const num = getRoomNumber(r.name);
    return num >= 110 && num <= 112;
  }).sort((a, b) => getRoomNumber(a.name) - getRoomNumber(b.name));

  // Layout constants optimized for larger 800x800 room image
  const roomWidth = 280;
  const roomHeight = 280;
  const roomSpacing = 25;
  const verticalSpacing = 35;
  const headerHeight = 90;
  const sideMargin = 30;
  const centerDividerWidth = 70;
  
  // Each side has 3 rooms per row
  const sideWidth = 3 * roomWidth + 2 * roomSpacing;
  
  // Total SVG dimensions
  const svgWidth = sideMargin + sideWidth + centerDividerWidth + sideWidth + sideMargin;
  const svgHeight = headerHeight + 2 * (roomHeight + verticalSpacing) + 80;

  // Calculate position for a room in the grid
  const getRoomPosition = (side: "left" | "right", row: "top" | "bottom", columnIndex: number) => {
    const baseX = side === "left" 
      ? sideMargin + columnIndex * (roomWidth + roomSpacing)
      : sideMargin + sideWidth + centerDividerWidth + columnIndex * (roomWidth + roomSpacing);
    
    const baseY = headerHeight + (row === "top" ? 0 : roomHeight + verticalSpacing);
    
    return { x: baseX, y: baseY };
  };

  const renderRoom = (room: Room, side: "left" | "right", row: "top" | "bottom", columnIndex: number) => {
    const pos = getRoomPosition(side, row, columnIndex);
    const identifier = getRoomNumber(room.name);
    const RoomLayout = getRoomComponent(identifier);
    const roomType = getRoomType(identifier);
    const bedCount = BED_COUNT[roomType];

    return (
      <g
        key={room.id}
        onClick={() => onRoomClick(room)}
        className="cursor-pointer group"
      >
        {/* Room layout SVG - scaled to fit larger 800x800 image */}
        <g transform={`translate(${pos.x}, ${pos.y}) scale(${roomType === "A" ? 0.35 : 1})`}>
          <RoomLayout 
            className={`${side === "left" 
              ? "stroke-blue-400 dark:stroke-blue-600 group-hover:stroke-blue-600 dark:group-hover:stroke-blue-400" 
              : "stroke-orange-400 dark:stroke-orange-600 group-hover:stroke-orange-600 dark:group-hover:stroke-orange-400"
            } transition-all`} 
          />
        </g>

        {/* Hover overlay */}
        <rect
          x={pos.x}
          y={pos.y}
          width={roomWidth}
          height={roomHeight}
          rx="10"
          className={`${side === "left" ? "fill-blue-500" : "fill-orange-500"} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`}
        />

        {/* Room number label (centered above room) */}
        <g transform={`translate(${pos.x + roomWidth / 2}, ${pos.y - 20})`}>
          <rect
            x="-38"
            y="-16"
            width="76"
            height="32"
            rx="12"
            fill={side === "left" ? "#0069ff" : "#ff6600"}
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill="white"
            fontSize="17"
            fontWeight="bold"
          >
            {identifier}
          </text>
        </g>

        {/* Room type badge (top-right corner) */}
        <circle
          cx={pos.x + roomWidth - 22}
          cy={pos.y + 22}
          r="15"
          className={`${side === "left" ? "fill-blue-600" : "fill-orange-600"} group-hover:opacity-90 transition-opacity`}
        />
        <text
          x={pos.x + roomWidth - 22}
          y={pos.y + 22}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white pointer-events-none"
          style={{ fontSize: "12px", fontWeight: "800" }}
        >
          {roomType}
        </text>

        {/* Bed count badge (centered below room) */}
        <rect
          x={pos.x + roomWidth / 2 - 38}
          y={pos.y + roomHeight + 8}
          width="76"
          height="24"
          rx="12"
          className={`${side === "left" ? "fill-blue-600 group-hover:fill-blue-700" : "fill-orange-600 group-hover:fill-orange-700"} transition-colors`}
        />
        <text
          x={pos.x + roomWidth / 2}
          y={pos.y + roomHeight + 21}
          textAnchor="middle"
          className="fill-white pointer-events-none"
          style={{ fontSize: "13px", fontWeight: "800" }}
        >
          {bedCount} BEDS
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-auto"
      style={{ minHeight: "700px", maxHeight: "1400px" }}
    >
      {/* Background */}
      <rect 
        width={svgWidth} 
        height={svgHeight} 
        fill="#f8fafc" 
        className="dark:fill-stone-950" 
      />
      
      {/* Title */}
      <text
        x={svgWidth / 2}
        y="40"
        textAnchor="middle"
        className="fill-stone-900 dark:fill-stone-100"
        style={{ fontSize: "36px", fontWeight: "bold" }}
      >
        Building #1 (661)
      </text>

      {/* Left side label */}
      <text
        x={sideMargin + sideWidth / 2}
        y="70"
        textAnchor="middle"
        className="fill-blue-600 dark:fill-blue-400"
        style={{ fontSize: "22px", fontWeight: "700" }}
      >
        ◄ LEFT SIDE
      </text>
      
      {/* Right side label */}
      <text
        x={sideMargin + sideWidth + centerDividerWidth + sideWidth / 2}
        y="70"
        textAnchor="middle"
        className="fill-orange-600 dark:fill-orange-400"
        style={{ fontSize: "22px", fontWeight: "700" }}
      >
        RIGHT SIDE ►
      </text>

      {/* Center divider line */}
      <line
        x1={sideMargin + sideWidth + centerDividerWidth / 2}
        y1={headerHeight - 10}
        x2={sideMargin + sideWidth + centerDividerWidth / 2}
        y2={svgHeight - 80}
        stroke="#ef4444"
        strokeWidth="6"
        className="dark:stroke-red-500"
        opacity="0.8"
      />

      {/* Building split label */}
      <text
        x={sideMargin + sideWidth + centerDividerWidth / 2 + 10}
        y={(headerHeight + svgHeight - 80) / 2}
        textAnchor="middle"
        className="fill-red-600 dark:fill-red-400"
        style={{ 
          fontSize: "16px", 
          fontWeight: "800",
          writingMode: "vertical-rl",
          textOrientation: "mixed"
        }}
      >
        HALLWAY
      </text>

      {/* Render LEFT SIDE rooms in 3×2 grid */}
      {/* Top row: 101, 102, 103 */}
      {leftTopRooms.map((room, idx) => renderRoom(room, "left", "top", idx))}
      
      {/* Bottom row: 104, 105, 106 */}
      {leftBottomRooms.map((room, idx) => renderRoom(room, "left", "bottom", idx))}

      {/* Render RIGHT SIDE rooms in 3×2 grid */}
      {/* Top row: 107, 108, 109 */}
      {rightTopRooms.map((room, idx) => renderRoom(room, "right", "top", idx))}
      
      {/* Bottom row: 110, 111, 112 */}
      {rightBottomRooms.map((room, idx) => renderRoom(room, "right", "bottom", idx))}

      {/* Legend */}
      <g transform={`translate(${svgWidth / 2 - 180}, ${svgHeight - 60})`}>
        <text
          x="0"
          y="0"
          className="fill-stone-600 dark:fill-stone-400"
          style={{ fontSize: "15px", fontWeight: "700" }}
        >
          LEGEND:
        </text>
        
        {/* Bed icon */}
        <rect
          x="80"
          y="-13"
          width="28"
          height="16"
          rx="2"
          className="fill-none stroke-stone-600 dark:stroke-stone-400"
          strokeWidth="2"
        />
        <text
          x="115"
          y="0"
          className="fill-stone-700 dark:fill-stone-300"
          style={{ fontSize: "12px", fontWeight: "600" }}
        >
          = Bed
        </text>
        
        {/* Toilet icon */}
        <circle
          cx="185"
          cy="-5"
          r="9"
          className="fill-none stroke-stone-600 dark:stroke-stone-400"
          strokeWidth="2"
        />
        <text
          x="200"
          y="0"
          className="fill-stone-700 dark:fill-stone-300"
          style={{ fontSize: "12px", fontWeight: "600" }}
        >
          = Toilet
        </text>
        
        {/* Closet icon */}
        <rect
          x="270"
          y="-13"
          width="28"
          height="16"
          rx="2"
          className="fill-none stroke-stone-600 dark:stroke-stone-400"
          strokeWidth="2"
        />
        <text
          x="305"
          y="0"
          className="fill-stone-700 dark:fill-stone-300"
          style={{ fontSize: "12px", fontWeight: "600" }}
        >
          = Closet
        </text>
      </g>
    </svg>
  );
}
