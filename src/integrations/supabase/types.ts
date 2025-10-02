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
      admin_link_claims: {
        Row: {
          claimed_at: string | null
          link_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          link_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          link_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_link_claims_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "admin_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_link_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_links: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          dream_points_amount: number | null
          id: string
          soul_amount: number | null
          uses_remaining: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          dream_points_amount?: number | null
          id?: string
          soul_amount?: number | null
          uses_remaining?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          dream_points_amount?: number | null
          id?: string
          soul_amount?: number | null
          uses_remaining?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      combat_history: {
        Row: {
          created_at: string | null
          dream_points_gained: number | null
          id: string
          is_dream: boolean | null
          nail_id: string | null
          soul_gained: number | null
          user_id: string | null
          won: boolean
        }
        Insert: {
          created_at?: string | null
          dream_points_gained?: number | null
          id?: string
          is_dream?: boolean | null
          nail_id?: string | null
          soul_gained?: number | null
          user_id?: string | null
          won: boolean
        }
        Update: {
          created_at?: string | null
          dream_points_gained?: number | null
          id?: string
          is_dream?: boolean | null
          nail_id?: string | null
          soul_gained?: number | null
          user_id?: string | null
          won?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "combat_history_nail_id_fkey"
            columns: ["nail_id"]
            isOneToOne: false
            referencedRelation: "nails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nails: {
        Row: {
          base_damage: number
          created_at: string | null
          dream_sell_value: number
          id: string
          name: string
          name_ru: string
          order_index: number
          rarity: Database["public"]["Enums"]["nail_rarity"]
          sell_value: number
        }
        Insert: {
          base_damage: number
          created_at?: string | null
          dream_sell_value: number
          id?: string
          name: string
          name_ru: string
          order_index: number
          rarity: Database["public"]["Enums"]["nail_rarity"]
          sell_value: number
        }
        Update: {
          base_damage?: number
          created_at?: string | null
          dream_sell_value?: number
          id?: string
          name?: string
          name_ru?: string
          order_index?: number
          rarity?: Database["public"]["Enums"]["nail_rarity"]
          sell_value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          coins: number | null
          created_at: string | null
          dream_points: number | null
          id: string
          language: string | null
          masks: number | null
          nickname: string
          soul: number | null
        }
        Insert: {
          coins?: number | null
          created_at?: string | null
          dream_points?: number | null
          id: string
          language?: string | null
          masks?: number | null
          nickname: string
          soul?: number | null
        }
        Update: {
          coins?: number | null
          created_at?: string | null
          dream_points?: number | null
          id?: string
          language?: string | null
          masks?: number | null
          nickname?: string
          soul?: number | null
        }
        Relationships: []
      }
      trade_links: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          code: string
          created_at: string | null
          from_user_id: string | null
          id: string
          user_nail_id: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          code: string
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          user_nail_id?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          code?: string
          created_at?: string | null
          from_user_id?: string | null
          id?: string
          user_nail_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_links_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_links_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_links_user_nail_id_fkey"
            columns: ["user_nail_id"]
            isOneToOne: false
            referencedRelation: "user_nails"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nails: {
        Row: {
          acquired_at: string | null
          id: string
          is_dream: boolean | null
          nail_id: string | null
          user_id: string | null
        }
        Insert: {
          acquired_at?: string | null
          id?: string
          is_dream?: boolean | null
          nail_id?: string | null
          user_id?: string | null
        }
        Update: {
          acquired_at?: string | null
          id?: string
          is_dream?: boolean | null
          nail_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_nails_nail_id_fkey"
            columns: ["nail_id"]
            isOneToOne: false
            referencedRelation: "nails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_nails_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
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
      app_role: "admin" | "user"
      nail_rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
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
      app_role: ["admin", "user"],
      nail_rarity: ["common", "uncommon", "rare", "epic", "legendary"],
    },
  },
} as const
