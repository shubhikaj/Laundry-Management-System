import { supabase } from "./supabase"

export interface ScheduleTemplate {
  id: string
  name: string
  description: string
  is_default: boolean
  created_by?: string
  created_at?: string
}

export interface TemplateSchedule {
  id: string
  template_id: string
  scheduled_day: string
  pickup_time: string
  dropoff_start_time: string
  dropoff_end_time: string
}

export interface LaundrySchedule {
  id: string
  block: string
  floor_number: number
  scheduled_day: string
  pickup_time: string
  dropoff_start_time: string
  dropoff_end_time: string
  is_active: boolean
  max_batches_per_day: number
  created_by?: string
  updated_by?: string
  created_at?: string
  updated_at?: string
}

// Schedule Templates
export async function getScheduleTemplates(): Promise<ScheduleTemplate[]> {
  const { data, error } = await supabase
    .from("schedule_templates")
    .select("*")
    .order("name")

  if (error) throw error
  return data || []
}

export async function createScheduleTemplate(template: Omit<ScheduleTemplate, "id" | "created_at">): Promise<ScheduleTemplate> {
  const { data, error } = await supabase
    .from("schedule_templates")
    .insert([template])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateScheduleTemplate(id: string, updates: Partial<ScheduleTemplate>): Promise<ScheduleTemplate> {
  const { data, error } = await supabase
    .from("schedule_templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteScheduleTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("schedule_templates")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// Template Schedules
export async function getTemplateSchedules(templateId: string): Promise<TemplateSchedule[]> {
  const { data, error } = await supabase
    .from("template_schedules")
    .select("*")
    .eq("template_id", templateId)
    .order("scheduled_day")

  if (error) throw error
  return data || []
}

export async function createTemplateSchedule(schedule: Omit<TemplateSchedule, "id">): Promise<TemplateSchedule> {
  const { data, error } = await supabase
    .from("template_schedules")
    .insert([schedule])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTemplateSchedule(id: string, updates: Partial<TemplateSchedule>): Promise<TemplateSchedule> {
  const { data, error } = await supabase
    .from("template_schedules")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTemplateSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from("template_schedules")
    .delete()
    .eq("id", id)

  if (error) throw error
}

// Laundry Schedules
export async function getLaundrySchedules(): Promise<LaundrySchedule[]> {
  const { data, error } = await supabase
    .from("laundry_schedules")
    .select("*")
    .order("block")
    .order("floor_number")
    .order("scheduled_day")

  if (error) throw error
  return data || []
}

export async function getLaundrySchedulesByBlock(block: string): Promise<LaundrySchedule[]> {
  const { data, error } = await supabase
    .from("laundry_schedules")
    .select("*")
    .eq("block", block)
    .order("floor_number")
    .order("scheduled_day")

  if (error) throw error
  return data || []
}

export async function createLaundrySchedule(schedule: Omit<LaundrySchedule, "id" | "created_at" | "updated_at">): Promise<LaundrySchedule> {
  // Check if we're in demo mode
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // Demo mode - just return a mock schedule
    console.log("Demo mode: Laundry schedule creation simulated", schedule)
    return {
      ...schedule,
      id: `demo-schedule-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  // Normalize time formats to HH:MM:SS for PostgreSQL
  const normalizedSchedule = {
    ...schedule,
    pickup_time: schedule.pickup_time.includes(':') && schedule.pickup_time.split(':').length === 2 
      ? `${schedule.pickup_time}:00` 
      : schedule.pickup_time,
    dropoff_start_time: schedule.dropoff_start_time.includes(':') && schedule.dropoff_start_time.split(':').length === 2 
      ? `${schedule.dropoff_start_time}:00` 
      : schedule.dropoff_start_time,
    dropoff_end_time: schedule.dropoff_end_time.includes(':') && schedule.dropoff_end_time.split(':').length === 2 
      ? `${schedule.dropoff_end_time}:00` 
      : schedule.dropoff_end_time,
  }

  const { data, error } = await supabase
    .from("laundry_schedules")
    .insert([normalizedSchedule])
    .select()
    .single()

  if (error) {
    console.error("Supabase error creating laundry schedule:", error)
    throw error
  }
  return data
}

export async function updateLaundrySchedule(id: string, updates: Partial<LaundrySchedule>): Promise<LaundrySchedule> {
  const { data, error } = await supabase
    .from("laundry_schedules")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLaundrySchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from("laundry_schedules")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function toggleScheduleStatus(id: string, isActive: boolean): Promise<LaundrySchedule> {
  // Check if we're in demo mode
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // Return mock data in demo mode
    return {
      id,
      block: "A",
      floor_number: 1,
      scheduled_day: "monday",
      pickup_time: "18:00",
      dropoff_start_time: "08:00",
      dropoff_end_time: "10:00",
      is_active: isActive,
      max_batches_per_day: 50,
      updated_at: new Date().toISOString(),
    }
  }

  // First verify the schedule exists
  const { data: existingSchedule, error: fetchError } = await supabase
    .from("laundry_schedules")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError) {
    console.error("Error fetching schedule:", fetchError)
    throw new Error("Schedule not found")
  }

  if (!existingSchedule) {
    throw new Error("Schedule not found")
  }

  // Then update the status
  return updateLaundrySchedule(id, { is_active: isActive })
}

// Bulk Operations
export async function applyTemplateToBlockFloor(templateId: string, block: string, floor: number): Promise<void> {
  // This would call the database function we created
  const { error } = await supabase.rpc("apply_schedule_template", {
    p_template_id: templateId,
    p_block: block,
    p_floor_number: floor
  })

  if (error) throw error
}

export async function bulkApplyTemplate(templateId: string, blocks: string[], floors: number[]): Promise<void> {
  // This would call the database function we created
  const { error } = await supabase.rpc("bulk_apply_schedule_template", {
    p_template_id: templateId,
    p_blocks: blocks,
    p_floors: floors
  })

  if (error) throw error
}

// Schedule Overview
export async function getScheduleOverview(): Promise<any[]> {
  const { data, error } = await supabase
    .from("schedule_overview")
    .select("*")
    .order("block")
    .order("floor_number")
    .order("scheduled_day")

  if (error) throw error
  return data || []
}

// Date-wise Schedules
export interface DateSchedule {
  id: string
  block: string
  floor_number: number
  schedule_date: string
  pickup_time: string
  dropoff_start_time: string
  dropoff_end_time: string
  is_active: boolean
  is_holiday: boolean
  holiday_name?: string
  max_batches_per_day: number
  notes?: string
  created_by?: string
  updated_by?: string
  created_at?: string
  updated_at?: string
}

export async function getDateSchedules(): Promise<DateSchedule[]> {
  // Check if we're in demo mode
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // Return empty array in demo mode - schedules are created on-the-fly
    return []
  }

  const { data, error } = await supabase
    .from("date_schedules")
    .select("*")
    .order("schedule_date", { ascending: false })
    .order("block")
    .order("floor_number")

  if (error) throw error
  return data || []
}

export async function getUpcomingDateSchedules(): Promise<DateSchedule[]> {
  const { data, error } = await supabase
    .from("date_schedules")
    .select("*")
    .gte("schedule_date", new Date().toISOString().split('T')[0])
    .order("schedule_date", { ascending: true })
    .order("block")
    .order("floor_number")

  if (error) throw error
  return data || []
}

export async function createDateSchedule(schedule: Omit<DateSchedule, "id" | "created_at" | "updated_at">): Promise<DateSchedule> {
  // Check if we're in demo mode
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // Demo mode - just return a mock schedule
    console.log("Demo mode: Date schedule creation simulated", schedule)
    return {
      ...schedule,
      id: `demo-date-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  // Normalize time formats to HH:MM:SS for PostgreSQL
  const normalizedSchedule = {
    ...schedule,
    pickup_time: schedule.pickup_time.includes(':') && schedule.pickup_time.split(':').length === 2 
      ? `${schedule.pickup_time}:00` 
      : schedule.pickup_time,
    dropoff_start_time: schedule.dropoff_start_time.includes(':') && schedule.dropoff_start_time.split(':').length === 2 
      ? `${schedule.dropoff_start_time}:00` 
      : schedule.dropoff_start_time,
    dropoff_end_time: schedule.dropoff_end_time.includes(':') && schedule.dropoff_end_time.split(':').length === 2 
      ? `${schedule.dropoff_end_time}:00` 
      : schedule.dropoff_end_time,
  }

  const { data, error } = await supabase
    .from("date_schedules")
    .insert([normalizedSchedule])
    .select()
    .single()

  if (error) {
    console.error("Supabase error creating date schedule:", error)
    throw error
  }
  return data
}

export async function updateDateSchedule(id: string, updates: Partial<DateSchedule>): Promise<DateSchedule> {
  // Check if we're in demo mode
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    // Demo mode - just return updated mock schedule
    console.log("Demo mode: Date schedule update simulated", { id, updates })
    return {
      id,
      ...updates,
      block: updates.block || "A",
      floor_number: updates.floor_number || 1,
      schedule_date: updates.schedule_date || new Date().toISOString().split('T')[0],
      pickup_time: updates.pickup_time || "18:00",
      dropoff_start_time: updates.dropoff_start_time || "08:00",
      dropoff_end_time: updates.dropoff_end_time || "10:00",
      is_active: updates.is_active !== undefined ? updates.is_active : true,
      is_holiday: updates.is_holiday !== undefined ? updates.is_holiday : false,
      max_batches_per_day: updates.max_batches_per_day || 50,
    } as DateSchedule
  }

  const { data, error } = await supabase
    .from("date_schedules")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDateSchedule(id: string): Promise<void> {
  // Check if we're in demo mode
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    console.log("Demo mode: Date schedule deletion simulated", id)
    return
  }

  const { error } = await supabase
    .from("date_schedules")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function toggleDateScheduleStatus(id: string, isActive: boolean): Promise<DateSchedule> {
  return updateDateSchedule(id, { is_active: isActive })
}

