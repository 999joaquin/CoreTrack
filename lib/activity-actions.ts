import { supabase } from "@/lib/supabase"

export interface ActivityData {
  action: string
  entity_type: string
  entity_id: string
  details?: Record<string, any>
}

export async function logActivity(data: ActivityData) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.warn("No user found for activity logging")
      return
    }

    const activityData = {
      user_id: user.id,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      details: data.details || {},
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("activities").insert([activityData])

    if (error) {
      console.error("Failed to log activity:", error)
    }
  } catch (error) {
    console.error("Error logging activity:", error)
  }
}

export async function getActivities(userId?: string, limit = 50) {
  try {
    let query = supabase
      .from("activities")
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching activities:", error)
    return []
  }
}

export async function getActivityStats(userId?: string) {
  try {
    let query = supabase.from("activities").select("action, entity_type, created_at")

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (error) throw error

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      today: 0,
      thisWeek: 0,
      byAction: {} as Record<string, number>,
      byEntity: {} as Record<string, number>,
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    data?.forEach((activity) => {
      const createdAt = new Date(activity.created_at)

      if (createdAt >= today) {
        stats.today++
      }

      if (createdAt >= weekAgo) {
        stats.thisWeek++
      }

      stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1
      stats.byEntity[activity.entity_type] = (stats.byEntity[activity.entity_type] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error("Error fetching activity stats:", error)
    return {
      total: 0,
      today: 0,
      thisWeek: 0,
      byAction: {},
      byEntity: {},
    }
  }
}
