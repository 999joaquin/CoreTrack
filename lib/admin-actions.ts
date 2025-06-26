import { supabase } from "./supabase"
import { logActivity } from "./activity-actions"

// Invite user by email using Supabase Auth
export async function inviteUserByEmail(email: string, fullName?: string, role: "admin" | "user" = "user") {
  try {
    // Check if current user is admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    if (!currentUser) {
      return { success: false, error: "Not authenticated" }
    }

    // Get current user's profile to check if they're admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single()

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Not authorized - admin access required" }
    }

    // Send invitation using Supabase Auth
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName || "",
        role: role,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    })

    if (error) {
      console.error("Error inviting user:", error)
      return { success: false, error: error.message }
    }

    // Log the invitation activity
    try {
      await logActivity({
        action: "invited",
        entity_type: "user",
        entity_id: email,
        details: {
          email: email,
          full_name: fullName,
          role: role,
          invitation_method: "email",
        },
      })
    } catch (activityError) {
      console.error("Failed to log activity:", activityError)
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error inviting user:", error)
    return { success: false, error: error.message || "Failed to invite user" }
  }
}

// Update user role
export async function updateUserRole(userId: string, newRole: "admin" | "user") {
  try {
    // Check if current user is admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    if (!currentUser) {
      return { success: false, error: "Not authenticated" }
    }

    // Get current user's profile to check if they're admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single()

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Not authorized - admin access required" }
    }

    // Prevent users from changing their own role
    if (userId === currentUser.id) {
      return { success: false, error: "Cannot change your own role" }
    }

    // Update the user's role in the profiles table
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      console.error("Error updating user role:", error)
      return { success: false, error: error.message }
    }

    // Get user details for logging
    const { data: userProfile } = await supabase.from("profiles").select("email, full_name").eq("id", userId).single()

    // Log the role change activity
    try {
      await logActivity({
        action: "role_changed",
        entity_type: "user",
        entity_id: userId,
        details: {
          email: userProfile?.email,
          full_name: userProfile?.full_name,
          old_role: profile.role,
          new_role: newRole,
        },
      })
    } catch (activityError) {
      console.error("Failed to log activity:", activityError)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error updating user role:", error)
    return { success: false, error: error.message || "Failed to update user role" }
  }
}

// Delete user by ID
export async function deleteUserById(userId: string) {
  try {
    // Check if current user is admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    if (!currentUser) {
      return { success: false, error: "Not authenticated" }
    }

    // Get current user's profile to check if they're admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", currentUser.id).single()

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Not authorized - admin access required" }
    }

    // Prevent users from deleting themselves
    if (userId === currentUser.id) {
      return { success: false, error: "Cannot delete your own account" }
    }

    // Get user details before deletion for logging
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", userId)
      .single()

    // Delete user from Supabase Auth (this will cascade to profiles table)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Error deleting user from auth:", authError)
      return { success: false, error: authError.message }
    }

    // Log the deletion activity
    try {
      await logActivity({
        action: "deleted",
        entity_type: "user",
        entity_id: userId,
        details: {
          email: userProfile?.email,
          full_name: userProfile?.full_name,
          role: userProfile?.role,
          deletion_method: "admin_action",
        },
      })
    } catch (activityError) {
      console.error("Failed to log activity:", activityError)
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting user:", error)
    return { success: false, error: error.message || "Failed to delete user" }
  }
}

// Get user profile (client-side safe)
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error getting user profile:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting user profile:", error)
    return { success: false, error: error.message || "Failed to get user profile" }
  }
}

// Get all users (client-side safe)
export async function getAllUsers() {
  try {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error getting all users:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error("Error getting all users:", error)
    return { success: false, error: error.message || "Failed to get users" }
  }
}

// Legacy function for backward compatibility
export async function inviteUser(email: string) {
  return inviteUserByEmail(email)
}
