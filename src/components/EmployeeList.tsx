
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, Phone, Mail, MapPin, DollarSign } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Employee = Database["public"]["Tables"]["employees"]["Row"];

interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
}

export function EmployeeList({ employees, onEdit, onDelete }: EmployeeListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (employeeId: string) => {
    if (window.confirm("Are you sure you want to delete this employee? This will also delete all their time entries and task logs.")) {
      setDeletingId(employeeId);
      try {
        await onDelete(employeeId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "terminated":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <p className="text-lg font-medium mb-2">No employees yet</p>
        <p className="text-sm">Add your first employee to get started</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {employees.map((employee) => (
        <Card key={employee.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={employee.photo_url || undefined} alt={employee.full_name} />
                  <AvatarFallback>{getInitials(employee.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{employee.full_name}</CardTitle>
                  <Badge className={`mt-1 ${getStatusColor(employee.status)}`}>
                    {employee.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(employee)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(employee.id)}
                  disabled={deletingId === employee.id}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {employee.phone && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Phone className="h-4 w-4" />
                <span>{employee.phone}</span>
              </div>
            )}
            {employee.email && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Mail className="h-4 w-4" />
                <span className="truncate">{employee.email}</span>
              </div>
            )}
            {employee.address && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{employee.address}</span>
              </div>
            )}
            {employee.hourly_rate && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <DollarSign className="h-4 w-4" />
                <span>${Number(employee.hourly_rate).toFixed(2)}/hour</span>
              </div>
            )}
            {employee.hire_date && (
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                Hired: {format(new Date(employee.hire_date), "MMM d, yyyy")}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
