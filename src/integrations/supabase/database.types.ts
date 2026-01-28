 
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
          custom_price: number | null
          deposit_amount: number | null
          discount_percent: number | null
          end_date: string
          id: string
          name: string
          notes: string | null
          number_of_guests: number | null
          number_of_rooms: number | null
          payment_status: string | null
          per_person_rate: number | null
          recurring: Json | null
          start_date: string
          total_cost: number | null
          updated_at: string | null
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
          custom_price?: number | null
          deposit_amount?: number | null
          discount_percent?: number | null
          end_date: string
          id?: string
          name: string
          notes?: string | null
          number_of_guests?: number | null
          number_of_rooms?: number | null
          payment_status?: string | null
          per_person_rate?: number | null
          recurring?: Json | null
          start_date: string
          total_cost?: number | null
          updated_at?: string | null
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
          custom_price?: number | null
          deposit_amount?: number | null
          discount_percent?: number | null
          end_date?: string
          id?: string
          name?: string
          notes?: string | null
          number_of_guests?: number | null
          number_of_rooms?: number | null
          payment_status?: string | null
          per_person_rate?: number | null
          recurring?: Json | null
          start_date?: string
          total_cost?: number | null
          updated_at?: string | null
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
          floor_plan_url: string | null
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
          floor_plan_url?: string | null
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
          floor_plan_url?: string | null
          id?: string
          map_image_url?: string | null
          name?: string
          target_heating_level?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_emails: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          body: string
          booking_id: string
          client_email: string
          client_name: string
          created_at: string | null
          email_type: string
          id: string
          scheduled_date: string | null
          sent_date: string | null
          status: string
          subject: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          body: string
          booking_id: string
          client_email: string
          client_name: string
          created_at?: string | null
          email_type: string
          id?: string
          scheduled_date?: string | null
          sent_date?: string | null
          status: string
          subject: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          body?: string
          booking_id?: string
          client_email?: string
          client_name?: string
          created_at?: string | null
          email_type?: string
          id?: string
          scheduled_date?: string | null
          sent_date?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_emails_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          booking_id: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          notes?: string | null
          updated_at?: string | null
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
          email_type: string | null
          error_message: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          booking_id?: string | null
          email_type?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          booking_id?: string | null
          email_type?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
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
          {
            foreignKeyName: "email_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
          is_active: boolean | null
          job_title: string | null
          notes: string | null
          pay_rate: number | null
          phone: string | null
          photo_url: string | null
          role: string | null
          status: string | null
          updated_at: string | null
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
          is_active?: boolean | null
          job_title?: string | null
          notes?: string | null
          pay_rate?: number | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
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
          is_active?: boolean | null
          job_title?: string | null
          notes?: string | null
          pay_rate?: number | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
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
          expense_date: string
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
          expense_date: string
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
          expense_date?: string
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
      feedback_submissions: {
        Row: {
          bonus_credit_amount: number | null
          bonus_credit_issued: boolean | null
          booking_id: string
          comments: string | null
          created_at: string | null
          id: string
          rating: number
          submission_date: string | null
          updated_at: string | null
        }
        Insert: {
          bonus_credit_amount?: number | null
          bonus_credit_issued?: boolean | null
          booking_id: string
          comments?: string | null
          created_at?: string | null
          id?: string
          rating: number
          submission_date?: string | null
          updated_at?: string | null
        }
        Update: {
          bonus_credit_amount?: number | null
          bonus_credit_issued?: boolean | null
          booking_id?: string
          comments?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          submission_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_submissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      id: {
        Row: {
          bonus_credit_amount: number | null
          created_at: string
          credit_issued: number | null
          id: string
          rating: number
        }
        Insert: {
          bonus_credit_amount?: number | null
          created_at: string
          credit_issued?: number | null
          id?: string
          rating: number
        }
        Update: {
          bonus_credit_amount?: number | null
          created_at?: string
          credit_issued?: number | null
          id?: string
          rating?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          balance_due: number | null
          base_price: number | null
          booking_id: string | null
          client_email: string | null
          client_name: string
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
          line_items: Json | null
          notes: string | null
          number_of_guests: number | null
          number_of_rooms: number | null
          paid_date: string | null
          reminder_count: number | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          balance_due?: number | null
          base_price?: number | null
          booking_id?: string | null
          client_email?: string | null
          client_name: string
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
          line_items?: Json | null
          notes?: string | null
          number_of_guests?: number | null
          number_of_rooms?: number | null
          paid_date?: string | null
          reminder_count?: number | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          balance_due?: number | null
          base_price?: number | null
          booking_id?: string | null
          client_email?: string | null
          client_name?: string
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
          line_items?: Json | null
          notes?: string | null
          number_of_guests?: number | null
          number_of_rooms?: number | null
          paid_date?: string | null
          reminder_count?: number | null
          status?: string | null
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
          assigned_to: string | null
          building_id: string | null
          created_at: string | null
          description: string | null
          id: string
          notes: string | null
          priority: string | null
          reported_by: string | null
          resolved_at: string | null
          room_id: string | null
          status: string | null
          task_log_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          building_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: string | null
          task_log_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          building_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: string | null
          task_log_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
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
          created_at: string | null
          due_date: string | null
          id: string
          manager_id: string | null
          notes: string | null
          paid: boolean | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          paid?: boolean | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          manager_id?: string | null
          notes?: string | null
          paid?: boolean | null
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
          {
            foreignKeyName: "manager_compensation_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          manager_id: string
          notes: string | null
          payment_date: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          manager_id: string
          notes?: string | null
          payment_date: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          manager_id?: string
          notes?: string | null
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_payments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminders: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          invoice_id: string
          notes: string | null
          reminder_type: string
          sent_to: string
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          reminder_type: string
          sent_to: string
          status: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          reminder_type?: string
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
          booking_id: string | null
          created_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          transaction_id?: string | null
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
          assigned_to: string | null
          auto_generated: boolean | null
          booking_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          metadata: Json | null
          priority: string | null
          recurring: boolean | null
          recurring_interval: string | null
          related_id: string | null
          related_type: string | null
          snoozed_until: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          auto_generated?: boolean | null
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          recurring?: boolean | null
          recurring_interval?: string | null
          related_id?: string | null
          related_type?: string | null
          snoozed_until?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          auto_generated?: boolean | null
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          metadata?: Json | null
          priority?: string | null
          recurring?: boolean | null
          recurring_interval?: string | null
          related_id?: string | null
          related_type?: string | null
          snoozed_until?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      room_cleaning_sessions: {
        Row: {
          clock_in_time: string | null
          clock_out_time: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          notes: string | null
          room_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          room_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          clock_in_time?: string | null
          clock_out_time?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          room_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_cleaning_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_cleaning_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_tasks: {
        Row: {
          created_at: string | null
          id: string
          room_id: string | null
          task_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id?: string | null
          task_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string | null
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
          floor: number | null
          id: string
          name: string
          room_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bed_count?: number | null
          building_id?: string | null
          bunk_bed_count?: number | null
          capacity?: number | null
          created_at?: string | null
          floor?: number | null
          id?: string
          name: string
          room_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bed_count?: number | null
          building_id?: string | null
          bunk_bed_count?: number | null
          capacity?: number | null
          created_at?: string | null
          floor?: number | null
          id?: string
          name?: string
          room_number?: string | null
          status?: string | null
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
      task_completions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          issue_reported: boolean | null
          notes: string | null
          session_id: string | null
          task_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          issue_reported?: boolean | null
          notes?: string | null
          session_id?: string | null
          task_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          issue_reported?: boolean | null
          notes?: string | null
          session_id?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "room_cleaning_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "room_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_logs: {
        Row: {
          booking_id: string | null
          building_id: string | null
          completed_at: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          notes: string | null
          room_id: string | null
          started_at: string | null
          task_type_id: string | null
          time_entry_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          building_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          room_id?: string | null
          started_at?: string | null
          task_type_id?: string | null
          time_entry_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          building_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          room_id?: string | null
          started_at?: string | null
          task_type_id?: string | null
          time_entry_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
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
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string | null
          employee_id: string | null
          entry_type: string | null
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
          employee_id?: string | null
          entry_type?: string | null
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
          employee_id?: string | null
          entry_type?: string | null
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
      get_monthly_manager_salary: {
        Args: { p_manager_id: string; p_month: string }
        Returns: {
          employee_id: string
          employee_name: string
          pay_rate: number
          salary: number
          total_hours: number
        }[]
      }
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
