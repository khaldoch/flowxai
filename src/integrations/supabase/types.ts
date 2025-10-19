export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      assistants: {
        Row: {
          assistant_id: string
          client_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          structured_data: Json | null
        }
        Insert: {
          assistant_id: string
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          structured_data?: Json | null
        }
        Update: {
          assistant_id?: string
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          structured_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assistants_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      call_reports: {
        Row: {
          agent: string
          call_id: string
          call_type: string
          client_id: string | null
          cost: number
          created_at: string
          duration_minutes: number
          ended_at: string
          from_number: string
          id: string
          recording_url: string | null
          sentiment: string | null
          started_at: string
          status: string
          structured_data: Json | null
          summary: string | null
          to_number: string
          transcript: string | null
        }
        Insert: {
          agent: string
          call_id: string
          call_type?: string
          client_id?: string | null
          cost: number
          created_at?: string
          duration_minutes: number
          ended_at: string
          from_number: string
          id?: string
          recording_url?: string | null
          sentiment?: string | null
          started_at: string
          status: string
          structured_data?: Json | null
          summary?: string | null
          to_number: string
          transcript?: string | null
        }
        Update: {
          agent?: string
          call_id?: string
          call_type?: string
          client_id?: string | null
          cost?: number
          created_at?: string
          duration_minutes?: number
          ended_at?: string
          from_number?: string
          id?: string
          recording_url?: string | null
          sentiment?: string | null
          started_at?: string
          status?: string
          structured_data?: Json | null
          summary?: string | null
          to_number?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_calls: {
        Row: {
          call_id: string | null
          campaign_id: string | null
          created_at: string
          id: string
          phone_number: string
          status: string | null
          updated_at: string
          variable_values: Json | null
        }
        Insert: {
          call_id?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          phone_number: string
          status?: string | null
          updated_at?: string
          variable_values?: Json | null
        }
        Update: {
          call_id?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          phone_number?: string
          status?: string | null
          updated_at?: string
          variable_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_calls_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          assistant_id: string | null
          client_id: string | null
          completed_calls: number | null
          created_at: string
          csv_file_name: string | null
          failed_calls: number | null
          id: string
          name: string
          phone_number_id: string | null
          status: string | null
          total_numbers: number | null
          updated_at: string
        }
        Insert: {
          assistant_id?: string | null
          client_id?: string | null
          completed_calls?: number | null
          created_at?: string
          csv_file_name?: string | null
          failed_calls?: number | null
          id?: string
          name: string
          phone_number_id?: string | null
          status?: string | null
          total_numbers?: number | null
          updated_at?: string
        }
        Update: {
          assistant_id?: string | null
          client_id?: string | null
          completed_calls?: number | null
          created_at?: string
          csv_file_name?: string | null
          failed_calls?: number | null
          id?: string
          name?: string
          phone_number_id?: string | null
          status?: string | null
          total_numbers?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_phone_number_id_fkey"
            columns: ["phone_number_id"]
            isOneToOne: false
            referencedRelation: "phone_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      phone_numbers: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          phone_number: string
          phone_number_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          phone_number: string
          phone_number_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone_number?: string
          phone_number_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          client_id: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          role: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          role?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
