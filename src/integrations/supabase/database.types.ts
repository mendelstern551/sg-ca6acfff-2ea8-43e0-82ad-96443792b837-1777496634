 
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
          number_of_rooms: number
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
          number_of_rooms?: number
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
          number_of_rooms?: number
          payment_status?: string
          per_person_rate?: number
          start_date?: string
          total_cost?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      buildings: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: string
          map_image_url: string | null
          name: string
          target_heating_level: number | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          map_image_url?: string | null
          name: string
          target_heating_level?: number | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          map_image_url?: string | null
          name?: string
          target_heating_level?: number | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          booking_id: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          notes: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          notes?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          notes?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          booking_id: string | null
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          full_name: string
          hire_date: string | null
          hourly_rate: number | null
          id: string
          id_photo_url: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          id_photo_url?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          id_photo_url?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          email_sent_at: string | null
          email_sent_to: string | null
          email_status: string | null
          event_date_end: string
          event_date_start: string
          id: string
          invoice_number: string
          last_reminder_sent_at: string | null
          notes: string | null
          number_of_guests: number
          number_of_rooms: number
          reminder_count: number | null
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
          email_sent_at?: string | null
          email_sent_to?: string | null
          email_status?: string | null
          event_date_end: string
          event_date_start: string
          id?: string
          invoice_number: string
          last_reminder_sent_at?: string | null
          notes?: string | null
          number_of_guests: number
          number_of_rooms: number
          reminder_count?: number | null
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
          email_sent_at?: string | null
          email_sent_to?: string | null
          email_status?: string | null
          event_date_end?: string
          event_date_start?: string
          id?: string
          invoice_number?: string
          last_reminder_sent_at?: string | null
          notes?: string | null
          number_of_guests?: number
          number_of_rooms?: number
          reminder_count?: number | null
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
      issues: {
        Row: {
          created_at: string | null
          description: string
          id: string
          reported_by_employee_id: string | null
          resolved_at: string | null
          room_id: string | null
          status: string
          task_log_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          reported_by_employee_id?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: string
          task_log_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          reported_by_employee_id?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: string
          task_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_reported_by_employee_id_fkey"
            columns: ["reported_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_task_log_id_fkey"
            columns: ["task_log_id"]
            isOneToOne: false
            referencedRelation: "task_logs"
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
      payment_reminders: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          reminder_type: string
          sent_at: string | null
          sent_to: string
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reminder_type: string
          sent_at?: string | null
          sent_to: string
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reminder_type?: string
          sent_at?: string | null
          sent_to?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          auto_generated: boolean | null
          booking_id: string | null
          category: string
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          metadata: Json | null
          priority: string
          recurring: boolean | null
          recurring_interval: string | null
          snoozed_until: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          auto_generated?: boolean | null
          booking_id?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          metadata?: Json | null
          priority?: string
          recurring?: boolean | null
          recurring_interval?: string | null
          snoozed_until?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          auto_generated?: boolean | null
          booking_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          metadata?: Json | null
          priority?: string
          recurring?: boolean | null
          recurring_interval?: string | null
          snoozed_until?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          bed_count: number | null
          building_id: string | null
          bunk_bed_count: number | null
          created_at: string | null
          floor: string | null
          id: string
          map_image_url: string | null
          name: string
        }
        Insert: {
          bed_count?: number | null
          building_id?: string | null
          bunk_bed_count?: number | null
          created_at?: string | null
          floor?: string | null
          id?: string
          map_image_url?: string | null
          name: string
        }
        Update: {
          bed_count?: number | null
          building_id?: string | null
          bunk_bed_count?: number | null
          created_at?: string | null
          floor?: string | null
          id?: string
          map_image_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      task_logs: {
        Row: {
          building_id: string
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          employee_id: string
          id: string
          notes: string | null
          room_id: string | null
          started_at: string
          task_type_id: string
          time_entry_id: string | null
        }
        Insert: {
          building_id: string
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          employee_id: string
          id?: string
          notes?: string | null
          room_id?: string | null
          started_at: string
          task_type_id: string
          time_entry_id?: string | null
        }
        Update: {
          building_id?: string
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          employee_id?: string
          id?: string
          notes?: string | null
          room_id?: string | null
          started_at?: string
          task_type_id?: string
          time_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_logs_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_logs_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_logs_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          building_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          building_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_types_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string | null
          employee_id: string
          entry_type: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          created_at?: string | null
          employee_id: string
          entry_type?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          employee_id?: string
          entry_type?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
