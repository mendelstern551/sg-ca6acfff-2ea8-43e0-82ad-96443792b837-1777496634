import { Room } from "@/services/buildingService";

interface BuildingFloorPlanProps {
  buildingName: string;
  rooms: Room[];
  onRoomClick: (room: Room) => void;
}

export function BuildingFloorPlan({ buildingName, rooms, onRoomClick }: BuildingFloorPlanProps) {
  const isBuilding1 = buildingName.includes("Building #1");

  const leftRooms = rooms.filter(room => room.name.includes("L"));
  const rightRooms = rooms.filter(room => room.name.includes("R"));

  const sortRooms = (roomList: Room[]) => {
    return [...roomList].sort((a, b) => {
      const floorDiff = (b.floor || 0) - (a.floor || 0);
      if (floorDiff !== 0) return floorDiff;
      return a.name.localeCompare(b.name);
    });
  };

  const sortedLeftRooms = sortRooms(leftRooms);
  const sortedRightRooms = sortRooms(rightRooms);

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

  const floors = Object.keys(leftRoomsByFloor).map(Number).sort((a, b) => b - a);

  const roomWidth = 160;
  const roomHeight = 180;
  const roomSpacing = 15;
  const verticalSpacing = 20;
  const headerHeight = 20;
  const sideMargin = 40;
  const centerDividerWidth = 40;

  const maxRoomsPerRow = Math.max(
    ...floors.map(f => Math.max(
      leftRoomsByFloor[f]?.length || 0,
      rightRoomsByFloor[f]?.length || 0
    ))
  );

  const sideWidth = maxRoomsPerRow * roomWidth + (maxRoomsPerRow - 1) * roomSpacing;
  const svgWidth = sideMargin * 2 + sideWidth * 2 + centerDividerWidth;
  const svgHeight = headerHeight + floors.length * (roomHeight + verticalSpacing) + 60;

  const getRoomPosition = (side: "left" | "right", floorIndex: number, roomIndex: number) => {
    const baseX = side === "left"
      ? sideMargin
      : sideMargin + sideWidth + centerDividerWidth;
    const x = baseX + roomIndex * (roomWidth + roomSpacing);
    const y = headerHeight + floorIndex * (roomHeight + verticalSpacing);
    return { x, y };
  };

  const getRoomNumber = (roomName: string) => {
    const match = roomName.match(/([LR]?\d+)/);
    return match ? match[1] : roomName;
  };

  const renderBeds = (x: number, y: number, bedCount: number, bunkBedCount: number) => {
    const beds = [];
    const bedIconWidth = 35;
    const bedIconHeight = 20;
    const bedSpacing = 8;
    const bedsPerRow = 2;
    const totalBeds = bedCount;
    const totalRows = Math.ceil(totalBeds / bedsPerRow);
    const gridWidth = bedsPerRow * bedIconWidth + (bedsPerRow - 1) * bedSpacing;
    const startX = x + (roomWidth - gridWidth) / 2;
    const startY = y + 80;

    for (let i = 0; i < totalBeds; i++) {
      const row = Math.floor(i / bedsPerRow);
      const col = i % bedsPerRow;
      const bedX = startX + col * (bedIconWidth + bedSpacing);
      const bedY = startY + row * (bedIconHeight + bedSpacing);

      beds.push(
        <g key={`bed-${i}`}>
          <rect
            x={bedX}
            y={bedY}
            width={bedIconWidth}
            height={bedIconHeight}
            rx="3"
            className="fill-blue-100 dark:fill-blue-900/40 stroke-blue-400 dark:stroke-blue-600"
            strokeWidth="2"
          />
          <rect
            x={bedX + 2}
            y={bedY + 2}
            width={10}
            height={bedIconHeight - 4}
            className="fill-blue-400 dark:fill-blue-600"
          />
          <line
            x1={bedX + 14}
            y1={bedY + 5}
            x2={bedX + bedIconWidth - 4}
            y2={bedY + 5}
            className="stroke-blue-300 dark:stroke-blue-700"
            strokeWidth="1"
          />
          <line
            x1={bedX + 14}
            y1={bedY + 10}
            x2={bedX + bedIconWidth - 4}
            y2={bedY + 10}
            className="stroke-blue-300 dark:stroke-blue-700"
            strokeWidth="1"
          />
          <line
            x1={bedX + 14}
            y1={bedY + 15}
            x2={bedX + bedIconWidth - 4}
            y2={bedY + 15}
            className="stroke-blue-300 dark:stroke-blue-700"
            strokeWidth="1"
          />
        </g>
      );
    }

    return beds;
  };

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-auto"
      style={{ minHeight: "400px", maxHeight: "1000px" }}
    >
      <rect
        width={svgWidth}
        height={svgHeight}
        fill="#f8fafc"
        className="dark:fill-stone-950"
      />

      <line
        x1={sideMargin + sideWidth + centerDividerWidth / 2}
        y1={headerHeight - 10}
        x2={sideMargin + sideWidth + centerDividerWidth / 2}
        y2={svgHeight - 40}
        stroke="#e5e7eb"
        strokeWidth="3"
        className="dark:stroke-stone-700"
        strokeDasharray="6 6"
      />

      {floors.map((floor, floorIndex) => {
        const leftFloorRooms = leftRoomsByFloor[floor] || [];
        const rightFloorRooms = rightRoomsByFloor[floor] || [];

        return (
          <g key={`floor-${floor}`}>
            {leftFloorRooms.map((room, roomIndex) => {
              const pos = getRoomPosition("left", floorIndex, roomIndex);
              const roomNumber = getRoomNumber(room.name);
              const singleBeds = room.bed_count || 0;
              const bunkBeds = room.bunk_bed_count || 0;
              const totalBeds = singleBeds + bunkBeds * 2;

              return (
                <g
                  key={room.id}
                  onClick={() => onRoomClick(room)}
                  className="cursor-pointer group"
                >
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={roomWidth}
                    height={roomHeight}
                    rx="12"
                    className="fill-white dark:fill-stone-900 stroke-stone-300 dark:stroke-stone-700 transition-all group-hover:stroke-blue-500 dark:group-hover:stroke-blue-400 group-hover:stroke-3"
                    strokeWidth="2"
                  />
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={roomWidth}
                    height={roomHeight}
                    rx="12"
                    className="fill-blue-500 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
                  />
                  <text
                    x={pos.x + roomWidth / 2}
                    y={pos.y + 45}
                    textAnchor="middle"
                    className="fill-stone-900 dark:fill-stone-100 font-bold"
                    style={{ fontSize: "32px", fontWeight: "900" }}
                  >
                    {roomNumber}
                  </text>
                  {renderBeds(pos.x, pos.y, singleBeds, bunkBeds)}
                  <rect
                    x={pos.x + roomWidth / 2 - 30}
                    y={pos.y + roomHeight - 35}
                    width="60"
                    height="26"
                    rx="13"
                    className="fill-blue-600 group-hover:fill-blue-700 transition-colors"
                  />
                  <text
                    x={pos.x + roomWidth / 2}
                    y={pos.y + roomHeight - 16}
                    textAnchor="middle"
                    className="fill-white"
                    style={{ fontSize: "13px", fontWeight: "800" }}
                  >
                    {totalBeds} BEDS
                  </text>
                </g>
              );
            })}

            {rightFloorRooms.map((room, roomIndex) => {
              const pos = getRoomPosition("right", floorIndex, roomIndex);
              const roomNumber = getRoomNumber(room.name);
              const singleBeds = room.bed_count || 0;
              const bunkBeds = room.bunk_bed_count || 0;
              const totalBeds = singleBeds + bunkBeds * 2;

              return (
                <g
                  key={room.id}
                  onClick={() => onRoomClick(room)}
                  className="cursor-pointer group"
                >
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={roomWidth}
                    height={roomHeight}
                    rx="12"
                    className="fill-white dark:fill-stone-900 stroke-stone-300 dark:stroke-stone-700 transition-all group-hover:stroke-orange-500 dark:group-hover:stroke-orange-400 group-hover:stroke-3"
                    strokeWidth="2"
                  />
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={roomWidth}
                    height={roomHeight}
                    rx="12"
                    className="fill-orange-500 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
                  />
                  <text
                    x={pos.x + roomWidth / 2}
                    y={pos.y + 45}
                    textAnchor="middle"
                    className="fill-stone-900 dark:fill-stone-100 font-bold"
                    style={{ fontSize: "32px", fontWeight: "900" }}
                  >
                    {roomNumber}
                  </text>
                  {renderBeds(pos.x, pos.y, singleBeds, bunkBeds)}
                  <rect
                    x={pos.x + roomWidth / 2 - 30}
                    y={pos.y + roomHeight - 35}
                    width="60"
                    height="26"
                    rx="13"
                    className="fill-orange-600 group-hover:fill-orange-700 transition-colors"
                  />
                  <text
                    x={pos.x + roomWidth / 2}
                    y={pos.y + roomHeight - 16}
                    textAnchor="middle"
                    className="fill-white"
                    style={{ fontSize: "13px", fontWeight: "800" }}
                  >
                    {totalBeds} BEDS
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      <g transform={`translate(${svgWidth / 2 - 100}, ${svgHeight - 25})`}>
        <text
          x="0"
          y="0"
          className="fill-stone-600 dark:fill-stone-400"
          style={{ fontSize: "12px", fontWeight: "700" }}
        >
          LEGEND:
        </text>
        <rect
          x="70"
          y="-12"
          width="30"
          height="18"
          rx="3"
          className="fill-blue-100 dark:fill-blue-900/40 stroke-blue-400 dark:stroke-blue-600"
          strokeWidth="2"
        />
        <rect
          x="72"
          y="-10"
          width="8"
          height="14"
          className="fill-blue-400 dark:fill-blue-600"
        />
        <text
          x="105"
          y="0"
          className="fill-stone-700 dark:fill-stone-300"
          style={{ fontSize: "11px", fontWeight: "600" }}
        >
          = Single Bed
        </text>
      </g>
    </svg>
  );
}