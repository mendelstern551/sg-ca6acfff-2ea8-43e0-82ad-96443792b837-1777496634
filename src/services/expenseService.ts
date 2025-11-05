import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];

export interface Expense extends ExpenseRow {}

export const expenseService = {
  async getAllExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getExpensesByBooking(bookingId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("booking_id", bookingId)
      .order("expense_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createExpense(expense: Omit<ExpenseInsert, "id" | "created_at" | "updated_at">): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .insert([expense])
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  },

  async updateExpense(id: string, updates: ExpenseUpdate): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async searchExpenses(searchTerm: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .or(`description.ilike.%${searchTerm}%,vendor.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      .order("expense_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getExpensesByAmountRange(minAmount: number, maxAmount: number): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .gte("amount", minAmount)
      .lte("amount", maxAmount)
      .order("expense_date", { ascending: false });

    if (error) throw error;
    return data || [];
  }
};