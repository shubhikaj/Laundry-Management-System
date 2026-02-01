import { supabase } from "./supabase"

export interface DateSchedule {
  id: string
  block: string
  floor_number: number
  schedule_date: string
  pickup_time: string
  dropoff_start_time: string
  dropoff_end_time: string
  is_active: boolean
  max_batches_per_day: number
  notes?: string
}

export async function getDateSchedules() {
  const isDemo = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

  if (isDemo) {
    return [
      {
        id: "demo-date-1",
        block: "A",
        floor_number: 1,
        schedule_date: new Date().toISOString().split("T")[0],
        pickup_time: "18:00:00",
        dropoff_start_time: "08:00:00",
        dropoff_end_time: "10:00:00",
        is_active: true,
        max_batches_per_day: 50,
        notes: "Special schedule for today"
      }
    ]
  }

  const { data, error } = await supabase
    .from("date_schedules")
    .select("*")
    .gte("schedule_date", new Date().toISOString().split("T")[0])
    .order("schedule_date", { ascending: true })
    .order("block", { ascending: true })
    .order("floor_number", { ascending: true })

  if (error) throw error
  return data
}

export async function createDateSchedule(schedule: Omit<DateSchedule, "id">) {
  const { data, error } = await supabase
    .from("date_schedules")
    .insert([schedule])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDateSchedule(id: string, updates: Partial<DateSchedule>) {
  const { data, error } = await supabase
    .from("date_schedules")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDateSchedule(id: string) {
  const { error } = await supabase
    .from("date_schedules")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function toggleDateScheduleStatus(id: string) {
  const { data: current, error: fetchError } = await supabase
    .from("date_schedules")
    .select("is_active")
    .eq("id", id)
    .single()

  if (fetchError) throw fetchError

  const { error: updateError } = await supabase
    .from("date_schedules")
    .update({ is_active: !current.is_active })
    .eq("id", id)

  if (updateError) throw updateError
}