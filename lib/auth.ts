import { supabase } from "./supabase"
import bcrypt from "bcryptjs"

// Extended user profile interface for Supabase Auth
interface UserProfile {
  id: string
  email: string
  full_name: string
  role: "student" | "staff" | "admin"
  block?: string
  floor_number?: number
  room_number?: string
  phone?: string
  email_notifications: boolean
  sms_notifications: boolean
}

export interface User {
  id: string
  email: string
  full_name: string
  role: "student" | "staff" | "admin"
  block?: string
  floor_number?: number
  room_number?: string
  phone?: string
  email_notifications: boolean
  sms_notifications: boolean
}

export async function signIn(email: string, password: string) {
  try {
    // In demo/preview mode, use hardcoded credentials
   const demoUsers = {
  "admin@college.edu": {
    id: "admin-demo-id",
    email: "admin@college.edu",
    full_name: "System Administrator",
    role: "admin" as const,
    password: "admin123",
    block: undefined,
    floor_number: undefined,
    room_number: undefined,
    phone: undefined,
  },
  "staff@college.edu": {
    id: "staff-demo-id",
    email: "staff@college.edu",
    full_name: "Laundry Staff",
    role: "staff" as const,
    password: "staff123",
    block: undefined,
    floor_number: undefined,
    room_number: undefined,
    phone: undefined,
  },
  "john.doe@student.college.edu": {
    id: "student-demo-id",
    email: "john.doe@student.college.edu",
    full_name: "John Doe",
    role: "student" as const,
    block: "A",
    floor_number: 1,
    room_number: "101",
    phone: "+1234567890",
    password: "student123",
  },
}

    // Check if we're in demo mode (using placeholder Supabase URL)
    const isDemo =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || 
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === "https://placeholder.supabase.co"

    console.log("Auth mode check:", {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      isDemo,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })

    if (isDemo) {
      // Demo mode authentication
      const demoUser = demoUsers[email as keyof typeof demoUsers]
      if (!demoUser || demoUser.password !== password) {
        throw new Error("Invalid credentials")
      }

      return {
        id: demoUser.id,
        email: demoUser.email,
        full_name: demoUser.full_name,
        role: demoUser.role,
        block: demoUser.block,
        floor_number: demoUser.floor_number,
        room_number: demoUser.room_number,
        phone: demoUser.phone,
        email_notifications: true,
        sms_notifications: false,
      }
    }

    // Production mode - use Supabase Auth
    console.log("Attempting Supabase Auth sign in...")
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log("Auth response:", { authData, authError })

    if (authError || !authData.user) {
      throw new Error("Invalid credentials")
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single()

    console.log("Profile response:", { profile, profileError })

    if (profileError || !profile) {
      throw new Error("User profile not found")
    }

    // Log activity
    await logActivity(authData.user.id, "login", "User logged in successfully")

    return {
      id: authData.user.id,
      email: authData.user.email!,
      full_name: profile.full_name,
      role: profile.role,
      block: profile.block,
      floor_number: profile.floor_number,
      room_number: profile.room_number,
      phone: profile.phone,
      email_notifications: profile.email_notifications,
      sms_notifications: profile.sms_notifications,
    }
  } catch (error) {
    throw error
  }
}

export async function signUp(userData: {
  email: string
  password: string
  full_name: string
  role: "student" | "staff" | "admin"
  block?: string
  floor_number?: number
  room_number?: string
  phone?: string
}) {
  try {
    // Check if we're in demo mode (using placeholder Supabase URL)
    const isDemo =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || 
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === "https://placeholder.supabase.co"

    if (isDemo) {
      // Demo mode - just return success without actually creating user
      console.log("Demo mode: User registration simulated", userData)
      return {
        id: `demo-${Date.now()}`,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        block: userData.block,
        floor_number: userData.floor_number,
        room_number: userData.room_number,
        phone: userData.phone,
        email_notifications: true,
        sms_notifications: false,
      }
    }

    // Production mode - use Supabase Auth
    console.log("Attempting Supabase Auth sign up...")
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })

    console.log("Auth signup response:", { authData, authError })

    if (authError || !authData.user) {
      throw authError || new Error("Failed to create user")
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          full_name: userData.full_name,
          role: userData.role,
          block: userData.block,
          floor_number: userData.floor_number,
          room_number: userData.room_number,
          phone: userData.phone,
          email_notifications: true,
          sms_notifications: false,
        },
      ])
      .select()
      .single()

    console.log("Profile creation response:", { profile, profileError })

    if (profileError) {
      // If profile creation fails, log the error
      // Note: Admin deleteUser requires service role key, handle this on server-side if needed
      console.error("Profile creation failed:", profileError)
      throw new Error("Failed to create user profile. Please contact support.")
    }

    return {
      id: authData.user.id,
      email: authData.user.email!,
      full_name: userData.full_name,
      role: userData.role,
      block: userData.block,
      floor_number: userData.floor_number,
      room_number: userData.room_number,
      phone: userData.phone,
      email_notifications: true,
      sms_notifications: false,
    }
  } catch (error) {
    throw error
  }
}

export async function logActivity(
  userId: string,
  activityType: "login" | "status_change" | "notification_sent" | "schedule_update",
  description: string,
  metadata?: any,
) {
  try {
    await supabase.from("activity_logs").insert([
      {
        user_id: userId,
        activity_type: activityType,
        description,
        metadata,
      },
    ])
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}
