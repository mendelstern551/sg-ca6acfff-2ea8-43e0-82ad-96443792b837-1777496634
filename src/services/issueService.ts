
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type IssueInsert = Database["public"]["Tables"]["issues"]["Insert"];
type Issue = Database["public"]["Tables"]["issues"]["Row"];

export const issueService = {
  async createIssue(issue: IssueInsert): Promise<Issue> {
    const { data, error } = await supabase
      .from("issues")
      .insert(issue)
      .select()
      .single();

    if (error) {
      console.error("Error creating issue:", error);
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
        employees:reported_by_employee_id ( full_name )
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
