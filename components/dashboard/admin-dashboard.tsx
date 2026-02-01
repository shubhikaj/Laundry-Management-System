"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, Package, Settings, Activity } from "lucide-react"
import type { User } from "@/lib/auth"
import { type LaundrySchedule, getAllSchedules, updateSchedule, getAllBatches } from "@/lib/laundry"
import { supabase } from "@/lib/supabase"
import { ScheduleManagement } from "@/components/admin/schedule-management"
import { DateScheduleManagement } from "@/components/admin/date-schedule-management"

interface AdminDashboardProps {
  user: User
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [schedules, setSchedules] = useState<LaundrySchedule[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState<LaundrySchedule | null>(null)
  const [newDay, setNewDay] = useState("")
  const [newTime, setNewTime] = useState("")
  const [selectedBlock, setSelectedBlock] = useState<string>("A")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [schedulesData, batchesData, logsData] = await Promise.all([
        getAllSchedules(),
        getAllBatches(),
        getActivityLogs(),
      ])

      setSchedules(schedulesData)
      setBatches(batchesData)
      setActivityLogs(logsData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityLogs = async () => {
    const isDemo =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL

    if (isDemo) {
      // Return demo activity logs
      return [
        {
          id: "demo-log-1",
          activity_type: "login",
          description: "User logged in successfully",
          created_at: new Date().toISOString(),
          user: { full_name: "John Doe", role: "student" },
        },
        {
          id: "demo-log-2",
          activity_type: "status_change",
          description: "Updated batch LB1234567890 status to ready_for_pickup",
          created_at: new Date(Date.now() - 60000).toISOString(),
          user: { full_name: "Laundry Staff", role: "staff" },
          metadata: { batchId: "demo-batch-1", status: "ready_for_pickup" },
        },
      ]
    }

    const { data, error } = await supabase
      .from("activity_logs")
      .select(`
        *,
        user:users(full_name, role)
      `)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error
    return data
  }

  const handleScheduleUpdate = async () => {
    if (!selectedSchedule || !newDay || !newTime) return

    try {
      await updateSchedule(
        selectedSchedule.id,
        {
          scheduled_day: newDay,
          pickup_time: newTime,
        },
        user.id,
      )

      setSelectedSchedule(null)
      setNewDay("")
      setNewTime("")
      loadData()
    } catch (error) {
      console.error("Failed to update schedule:", error)
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const activeBatches = batches.filter((b) => !["picked_up"].includes(b.status))
  const totalStudents = new Set(batches.map((b) => b.student_id)).size
  const filteredSchedules = schedules.filter((schedule) => schedule.block === selectedBlock)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Using laundry service</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBatches.length}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-xs text-muted-foreground">Floor schedules</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedules" className="space-y-4" onValueChange={() => {
        // Reload data when switching tabs to ensure stats are up to date
        loadData()
      }}>
        <TabsList>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="schedule-management">Schedule Management</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Laundry Schedules</CardTitle>
              <CardDescription>Manage floor-wise laundry schedules by block</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Label className="text-sm font-medium">Select Block</Label>
                <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Block A</SelectItem>
                    <SelectItem value="B">Block B</SelectItem>
                    <SelectItem value="C">Block C</SelectItem>
                    <SelectItem value="D">Block D</SelectItem>
                    <SelectItem value="E">Block E</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Block {selectedBlock} Schedules</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSchedules.map((schedule) => (
                    <Card key={schedule.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Floor {schedule.floor_number}</h4>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSchedule(schedule)
                                setNewDay(schedule.scheduled_day)
                                setNewTime(schedule.pickup_time)
                              }}
                            >
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Schedule</DialogTitle>
                              <DialogDescription>
                                Update schedule for Block {schedule.block} Floor {schedule.floor_number}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Day</label>
                                <Select value={newDay} onValueChange={setNewDay}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="monday">Monday</SelectItem>
                                    <SelectItem value="tuesday">Tuesday</SelectItem>
                                    <SelectItem value="wednesday">Wednesday</SelectItem>
                                    <SelectItem value="thursday">Thursday</SelectItem>
                                    <SelectItem value="friday">Friday</SelectItem>
                                    <SelectItem value="saturday">Saturday</SelectItem>
                                    <SelectItem value="sunday">Sunday</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Pickup Time</label>
                                <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                              </div>

                              <Button onClick={handleScheduleUpdate} className="w-full">
                                Update Schedule
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {schedule.scheduled_day.charAt(0).toUpperCase() + schedule.scheduled_day.slice(1)} at{" "}
                        {schedule.pickup_time.slice(0, 5)}
                      </p>
                    </Card>
                  ))}
                </div>
                {filteredSchedules.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No schedules found for Block {selectedBlock}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule-management">
          <ScheduleManagement />
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle>All Laundry Batches</CardTitle>
              <CardDescription>Overview of all laundry batches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batches.slice(0, 20).map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">#{batch.batch_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {batch.student?.full_name} - Block {batch.student?.block} Floor {batch.student?.floor_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(batch.scheduled_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(batch.status)} text-white`}>{formatStatus(batch.status)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>System activity and audit trail</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{log.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.user?.full_name} ({log.user?.role}) - {new Date(log.created_at).toLocaleString()}
                      </p>
                      {log.metadata && (
                        <pre className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
