export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      authors: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author_id: string | null
          available_copies: number | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          isbn: string | null
          language: string | null
          location: string | null
          pages: number | null
          publication_year: number | null
          publisher_id: string | null
          title: string
          total_copies: number | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          available_copies?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          location?: string | null
          pages?: number | null
          publication_year?: number | null
          publisher_id?: string | null
          title: string
          total_copies?: number | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          available_copies?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          location?: string | null
          pages?: number | null
          publication_year?: number | null
          publisher_id?: string | null
          title?: string
          total_copies?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      circulation: {
        Row: {
          book_id: string
          checked_out_by: string | null
          checkout_date: string | null
          created_at: string | null
          due_date: string
          fine_amount: number | null
          id: string
          patron_id: string
          renewed_count: number | null
          return_date: string | null
          status: string | null
        }
        Insert: {
          book_id: string
          checked_out_by?: string | null
          checkout_date?: string | null
          created_at?: string | null
          due_date: string
          fine_amount?: number | null
          id?: string
          patron_id: string
          renewed_count?: number | null
          return_date?: string | null
          status?: string | null
        }
        Update: {
          book_id?: string
          checked_out_by?: string | null
          checkout_date?: string | null
          created_at?: string | null
          due_date?: string
          fine_amount?: number | null
          id?: string
          patron_id?: string
          renewed_count?: number | null
          return_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circulation_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circulation_checked_out_by_fkey"
            columns: ["checked_out_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circulation_patron_id_fkey"
            columns: ["patron_id"]
            isOneToOne: false
            referencedRelation: "patrons"
            referencedColumns: ["id"]
          },
        ]
      }
      fines: {
        Row: {
          amount: number
          circulation_id: string | null
          created_at: string | null
          id: string
          paid_at: string | null
          patron_id: string
          reason: string
          status: string | null
        }
        Insert: {
          amount: number
          circulation_id?: string | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          patron_id: string
          reason: string
          status?: string | null
        }
        Update: {
          amount?: number
          circulation_id?: string | null
          created_at?: string | null
          id?: string
          paid_at?: string | null
          patron_id?: string
          reason?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fines_circulation_id_fkey"
            columns: ["circulation_id"]
            isOneToOne: false
            referencedRelation: "circulation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fines_patron_id_fkey"
            columns: ["patron_id"]
            isOneToOne: false
            referencedRelation: "patrons"
            referencedColumns: ["id"]
          },
        ]
      }
      patrons: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          expiry_date: string | null
          full_name: string
          id: string
          max_books: number | null
          membership_date: string | null
          patron_id: string
          patron_type: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          expiry_date?: string | null
          full_name: string
          id?: string
          max_books?: number | null
          membership_date?: string | null
          patron_id: string
          patron_type?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          expiry_date?: string | null
          full_name?: string
          id?: string
          max_books?: number | null
          membership_date?: string | null
          patron_id?: string
          patron_type?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      publishers: {
        Row: {
          address: string | null
          contact_info: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          contact_info?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          book_id: string
          created_at: string | null
          expiry_date: string | null
          id: string
          patron_id: string
          priority: number | null
          reserved_date: string | null
          status: string | null
        }
        Insert: {
          book_id: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          patron_id: string
          priority?: number | null
          reserved_date?: string | null
          status?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          patron_id?: string
          priority?: number | null
          reserved_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_patron_id_fkey"
            columns: ["patron_id"]
            isOneToOne: false
            referencedRelation: "patrons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_staff_or_supervisor: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "supervisor" | "staff" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["supervisor", "staff", "student"],
    },
  },
} as const
