import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Add this export for the createClient function
export const createBrowserClient = () => createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: "admin" | "user"
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: "admin" | "user"
          avatar_url?: string | null
        }
        Update: {
          full_name?: string | null
          role?: "admin" | "user"
          avatar_url?: string | null
        }
      }
      workspaces: {
        Row: {
          id: string
          name: string
          description: string | null
          invite_code: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          invite_code: string
          created_by: string
        }
        Update: {
          name?: string
          description?: string | null
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: "admin" | "user" | "viewer"
          joined_at: string
        }
        Insert: {
          workspace_id: string
          user_id: string
          role?: "admin" | "user" | "viewer"
        }
        Update: {
          role?: "admin" | "user" | "viewer"
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          deadline: string | null
          budget: number | null
          status: string
          workspace_id: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description?: string | null
          deadline?: string | null
          budget?: number | null
          status?: string
          workspace_id: string
          created_by?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          deadline?: string | null
          budget?: number | null
          status?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          project_id: string
          assigned_to: string | null
          status: "todo" | "in_progress" | "completed"
          priority: "low" | "medium" | "high"
          due_date: string | null
          parent_task_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description?: string | null
          project_id: string
          assigned_to?: string | null
          status?: "todo" | "in_progress" | "completed"
          priority?: "low" | "medium" | "high"
          due_date?: string | null
          parent_task_id?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          assigned_to?: string | null
          status?: "todo" | "in_progress" | "completed"
          priority?: "low" | "medium" | "high"
          due_date?: string | null
          parent_task_id?: string | null
        }
      }
      goals: {
        Row: {
          id: string
          title: string
          description: string | null
          project_id: string
          target_value: number
          current_value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description?: string | null
          project_id: string
          target_value?: number
          current_value?: number
        }
        Update: {
          title?: string
          description?: string | null
          target_value?: number
          current_value?: number
        }
      }
      expenses: {
        Row: {
          id: string
          amount: number
          description: string | null
          project_id: string
          task_id: string | null
          created_by: string | null
          expense_date: string
          created_at: string
        }
        Insert: {
          amount: number
          description?: string | null
          project_id: string
          task_id?: string | null
          created_by?: string | null
          expense_date?: string
        }
        Update: {
          amount?: number
          description?: string | null
          expense_date?: string
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          details: any
          created_at: string
        }
        Insert: {
          user_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          details?: any
        }
      }
    }
  }
}
