
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Save, RefreshCw, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildingService, BuildingWithRooms } from "@/services/buildingService";
import { supabase } from "@/integrations/supabase/client";

export function AdminBuildingSettings() {
  const [buildings, setBuildings] = useState<BuildingWithRooms[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [heatingLevels, setHeatingLevels] = useState<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const data = await buildingService.getBuildingsWithRooms();
      setBuildings(data);
      
      const levels: Record<string, number> = {};
      data.forEach(building => {
        levels[building.id] = building.target_heating_level || 20;
      });
      setHeatingLevels(levels);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load buildings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHeatingChange = (buildingId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setHeatingLevels(prev => ({ ...prev, [buildingId]: numValue }));
    }
  };

  const saveHeatingLevels = async () => {
    try {
      setSaving(true);
      
      for (const [buildingId, level] of Object.entries(heatingLevels)) {
        const { error } = await supabase
          .from("buildings")
          .update({ target_heating_level: level })
          .eq("id", buildingId);
        
        if (error) throw error;
      }
      
      toast({
        title: "Settings Saved",
        description: "Heating levels updated successfully"
      });
      
      await loadBuildings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save heating levels",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const seedBuildings = async () => {
    try {
      setSeeding(true);
      
      const response = await fetch("/api/seed-buildings", {
        method: "POST"
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message
        });
        await loadBuildings();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed buildings",
        variant: "destructive"
      });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Building Settings</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Building Heating Settings
          </CardTitle>
          <CardDescription>
            Configure target heating levels for each building. These will be displayed to employees during room cleaning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {buildings.map((building) => (
            <div key={building.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">{building.name}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {building.rooms?.length || 0} rooms
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`heating-${building.id}`} className="text-sm">
                  Target:
                </Label>
                <Input
                  id={`heating-${building.id}`}
                  type="number"
                  step="0.5"
                  min="15"
                  max="25"
                  value={heatingLevels[building.id] || 20}
                  onChange={(e) => handleHeatingChange(building.id, e.target.value)}
                  className="w-20"
                />
                <span className="text-sm font-medium">°C</span>
              </div>
            </div>
          ))}
          
          <Button
            onClick={saveHeatingLevels}
            disabled={saving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save All Heating Levels"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-600" />
            Database Management
          </CardTitle>
          <CardDescription>
            Seed the database with all 5 buildings and their room configurations based on the floor plan images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-semibold text-sm mb-2">What will be seeded:</h4>
            <ul className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
              <li>• Building #1 (661) - 10 rooms with mixed bed types</li>
              <li>• Building #3 - 6 rooms with various configurations</li>
              <li>• Building #4 - 6 rooms with bunk bed focus</li>
              <li>• Building #5 Basement - 4 rooms</li>
              <li>• Building #5 Upper Floor - 6 rooms</li>
            </ul>
          </div>
          
          <Button
            onClick={seedBuildings}
            disabled={seeding}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${seeding ? "animate-spin" : ""}`} />
            {seeding ? "Seeding Buildings..." : "Seed All Buildings & Rooms"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
