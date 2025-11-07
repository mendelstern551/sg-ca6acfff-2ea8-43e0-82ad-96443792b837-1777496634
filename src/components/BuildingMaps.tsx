import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildingService, BuildingWithRooms, Room } from "@/services/buildingService";
import { Bed, BedDouble, Home, Image as ImageIcon, Map } from "lucide-react";

function roomTotalBeds(room: Room): number {
  const singles = Number(room.bed_count || 0);
  const bunks = Number(room.bunk_bed_count || 0) * 2;
  return singles + bunks;
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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await buildingService.getBuildingsWithRooms();
        setBuildings(Array.isArray(data) ? data : []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grandTotals = useMemo(() => {
    const singles = buildings.reduce((sum, b) => {
      const rooms = Array.isArray(b.rooms) ? b.rooms : [];
      return sum + rooms.reduce((s, r) => s + Number(r.bed_count || 0), 0);
    }, 0);
    const bunksUnits = buildings.reduce((sum, b) => {
      const rooms = Array.isArray(b.rooms) ? b.rooms : [];
      return sum + rooms.reduce((s, r) => s + Number(r.bunk_bed_count || 0), 0);
    }, 0);
    return {
      buildingsCount: buildings.length,
      roomsCount: buildings.reduce((sum, b) => sum + (Array.isArray(b.rooms) ? b.rooms.length : 0), 0),
      totalBeds: singles + bunksUnits * 2,
      singles,
      bunksUnits
    };
  }, [buildings]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Building Maps
          </CardTitle>
          <CardDescription>Loading building maps and room totals…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-500">Please wait…</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Building Maps
          </CardTitle>
          <CardDescription>Could not load buildings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Building Maps Overview
          </CardTitle>
          <CardDescription>
            Quick snapshot of all buildings with total rooms and beds including bunk beds.
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
              Singles: {grandTotals.singles}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <BedDouble className="h-4 w-4" />
              Bunk Units: {grandTotals.bunksUnits} (Total beds: {grandTotals.totalBeds})
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {buildings.map((b) => {
          const totals = buildingTotals(b);
          return (
            <Card key={b.id} className="overflow-hidden bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{b.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1">
                      Rooms: {totals.totalRooms}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Bed className="h-4 w-4" />
                      {totals.totalSingles}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <BedDouble className="h-4 w-4" />
                      {totals.totalBunksUnits} (Beds {totals.totalBunksUnits * 2})
                    </Badge>
                    <Badge className="gap-1">
                      Total Beds: {totals.totalBeds}
                    </Badge>
                  </div>
                </div>
                {typeof b.target_heating_level === "number" && (
                  <CardDescription className="mt-1">
                    Target heating level: {Number(b.target_heating_level).toFixed(1)}°
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <div className="rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 mb-4">
                  {b.map_image_url ? (
                    <img
                      src={b.map_image_url}
                      alt={`${b.name} map`}
                      className="w-full object-contain max-h-64 bg-slate-50 dark:bg-slate-800"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-40 text-slate-500 bg-slate-50 dark:bg-slate-800">
                      <ImageIcon className="h-6 w-6 mr-2" />
                      No map image available
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Rooms</h4>
                  {(!b.rooms || b.rooms.length === 0) ? (
                    <p className="text-sm text-slate-500">No rooms configured for this building.</p>
                  ) : (
                    <ul className="space-y-1">
                      {(b.rooms as Room[]).map((r) => (
                        <li
                          key={r.id}
                          className="text-sm flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-800/50"
                        >
                          <span className="truncate">{r.name}{r.floor ? ` • ${r.floor}` : ""}</span>
                          <span className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <Bed className="h-4 w-4" /> {Number(r.bed_count || 0)}
                            </span>
                            <span className="flex items-center gap-1">
                              <BedDouble className="h-4 w-4" /> {Number(r.bunk_bed_count || 0)}
                            </span>
                            <Badge variant="secondary">Beds {roomTotalBeds(r)}</Badge>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}