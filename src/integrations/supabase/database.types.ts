 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          additional_cleaning_fee: number
          amount_paid: number
          balance_due: number
          base_rate: number
          booking_type: string
          cleaning_fee: number
          confirmed: boolean
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          custom_price: number | null
          deposit_amount: number
          discount_percent: number | null
          end_date: string
          id: string
          name: string
          notes: string | null
          number_of_guests: number
          payment_status: string
          per_person_rate: number
          start_date: string
          total_cost: number
          updated_at: string | null
        }
        Insert: {
          additional_cleaning_fee?: number
          amount_paid?: number
          balance_due?: number
          base_rate?: number
          booking_type: string
          cleaning_fee?: number
          confirmed?: boolean
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          custom_price?: number | null
          deposit_amount?: number
          discount_percent?: number | null
          end_date: string
          id?: string
          name: string
          notes?: string | null
          number_of_guests?: number
          payment_status?: string
          per_person_rate?: number
          start_date: string
          total_cost?: number
          updated_at?: string | null
        }
        Update: {
          additional_cleaning_fee?: number
          amount_paid?: number
          balance_due?: number
          base_rate?: number
          booking_type?: string
          cleaning_fee?: number
          confirmed?: boolean
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          custom_price?: number | null
          deposit_amount?: number
          discount_percent?: number | null
          end_date?: string
          id?: string
          name?: string
          notes?: string | null
          number_of_guests?: number
          payment_status?: string
          per_person_rate?: number
          start_date?: string
          total_cost?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          booking_id: string | null
          category: string
          created_at: string | null
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: string
          proof_urls: string[] | null
          receipt_urls: string[] | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          category: string
          created_at?: string | null
          description: string
          expense_date: string
          id?: string
          notes?: string | null
          payment_method: string
          proof_urls?: string[] | null
          receipt_urls?: string[] | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          category?: string
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string
          proof_urls?: string[] | null
          receipt_urls?: string[] | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_due: number
          base_price: number
          booking_id: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          deposit_amount: number
          event_date_end: string
          event_date_start: string
          id: string
          invoice_number: string
          notes: string | null
          number_of_guests: number
          number_of_rooms: number
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          balance_due: number
          base_price: number
          booking_id: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          deposit_amount: number
          event_date_end: string
          event_date_start: string
          id?: string
          invoice_number: string
          notes?: string | null
          number_of_guests: number
          number_of_rooms: number
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          balance_due?: number
          base_price?: number
          booking_id?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          deposit_amount?: number
          event_date_end?: string
          event_date_start?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          number_of_guests?: number
          number_of_rooms?: number
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_compensation: {
        Row: {
          amount: number
          booking_id: string | null
          calculation_basis: string | null
          compensation_type: string
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          paid: boolean
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          calculation_basis?: string | null
          compensation_type: string
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          paid?: boolean
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          calculation_basis?: string | null
          compensation_type?: string
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          paid?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_compensation_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_payments: {
        Row: {
          amount: number
          compensation_id: string
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          compensation_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          compensation_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_payments_compensation_id_fkey"
            columns: ["compensation_id"]
            isOneToOne: false
            referencedRelation: "manager_compensation"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
