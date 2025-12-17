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
      alert_history: {
        Row: {
          alert_type: string
          created_at: string | null
          days_until_expiry: number | null
          document_id: string | null
          id: string
          sent_at: string | null
          sent_to: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          days_until_expiry?: number | null
          document_id?: string | null
          id?: string
          sent_at?: string | null
          sent_to: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          days_until_expiry?: number | null
          document_id?: string | null
          id?: string
          sent_at?: string | null
          sent_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_requests: {
        Row: {
          budget_range_max: number | null
          budget_range_min: number | null
          client_id: string
          created_at: string
          description: string
          destination: string
          expires_at: string | null
          id: string
          origin: string
          passengers: number
          pickup_date: string
          pickup_time: string
          return_date: string | null
          return_time: string | null
          status: string
          title: string
          updated_at: string
          vehicle_type: string | null
          with_driver: boolean
        }
        Insert: {
          budget_range_max?: number | null
          budget_range_min?: number | null
          client_id: string
          created_at?: string
          description: string
          destination: string
          expires_at?: string | null
          id?: string
          origin: string
          passengers: number
          pickup_date: string
          pickup_time: string
          return_date?: string | null
          return_time?: string | null
          status?: string
          title: string
          updated_at?: string
          vehicle_type?: string | null
          with_driver?: boolean
        }
        Update: {
          budget_range_max?: number | null
          budget_range_min?: number | null
          client_id?: string
          created_at?: string
          description?: string
          destination?: string
          expires_at?: string | null
          id?: string
          origin?: string
          passengers?: number
          pickup_date?: string
          pickup_time?: string
          return_date?: string | null
          return_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          vehicle_type?: string | null
          with_driver?: boolean
        }
        Relationships: []
      }
      bids: {
        Row: {
          bid_amount: number
          bid_request_id: string
          bidder_id: string
          created_at: string
          driver_id: string | null
          id: string
          message: string | null
          status: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          bid_amount: number
          bid_request_id: string
          bidder_id: string
          created_at?: string
          driver_id?: string | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          bid_amount?: number
          bid_request_id?: string
          bidder_id?: string
          created_at?: string
          driver_id?: string | null
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_bid_request_id_fkey"
            columns: ["bid_request_id"]
            isOneToOne: false
            referencedRelation: "bid_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          post_count: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          post_count?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          post_count?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          canonical_url: string | null
          category_id: string | null
          content: string
          created_at: string
          excerpt: string
          featured_image_url: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          og_image_url: string | null
          published_at: string | null
          reading_time: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content: string
          created_at?: string
          excerpt: string
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          og_image_url?: string | null
          published_at?: string | null
          reading_time?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
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
      countries: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      driver_requirements: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_mandatory: boolean
          name: string
          requirement_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          name: string
          requirement_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          name?: string
          requirement_type?: string
          updated_at?: string
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
      empty_legs: {
        Row: {
          created_at: string
          departure_date: string
          departure_time: string
          destination: string
          discounted_rate: number
          driver_id: string
          id: string
          notes: string | null
          origin: string
          seats_available: number
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          departure_date: string
          departure_time: string
          destination: string
          discounted_rate: number
          driver_id: string
          id?: string
          notes?: string | null
          origin: string
          seats_available: number
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          departure_date?: string
          departure_time?: string
          destination?: string
          discounted_rate?: number
          driver_id?: string
          id?: string
          notes?: string | null
          origin?: string
          seats_available?: number
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empty_legs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empty_legs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          button_link: string
          button_text: string
          created_at: string
          description: string
          display_order: number
          id: string
          image_position_x: number
          image_position_y: number
          image_url: string
          is_active: boolean
          secondary_button_link: string | null
          secondary_button_text: string | null
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          button_link: string
          button_text: string
          created_at?: string
          description: string
          display_order?: number
          id?: string
          image_position_x?: number
          image_position_y?: number
          image_url: string
          is_active?: boolean
          secondary_button_link?: string | null
          secondary_button_text?: string | null
          subtitle: string
          title: string
          updated_at?: string
        }
        Update: {
          button_link?: string
          button_text?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          image_position_x?: number
          image_position_y?: number
          image_url?: string
          is_active?: boolean
          secondary_button_link?: string | null
          secondary_button_text?: string | null
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          company_name: string | null
          company_pin: string | null
          company_registration_number: string | null
          country: string | null
          created_at: string
          email: string | null
          entity_type: string | null
          full_name: string
          id: string
          is_fleet_owner: boolean | null
          phone: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_notes: string | null
          suspension_reason: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string | null
          company_name?: string | null
          company_pin?: string | null
          company_registration_number?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          entity_type?: string | null
          full_name: string
          id: string
          is_fleet_owner?: boolean | null
          phone?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_notes?: string | null
          suspension_reason?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string | null
          company_name?: string | null
          company_pin?: string | null
          company_registration_number?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          entity_type?: string | null
          full_name?: string
          id?: string
          is_fleet_owner?: boolean | null
          phone?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_notes?: string | null
          suspension_reason?: string | null
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_categories: {
        Row: {
          created_at: string
          description: string | null
          icon_name: string
          id: string
          image_url: string | null
          is_active: boolean
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
          is_active?: boolean
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
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicle_subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          icon_name: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          icon_name?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
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
          min_advance_booking_days: number
          model: string
          owner_id: string
          registration_number: string | null
          road_license_expiry: string
          status: Database["public"]["Enums"]["vehicle_status"]
          subcategory_id: string | null
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
          min_advance_booking_days?: number
          model: string
          owner_id: string
          registration_number?: string | null
          road_license_expiry: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          subcategory_id?: string | null
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
          min_advance_booking_days?: number
          model?: string
          owner_id?: string
          registration_number?: string | null
          road_license_expiry?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          subcategory_id?: string | null
          tsv_psv_licence_expiry?: string | null
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "vehicle_subcategories"
            referencedColumns: ["id"]
          },
        ]
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
      is_user_suspended: { Args: { user_id: string }; Returns: boolean }
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
