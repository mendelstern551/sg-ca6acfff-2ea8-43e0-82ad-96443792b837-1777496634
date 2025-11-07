
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type EmployeeInsert = Database["public"]["Tables"]["employees"]["Insert"];
type EmployeeUpdate = Database["public"]["Tables"]["employees"]["Update"];

export const employeeService = {
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
  },

  async getActiveEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("status", "active")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching active employees:", error);
      throw error;
    }
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching employee:", error);
      throw error;
    }
  },

  async createEmployee(employee: EmployeeInsert): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from("employees")
        .insert(employee)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
  },

  async updateEmployee(id: string, updates: EmployeeUpdate): Promise<Employee> {
    try {
      const { data, error } = await supabase
        .from("employees")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  },

  async deleteEmployee(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }
  },

  async uploadEmployeePhoto(file: File, employeeId: string, type: "photo" | "id"): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${employeeId}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `employee_${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("employee_documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("employee_documents")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading employee photo:", error);
      throw error;
    }
  }
};
