import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildingService, BuildingWithRooms, Room } from "@/services/buildingService";
import { Bed, BedDouble, Home, AlertCircle, CheckCircle2, Clock, Thermometer, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BuildingFloorPlan } from "./BuildingFloorPlan";

function roomTotalBeds(room: Room): number {
  const singles = Number(room.bed_count || 0);
  const bunks = Number(room.bunk_bed_count || 0);
  return singles + bunks * 2;
}

function buildingTotals(building: BuildingWithRooms) {
  const rooms = Array.isArray(building.rooms) ? building.rooms : [];
  const totalRooms = rooms.length;
  const totalSingles = rooms.reduce((sum, r) => sum + Number(r.bed_count || 0), 0);
  const totalBunksUnits = rooms.reduce((sum, r) => sum + Number(r.bunk_bed_count || 0), 0);
  const totalBeds = totalSingles + totalBunksUnits * 2;
  return { totalRooms, totalSingles, totalBunksUnits, totalBeds };
}

export function BuildingMaps() {
  const [buildings, setBuildings] = useState<BuildingWithRooms[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingWithRooms | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const data = await buildingService.getBuildingsWithRooms();
      
      // Combine Building #1 Left Side and Right Side into a single entry
      const processedBuildings: BuildingWithRooms[] = [];
      let building1Left: BuildingWithRooms | null = null;
      let building1Right: BuildingWithRooms | null = null;
      
      for (const building of data) {
        if (building.name === "Building #1 - Left Side") {
          building1Left = building;
        } else if (building.name === "Building #1 - Right Side") {
          building1Right = building;
        } else {
          processedBuildings.push(building);
        }
      }
      
      // If we have both sides of Building #1, combine them
      if (building1Left && building1Right) {
        const combinedBuilding: BuildingWithRooms = {
          ...building1Left,
          name: "Building #1",
          rooms: [
            ...(Array.isArray(building1Left.rooms) ? building1Left.rooms : []),
            ...(Array.isArray(building1Right.rooms) ? building1Right.rooms : [])
          ]
        };
        processedBuildings.unshift(combinedBuilding);
      } else if (building1Left) {
        processedBuildings.unshift({ ...building1Left, name: "Building #1" });
      } else if (building1Right) {
        processedBuildings.unshift({ ...building1Right, name: "Building #1" });
      }
      
      setBuildings(processedBuildings);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (room: Room, building: BuildingWithRooms) => {
    setSelectedRoom(room);
    setSelectedBuilding(building);
  };

  const closeDialog = () => {
    setSelectedRoom(null);
    setSelectedBuilding(null);
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Building Maps & Room Management
          </CardTitle>
          <CardDescription>Loading building maps and room details…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-500">Please wait…</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Building Maps & Room Management
          </CardTitle>
          <CardDescription>Could not load buildings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const grandTotals = buildings.reduce((acc, b) => {
    const totals = buildingTotals(b);
    return {
      buildingsCount: acc.buildingsCount + 1,
      roomsCount: acc.roomsCount + totals.totalRooms,
      totalBeds: acc.totalBeds + totals.totalBeds,
      singles: acc.singles + totals.totalSingles,
      bunksUnits: acc.bunksUnits + totals.totalBunksUnits
    };
  }, { buildingsCount: 0, roomsCount: 0, totalBeds: 0, singles: 0, bunksUnits: 0 });

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Building Maps & Room Management
          </CardTitle>
          <CardDescription>
            View all buildings, rooms, and bed counts. Click on any room to see details and start cleaning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary" className="gap-1">
              <Home className="h-4 w-4" />
              {grandTotals.buildingsCount} Buildings
            </Badge>
            <Badge variant="secondary" className="gap-1">
              Rooms: {grandTotals.roomsCount}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Bed className="h-4 w-4" />
              Single Beds: {grandTotals.singles}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <BedDouble className="h-4 w-4" />
              Bunk Beds: {grandTotals.bunksUnits}
            </Badge>
            <Badge className="gap-1 bg-orange-600">
              Total Beds: {grandTotals.totalBeds}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {buildings.map((building) => {
          const totals = buildingTotals(building);
          const rooms = Array.isArray(building.rooms) ? building.rooms : [];
          
          return (
            <Card key={building.id} className="overflow-hidden bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{building.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline" className="gap-1">
                        <Home className="h-3 w-3" />
                        {totals.totalRooms} Rooms
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Bed className="h-3 w-3" />
                        {totals.totalSingles} Single
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <BedDouble className="h-3 w-3" />
                        {totals.totalBunksUnits} Bunk
                      </Badge>
                      <Badge className="bg-orange-600 gap-1">
                        {totals.totalBeds} Total Beds
                      </Badge>
                    </div>
                  </div>
                  {typeof building.target_heating_level === "number" && (
                    <Badge variant="secondary" className="gap-1">
                      <Thermometer className="h-3 w-3" />
                      {Number(building.target_heating_level).toFixed(0)}°C
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {rooms.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4 text-center">No rooms configured</p>
                ) : (
                  <div className="space-y-4">
                    {/* Custom SVG Floor Plan */}
                    <div className="bg-white dark:bg-stone-950 rounded-lg border border-slate-200 dark:border-slate-700 p-4 overflow-hidden">
                      <BuildingFloorPlan
                        buildingName={building.name}
                        rooms={rooms}
                        onRoomClick={(room) => handleRoomClick(room, building)}
                      />
                    </div>

                    {/* Room Statistics Summary */}
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {rooms.map((room) => {
                        const totalBeds = roomTotalBeds(room);
                        const hasBunks = (room.bunk_bed_count || 0) > 0;
                        
                        return (
                          <div
                            key={room.id}
                            onClick={() => handleRoomClick(room, building)}
                            className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-stone-900"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-stone-900 dark:text-stone-100">{room.name}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Floor {room.floor ?? "N/A"}</p>
                              </div>
                              <Badge className="bg-orange-600 text-xs">
                                {totalBeds} beds
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-3 text-sm">
                              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                <Bed className="h-4 w-4" />
                                <span>{room.bed_count || 0}</span>
                              </div>
                              {hasBunks && (
                                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                  <BedDouble className="h-4 w-4" />
                                  <span>{room.bunk_bed_count || 0}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedRoom} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-orange-600" />
              {selectedRoom?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedBuilding?.name} • Floor {selectedRoom?.floor ?? "N/A"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Single Beds</div>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Bed className="h-5 w-5 text-blue-600" />
                    {Number(selectedRoom.bed_count || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Bunk Beds</div>
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <BedDouble className="h-5 w-5 text-orange-600" />
                    {Number(selectedRoom.bunk_bed_count || 0)}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Capacity</div>
                  <div className="flex items-center gap-2 text-xl font-bold text-orange-600">
                    {roomTotalBeds(selectedRoom)} beds
                  </div>
                </div>
              </div>

              {selectedBuilding?.target_heating_level && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-sm">
                    <Thermometer className="h-4 w-4 text-amber-600" />
                    <span className="text-slate-700 dark:text-slate-300">
                      Target Heating: <strong>{Number(selectedBuilding.target_heating_level).toFixed(1)}°C</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <CheckCircle2 className="h-4 w-4" />
                  Cleaning Checklist
                </h4>
                <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
                  <li>✓ Remove linen and towels</li>
                  <li>✓ Clean floor</li>
                  <li>✓ Check heating level</li>
                  <li>✓ Take out garbage</li>
                  <li>✓ Put new linen</li>
                  <li>✓ Clean toilet</li>
                  <li>✓ Check for leaks</li>
                  <li>✓ Check all lights</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                  Employees can start cleaning this room from the Time Tracking page
                </p>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => {
                    closeDialog();
                    toast({
                      title: "Navigate to Time Tracking",
                      description: "Go to the Time Tracking page to start cleaning this room",
                    });
                  }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Go to Time Tracking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
