import { Room } from "@/services/buildingService";

interface BuildingFloorPlanProps {
  buildingName: string;
  rooms: Room[];
  onRoomClick: (room: Room) => void;
}

export function BuildingFloorPlan({ buildingName, rooms, onRoomClick }: BuildingFloorPlanProps) {
  // Sort rooms by floor and name for consistent layout
  const sortedRooms = [...rooms].sort((a, b) => {
    const floorDiff = (a.floor || 0) - (b.floor || 0);
    if (floorDiff !== 0) return floorDiff;
    return a.name.localeCompare(b.name);
  });

  // Group rooms by floor
  const roomsByFloor = sortedRooms.reduce((acc, room) => {
    const floor = room.floor || 0;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<number, Room[]>);

  const floors = Object.keys(roomsByFloor).map(Number).sort((a, b) => b - a); // Top floor first
  const maxRoomsPerFloor = Math.max(...floors.map(f => roomsByFloor[f].length));
  
  // Calculate SVG dimensions
  const roomWidth = 180;
  const roomHeight = 140;
  const roomSpacing = 20;
  const floorSpacing = 60;
  const headerHeight = 80;
  const sideMargin = 40;
  
  const svgWidth = sideMargin * 2 + maxRoomsPerFloor * roomWidth + (maxRoomsPerFloor - 1) * roomSpacing;
  const svgHeight = headerHeight + floors.length * (roomHeight + floorSpacing);

  // Get room position in grid
  const getRoomPosition = (floorIndex: number, roomIndex: number) => {
    const x = sideMargin + roomIndex * (roomWidth + roomSpacing);
    const y = headerHeight + floorIndex * (roomHeight + floorSpacing);
    return { x, y };
  };

  // Extract room number from room name
  const getRoomNumber = (roomName: string) => {
    const match = roomName.match(/(\d+|B\d+)/);
    return match ? match[1] : roomName;
  };

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-auto"
      style={{ minHeight: "400px", maxHeight: "1000px" }}
    >
      {/* Background */}
      <rect 
        width={svgWidth} 
        height={svgHeight} 
        fill="#f8fafc" 
        className="dark:fill-stone-950" 
      />
      
      {/* Building title */}
      <text
        x={svgWidth / 2}
        y="35"
        textAnchor="middle"
        className="fill-stone-900 dark:fill-stone-100"
        style={{ fontSize: "28px", fontWeight: "bold" }}
      >
        {buildingName}
      </text>

      {/* Render each floor */}
      {floors.map((floor, floorIndex) => {
        const floorRooms = roomsByFloor[floor];
        const floorY = headerHeight + floorIndex * (roomHeight + floorSpacing);

        return (
          <g key={`floor-${floor}`}>
            {/* Floor label */}
            <text
              x="20"
              y={floorY + roomHeight / 2}
              className="fill-stone-600 dark:fill-stone-400"
              style={{ 
                fontSize: "18px", 
                fontWeight: "600",
                writingMode: "tb",
                transform: `rotate(-90deg)`,
                transformOrigin: `20px ${floorY + roomHeight / 2}px`
              }}
            >
              {floor === 0 ? "BASEMENT" : `FLOOR ${floor}`}
            </text>

            {/* Floor separator line */}
            {floorIndex > 0 && (
              <line
                x1={sideMargin}
                y1={floorY - floorSpacing / 2}
                x2={svgWidth - sideMargin}
                y2={floorY - floorSpacing / 2}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="5,5"
                className="dark:stroke-stone-700"
              />
            )}

            {/* Rooms on this floor */}
            {floorRooms.map((room, roomIndex) => {
              const pos = getRoomPosition(floorIndex, roomIndex);
              const roomNumber = getRoomNumber(room.name);
              const singleBeds = room.bed_count || 0;
              const bunkBeds = room.bunk_bed_count || 0;
              const totalBeds = singleBeds + bunkBeds;
              const hasBunks = bunkBeds > 0;

              return (
                <g
                  key={room.id}
                  onClick={() => onRoomClick(room)}
                  className="cursor-pointer group"
                >
                  {/* Room container with hover effect */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={roomWidth}
                    height={roomHeight}
                    rx="12"
                    className="fill-white dark:fill-stone-900 stroke-stone-300 dark:stroke-stone-700 transition-all group-hover:stroke-orange-500 dark:group-hover:stroke-orange-500 group-hover:stroke-2"
                    strokeWidth="2"
                  />
                  
                  {/* Hover background effect */}
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={roomWidth}
                    height={roomHeight}
                    rx="12"
                    className="fill-orange-500 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
                  />

                  {/* Room number - Large and prominent */}
                  <text
                    x={pos.x + roomWidth / 2}
                    y={pos.y + 45}
                    textAnchor="middle"
                    className="fill-stone-900 dark:fill-stone-100 font-bold transition-colors group-hover:fill-orange-600 dark:group-hover:fill-orange-400"
                    style={{ fontSize: "32px", fontWeight: "800" }}
                  >
                    {roomNumber}
                  </text>

                  {/* Bed count indicators - Side by side */}
                  <g transform={`translate(${pos.x + 25}, ${pos.y + 70})`}>
                    {/* Single beds icon and count */}
                    <rect
                      x="0"
                      y="0"
                      width="55"
                      height="50"
                      rx="8"
                      className="fill-blue-50 dark:fill-blue-950/30 stroke-blue-300 dark:stroke-blue-700"
                      strokeWidth="1.5"
                    />
                    {/* Bed icon */}
                    <rect
                      x="10"
                      y="12"
                      width="35"
                      height="15"
                      rx="2"
                      className="fill-blue-400 dark:fill-blue-600"
                    />
                    <rect
                      x="10"
                      y="12"
                      width="8"
                      height="15"
                      className="fill-blue-500 dark:fill-blue-700"
                    />
                    <text
                      x="27.5"
                      y="43"
                      textAnchor="middle"
                      className="fill-blue-700 dark:fill-blue-300"
                      style={{ fontSize: "16px", fontWeight: "bold" }}
                    >
                      {singleBeds}
                    </text>
                  </g>

                  <g transform={`translate(${pos.x + 100}, ${pos.y + 70})`}>
                    {/* Bunk beds icon and count */}
                    <rect
                      x="0"
                      y="0"
                      width="55"
                      height="50"
                      rx="8"
                      className={`${hasBunks 
                        ? 'fill-orange-50 dark:fill-orange-950/30 stroke-orange-300 dark:stroke-orange-700' 
                        : 'fill-stone-50 dark:fill-stone-900 stroke-stone-300 dark:stroke-stone-700'}`}
                      strokeWidth="1.5"
                    />
                    {/* Bunk bed icon - two stacked beds */}
                    <rect
                      x="10"
                      y="8"
                      width="35"
                      height="8"
                      rx="1"
                      className={`${hasBunks ? 'fill-orange-400 dark:fill-orange-600' : 'fill-stone-300 dark:fill-stone-700'}`}
                    />
                    <rect
                      x="10"
                      y="8"
                      width="6"
                      height="8"
                      className={`${hasBunks ? 'fill-orange-500 dark:fill-orange-700' : 'fill-stone-400 dark:fill-stone-800'}`}
                    />
                    <rect
                      x="10"
                      y="19"
                      width="35"
                      height="8"
                      rx="1"
                      className={`${hasBunks ? 'fill-orange-400 dark:fill-orange-600' : 'fill-stone-300 dark:fill-stone-700'}`}
                    />
                    <rect
                      x="10"
                      y="19"
                      width="6"
                      height="8"
                      className={`${hasBunks ? 'fill-orange-500 dark:fill-orange-700' : 'fill-stone-400 dark:fill-stone-800'}`}
                    />
                    <text
                      x="27.5"
                      y="43"
                      textAnchor="middle"
                      className={`${hasBunks 
                        ? 'fill-orange-700 dark:fill-orange-300' 
                        : 'fill-stone-500 dark:fill-stone-500'}`}
                      style={{ fontSize: "16px", fontWeight: "bold" }}
                    >
                      {bunkBeds}
                    </text>
                  </g>

                  {/* Total capacity badge - Bottom right */}
                  <rect
                    x={pos.x + roomWidth - 65}
                    y={pos.y + roomHeight - 32}
                    width="55"
                    height="24"
                    rx="12"
                    className="fill-orange-600 group-hover:fill-orange-700 transition-colors"
                  />
                  <text
                    x={pos.x + roomWidth - 37.5}
                    y={pos.y + roomHeight - 15}
                    textAnchor="middle"
                    className="fill-white"
                    style={{ fontSize: "13px", fontWeight: "700" }}
                  >
                    {totalBeds}
                  </text>

                  {/* Small "beds" label under total */}
                  <text
                    x={pos.x + roomWidth / 2}
                    y={pos.y + roomHeight - 8}
                    textAnchor="middle"
                    className="fill-stone-500 dark:fill-stone-500"
                    style={{ fontSize: "10px" }}
                  >
                    Total Beds
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Legend at bottom */}
      <g transform={`translate(${sideMargin}, ${svgHeight - 40})`}>
        <text
          x="0"
          y="0"
          className="fill-stone-600 dark:fill-stone-400"
          style={{ fontSize: "12px", fontWeight: "600" }}
        >
          LEGEND:
        </text>
        
        {/* Single bed legend */}
        <rect
          x="60"
          y="-12"
          width="20"
          height="16"
          rx="3"
          className="fill-blue-400 dark:fill-blue-600"
        />
        <text
          x="85"
          y="0"
          className="fill-stone-700 dark:fill-stone-300"
          style={{ fontSize: "11px" }}
        >
          Single Bed
        </text>

        {/* Bunk bed legend */}
        <rect
          x="160"
          y="-12"
          width="20"
          height="16"
          rx="3"
          className="fill-orange-400 dark:fill-orange-600"
        />
        <text
          x="185"
          y="0"
          className="fill-stone-700 dark:fill-stone-300"
          style={{ fontSize: "11px" }}
        >
          Bunk Bed
        </text>
      </g>
    </svg>
  );
}
