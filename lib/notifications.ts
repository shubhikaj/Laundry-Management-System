import { supabase } from "./supabase"
import { logActivity } from "./auth"

export interface Notification {
  id: string
  user_id: string
  batch_id?: string
  type: "email" | "sms"
  message: string
  sent_at: string
  delivered: boolean
  batch?: {
    batch_number: string
    status: string
    scheduled_date: string
  }
}

export interface UserNotificationPreferences {
  email_notifications: boolean
  sms_notifications: boolean
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // Return demo notification data
    return [
      {
        id: "demo-notification-1",
        user_id: userId,
        batch_id: "demo-batch-1",
        type: "email",
        message: "Your laundry batch LB1234567890 is ready for pickup!",
        sent_at: new Date().toISOString(),
        delivered: true,
        batch: {
          batch_number: "LB1234567890",
          status: "ready_for_pickup",
          scheduled_date: new Date().toISOString().split("T")[0],
        },
      },
      {
        id: "demo-notification-2",
        user_id: userId,
        batch_id: "demo-batch-2",
        type: "email",
        message: "Your laundry batch LB1234567891 has been picked up successfully.",
        sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        delivered: true,
        batch: {
          batch_number: "LB1234567891",
          status: "picked_up",
          scheduled_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
      },
    ]
  }

  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      batch:laundry_batches(batch_number, status, scheduled_date)
    `)
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
    .limit(20)

  if (error) throw error
  return data || []
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // Return demo count
    return 1
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("delivered", false)

  if (error) throw error
  return count || 0
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    console.log(`Demo: Marked notification ${notificationId} as read`)
    return
  }

  const { error } = await supabase
    .from("notifications")
    .update({ delivered: true })
    .eq("id", notificationId)

  if (error) throw error
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    console.log(`Demo: Marked all notifications for user ${userId} as read`)
    return
  }

  const { error } = await supabase
    .from("notifications")
    .update({ delivered: true })
    .eq("user_id", userId)
    .eq("delivered", false)

  if (error) throw error
}

export async function getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences> {
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    return {
      email_notifications: true,
      sms_notifications: false,
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("email_notifications, sms_notifications")
    .eq("id", userId)
    .single()

  if (error) throw error
  return {
    email_notifications: data.email_notifications ?? true,
    sms_notifications: data.sms_notifications ?? false,
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<UserNotificationPreferences>
): Promise<void> {
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    console.log(`Demo: Updated notification preferences for user ${userId}:`, preferences)
    return
  }

  const { error } = await supabase
    .from("profiles")
    .update(preferences)
    .eq("id", userId)

  if (error) throw error

  await logActivity(
    userId,
    "notification_sent",
    "Updated notification preferences",
    preferences
  )
}

export async function sendBulkNotification(
  userIds: string[],
  message: string,
  type: "email" | "sms" = "email"
): Promise<void> {
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    console.log(`Demo: Sent bulk ${type} notification to ${userIds.length} users:`, message)
    return
  }

  const notifications = userIds.map(userId => ({
    user_id: userId,
    type,
    message,
    delivered: true,
  }))

  const { error } = await supabase
    .from("notifications")
    .insert(notifications)

  if (error) throw error

  // Log activity for the admin who sent the notification
  await logActivity(
    userIds[0], // Using first user ID as a placeholder for admin ID
    "notification_sent",
    `Sent bulk ${type} notification to ${userIds.length} users`,
    { message, userIds }
  )
}

export async function sendPickupReminderNotification(
  batchId: string,
  userId: string,
  batchNumber: string
): Promise<void> {
  const message = `Reminder: Your laundry batch ${batchNumber} is ready for pickup. Please collect it from the laundry room.`
  
  await sendNotification(userId, batchId, "email", message)
}

// Re-export the existing sendNotification function from laundry.ts for convenience
export { sendNotification } from "./laundry"
