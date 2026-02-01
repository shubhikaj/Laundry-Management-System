"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Package, Bell, BellRing } from "lucide-react"
import { NotificationCenter } from "@/components/notifications/notification-center"
import type { User } from "@/lib/auth"
import {
  type LaundryBatch,
  type LaundrySchedule,
  getLaundrySchedule,
  getStudentBatches,
  createBatch,
} from "@/lib/laundry"

interface StudentDashboardProps {
  user: User
}

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [schedule, setSchedule] = useState<LaundrySchedule | null>(null)
  const [batches, setBatches] = useState<LaundryBatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      if (user.block && user.floor_number) {
        const scheduleData = await getLaundrySchedule(user.block, user.floor_number)
        setSchedule(scheduleData)
      }

      const batchesData = await getStudentBatches(user.id)
      setBatches(batchesData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500"
      case "dropped_off":
        return "bg-yellow-500"
      case "washing":
        return "bg-orange-500"
      case "ready_for_pickup":
        return "bg-green-500"
      case "picked_up":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getNextLaundryDate = () => {
    if (!schedule) return null

    const today = new Date()
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const targetDay = dayNames.indexOf(schedule.scheduled_day.toLowerCase())

    const nextDate = new Date(today)
    const currentDay = today.getDay()

    if (currentDay <= targetDay) {
      nextDate.setDate(today.getDate() + (targetDay - currentDay))
    } else {
      nextDate.setDate(today.getDate() + (7 - currentDay + targetDay))
    }

    return nextDate
  }

  const handleScheduleBatch = async () => {
    const nextDate = getNextLaundryDate()
    if (!nextDate) return

    try {
      await createBatch(user.id, nextDate.toISOString().split("T")[0])
      loadData() // Refresh data
    } catch (error) {
      console.error("Failed to schedule batch:", error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const nextDate = getNextLaundryDate()
  const activeBatch = batches.find((batch) =>
    ["scheduled", "dropped_off", "washing", "ready_for_pickup"].includes(batch.status),
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Laundry Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedule ? schedule.scheduled_day.charAt(0).toUpperCase() + schedule.scheduled_day.slice(1) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {nextDate ? nextDate.toLocaleDateString() : "No schedule found"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pickup Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedule ? schedule.pickup_time.slice(0, 5) : "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              Block {user.block} - Floor {user.floor_number}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.filter((b) => !["picked_up"].includes(b.status)).length}</div>
            <p className="text-xs text-muted-foreground">Total batches: {batches.length}</p>
          </CardContent>
        </Card>
      </div>

      {activeBatch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Current Batch Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Batch #{activeBatch.batch_number}</p>
                <p className="text-sm text-muted-foreground">
                  Scheduled: {new Date(activeBatch.scheduled_date).toLocaleDateString()}
                </p>
              </div>
              <Badge className={`${getStatusColor(activeBatch.status)} text-white`}>
                {formatStatus(activeBatch.status)}
              </Badge>
            </div>
            {activeBatch.staff_notes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Staff Notes:</p>
                <p className="text-sm text-muted-foreground">{activeBatch.staff_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!activeBatch && schedule && nextDate && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Your Next Laundry</CardTitle>
            <CardDescription>
              Your next laundry day is {schedule.scheduled_day} at {schedule.pickup_time.slice(0, 5)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleScheduleBatch} className="w-full">
              Schedule Batch for {nextDate.toLocaleDateString()}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Batches</span>
            {user.id && <NotificationCenter userId={user.id} />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {batches.slice(0, 5).map((batch) => (
              <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">#{batch.batch_number}</p>
                  <p className="text-sm text-muted-foreground">{new Date(batch.scheduled_date).toLocaleDateString()}</p>
                </div>
                <Badge className={`${getStatusColor(batch.status)} text-white`}>{formatStatus(batch.status)}</Badge>
              </div>
            ))}
            {batches.length === 0 && <p className="text-center text-muted-foreground py-4">No laundry batches yet</p>}
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
          <CardDescription>
            Stay updated with your laundry status and important announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {batches
              .filter(batch => batch.status === "ready_for_pickup")
              .map((batch) => (
                <div key={batch.id} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <BellRing className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">
                      Your laundry is ready for pickup!
                    </p>
                    <p className="text-sm text-green-700">
                      Batch #{batch.batch_number} • Scheduled for {new Date(batch.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Ready
                  </Badge>
                </div>
              ))}
            
            {batches.filter(batch => batch.status === "ready_for_pickup").length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No new notifications</p>
                <p className="text-sm">You'll receive notifications when your laundry is ready for pickup</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
