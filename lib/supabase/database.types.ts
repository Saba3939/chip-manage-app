export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          points: number
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          points?: number
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          points?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          host_user_id: string
          name: string | null
          initial_chips: number
          max_participants: number
          rate: number | null
          status: 'waiting' | 'active' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_user_id: string
          name?: string | null
          initial_chips?: number
          max_participants?: number
          rate?: number | null
          status?: 'waiting' | 'active' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_user_id?: string
          name?: string | null
          initial_chips?: number
          max_participants?: number
          rate?: number | null
          status?: 'waiting' | 'active' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_host_user_id_fkey"
            columns: ["host_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      session_participants: {
        Row: {
          id: string
          session_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      balances: {
        Row: {
          id: string
          session_id: string
          user_id: string
          amount: number
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          amount?: number
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "balances_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balances_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          session_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          from_user_id?: string
          to_user_id?: string
          amount?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_from_user_id_fkey"
            columns: ["from_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_user_id_fkey"
            columns: ["to_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      transfer_chips: {
        Args: {
          p_session_id: string
          p_from_user_id: string
          p_to_user_id: string
          p_amount: number
        }
        Returns: Json
      }
      join_session: {
        Args: {
          p_session_id: string
          p_user_id: string
        }
        Returns: Json
      }
      update_user_points: {
        Args: {
          p_user_id: string
          p_points_change: number
        }
        Returns: Json
      }
      deduct_entry_points: {
        Args: {
          p_session_id: string
        }
        Returns: Json
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
