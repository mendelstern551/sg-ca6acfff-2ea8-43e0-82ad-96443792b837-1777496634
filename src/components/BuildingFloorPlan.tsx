
import { Room } from "@/services/buildingService";
import { Badge } from "@/components/ui/badge";
import { Bed, BedDouble } from "lucide-react";

interface BuildingFloorPlanProps {
  buildingName: string;
  rooms: Room[];
  onRoomClick: (room: Room) => void;
}

export function BuildingFloorPlan({ buildingName, rooms, onRoomClick }: BuildingFloorPlanProps) {
  // Create an interactive SVG floor plan layout
  const getRoomPosition = (roomName: string, floor: number) => {
    // Extract room number from name (e.g., "Room 101" -> 101)
    const roomNum = parseInt(roomName.replace(/\D/g, ""));
    const roomIndex = roomNum % 100; // Get last 2 digits
    
    // Calculate grid position (3 rooms per row)
    const col = (roomIndex - 1) % 3;
    const row = Math.floor((roomIndex - 1) / 3);
    
    return {
      x: 50 + col * 280,
      y: 80 + row * 200 + (floor * 600)
    };
  };

  const maxFloor = Math.max(...rooms.map(r => r.floor || 0));
  const svgHeight = 200 + (maxFloor + 1) * 600;

  return (
    <svg
      viewBox={`0 0 900 ${svgHeight}`}
      className="w-full h-auto"
      style={{ minHeight: "400px", maxHeight: "800px" }}
    >
      {/* Background */}
      <rect width="900" height={svgHeight} fill="#f8fafc" className="dark:fill-stone-900" />
      
      {/* Building title */}
      <text
        x="450"
        y="40"
        textAnchor="middle"
        className="fill-stone-900 dark:fill-stone-100"
        style={{ fontSize: "24px", fontWeight: "bold" }}
      >
        {buildingName}
      </text>

      {/* Floor labels */}
      {Array.from({ length: maxFloor + 1 }).map((_, floor) => (
        <g key={`floor-${floor}`}>
          <line
            x1="20"
            y1={60 + floor * 600}
            x2="880"
            y2={60 + floor * 600}
            stroke="#cbd5e1"
            strokeWidth="2"
            className="dark:stroke-stone-700"
          />
          <text
            x="30"
            y={100 + floor * 600}
            className="fill-stone-600 dark:fill-stone-400"
            style={{ fontSize: "16px", fontWeight: "600" }}
          >
            {floor === 0 ? "Basement" : `Floor ${floor}`}
          </text>
        </g>
      ))}

      {/* Rooms */}
      {rooms.map((room) => {
        const pos = getRoomPosition(room.name, room.floor || 0);
        const totalBeds = (room.bed_count || 0) + (room.bunk_bed_count || 0);
        const hasBunks = (room.bunk_bed_count || 0) > 0;

        return (
          <g
            key={room.id}
            onClick={() => onRoomClick(room)}
            className="cursor-pointer transition-transform hover:scale-105"
            style={{ transformOrigin: `${pos.x + 110}px ${pos.y + 75}px` }}
          >
            {/* Room card */}
            <rect
              x={pos.x}
              y={pos.y}
              width="220"
              height="150"
              rx="12"
              className="fill-white dark:fill-stone-800 stroke-stone-300 dark:stroke-stone-600"
              strokeWidth="2"
            />
            
            {/* Hover effect overlay */}
            <rect
              x={pos.x}
              y={pos.y}
              width="220"
              height="150"
              rx="12"
              className="fill-orange-500 opacity-0 hover:opacity-10 transition-opacity"
              pointerEvents="none"
            />

            {/* Room name */}
            <text
              x={pos.x + 110}
              y={pos.y + 35}
              textAnchor="middle"
              className="fill-stone-900 dark:fill-stone-100"
              style={{ fontSize: "18px", fontWeight: "700" }}
            >
              {room.name}
            </text>

            {/* Bed count display */}
            <g transform={`translate(${pos.x + 30}, ${pos.y + 60})`}>
              {/* Single beds */}
              <rect
                x="0"
                y="0"
                width="70"
                height="40"
                rx="6"
                className="fill-blue-100 dark:fill-blue-900/30 stroke-blue-300 dark:stroke-blue-700"
                strokeWidth="1.5"
              />
              <text
                x="35"
                y="26"
                textAnchor="middle"
                className="fill-blue-700 dark:fill-blue-300"
                style={{ fontSize: "20px", fontWeight: "bold" }}
              >
                {room.bed_count || 0}
              </text>
              <text
                x="35"
                y="55"
                textAnchor="middle"
                className="fill-stone-600 dark:fill-stone-400"
                style={{ fontSize: "11px" }}
              >
                Single
              </text>
            </g>

            <g transform={`translate(${pos.x + 120}, ${pos.y + 60})`}>
              {/* Bunk beds */}
              <rect
                x="0"
                y="0"
                width="70"
                height="40"
                rx="6"
                className={`${hasBunks ? 'fill-orange-100 dark:fill-orange-900/30 stroke-orange-300 dark:stroke-orange-700' : 'fill-stone-100 dark:fill-stone-800 stroke-stone-300 dark:stroke-stone-600'}`}
                strokeWidth="1.5"
              />
              <text
                x="35"
                y="26"
                textAnchor="middle"
                className={`${hasBunks ? 'fill-orange-700 dark:fill-orange-300' : 'fill-stone-500 dark:fill-stone-500'}`}
                style={{ fontSize: "20px", fontWeight: "bold" }}
              >
                {room.bunk_bed_count || 0}
              </text>
              <text
                x="35"
                y="55"
                textAnchor="middle"
                className="fill-stone-600 dark:fill-stone-400"
                style={{ fontSize: "11px" }}
              >
                Bunk
              </text>
            </g>

            {/* Total capacity badge */}
            <rect
              x={pos.x + 145}
              y={pos.y + 115}
              width="65"
              height="25"
              rx="12.5"
              className="fill-orange-600"
            />
            <text
              x={pos.x + 177.5}
              y={pos.y + 132}
              textAnchor="middle"
              className="fill-white"
              style={{ fontSize: "13px", fontWeight: "700" }}
            >
              {totalBeds} beds
            </text>
          </g>
        );
      })}
    </svg>
  );
}
