
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, X } from "lucide-react";
import { employeeService } from "@/services/employeeService";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee;
  onSuccess: () => void;
}

export function EmployeeDialog({ open, onOpenChange, employee, onSuccess }: EmployeeDialogProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    address: "",
    phone: "",
    email: "",
    hourly_rate: "",
    hire_date: "",
    status: "active" as "active" | "inactive" | "terminated",
    notes: ""
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [idPhotoPreview, setIdPhotoPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name || "",
        address: employee.address || "",
        phone: employee.phone || "",
        email: employee.email || "",
        hourly_rate: employee.hourly_rate?.toString() || "",
        hire_date: employee.hire_date || "",
        status: employee.status as "active" | "inactive" | "terminated",
        notes: employee.notes || ""
      });
      setPhotoPreview(employee.photo_url || "");
      setIdPhotoPreview(employee.id_photo_url || "");
    } else {
      setFormData({
        full_name: "",
        address: "",
        phone: "",
        email: "",
        hourly_rate: "",
        hire_date: new Date().toISOString().split("T")[0],
        status: "active",
        notes: ""
      });
      setPhotoPreview("");
      setIdPhotoPreview("");
    }
    setPhotoFile(null);
    setIdPhotoFile(null);
  }, [employee, open]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "id") => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "photo") {
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
      } else {
        setIdPhotoFile(file);
        setIdPhotoPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Employee name is required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      let photoUrl = employee?.photo_url || "";
      let idPhotoUrl = employee?.id_photo_url || "";

      const employeeData = {
        full_name: formData.full_name,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        hire_date: formData.hire_date || null,
        status: formData.status,
        notes: formData.notes || null
      };

      let savedEmployee: Employee;

      if (employee) {
        savedEmployee = await employeeService.updateEmployee(employee.id, employeeData);
      } else {
        savedEmployee = await employeeService.createEmployee(employeeData);
      }

      if (photoFile) {
        photoUrl = await employeeService.uploadEmployeePhoto(photoFile, savedEmployee.id, "photo");
        await employeeService.updateEmployee(savedEmployee.id, { photo_url: photoUrl });
      }

      if (idPhotoFile) {
        idPhotoUrl = await employeeService.uploadEmployeePhoto(idPhotoFile, savedEmployee.id, "id");
        await employeeService.updateEmployee(savedEmployee.id, { id_photo_url: idPhotoUrl });
      }

      toast({
        title: employee ? "Employee Updated" : "Employee Created",
        description: `${formData.full_name} has been ${employee ? "updated" : "added"} successfully`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving employee:", error);
      toast({
        title: "Error",
        description: "Failed to save employee. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          <DialogDescription>
            {employee ? "Update employee information" : "Add a new employee to your team"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Employee Photo</Label>
              <div className="flex flex-col items-center gap-2">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Employee" className="w-32 h-32 object-cover rounded-lg border-2" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview("");
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed">
                    <Camera className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(e, "photo")}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ID Photo</Label>
              <div className="flex flex-col items-center gap-2">
                {idPhotoPreview ? (
                  <div className="relative">
                    <img src={idPhotoPreview} alt="ID" className="w-32 h-32 object-cover rounded-lg border-2" />
                    <button
                      type="button"
                      onClick={() => {
                        setIdPhotoFile(null);
                        setIdPhotoPreview("");
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border-2 border-dashed">
                    <Camera className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(e, "id")}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload ID
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="employee@example.com"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State ZIP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="15.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive" | "terminated") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the employee..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : employee ? "Update Employee" : "Add Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
