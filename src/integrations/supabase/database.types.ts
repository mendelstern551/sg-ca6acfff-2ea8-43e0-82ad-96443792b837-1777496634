 
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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          additional_cleaning_fee: number | null
          amount_paid: number | null
          balance_due: number | null
          base_rate: number | null
          booking_type: string | null
          building_id: string | null
          cleaning_fee: number | null
          confirmed: boolean | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          custom_price: boolean | null
          deposit_amount: number | null
          discount_percent: number | null
          end_date: string
          id: string
          name: string | null
          notes: string | null
          number_of_guests: number | null
          number_of_rooms: number | null
          payment_status: string | null
          per_person_rate: number | null
          start_date: string
          status: string | null
          total_cost: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_cleaning_fee?: number | null
          amount_paid?: number | null
          balance_due?: number | null
          base_rate?: number | null
          booking_type?: string | null
          building_id?: string | null
          cleaning_fee?: number | null
          confirmed?: boolean | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          custom_price?: boolean | null
          deposit_amount?: number | null
          discount_percent?: number | null
          end_date: string
          id?: string
          name?: string | null
          notes?: string | null
          number_of_guests?: number | null
          number_of_rooms?: number | null
          payment_status?: string | null
          per_person_rate?: number | null
          start_date: string
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_cleaning_fee?: number | null
          amount_paid?: number | null
          balance_due?: number | null
          base_rate?: number | null
          booking_type?: string | null
          building_id?: string | null
          cleaning_fee?: number | null
          confirmed?: boolean | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          custom_price?: boolean | null
          deposit_amount?: number | null
          discount_percent?: number | null
          end_date?: string
          id?: string
          name?: string | null
          notes?: string | null
          number_of_guests?: number | null
          number_of_rooms?: number | null
          payment_status?: string | null
          per_person_rate?: number | null
          start_date?: string
          status?: string | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
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
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          map_image_url?: string | null
          name: string
          target_heating_level?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          map_image_url?: string | null
          name?: string
          target_heating_level?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          booking_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string | null
          id: string
          notes: string | null
          uploaded_at: string | null
        }
        Insert: {
          booking_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type?: string | null
          id?: string
          notes?: string | null
          uploaded_at?: string | null
        }
        Update: {
          booking_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string | null
          id?: string
          notes?: string | null
          uploaded_at?: string | null
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
          body: string | null
          booking_id: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string | null
          recipient_name: string | null
          sent_at: string | null
          sent_to: string
          status: string
          subject: string | null
        }
        Insert: {
          body?: string | null
          booking_id?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string | null
          recipient_name?: string | null
          sent_at?: string | null
          sent_to: string
          status: string
          subject?: string | null
        }
        Update: {
          body?: string | null
          booking_id?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string | null
          recipient_name?: string | null
          sent_at?: string | null
          sent_to?: string
          status?: string
          subject?: string | null
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
          pay_rate: number | null
          phone: string | null
          photo_url: string | null
          role: string | null
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
          pay_rate?: number | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
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
          pay_rate?: number | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
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
          category: string | null
          created_at: string | null
          description: string
          expense_date: string | null
          id: string
          notes: string | null
          payment_method: string | null
          proof_urls: string[] | null
          receipt_url: string | null
          receipt_urls: string[] | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          description: string
          expense_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          proof_urls?: string[] | null
          receipt_url?: string | null
          receipt_urls?: string[] | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string
          expense_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          proof_urls?: string[] | null
          receipt_url?: string | null
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
          amount: number
          balance_due: number | null
          base_price: number | null
          booking_id: string
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          deposit_amount: number | null
          due_date: string | null
          email_sent_at: string | null
          email_status: string | null
          event_date_end: string | null
          event_date_start: string | null
          id: string
          invoice_number: string
          issued_date: string | null
          last_reminder_sent_at: string | null
          notes: string | null
          number_of_guests: number | null
          number_of_rooms: number | null
          reminder_count: number | null
          status: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          balance_due?: number | null
          base_price?: number | null
          booking_id: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          due_date?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          event_date_end?: string | null
          event_date_start?: string | null
          id?: string
          invoice_number: string
          issued_date?: string | null
          last_reminder_sent_at?: string | null
          notes?: string | null
          number_of_guests?: number | null
          number_of_rooms?: number | null
          reminder_count?: number | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          balance_due?: number | null
          base_price?: number | null
          booking_id?: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          due_date?: string | null
          email_sent_at?: string | null
          email_status?: string | null
          event_date_end?: string | null
          event_date_start?: string | null
          id?: string
          invoice_number?: string
          issued_date?: string | null
          last_reminder_sent_at?: string | null
          notes?: string | null
          number_of_guests?: number | null
          number_of_rooms?: number | null
          reminder_count?: number | null
          status?: string
          total_amount?: number | null
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
          building_id: string
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          reported_by_id: string | null
          resolved_at: string | null
          room_id: string | null
          status: string
          task_log_id: string | null
          title: string
        }
        Insert: {
          building_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          reported_by_id?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: string
          task_log_id?: string | null
          title: string
        }
        Update: {
          building_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          reported_by_id?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: string
          task_log_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_reported_by_id_fkey"
            columns: ["reported_by_id"]
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
          base_salary: number
          calculation_logic: string | null
          commission_rate: number
          created_at: string | null
          effective_date: string
          id: string
        }
        Insert: {
          base_salary?: number
          calculation_logic?: string | null
          commission_rate?: number
          created_at?: string | null
          effective_date: string
          id?: string
        }
        Update: {
          base_salary?: number
          calculation_logic?: string | null
          commission_rate?: number
          created_at?: string | null
          effective_date?: string
          id?: string
        }
        Relationships: []
      }
      manager_payments: {
        Row: {
          commission_earned: number | null
          compensation_id: string | null
          created_at: string | null
          id: string
          payment_date: string | null
          payment_period_end: string
          payment_period_start: string
          salary_paid: number | null
          status: string | null
          total_booking_revenue: number | null
          total_payment: number | null
        }
        Insert: {
          commission_earned?: number | null
          compensation_id?: string | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_period_end: string
          payment_period_start: string
          salary_paid?: number | null
          status?: string | null
          total_booking_revenue?: number | null
          total_payment?: number | null
        }
        Update: {
          commission_earned?: number | null
          compensation_id?: string | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_period_end?: string
          payment_period_start?: string
          salary_paid?: number | null
          status?: string | null
          total_booking_revenue?: number | null
          total_payment?: number | null
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
          id: string
          invoice_id: string | null
          notes: string | null
          reminder_type: string
          sent_at: string | null
          sent_to: string | null
          status: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reminder_type: string
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reminder_type?: string
          sent_at?: string | null
          sent_to?: string | null
          status?: string | null
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
          invoice_id: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      reminders: {
        Row: {
          auto_generated: boolean | null
          booking_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          priority: string | null
          snoozed_until: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_generated?: boolean | null
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: string | null
          snoozed_until?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_generated?: boolean | null
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string | null
          snoozed_until?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
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
          capacity: number | null
          created_at: string | null
          description: string | null
          floor: number | null
          id: string
          map_image_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          bed_count?: number | null
          building_id?: string | null
          bunk_bed_count?: number | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          floor?: number | null
          id?: string
          map_image_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          bed_count?: number | null
          building_id?: string | null
          bunk_bed_count?: number | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          floor?: number | null
          id?: string
          map_image_url?: string | null
          name?: string
          updated_at?: string | null
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
          building_id: string | null
          completed_at: string | null
          duration_minutes: number | null
          employee_id: string | null
          id: string
          notes: string | null
          room_id: string | null
          started_at: string | null
          task_type_id: string | null
          time_entry_id: string | null
        }
        Insert: {
          building_id?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          room_id?: string | null
          started_at?: string | null
          task_type_id?: string | null
          time_entry_id?: string | null
        }
        Update: {
          building_id?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          room_id?: string | null
          started_at?: string | null
          task_type_id?: string | null
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
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string | null
          employee_id: string
          entry_type: string
          id: string
          location_lat: number | null
          location_lon: number | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          created_at?: string | null
          employee_id: string
          entry_type?: string
          id?: string
          location_lat?: number | null
          location_lon?: number | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          employee_id?: string
          entry_type?: string
          id?: string
          location_lat?: number | null
          location_lon?: number | null
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
