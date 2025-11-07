
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Contract = Database["public"]["Tables"]["contracts"]["Row"];
type ContractInsert = Database["public"]["Tables"]["contracts"]["Insert"];

export const contractService = {
  async uploadContract(
    bookingId: string,
    file: File,
    notes?: string
  ): Promise<Contract> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${bookingId}/${Date.now()}_${file.name}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .insert([
          {
            booking_id: bookingId,
            file_name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            file_type: file.type,
            notes: notes || null,
          },
        ])
        .select()
        .single();

      if (contractError) throw contractError;

      return contractData;
    } catch (error) {
      console.error("Error uploading contract:", error);
      throw error;
    }
  },

  async getContractsByBookingId(bookingId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("booking_id", bookingId)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async downloadContract(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from("contracts")
      .download(filePath);

    if (error) throw error;
    return data;
  },

  async deleteContract(contractId: string, filePath: string): Promise<void> {
    const { error: storageError } = await supabase.storage
      .from("contracts")
      .remove([filePath]);

    if (storageError) throw storageError;

    const { error: dbError } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId);

    if (dbError) throw dbError;
  },

  async updateContractNotes(
    contractId: string,
    notes: string
  ): Promise<Contract> {
    const { data, error } = await supabase
      .from("contracts")
      .update({ notes })
      .eq("id", contractId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  },
};
