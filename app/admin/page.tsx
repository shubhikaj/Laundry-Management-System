"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import type { User } from "@/lib/auth"

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "admin") {
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System administration and management</p>
        </div>
        <AdminDashboard user={user} />
      </main>
    </div>
  )
}
