
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type IssueInsert = Database["public"]["Tables"]["issues"]["Insert"];
type Issue = Database["public"]["Tables"]["issues"]["Row"];

export type IssueWithRelations = Issue & {
  rooms: { name: string; building_id: string } | null;
  employees: { full_name: string } | null;
};

export const issueService = {
  async createIssue(issueData: IssueInsert): Promise<Issue> {
    const { data, error } = await supabase
      .from("issues")
      .insert(issueData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getIssues(filters: { status?: string } = {}): Promise<IssueWithRelations[]> {
    let query = supabase
      .from("issues")
      .select(`
        *,
        rooms ( name, building_id ),
        employees:reported_by_id ( full_name )
      `);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching issues:", error);
      throw error;
    }
    
    return data as IssueWithRelations[];
  },

  async updateIssueStatus(issueId: string, status: string): Promise<Issue> {
    const { data, error } = await supabase
      .from("issues")
      .update({ status })
      .eq("id", issueId)
      .select()
      .single();

    if (error) {
      console.error("Error updating issue status:", error);
      throw error;
    }
    return data;
  },

  async getOpenIssues(): Promise<(Issue & { rooms: { name: string | null, building_id: string | null } | null, employees: { full_name: string | null } | null })[]> {
    const { data, error } = await supabase
      .from("issues")
      .select(`
        *,
        rooms ( name, building_id ),
        employees:reported_by_id ( full_name )
      `)
      .in('status', ['new', 'open'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching open issues:", error);
      throw error;
    }
    return data || [];
  },
};
