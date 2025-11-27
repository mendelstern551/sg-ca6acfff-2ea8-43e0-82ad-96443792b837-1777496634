
import { Room } from "@/services/buildingService";
import { RoomTypeA, RoomTypeB, RoomTypeC } from "./RoomLayouts";

interface BuildingFloorPlanProps {
  buildingName: string;
  rooms: Room[];
  onRoomClick: (room: Room) => void;
}

export function BuildingFloorPlan({ buildingName, rooms, onRoomClick }: BuildingFloorPlanProps) {
  // Detect if this is Building #1
  const isBuilding1 = buildingName.includes("Building #1");
  
  // Extract room number from room name (e.g., "Room 101" -> "101")
  const getRoomNumber = (roomName: string) => {
    const match = roomName.match(/(\d+)/);
    return match ? match[1] : roomName;
  };
  
  // For Building #1, split rooms by number range
  // Rooms 101-106 go on the left side (Floor 1)
  // Rooms 107-112 go on the right side (Floor 2)
  const leftRooms = rooms.filter(room => {
    const roomNum = parseInt(getRoomNumber(room.name));
    return roomNum >= 101 && roomNum <= 106;
  });
  
  const rightRooms = rooms.filter(room => {
    const roomNum = parseInt(getRoomNumber(room.name));
    return roomNum >= 107 && roomNum <= 112;
  });
  
  // Sort rooms by room number
  const sortRooms = (roomList: Room[]) => {
    return [...roomList].sort((a, b) => {
      const numA = parseInt(getRoomNumber(a.name));
      const numB = parseInt(getRoomNumber(b.name));
      return numA - numB;
    });
  };

  const sortedLeftRooms = sortRooms(leftRooms);
  const sortedRightRooms = sortRooms(rightRooms);

  // Group by floor for layout positioning
  const groupByFloor = (roomList: Room[]) => {
    return roomList.reduce((acc, room) => {
      const floor = room.floor || 0;
      if (!acc[floor]) acc[floor] = [];
      acc[floor].push(room);
      return acc;
    }, {} as Record<number, Room[]>);
  };

  const leftRoomsByFloor = groupByFloor(sortedLeftRooms);
  const rightRoomsByFloor = groupByFloor(sortedRightRooms);
  
  // Get all floor numbers
  const floors = [1, 2]; // Building #1 has floors 1 and 2
  
  // Calculate SVG dimensions for Building #1 layout
  const roomWidth = 160;
  const roomHeight = 110;
  const roomSpacing = 15;
  const verticalSpacing = 20;
  const headerHeight = 80;
  const sideMargin = 40;
  const centerDividerWidth = 60;
  
  // Calculate the maximum number of rooms per row on each side
  const maxLeftRoomsPerRow = Math.max(...floors.map(f => (leftRoomsByFloor[f]?.length || 0)));
  const maxRightRoomsPerRow = Math.max(...floors.map(f => (rightRoomsByFloor[f]?.length || 0)));
  
  // Calculate width for each side independently
  const leftSideWidth = maxLeftRoomsPerRow * roomWidth + (maxLeftRoomsPerRow - 1) * roomSpacing;
  const rightSideWidth = maxRightRoomsPerRow * roomWidth + (maxRightRoomsPerRow - 1) * roomSpacing;
  
  // Total SVG width: left margin + left side + divider + right side + right margin
  const svgWidth = sideMargin + leftSideWidth + centerDividerWidth + rightSideWidth + sideMargin;
  const svgHeight = headerHeight + floors.length * (roomHeight + verticalSpacing) + 80;

  // Get room position in grid
  const getRoomPosition = (side: "left" | "right", floorIndex: number, roomIndex: number) => {
    const x = side === "left" 
      ? sideMargin + roomIndex * (roomWidth + roomSpacing)
      : sideMargin + leftSideWidth + centerDividerWidth + roomIndex * (roomWidth + roomSpacing);
    
    const y = headerHeight + floorIndex * (roomHeight + verticalSpacing);
    return { x, y };
  };

  // Get the appropriate room layout component based on room_type
  const getRoomLayoutComponent = (roomType: string | null) => {
    switch (roomType) {
      case "A":
        return RoomTypeA;
      case "C":
        return RoomTypeC;
      case "B":
      default:
        return RoomTypeB;
    }
  };

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-auto"
      style={{ minHeight: "500px", maxHeight: "1200px" }}
    >
      <rect 
        width={svgWidth} 
        height={svgHeight} 
        fill="#f8fafc" 
        className="dark:fill-stone-950" 
      />
      
      <text
        x={svgWidth / 2}
        y="40"
        textAnchor="middle"
        className="fill-stone-900 dark:fill-stone-100"
        style={{ fontSize: "32px", fontWeight: "bold" }}
      >
        Building #1 (661)
      </text>

      <text
        x={sideMargin + leftSideWidth / 2}
        y="65"
        textAnchor="middle"
        className="fill-blue-600 dark:fill-blue-400"
        style={{ fontSize: "20px", fontWeight: "700" }}
      >
        ◄ LEFT SIDE (101-106)
      </text>
      
      <text
        x={sideMargin + leftSideWidth + centerDividerWidth + rightSideWidth / 2}
        y="65"
        textAnchor="middle"
        className="fill-orange-600 dark:fill-orange-400"
        style={{ fontSize: "20px", fontWeight: "700" }}
      >
        RIGHT SIDE (107-112) ►
      </text>

      <line
        x1={sideMargin + leftSideWidth + centerDividerWidth / 2}
        y1={headerHeight - 10}
        x2={sideMargin + leftSideWidth + centerDividerWidth / 2}
        y2={svgHeight - 60}
        stroke="#ef4444"
        strokeWidth="5"
        className="dark:stroke-red-500"
        opacity="0.7"
      />

      <text
        x={sideMargin + leftSideWidth + centerDividerWidth / 2 + 8}
        y={(headerHeight + svgHeight - 60) / 2}
        textAnchor="middle"
        className="fill-red-600 dark:fill-red-400"
        style={{ 
          fontSize: "14px", 
          fontWeight: "800",
          writingMode: "vertical-rl",
          textOrientation: "mixed"
        }}
      >
        BUILDING SPLIT
      </text>

      {floors.map((floor, floorIndex) => {
        const leftFloorRooms = leftRoomsByFloor[floor] || [];
        const rightFloorRooms = rightRoomsByFloor[floor] || [];

        return (
          <g key={`floor-${floor}`}>
            {/* Render LEFT side rooms (101-106) */}
            {leftFloorRooms.map((room, roomIndex) => {
              const pos = getRoomPosition("left", floorIndex, roomIndex);
              const roomNumber = getRoomNumber(room.name);
              const RoomLayout = getRoomLayoutComponent(room.room_type);
              const singleBeds = room.bed_count || 0;
              const bunkBeds = room.bunk_bed_count || 0;
              const totalBeds = singleBeds + (bunkBeds * 2);

              return (
                <g
                  key={room.id}
                  onClick={() => onRoomClick(room)}
                  className="cursor-pointer group"
                >
                  {/* Room layout SVG */}
                  <g transform={`translate(${pos.x}, ${pos.y}) scale(0.5)`}>
                    <RoomLayout className="stroke-stone-300 dark:stroke-stone-700 group-hover:stroke-blue-500 dark:group-hover:stroke-blue-400 transition-all" />
                  </g>

                  {/* Hover overlay */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={roomWidth}
                    height={roomHeight}
                    rx="12"
                    className="fill-blue-500 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
                  />

                  {/* Room number label */}
                  <text
                    x={pos.x + roomWidth / 2}
                    y={pos.y - 8}
                    textAnchor="middle"
                    className="fill-stone-900 dark:fill-stone-100 font-bold"
                    style={{ fontSize: "20px", fontWeight: "900" }}
                  >
                    {roomNumber}
                  </text>

                  {/* Bed count badge */}
                  <rect
                    x={pos.x + roomWidth / 2 - 30}
                    y={pos.y + roomHeight + 5}
                    width="60"
                    height="20"
                    rx="10"
                    className="fill-blue-600 group-hover:fill-blue-700 transition-colors"
                  />
                  <text
                    x={pos.x + roomWidth / 2}
                    y={pos.y + roomHeight + 18}
                    textAnchor="middle"
                    className="fill-white"
                    style={{ fontSize: "12px", fontWeight: "800" }}
                  >
                    {totalBeds} BEDS
                  </text>
                </g>
              );
            })}

            {/* Render RIGHT side rooms (107-112) */}
            {rightFloorRooms.map((room, roomIndex) => {
              const pos = getRoomPosition("right", floorIndex, roomIndex);
              const roomNumber = getRoomNumber(room.name);
              const RoomLayout = getRoomLayoutComponent(room.room_type);
              const singleBeds = room.bed_count || 0;
              const bunkBeds = room.bunk_bed_count || 0;
              const totalBeds = singleBeds + (bunkBeds * 2);

              return (
                <g
                  key={room.id}
                  onClick={() => onRoomClick(room)}
                  className="cursor-pointer group"
                >
                  {/* Room layout SVG */}
                  <g transform={`translate(${pos.x}, ${pos.y}) scale(0.5)`}>
                    <RoomLayout className="stroke-stone-300 dark:stroke-stone-700 group-hover:stroke-orange-500 dark:group-hover:stroke-orange-400 transition-all" />
                  </g>

                  {/* Hover overlay */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={roomWidth}
                    height={roomHeight}
                    rx="12"
                    className="fill-orange-500 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
                  />

                  {/* Room number label */}
                  <text
                    x={pos.x + roomWidth / 2}
                    y={pos.y - 8}
                    textAnchor="middle"
                    className="fill-stone-900 dark:fill-stone-100 font-bold"
                    style={{ fontSize: "20px", fontWeight: "900" }}
                  >
                    {roomNumber}
                  </text>

                  {/* Bed count badge */}
                  <rect
                    x={pos.x + roomWidth / 2 - 30}
                    y={pos.y + roomHeight + 5}
                    width="60"
                    height="20"
                    rx="10"
                    className="fill-orange-600 group-hover:fill-orange-700 transition-colors"
                  />
                  <text
                    x={pos.x + roomWidth / 2}
                    y={pos.y + roomHeight + 18}
                    textAnchor="middle"
                    className="fill-white"
                    style={{ fontSize: "12px", fontWeight: "800" }}
                  >
                    {totalBeds} BEDS
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      <g transform={`translate(${svgWidth / 2 - 150}, ${svgHeight - 50})`}>
        <text
          x="0"
          y="0"
          className="fill-stone-600 dark:fill-stone-400"
          style={{ fontSize: "14px", fontWeight: "700" }}
        >
          LEGEND:
        </text>
        
        <rect
          x="80"
          y="-12"
          width="25"
          height="15"
          rx="2"
          className="fill-none stroke-stone-600 dark:stroke-stone-400"
          strokeWidth="2"
        />
        <text
          x="110"
          y="0"
          className="fill-stone-700 dark:fill-stone-300"
          style={{ fontSize: "11px", fontWeight: "600" }}
        >
          = Bed
        </text>
        
        <circle
          cx="175"
          cy="-5"
          r="8"
          className="fill-none stroke-stone-600 dark:stroke-stone-400"
          strokeWidth="2"
        />
        <text
          x="188"
          y="0"
          className="fill-stone-700 dark:fill-stone-300"
          style={{ fontSize: "11px", fontWeight: "600" }}
        >
          = Toilet
        </text>
        
        <rect
          x="250"
          y="-12"
          width="25"
          height="15"
          rx="2"
          className="fill-none stroke-stone-600 dark:stroke-stone-400"
          strokeWidth="2"
        />
        <text
          x="280"
          y="0"
          className="fill-stone-700 dark:fill-stone-300"
          style={{ fontSize: "11px", fontWeight: "600" }}
        >
          = Closet
        </text>
      </g>
    </svg>
  );
}
