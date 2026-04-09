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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string
          created_at: string
          due_balance: number
          id: string
          name: string
          phone: string
        }
        Insert: {
          address?: string
          created_at?: string
          due_balance?: number
          id?: string
          name: string
          phone?: string
        }
        Update: {
          address?: string
          created_at?: string
          due_balance?: number
          id?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      due_entries: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          date: string
          id: string
          note: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id: string
          date?: string
          id?: string
          note?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "due_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          batch: string
          created_at: string
          expiry: string
          form: string
          generic: string
          id: string
          manufacturer: string
          min_stock: number
          mrp: number
          name: string
          stock: number
          tp: number
        }
        Insert: {
          batch?: string
          created_at?: string
          expiry?: string
          form?: string
          generic?: string
          id?: string
          manufacturer?: string
          min_stock?: number
          mrp?: number
          name: string
          stock?: number
          tp?: number
        }
        Update: {
          batch?: string
          created_at?: string
          expiry?: string
          form?: string
          generic?: string
          id?: string
          manufacturer?: string
          min_stock?: number
          mrp?: number
          name?: string
          stock?: number
          tp?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          date: string
          id: string
          method: string
          note: string
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_id: string
          date?: string
          id?: string
          method?: string
          note?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          method?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_settings: {
        Row: {
          address: string
          created_at: string
          currency: string
          id: string
          name: string
          phone: string
          receipt_width: string
          vat_rate: number
        }
        Insert: {
          address?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
          phone?: string
          receipt_width?: string
          vat_rate?: number
        }
        Update: {
          address?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
          phone?: string
          receipt_width?: string
          vat_rate?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          generic: string
          id: string
          medicine_id: string | null
          medicine_name: string
          qty: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          generic?: string
          id?: string
          medicine_id?: string | null
          medicine_name: string
          qty?: number
          sale_id: string
          total?: number
          unit_price?: number
        }
        Update: {
          generic?: string
          id?: string
          medicine_id?: string | null
          medicine_name?: string
          qty?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          date: string
          discount: number
          due_amount: number
          id: string
          invoice_no: string
          paid_amount: number
          payment_method: string
          salesperson: string
          subtotal: number
          total: number
          vat: number
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          date?: string
          discount?: number
          due_amount?: number
          id?: string
          invoice_no: string
          paid_amount?: number
          payment_method?: string
          salesperson?: string
          subtotal?: number
          total?: number
          vat?: number
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          date?: string
          discount?: number
          due_amount?: number
          id?: string
          invoice_no?: string
          paid_amount?: number
          payment_method?: string
          salesperson?: string
          subtotal?: number
          total?: number
          vat?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "staff"
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
      app_role: ["admin", "staff"],
    },
  },
} as const
