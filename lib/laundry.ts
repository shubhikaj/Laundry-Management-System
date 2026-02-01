import { supabase } from "./supabase"
import { logActivity } from "./auth"

export interface LaundryBatch {
  id: string
  student_id: string
  batch_number: string
  status: "scheduled" | "dropped_off" | "washing" | "ready_for_pickup" | "picked_up"
  scheduled_date: string
  dropped_off_at?: string
  ready_at?: string
  picked_up_at?: string
  staff_notes?: string
  student?: {
    full_name: string
    block: string
    floor_number: number
    room_number: string
  }
}

export interface LaundrySchedule {
  id: string
  block: string
  floor_number: number
  scheduled_day?: string
  schedule_date?: string
  pickup_time: string
  is_date_specific?: boolean
  dropoff_start_time?: string
  dropoff_end_time?: string
  is_active?: boolean
  max_batches_per_day?: number
}

export async function getLaundrySchedule(block: string, floor: number) {
  // Check if we're in demo mode
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // Return demo schedule data
    const demoSchedules = {
      "A-1": { id: "demo-1", block: "A", floor_number: 1, scheduled_day: "monday", pickup_time: "18:00:00" },
      "A-2": { id: "demo-2", block: "A", floor_number: 2, scheduled_day: "tuesday", pickup_time: "18:00:00" },
      "B-1": { id: "demo-3", block: "B", floor_number: 1, scheduled_day: "wednesday", pickup_time: "18:00:00" },
      "B-2": { id: "demo-4", block: "B", floor_number: 2, scheduled_day: "thursday", pickup_time: "18:00:00" },
    }

    const key = `${block}-${floor}`
    return demoSchedules[key as keyof typeof demoSchedules] || demoSchedules["A-1"]
  }

  const { data, error } = await supabase
    .from("laundry_schedules")
    .select("*")
    .eq("block", block)
    .eq("floor_number", floor)
    .single()

  if (error) throw error
  return data
}

export async function getAllSchedules() {
  // Check if we're in demo mode
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // Return demo schedule data including date-specific schedules
    return [
      { 
        id: "demo-1", 
        block: "A", 
        floor_number: 1, 
        scheduled_day: "monday", 
        pickup_time: "18:00:00",
        is_date_specific: false
      },
      { 
        id: "demo-2", 
        block: "A", 
        floor_number: 2, 
        schedule_date: "2025-11-05",
        pickup_time: "18:00:00",
        is_date_specific: true,
        dropoff_start_time: "08:00:00",
        dropoff_end_time: "10:00:00"
      }
    ]
  }

  // Get regular schedules
  const { data: regularSchedules, error: regularError } = await supabase
    .from("laundry_schedules")
    .select("*")
    .order("block", { ascending: true })
    .order("floor_number", { ascending: true })

  if (regularError) throw regularError

  // Get date-specific schedules
  const { data: dateSchedules, error: dateError } = await supabase
    .from("date_schedules")
    .select("*")
    .gte("schedule_date", new Date().toISOString().split("T")[0])
    .order("schedule_date", { ascending: true })
    .order("block", { ascending: true })
    .order("floor_number", { ascending: true })

  if (dateError) throw dateError

  // Combine and format both types of schedules
  const formattedDateSchedules = (dateSchedules || []).map(schedule => ({
    id: schedule.id,
    block: schedule.block,
    floor_number: schedule.floor_number,
    schedule_date: schedule.schedule_date,
    pickup_time: schedule.pickup_time,
    is_date_specific: true,
    dropoff_start_time: schedule.dropoff_start_time,
    dropoff_end_time: schedule.dropoff_end_time,
    is_active: schedule.is_active,
    max_batches_per_day: schedule.max_batches_per_day
  }))

  const formattedRegularSchedules = (regularSchedules || []).map(schedule => ({
    ...schedule,
    is_date_specific: false
  }))

  return [...formattedRegularSchedules, ...formattedDateSchedules]
}

export async function updateSchedule(id: string, updates: Partial<LaundrySchedule>, userId: string) {
  const { data, error } = await supabase.from("laundry_schedules").update(updates).eq("id", id).select().single()

  if (error) throw error

  await logActivity(
    userId,
    "schedule_update",
    `Updated schedule for Block ${updates.block} Floor ${updates.floor_number}`,
    updates,
  )

  return data
}

export async function getStudentBatches(studentId: string) {
  // Check if we're in demo mode
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // Return demo batch data
    return [
      {
        id: "demo-batch-1",
        student_id: studentId,
        batch_number: "LB1234567890",
        status: "ready_for_pickup" as const,
        scheduled_date: new Date().toISOString().split("T")[0],
        dropped_off_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ready_at: new Date().toISOString(),
        staff_notes: "Laundry is clean and ready for pickup",
      },
      {
        id: "demo-batch-2",
        student_id: studentId,
        batch_number: "LB1234567891",
        status: "picked_up" as const,
        scheduled_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        dropped_off_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        picked_up_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Completed successfully",
      },
    ]
  }

  const { data, error } = await supabase
    .from("laundry_batches")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getAllBatches() {
  // Check if we're in demo mode
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  // Try to fetch real data first, fall back to demo if it fails
  try {
    const { data, error } = await supabase
      .from("laundry_batches")
      .select(`
        *,
        student:users(full_name, block, floor_number, room_number)
      `)
      .order("created_at", { ascending: false })

    if (!error && data && data.length > 0) {
      return data
    }
  } catch (error) {
    console.log("Failed to fetch real data, falling back to demo data:", error)
  }

  if (isDemo) {
    // Return comprehensive demo batch data for staff/admin
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    
    return [
      {
        id: "demo-batch-1",
        student_id: "student-demo-1",
        batch_number: "LB001234567",
        status: "ready_for_pickup" as const,
        scheduled_date: yesterday,
        dropped_off_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        staff_notes: "All items clean and pressed. Ready for pickup.",
        student: {
          full_name: "John Doe",
          block: "A",
          floor_number: 1,
          room_number: "101",
        },
      },
      {
        id: "demo-batch-2",
        student_id: "student-demo-2",
        batch_number: "LB001234568",
        status: "washing" as const,
        scheduled_date: today,
        dropped_off_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Currently in washing cycle. Expected completion in 30 minutes.",
        student: {
          full_name: "Jane Smith",
          block: "A",
          floor_number: 2,
          room_number: "205",
        },
      },
      {
        id: "demo-batch-3",
        student_id: "student-demo-3",
        batch_number: "LB001234569",
        status: "dropped_off" as const,
        scheduled_date: today,
        dropped_off_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        staff_notes: "Received 30 minutes ago. Waiting to start washing.",
        student: {
          full_name: "Mike Johnson",
          block: "B",
          floor_number: 1,
          room_number: "101",
        },
      },
      {
        id: "demo-batch-4",
        student_id: "student-demo-4",
        batch_number: "LB001234570",
        status: "picked_up" as const,
        scheduled_date: twoDaysAgo,
        dropped_off_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        picked_up_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Completed successfully. Student picked up on time.",
        student: {
          full_name: "Sarah Wilson",
          block: "B",
          floor_number: 3,
          room_number: "301",
        },
      },
      {
        id: "demo-batch-5",
        student_id: "student-demo-5",
        batch_number: "LB001234571",
        status: "scheduled" as const,
        scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        staff_notes: "Scheduled for tomorrow's pickup.",
        student: {
          full_name: "David Brown",
          block: "C",
          floor_number: 1,
          room_number: "101",
        },
      },
      {
        id: "demo-batch-6",
        student_id: "student-demo-6",
        batch_number: "LB001234572",
        status: "ready_for_pickup" as const,
        scheduled_date: yesterday,
        dropped_off_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Ready since morning. Student hasn't picked up yet.",
        student: {
          full_name: "Lisa Garcia",
          block: "C",
          floor_number: 2,
          room_number: "202",
        },
      },
      {
        id: "demo-batch-7",
        student_id: "student-demo-7",
        batch_number: "LB001234573",
        status: "washing" as const,
        scheduled_date: today,
        dropped_off_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Heavy load. Taking longer than usual. Almost done.",
        student: {
          full_name: "Alex Chen",
          block: "D",
          floor_number: 1,
          room_number: "101",
        },
      },
      {
        id: "demo-batch-8",
        student_id: "student-demo-8",
        batch_number: "LB001234574",
        status: "dropped_off" as const,
        scheduled_date: today,
        dropped_off_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        staff_notes: "Just received. Will start washing soon.",
        student: {
          full_name: "Emma Davis",
          block: "E",
          floor_number: 1,
          room_number: "101",
        },
      },
      // Additional batches for more comprehensive testing
      {
        id: "demo-batch-9",
        student_id: "student-demo-9",
        batch_number: "LB001234575",
        status: "washing" as const,
        scheduled_date: today,
        dropped_off_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Delicate items. Using gentle cycle.",
        student: {
          full_name: "Maria Rodriguez",
          block: "A",
          floor_number: 3,
          room_number: "305",
        },
      },
      {
        id: "demo-batch-10",
        student_id: "student-demo-10",
        batch_number: "LB001234576",
        status: "ready_for_pickup" as const,
        scheduled_date: yesterday,
        dropped_off_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        staff_notes: "All items washed and dried. Ready for pickup.",
        student: {
          full_name: "James Wilson",
          block: "B",
          floor_number: 2,
          room_number: "208",
        },
      },
      {
        id: "demo-batch-11",
        student_id: "student-demo-11",
        batch_number: "LB001234577",
        status: "dropped_off" as const,
        scheduled_date: today,
        dropped_off_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        staff_notes: "Large load. Will need extra time for drying.",
        student: {
          full_name: "Sophie Anderson",
          block: "C",
          floor_number: 3,
          room_number: "312",
        },
      },
      {
        id: "demo-batch-12",
        student_id: "student-demo-12",
        batch_number: "LB001234578",
        status: "picked_up" as const,
        scheduled_date: twoDaysAgo,
        dropped_off_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        picked_up_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Completed successfully. Student very satisfied.",
        student: {
          full_name: "Ryan Thompson",
          block: "D",
          floor_number: 2,
          room_number: "215",
        },
      },
      {
        id: "demo-batch-13",
        student_id: "student-demo-13",
        batch_number: "LB001234579",
        status: "scheduled" as const,
        scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        staff_notes: "Scheduled for day after tomorrow.",
        student: {
          full_name: "Olivia Martinez",
          block: "E",
          floor_number: 2,
          room_number: "220",
        },
      },
      {
        id: "demo-batch-14",
        student_id: "student-demo-14",
        batch_number: "LB001234580",
        status: "washing" as const,
        scheduled_date: today,
        dropped_off_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Stain treatment applied. In final rinse cycle.",
        student: {
          full_name: "Daniel Kim",
          block: "A",
          floor_number: 4,
          room_number: "410",
        },
      },
      {
        id: "demo-batch-15",
        student_id: "student-demo-15",
        batch_number: "LB001234581",
        status: "ready_for_pickup" as const,
        scheduled_date: yesterday,
        dropped_off_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Ready for pickup. Student notified.",
        student: {
          full_name: "Isabella Taylor",
          block: "B",
          floor_number: 4,
          room_number: "405",
        },
      },
      {
        id: "demo-batch-16",
        student_id: "student-demo-16",
        batch_number: "LB001234582",
        status: "dropped_off" as const,
        scheduled_date: today,
        dropped_off_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        staff_notes: "Just dropped off. Sorting items now.",
        student: {
          full_name: "Noah Garcia",
          block: "C",
          floor_number: 1,
          room_number: "105",
        },
      },
      {
        id: "demo-batch-17",
        student_id: "student-demo-17",
        batch_number: "LB001234583",
        status: "washing" as const,
        scheduled_date: today,
        dropped_off_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Heavy load with towels and bedding. In wash cycle.",
        student: {
          full_name: "Ava Johnson",
          block: "D",
          floor_number: 3,
          room_number: "310",
        },
      },
      {
        id: "demo-batch-18",
        student_id: "student-demo-18",
        batch_number: "LB001234584",
        status: "picked_up" as const,
        scheduled_date: twoDaysAgo,
        dropped_off_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        picked_up_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Completed on time. Good service.",
        student: {
          full_name: "Liam Brown",
          block: "E",
          floor_number: 3,
          room_number: "315",
        },
      },
      {
        id: "demo-batch-19",
        student_id: "student-demo-19",
        batch_number: "LB001234585",
        status: "scheduled" as const,
        scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        staff_notes: "Scheduled for next week.",
        student: {
          full_name: "Charlotte Davis",
          block: "A",
          floor_number: 5,
          room_number: "505",
        },
      },
      {
        id: "demo-batch-20",
        student_id: "student-demo-20",
        batch_number: "LB001234586",
        status: "ready_for_pickup" as const,
        scheduled_date: yesterday,
        dropped_off_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ready_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        staff_notes: "Ready since this morning. Student hasn't picked up yet.",
        student: {
          full_name: "William Miller",
          block: "B",
          floor_number: 5,
          room_number: "510",
        },
      },
    ]
  }

  const { data, error } = await supabase
    .from("laundry_batches")
    .select(`
      *,
      student:users(full_name, block, floor_number, room_number)
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function updateBatchStatus(
  batchId: string,
  status: LaundryBatch["status"],
  staffId: string,
  notes?: string,
) {
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  // Try to update real data first, fall back to demo if it fails
  try {
    const updates: any = { status, updated_at: new Date().toISOString() }

    if (status === "dropped_off") {
      updates.dropped_off_at = new Date().toISOString()
    } else if (status === "ready_for_pickup") {
      updates.ready_at = new Date().toISOString()
    } else if (status === "picked_up") {
      updates.picked_up_at = new Date().toISOString()
    }

    if (notes) {
      updates.staff_notes = notes
    }

    const { data, error } = await supabase
      .from("laundry_batches")
      .update(updates)
      .eq("id", batchId)
      .select(`
        *,
        student:users(full_name, email, email_notifications, sms_notifications)
      `)
      .single()

    if (!error && data) {
      // Log activity
      await logActivity(staffId, "status_change", `Updated batch ${data.batch_number} status to ${status}`, {
        batchId,
        status,
        notes,
      })

      // Send notification if ready for pickup
      if (status === "ready_for_pickup" && data.student && data.student.email) {
        try {
          await sendNotification(
            data.student_id,
            batchId,
            "email",
            `Your laundry batch ${data.batch_number} is ready for pickup!`,
          )
        } catch (notifError) {
          console.error("Failed to send notification (non-critical):", notifError)
          // Don't fail the status update if notification fails
        }
      }

      return data
    }
  } catch (error) {
    console.log("Failed to update real data, falling back to demo mode:", error)
  }

  if (isDemo) {
    // In demo mode, just return success
    console.log(`Demo: Updated batch ${batchId} to status ${status}`)
    return {
      id: batchId,
      status,
      staff_notes: notes,
      batch_number: "LB1234567890",
      student_id: "student-demo-id",
    }
  }

  // If we reach here, it means we're in production mode but the real data update failed
  throw new Error("Failed to update batch status")
}

export async function createBatch(studentId: string, scheduledDate: string) {
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // In demo mode, just return success
    const batchNumber = `LB${Date.now()}`
    console.log(`Demo: Created batch ${batchNumber} for ${scheduledDate}`)
    return {
      id: `demo-${Date.now()}`,
      student_id: studentId,
      batch_number: batchNumber,
      scheduled_date: scheduledDate,
      status: "scheduled" as const,
    }
  }

  const batchNumber = `LB${Date.now()}`

  const { data, error } = await supabase
    .from("laundry_batches")
    .insert([
      {
        student_id: studentId,
        batch_number: batchNumber,
        scheduled_date: scheduledDate,
        status: "scheduled",
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function sendNotification(userId: string, batchId: string, type: "email" | "sms", message: string) {
  try {
    // Check user notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("email_notifications, sms_notifications")
      .eq("id", userId)
      .single()

    // Get batch with student email for sending notification
    const { data: batchWithEmail } = await supabase
      .from("laundry_batches")
      .select(`
        batch_number,
        student:users(full_name, email, block, room_number)
      `)
      .eq("id", batchId)
      .single()

    const userEmail = batchWithEmail?.student?.email

    // If user has disabled email notifications, don't send
    if (type === "email" && profile && profile.email_notifications === false) {
      console.log(`Email notifications disabled for user ${userId}`)
      // Still save notification to database but don't send
    }

    // If user has disabled SMS notifications, don't send
    if (type === "sms" && profile && profile.sms_notifications === false) {
      console.log(`SMS notifications disabled for user ${userId}`)
      // Still save notification to database but don't send
    }

    // Save notification to database first
    const { error: insertError, data: notification } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: userId,
          batch_id: batchId,
          type,
          message,
          delivered: false, // Will be updated after actual delivery
        },
      ])
      .select()
      .single()

    if (insertError) throw insertError

    // Actually send the email if enabled
    let emailSent = false
    if (type === "email" && userEmail && (profile?.email_notifications !== false)) {
      if (batchWithEmail && batchWithEmail.student) {
        // Import and use email service with batch details
        const { sendLaundryReadyEmail } = await import("./email")
        emailSent = await sendLaundryReadyEmail(
          userEmail,
          batchWithEmail.student.full_name || "Student",
          batchWithEmail.batch_number,
          batchWithEmail.student.block || undefined,
          batchWithEmail.student.room_number || undefined
        )
      } else {
        // Fallback: send generic email
        const { sendEmail } = await import("./email")
        emailSent = await sendEmail({
          to: userEmail,
          subject: "Laundry Ready for Pickup",
          html: `<p>${message}</p>`,
          text: message,
        })
      }

      // Update notification delivery status
      if (emailSent && notification) {
        await supabase
          .from("notifications")
          .update({ delivered: true })
          .eq("id", notification.id)
      }
    }

    // TODO: Implement SMS sending here if type === "sms"
    if (type === "sms") {
      console.log("SMS notification would be sent:", message)
      // Update as delivered (implement actual SMS service later)
      if (notification) {
        await supabase
          .from("notifications")
          .update({ delivered: true })
          .eq("id", notification.id)
      }
    }

    await logActivity(userId, "notification_sent", `${type.toUpperCase()} notification sent`, { batchId, message, emailSent })
  } catch (error) {
    console.error("Failed to send notification:", error)
    throw error
  }
}
