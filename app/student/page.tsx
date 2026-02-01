"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import type { User } from "@/lib/auth"

export default function StudentPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "student") {
      router.push("/")
      return
    }

    setUser(parsedUser)
  }, [router])

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.full_name}!</p>
        </div>
        <StudentDashboard user={user} />
      </main>
    </div>
  )
}
