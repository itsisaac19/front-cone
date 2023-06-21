export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      "deleted-drills": {
        Row: {
          created_at: string | null
          description: string | null
          index: number | null
          other_meta: Json | null
          plan_uuid: string | null
          status: string | null
          time_end: string | null
          time_start: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          uuid: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          index?: number | null
          other_meta?: Json | null
          plan_uuid?: string | null
          status?: string | null
          time_end?: string | null
          time_start?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          uuid?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          index?: number | null
          other_meta?: Json | null
          plan_uuid?: string | null
          status?: string | null
          time_end?: string | null
          time_start?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          uuid?: string
        }
        Relationships: []
      }
      "deleted-plans": {
        Row: {
          created_at: string | null
          description: string | null
          shared_link: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          uuid: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          shared_link?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          uuid?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          shared_link?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          uuid?: string
        }
        Relationships: []
      }
      drills: {
        Row: {
          created_at: string | null
          description: string | null
          index: number | null
          other_meta: Json | null
          plan_uuid: string | null
          status: string | null
          time_end: string | null
          time_start: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          uuid: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          index?: number | null
          other_meta?: Json | null
          plan_uuid?: string | null
          status?: string | null
          time_end?: string | null
          time_start?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          uuid?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          index?: number | null
          other_meta?: Json | null
          plan_uuid?: string | null
          status?: string | null
          time_end?: string | null
          time_start?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          uuid?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          description: string | null
          shared_link: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          uuid: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          shared_link?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          uuid?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          shared_link?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          uuid?: string
        }
        Relationships: []
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
