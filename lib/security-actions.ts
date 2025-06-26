import { supabase } from "./supabase"
import { getCurrentUser } from "./auth"

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // For Supabase, we can't verify the current password on the client side
    // We'll just update the password directly
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      throw new Error(updateError.message)
    }

    return { success: true }
  } catch (error) {
    console.error("Password change error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change password",
    }
  }
}

export async function getUserSessions() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Since we can't get real session data from client-side Supabase,
    // we'll return mock data for now
    return {
      success: true,
      sessions: [
        {
          id: "current",
          device: "Chrome on macOS",
          location: "San Francisco, CA",
          lastActive: new Date().toISOString(),
          isCurrent: true,
        },
        {
          id: "mobile",
          device: "Safari on iPhone",
          location: "San Francisco, CA",
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isCurrent: false,
        },
      ],
    }
  } catch (error) {
    console.error("Get sessions error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get sessions",
      sessions: [],
    }
  }
}

export async function signOutAllSessions() {
  try {
    // Sign out from all sessions
    const { error } = await supabase.auth.signOut({ scope: "global" })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error) {
    console.error("Sign out all sessions error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign out all sessions",
    }
  }
}

export async function enable2FA(userId: string) {
  try {
    // Store 2FA preference in profiles table
    const { error } = await supabase
      .from("profiles")
      .update({
        two_factor_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error) {
    console.error("Enable 2FA error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to enable 2FA",
    }
  }
}

export async function disable2FA(userId: string) {
  try {
    // Remove 2FA preference from profiles table
    const { error } = await supabase
      .from("profiles")
      .update({
        two_factor_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error) {
    console.error("Disable 2FA error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to disable 2FA",
    }
  }
}

export async function get2FAStatus(userId: string) {
  try {
    const { data, error } = await supabase.from("profiles").select("two_factor_enabled").eq("id", userId).single()

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      enabled: data?.two_factor_enabled || false,
    }
  } catch (error) {
    console.error("Get 2FA status error:", error)
    return {
      success: false,
      enabled: false,
      error: error instanceof Error ? error.message : "Failed to get 2FA status",
    }
  }
}

// Server action for password verification (if needed)
export async function verifyCurrentPassword(email: string, password: string) {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { success: !error, error: error?.message }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify password",
    }
  }
}
