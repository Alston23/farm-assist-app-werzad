
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
      ai_conversations: {
        Row: {
          content: string
          conversation_type: string | null
          created_at: string | null
          id: string
          image_url: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          listing_id: string
          listing_type: string
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          listing_id: string
          listing_type: string
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          listing_type?: string
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crops: {
        Row: {
          avoid: string | null
          category: string
          companions: string | null
          created_at: string | null
          days_to_maturity: string | null
          diseases: string | null
          hardiness: string | null
          harvest: string | null
          id: string
          name: string
          notes: string | null
          pests: string | null
          plant_spacing: string | null
          planting_depth: string | null
          row_spacing: string | null
          scientific_name: string | null
          soil_ph: string | null
          soil_type: string | null
          storage: string | null
          sunlight: string | null
          temperature: string | null
          updated_at: string | null
          user_id: string
          water: string | null
        }
        Insert: {
          avoid?: string | null
          category: string
          companions?: string | null
          created_at?: string | null
          days_to_maturity?: string | null
          diseases?: string | null
          hardiness?: string | null
          harvest?: string | null
          id?: string
          name: string
          notes?: string | null
          pests?: string | null
          plant_spacing?: string | null
          planting_depth?: string | null
          row_spacing?: string | null
          scientific_name?: string | null
          soil_ph?: string | null
          soil_type?: string | null
          storage?: string | null
          sunlight?: string | null
          temperature?: string | null
          updated_at?: string | null
          user_id: string
          water?: string | null
        }
        Update: {
          avoid?: string | null
          category?: string
          companions?: string | null
          created_at?: string | null
          days_to_maturity?: string | null
          diseases?: string | null
          hardiness?: string | null
          harvest?: string | null
          id?: string
          name?: string
          notes?: string | null
          pests?: string | null
          plant_spacing?: string | null
          planting_depth?: string | null
          row_spacing?: string | null
          scientific_name?: string | null
          soil_ph?: string | null
          soil_type?: string | null
          storage?: string | null
          sunlight?: string | null
          temperature?: string | null
          updated_at?: string | null
          user_id?: string
          water?: string | null
        }
        Relationships: []
      }
      customer_marketplace_listings: {
        Row: {
          availability_status: string
          category: string
          created_at: string | null
          delivery_available: boolean | null
          description: string
          id: string
          images: string[] | null
          pickup_location: string | null
          price: number
          product_name: string
          quantity: number
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability_status?: string
          category: string
          created_at?: string | null
          delivery_available?: boolean | null
          description: string
          id?: string
          images?: string[] | null
          pickup_location?: string | null
          price: number
          product_name: string
          quantity: number
          unit: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability_status?: string
          category?: string
          created_at?: string | null
          delivery_available?: boolean | null
          description?: string
          id?: string
          images?: string[] | null
          pickup_location?: string | null
          price?: number
          product_name?: string
          quantity?: number
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          brand: string | null
          created_at: string | null
          hours: number | null
          id: string
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          type: string
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          hours?: number | null
          id?: string
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          type: string
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          hours?: number | null
          id?: string
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      equipment_marketplace_listings: {
        Row: {
          condition: string | null
          created_at: string | null
          description: string
          equipment_name: string
          equipment_type: string
          hours_used: number | null
          id: string
          images: string[] | null
          listing_type: string
          location: string | null
          manufacturer: string | null
          model: string | null
          price: number | null
          status: string
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          description: string
          equipment_name: string
          equipment_type: string
          hours_used?: number | null
          id?: string
          images?: string[] | null
          listing_type: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          price?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          description?: string
          equipment_name?: string
          equipment_type?: string
          hours_used?: number | null
          id?: string
          images?: string[] | null
          listing_type?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          price?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      equipment_services: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string
          equipment_id: string
          hours_at_service: number | null
          id: string
          notes: string | null
          performed_by: string | null
          service_date: string
          service_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description: string
          equipment_id: string
          hours_at_service?: number | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          service_date: string
          service_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string
          equipment_id?: string
          hours_at_service?: number | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          service_date?: string
          service_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_services_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          updated_at: string | null
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          expense_date: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string | null
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          updated_at?: string | null
          user_id?: string
          vendor?: string | null
        }
        Relationships: []
      }
      fertilizers: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          quantity: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          quantity: number
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          quantity?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fields_beds: {
        Row: {
          area_unit: string
          area_value: number
          created_at: string | null
          id: string
          irrigation_type: string
          name: string
          soil_type: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area_unit: string
          area_value: number
          created_at?: string | null
          id?: string
          irrigation_type: string
          name: string
          soil_type: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area_unit?: string
          area_value?: number
          created_at?: string | null
          id?: string
          irrigation_type?: string
          name?: string
          soil_type?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      harvests: {
        Row: {
          created_at: string | null
          crop_name: string
          id: string
          loss: number | null
          planted_amount: number | null
          storage_location_id: string | null
          unit: string
          updated_at: string | null
          user_id: string
          yield_amount: number
        }
        Insert: {
          created_at?: string | null
          crop_name: string
          id?: string
          loss?: number | null
          planted_amount?: number | null
          storage_location_id?: string | null
          unit: string
          updated_at?: string | null
          user_id: string
          yield_amount: number
        }
        Update: {
          created_at?: string | null
          crop_name?: string
          id?: string
          loss?: number | null
          planted_amount?: number | null
          storage_location_id?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string
          yield_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "harvests_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      income: {
        Row: {
          amount: number
          created_at: string | null
          crop_name: string
          customer_name: string | null
          id: string
          notes: string | null
          payment_method: string | null
          price_per_unit: number | null
          quantity: number | null
          sale_date: string
          sales_channel: string
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          crop_name: string
          customer_name?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          price_per_unit?: number | null
          quantity?: number | null
          sale_date: string
          sales_channel: string
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          crop_name?: string
          customer_name?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          price_per_unit?: number | null
          quantity?: number | null
          sale_date?: string
          sales_channel?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketplace_messages: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          listing_type: string
          message: string
          read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          listing_type: string
          message: string
          read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          listing_type?: string
          message?: string
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      packaging: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          quantity: number
          reorder_threshold: number | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          quantity: number
          reorder_threshold?: number | null
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          quantity?: number
          reorder_threshold?: number | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plantings: {
        Row: {
          created_at: string | null
          crop_id: string
          crop_name: string
          days_to_maturity: number
          field_bed_id: string
          harvest_date: string
          id: string
          planting_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          crop_id: string
          crop_name: string
          days_to_maturity: number
          field_bed_id: string
          harvest_date: string
          id?: string
          planting_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          crop_id?: string
          crop_name?: string
          days_to_maturity?: number
          field_bed_id?: string
          harvest_date?: string
          id?: string
          planting_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plantings_field_bed_id_fkey"
            columns: ["field_bed_id"]
            isOneToOne: false
            referencedRelation: "fields_beds"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          is_pro: boolean
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_pro?: boolean
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_pro?: boolean
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount_sold: number
          created_at: string | null
          crop_name: string
          customer: string | null
          id: string
          notes: string | null
          payment_method: string | null
          price: number | null
          storage_location_id: string | null
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_sold: number
          created_at?: string | null
          crop_name: string
          customer?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          price?: number | null
          storage_location_id?: string | null
          unit: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_sold?: number
          created_at?: string | null
          crop_name?: string
          customer?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          price?: number | null
          storage_location_id?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      seeds: {
        Row: {
          created_at: string
          id: string
          name: string
          quantity: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          quantity: number
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          listing_id: string
          listing_type: string
          rater_id: string
          rating: number
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          listing_id: string
          listing_type: string
          rater_id: string
          rating: number
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string
          listing_type?: string
          rater_id?: string
          rating?: number
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_ratings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          capacity: number
          created_at: string
          id: string
          notes: string | null
          type: string
          unit: string
          updated_at: string
          used: number | null
          user_id: string
        }
        Insert: {
          capacity: number
          created_at?: string
          id?: string
          notes?: string | null
          type: string
          unit: string
          updated_at?: string
          used?: number | null
          user_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          notes?: string | null
          type?: string
          unit?: string
          updated_at?: string
          used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          plan_type: string
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string
          started_at?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          notes: string | null
          planting_id: string | null
          priority: string | null
          task_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          notes?: string | null
          planting_id?: string | null
          priority?: string | null
          task_type: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          planting_id?: string | null
          priority?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_planting_id_fkey"
            columns: ["planting_id"]
            isOneToOne: false
            referencedRelation: "plantings"
            referencedColumns: ["id"]
          },
        ]
      }
      transplants: {
        Row: {
          created_at: string | null
          crop_name: string
          id: string
          notes: string | null
          quantity: number
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          crop_name: string
          id?: string
          notes?: string | null
          quantity: number
          unit?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          crop_name?: string
          id?: string
          notes?: string | null
          quantity?: number
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_seller_average_rating: {
        Args: { seller_uuid: string }
        Returns: {
          avg_rating: number
          review_count: number
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
