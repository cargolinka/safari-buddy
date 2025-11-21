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
          client_id: string
          created_at: string
          destination: string
          driver_id: string | null
          dropoff_date: string
          id: string
          pickup_date: string
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at: string
          vehicle_id: string
          with_driver: boolean
        }
        Insert: {
          client_id: string
          created_at?: string
          destination: string
          driver_id?: string | null
          dropoff_date: string
          id?: string
          pickup_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount: number
          updated_at?: string
          vehicle_id: string
          with_driver?: boolean
        }
        Update: {
          client_id?: string
          created_at?: string
          destination?: string
          driver_id?: string | null
          dropoff_date?: string
          id?: string
          pickup_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number
          updated_at?: string
          vehicle_id?: string
          with_driver?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_directors: {
        Row: {
          company_id: string
          created_at: string | null
          full_name: string
          id: string
          id_number: string
          position: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          full_name: string
          id?: string
          id_number: string
          position?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          full_name?: string
          id?: string
          id_number?: string
          position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_directors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_documents: {
        Row: {
          company_id: string
          document_type: string
          file_path: string
          id: string
          uploaded_at: string | null
          verified_at: string | null
          verified_by_admin: boolean | null
        }
        Insert: {
          company_id: string
          document_type: string
          file_path: string
          id?: string
          uploaded_at?: string | null
          verified_at?: string | null
          verified_by_admin?: boolean | null
        }
        Update: {
          company_id?: string
          document_type?: string
          file_path?: string
          id?: string
          uploaded_at?: string | null
          verified_at?: string | null
          verified_by_admin?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          entity_id: string
          entity_type: string
          expiry_date: string | null
          file_path: string
          id: string
          uploaded_at: string
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type"]
          entity_id: string
          entity_type: string
          expiry_date?: string | null
          file_path: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          entity_id?: string
          entity_type?: string
          expiry_date?: string | null
          file_path?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      driver_vehicle_assignments: {
        Row: {
          driver_id: string
          fleet_owner_id: string
          id: string
          invited_at: string | null
          permissions: Json | null
          responded_at: string | null
          status: string | null
          vehicle_id: string
        }
        Insert: {
          driver_id: string
          fleet_owner_id: string
          id?: string
          invited_at?: string | null
          permissions?: Json | null
          responded_at?: string | null
          status?: string | null
          vehicle_id: string
        }
        Update: {
          driver_id?: string
          fleet_owner_id?: string
          id?: string
          invited_at?: string | null
          permissions?: Json | null
          responded_at?: string | null
          status?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          id: string
          id_number: string | null
          is_compliant: boolean | null
          is_vehicle_owner: boolean | null
          license_expiry: string
          license_number: string
          ntsa_badge_number: string | null
          ntsa_verified: boolean | null
          status: Database["public"]["Enums"]["driver_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          id_number?: string | null
          is_compliant?: boolean | null
          is_vehicle_owner?: boolean | null
          license_expiry: string
          license_number: string
          ntsa_badge_number?: string | null
          ntsa_verified?: boolean | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          id_number?: string | null
          is_compliant?: boolean | null
          is_vehicle_owner?: boolean | null
          license_expiry?: string
          license_number?: string
          ntsa_badge_number?: string | null
          ntsa_verified?: boolean | null
          status?: Database["public"]["Enums"]["driver_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          company_pin: string | null
          company_registration_number: string | null
          created_at: string
          entity_type: string | null
          full_name: string
          id: string
          is_fleet_owner: boolean | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          company_pin?: string | null
          company_registration_number?: string | null
          created_at?: string
          entity_type?: string | null
          full_name: string
          id: string
          is_fleet_owner?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          company_pin?: string | null
          company_registration_number?: string | null
          created_at?: string
          entity_type?: string | null
          full_name?: string
          id?: string
          is_fleet_owner?: boolean | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_categories: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string
          id: string
          image_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          image_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          capacity: number
          created_at: string
          daily_rate: number
          features: string[] | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          inspection_expiry: string
          insurance_expiry: string
          is_compliant: boolean | null
          model: string
          owner_id: string
          road_license_expiry: string
          status: Database["public"]["Enums"]["vehicle_status"]
          tsv_psv_licence_expiry: string | null
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at: string
          year: number
        }
        Insert: {
          capacity: number
          created_at?: string
          daily_rate: number
          features?: string[] | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          inspection_expiry: string
          insurance_expiry: string
          is_compliant?: boolean | null
          model: string
          owner_id: string
          road_license_expiry: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          tsv_psv_licence_expiry?: string | null
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
          year: number
        }
        Update: {
          capacity?: number
          created_at?: string
          daily_rate?: number
          features?: string[] | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          inspection_expiry?: string
          insurance_expiry?: string
          is_compliant?: boolean | null
          model?: string
          owner_id?: string
          road_license_expiry?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          tsv_psv_licence_expiry?: string | null
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "owner"
        | "driver"
        | "client_individual"
        | "client_corporate"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      document_type:
        | "insurance"
        | "inspection"
        | "road_license"
        | "logbook"
        | "driver_license"
        | "ntsa_verification"
        | "national_id"
      driver_status: "available" | "on_trip" | "unavailable"
      vehicle_status: "available" | "booked" | "maintenance" | "unavailable"
      vehicle_type: "land_cruiser" | "tour_van" | "bus" | "saloon"
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
    Enums: {
      app_role: [
        "admin",
        "owner",
        "driver",
        "client_individual",
        "client_corporate",
      ],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      document_type: [
        "insurance",
        "inspection",
        "road_license",
        "logbook",
        "driver_license",
        "ntsa_verification",
        "national_id",
      ],
      driver_status: ["available", "on_trip", "unavailable"],
      vehicle_status: ["available", "booked", "maintenance", "unavailable"],
      vehicle_type: ["land_cruiser", "tour_van", "bus", "saloon"],
    },
  },
} as const
