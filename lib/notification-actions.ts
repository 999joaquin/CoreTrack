import { supabase } from "./supabase"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  category: "project" | "task" | "goal" | "expense" | "system"
  read: boolean
  action_url?: string
  action_text?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_project_updates: boolean
  email_task_assignments: boolean
  email_goal_reminders: boolean
  email_expense_alerts: boolean
  email_weekly_reports: boolean
  email_system_updates: boolean
  push_project_updates: boolean
  push_task_assignments: boolean
  push_goal_reminders: boolean
  push_expense_alerts: boolean
  push_system_updates: boolean
  digest_frequency: "daily" | "weekly" | "never"
  quiet_hours_start: string
  quiet_hours_end: string
  timezone: string
  created_at: string
  updated_at: string
}

// Get user's notifications
export async function getUserNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  return { data: data as Notification[] | null, error }
}

// Get unread notification count
export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false)

  return { count: count || 0, error }
}

// Mark notification as read
export async function markAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select()
    .single()

  return { data: data as Notification | null, error }
}

// Mark all notifications as read
export async function markAllAsRead(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("read", false)
    .select()

  return { data: data as Notification[] | null, error }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

  return { error }
}

// Create a new notification
export async function createNotification(notification: {
  user_id: string
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  category: "project" | "task" | "goal" | "expense" | "system"
  action_url?: string
  action_text?: string
  metadata?: Record<string, any>
}) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      ...notification,
      type: notification.type || "info",
      metadata: notification.metadata || {},
    })
    .select()
    .single()

  return { data: data as Notification | null, error }
}

// Get user's notification preferences
export async function getNotificationPreferences(userId: string) {
  const { data, error } = await supabase.from("notification_preferences").select("*").eq("user_id", userId).single()

  return { data: data as NotificationPreferences | null, error }
}

// Update notification preferences
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">>,
) {
  const { data, error } = await supabase
    .from("notification_preferences")
    .update({
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single()

  return { data: data as NotificationPreferences | null, error }
}

// Helper function to check if user should receive notification based on preferences
export async function shouldSendNotification(
  userId: string,
  category: string,
  type: "email" | "push",
): Promise<boolean> {
  const { data: preferences } = await getNotificationPreferences(userId)

  if (!preferences) return false

  const prefKey = `${type}_${category}` as keyof NotificationPreferences
  return Boolean(preferences[prefKey])
}

// Helper function to send notification (checks preferences first)
export async function sendNotification(notification: {
  user_id: string
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  category: "project" | "task" | "goal" | "expense" | "system"
  action_url?: string
  action_text?: string
  metadata?: Record<string, any>
}) {
  // Check if user wants to receive this type of notification
  const shouldReceive = await shouldSendNotification(notification.user_id, notification.category, "push")

  if (!shouldReceive) {
    return { data: null, error: null, skipped: true }
  }

  return await createNotification(notification)
}
