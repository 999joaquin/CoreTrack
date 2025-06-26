import { supabase } from "./supabase"

export interface ProfileData {
  id: string
  email: string
  full_name: string | null
  bio: string | null
  phone: string | null
  company: string | null
  website: string | null
  avatar_url: string | null
  role: "admin" | "user"
  created_at: string
  updated_at: string
}

export interface UpdateProfileData {
  full_name?: string
  bio?: string
  phone?: string
  company?: string
  website?: string
  avatar_url?: string
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching profile:", error)
    return { data: null, error }
  }

  return { data: data as ProfileData, error: null }
}

export async function updateProfile(userId: string, updates: UpdateProfileData) {
  // Validate website URL if provided
  if (updates.website && updates.website.trim()) {
    const websiteUrl = updates.website.trim()
    if (!websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) {
      updates.website = `https://${websiteUrl}`
    }
  }

  // Validate phone number format (basic validation)
  if (updates.phone && updates.phone.trim()) {
    const phone = updates.phone.trim().replace(/\D/g, "") // Remove non-digits
    if (phone.length < 10) {
      return {
        data: null,
        error: { message: "Phone number must be at least 10 digits" },
      }
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating profile:", error)
    return { data: null, error }
  }

  return { data: data as ProfileData, error: null }
}

export async function uploadAvatar(userId: string, file: File) {
  try {
    // Create a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Error uploading avatar:", uploadError)
      return { data: null, error: uploadError }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Update profile with new avatar URL
    const { data: profileData, error: profileError } = await updateProfile(userId, {
      avatar_url: avatarUrl,
    })

    if (profileError) {
      return { data: null, error: profileError }
    }

    return { data: { url: avatarUrl, profile: profileData }, error: null }
  } catch (error) {
    console.error("Error in uploadAvatar:", error)
    return { data: null, error: { message: "Failed to upload avatar" } }
  }
}

export async function deleteAvatar(userId: string, avatarUrl: string) {
  try {
    // Extract file path from URL
    const urlParts = avatarUrl.split("/")
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `avatars/${fileName}`

    // Delete file from storage
    const { error: deleteError } = await supabase.storage.from("avatars").remove([filePath])

    if (deleteError) {
      console.error("Error deleting avatar file:", deleteError)
    }

    // Update profile to remove avatar URL
    const { data, error } = await updateProfile(userId, {
      avatar_url: null,
    })

    return { data, error }
  } catch (error) {
    console.error("Error in deleteAvatar:", error)
    return { data: null, error: { message: "Failed to delete avatar" } }
  }
}
