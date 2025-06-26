import { supabase } from "@/lib/supabase"
import type { Project } from "@/types"

export async function createProject(projectData: Omit<Project, "id" | "created_at" | "updated_at">) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...projectData,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase.from("projects").update(updates).eq("id", id).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export async function getProject(id: string) {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getProjects() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}
