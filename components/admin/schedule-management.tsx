"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Building, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  getLaundrySchedules,
  createLaundrySchedule,
  updateLaundrySchedule,
  deleteLaundrySchedule,
  toggleScheduleStatus as toggleScheduleStatusDB,
  getDateSchedules,
  createDateSchedule,
  updateDateSchedule,
  deleteDateSchedule,
  toggleDateScheduleStatus as toggleDateScheduleStatusDB,
  type LaundrySchedule,
  type DateSchedule,
} from "@/lib/schedule-management"

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
]

const BLOCKS = ["A", "B", "C", "D", "E"]
const FLOORS = Array.from({ length: 10 }, (_, i) => i + 1)

export function ScheduleManagement() {
  const [schedules, setSchedules] = useState<LaundrySchedule[]>([])
  const [dateSchedules, setDateSchedules] = useState<DateSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    block: "",
    floor_number: "",
    scheduled_day: "",
    pickup_time: "18:00",
    dropoff_start_time: "08:00",
    dropoff_end_time: "10:00",
    max_batches_per_day: 50,
  })
  const [newDateSchedule, setNewDateSchedule] = useState({
    schedule_date: "",
    block: "",
    floor_number: "",
    pickup_time: "18:00",
    dropoff_start_time: "08:00",
    dropoff_end_time: "10:00",
    is_active: true,
    is_holiday: false,
    holiday_name: "",
    max_batches_per_day: 50,
    notes: "",
  })

  // Load data on component mount
  useEffect(() => {
    loadSchedules()
    loadDateSchedules()
  }, [])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const data = await getLaundrySchedules()
      setSchedules(data)
    } catch (error) {
      console.error("Failed to load schedules:", error)
      toast.error("Failed to load schedules")
    } finally {
      setLoading(false)
    }
  }

  const loadDateSchedules = async () => {
    try {
      const data = await getDateSchedules()
      setDateSchedules(data)
    } catch (error) {
      console.error("Failed to load date schedules:", error)
      toast.error("Failed to load date schedules")
    }
  }

  const handleToggleScheduleStatus = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    if (!schedule) {
      console.error("Schedule not found in local state:", scheduleId)
      toast.error("Could not find schedule to update")
      return
    }

    try {
      console.log("Toggling schedule status:", {
        scheduleId,
        currentStatus: schedule.is_active,
        newStatus: !schedule.is_active
      })
      
      await toggleScheduleStatusDB(scheduleId, !schedule.is_active)
      
      // Optimistically update the UI
      setSchedules(prev => 
        prev.map(s => s.id === scheduleId ? { ...s, is_active: !s.is_active } : s)
      )
      
      // Refresh data from server to ensure consistency
      await loadSchedules()
      
      toast.success(`Schedule ${!schedule.is_active ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      // Log detailed error information
      console.error("Failed to toggle schedule status:", {
        error,
        scheduleId,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined
      })
      
      // Check for specific error types
      let errorMessage = "Failed to update schedule status"
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          errorMessage = "Schedule not found in database"
        } else if (error.message.includes("permission denied")) {
          errorMessage = "You don't have permission to update schedules"
        }
      }
      
      // Revert optimistic update
      await loadSchedules()
      toast.error(errorMessage)
    }
  }

  const addNewSchedule = async () => {
    if (!newSchedule.block || !newSchedule.floor_number || !newSchedule.scheduled_day) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      console.log("Creating schedule with data:", newSchedule)
      await createLaundrySchedule({
        block: newSchedule.block,
        floor_number: parseInt(newSchedule.floor_number),
        scheduled_day: newSchedule.scheduled_day,
        pickup_time: newSchedule.pickup_time,
        dropoff_start_time: newSchedule.dropoff_start_time,
        dropoff_end_time: newSchedule.dropoff_end_time,
        is_active: true,
        max_batches_per_day: newSchedule.max_batches_per_day,
      })

      setNewSchedule({
        block: "",
        floor_number: "",
        scheduled_day: "",
        pickup_time: "18:00",
        dropoff_start_time: "08:00",
        dropoff_end_time: "10:00",
        max_batches_per_day: 50,
      })

      await loadSchedules()
      toast.success("Schedule added successfully")
    } catch (error) {
      console.error("Failed to add schedule:", error)
      toast.error("Failed to add schedule")
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteLaundrySchedule(scheduleId)
        await loadSchedules()
        toast.success("Schedule deleted successfully")
      } catch (error) {
        console.error("Failed to delete schedule:", error)
        toast.error("Failed to delete schedule")
      }
    }
  }

  const addNewDateSchedule = async () => {
    if (!newDateSchedule.block || !newDateSchedule.floor_number || !newDateSchedule.schedule_date) {
      toast.error("Please fill in all required fields")
      return
    }

    const floorNumber = parseInt(newDateSchedule.floor_number)
    if (isNaN(floorNumber)) {
      toast.error("Invalid floor number")
      return
    }

    try {
      console.log("Creating date schedule with data:", {
        ...newDateSchedule,
        floor_number: floorNumber
      })
      
      const createdSchedule = await createDateSchedule({
        block: newDateSchedule.block,
        floor_number: floorNumber,
        schedule_date: newDateSchedule.schedule_date,
        pickup_time: newDateSchedule.pickup_time,
        dropoff_start_time: newDateSchedule.dropoff_start_time,
        dropoff_end_time: newDateSchedule.dropoff_end_time,
        is_active: newDateSchedule.is_active,
        is_holiday: newDateSchedule.is_holiday,
        holiday_name: newDateSchedule.holiday_name.trim() ? newDateSchedule.holiday_name.trim() : undefined,
        max_batches_per_day: newDateSchedule.max_batches_per_day,
        notes: newDateSchedule.notes.trim() ? newDateSchedule.notes.trim() : undefined,
      })

      // Update local state with the created schedule
      setDateSchedules(prev => [createdSchedule, ...prev])

      setNewDateSchedule({
        schedule_date: "",
        block: "",
        floor_number: "",
        pickup_time: "18:00",
        dropoff_start_time: "08:00",
        dropoff_end_time: "10:00",
        is_active: true,
        is_holiday: false,
        holiday_name: "",
        max_batches_per_day: 50,
        notes: "",
      })

      toast.success("Date schedule added successfully")
    } catch (error) {
      console.error("Failed to add date schedule:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Check if it's a Supabase error with details
      const supabaseError = error as { code?: string; details?: string; message?: string }
      let errorMessage = "An error occurred while creating the schedule"
      
      if (supabaseError.code) {
        switch (supabaseError.code) {
          case "23505": // Unique violation
            errorMessage = "A schedule for this block, floor and date already exists"
            break
          case "23503": // Foreign key violation
            errorMessage = "Invalid block or floor number"
            break
          case "22007": // Invalid datetime format
            errorMessage = "Invalid date or time format"
            break
          default:
            errorMessage = supabaseError.message || "Database error occurred"
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast.error(`Failed to add date schedule: ${errorMessage}`)
    }
  }

  const handleDeleteDateSchedule = async (scheduleId: string) => {
    if (confirm("Are you sure you want to delete this date schedule?")) {
      try {
        await deleteDateSchedule(scheduleId)
        // Update local state by removing the deleted schedule
        setDateSchedules(prev => prev.filter(s => s.id !== scheduleId))
        toast.success("Date schedule deleted successfully")
      } catch (error) {
        console.error("Failed to delete date schedule:", error)
        toast.error("Failed to delete date schedule")
      }
    }
  }

  const handleToggleDateScheduleStatus = async (scheduleId: string) => {
    const schedule = dateSchedules.find(s => s.id === scheduleId)
    if (!schedule) return

    try {
      await toggleDateScheduleStatusDB(scheduleId, !schedule.is_active)
      // Update local state by toggling the schedule status
      setDateSchedules(prev => 
        prev.map(s => s.id === scheduleId ? { ...s, is_active: !s.is_active } : s)
      )
      toast.success("Date schedule status updated")
    } catch (error) {
      console.error("Failed to toggle date schedule status:", error)
      toast.error("Failed to update date schedule status")
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schedule Management</h2>
          <p className="text-muted-foreground">
            Manage laundry schedules for all blocks and floors
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Weekly Schedules</TabsTrigger>
          <TabsTrigger value="add-schedule">Add Weekly Schedule</TabsTrigger>
          <TabsTrigger value="date-schedules">Date-wise Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Weekly Schedules</CardTitle>
              <CardDescription>
                View and manage all laundry schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p>Loading schedules...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Building className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">
                            Block {schedule.block} - Floor {schedule.floor_number}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="capitalize">{schedule.scheduled_day}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span>Pickup: {schedule.pickup_time}</span>
                          <span>Dropoff: {schedule.dropoff_start_time}-{schedule.dropoff_end_time}</span>
                        </div>
                        <Badge variant={schedule.is_active ? "default" : "secondary"}>
                          {schedule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={schedule.is_active}
                          onCheckedChange={() => handleToggleScheduleStatus(schedule.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {schedules.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No schedules found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add-schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Weekly Schedule</CardTitle>
              <CardDescription>
                Create a custom schedule for a specific block and floor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="block">Block</Label>
                  <Select value={newSchedule.block} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, block: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select block" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOCKS.map((block) => (
                        <SelectItem key={block} value={block}>
                          Block {block}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="floor">Floor</Label>
                  <Select value={newSchedule.floor_number} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, floor_number: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLOORS.map((floor) => (
                        <SelectItem key={floor} value={floor.toString()}>
                          Floor {floor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="day">Day</Label>
                  <Select value={newSchedule.scheduled_day} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, scheduled_day: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pickup">Pickup Time</Label>
                  <Input
                    id="pickup"
                    type="time"
                    value={newSchedule.pickup_time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, pickup_time: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="dropoff-start">Dropoff Start</Label>
                  <Input
                    id="dropoff-start"
                    type="time"
                    value={newSchedule.dropoff_start_time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, dropoff_start_time: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="dropoff-end">Dropoff End</Label>
                  <Input
                    id="dropoff-end"
                    type="time"
                    value={newSchedule.dropoff_end_time}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, dropoff_end_time: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="max-batches">Max Batches per Day</Label>
                  <Input
                    id="max-batches"
                    type="number"
                    value={newSchedule.max_batches_per_day}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, max_batches_per_day: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Button onClick={addNewSchedule} className="mt-4" disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="date-schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Date-wise Schedules</CardTitle>
              <CardDescription>
                Manage laundry schedules for specific dates with holiday support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add New Date Schedule Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Date Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="schedule-date">Schedule Date</Label>
                        <Input
                          id="schedule-date"
                          type="date"
                          value={newDateSchedule.schedule_date}
                          onChange={(e) => setNewDateSchedule(prev => ({ ...prev, schedule_date: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="date-block">Block</Label>
                        <Select value={newDateSchedule.block} onValueChange={(value) => setNewDateSchedule(prev => ({ ...prev, block: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select block" />
                          </SelectTrigger>
                          <SelectContent>
                            {BLOCKS.map((block) => (
                              <SelectItem key={block} value={block}>
                                Block {block}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="date-floor">Floor</Label>
                        <Select value={newDateSchedule.floor_number} onValueChange={(value) => setNewDateSchedule(prev => ({ ...prev, floor_number: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select floor" />
                          </SelectTrigger>
                          <SelectContent>
                            {FLOORS.map((floor) => (
                              <SelectItem key={floor} value={floor.toString()}>
                                Floor {floor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="date-pickup">Pickup Time</Label>
                        <Input
                          id="date-pickup"
                          type="time"
                          value={newDateSchedule.pickup_time}
                          onChange={(e) => setNewDateSchedule(prev => ({ ...prev, pickup_time: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="date-dropoff-start">Dropoff Start</Label>
                        <Input
                          id="date-dropoff-start"
                          type="time"
                          value={newDateSchedule.dropoff_start_time}
                          onChange={(e) => setNewDateSchedule(prev => ({ ...prev, dropoff_start_time: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="date-dropoff-end">Dropoff End</Label>
                        <Input
                          id="date-dropoff-end"
                          type="time"
                          value={newDateSchedule.dropoff_end_time}
                          onChange={(e) => setNewDateSchedule(prev => ({ ...prev, dropoff_end_time: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="date-max-batches">Max Batches per Day</Label>
                        <Input
                          id="date-max-batches"
                          type="number"
                          value={newDateSchedule.max_batches_per_day}
                          onChange={(e) => setNewDateSchedule(prev => ({ ...prev, max_batches_per_day: parseInt(e.target.value) }))}
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newDateSchedule.is_holiday}
                            onCheckedChange={(checked) => setNewDateSchedule(prev => ({ ...prev, is_holiday: checked }))}
                          />
                          <Label>Is Holiday</Label>
                        </div>
                      </div>

                      {newDateSchedule.is_holiday && (
                        <div>
                          <Label htmlFor="holiday-name">Holiday Name</Label>
                          <Input
                            id="holiday-name"
                            value={newDateSchedule.holiday_name}
                            onChange={(e) => setNewDateSchedule(prev => ({ ...prev, holiday_name: e.target.value }))}
                            placeholder="Enter holiday name"
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="date-notes">Notes (Optional)</Label>
                      <Textarea
                        id="date-notes"
                        value={newDateSchedule.notes}
                        onChange={(e) => setNewDateSchedule(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>

                    <Button onClick={addNewDateSchedule} className="mt-4" disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Date Schedule
                    </Button>
                  </CardContent>
                </Card>

                {/* Date Schedules List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Current Date Schedules</CardTitle>
                    <CardDescription>
                      View and manage all date-specific schedules
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dateSchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-5 w-5 text-blue-600" />
                              <span className="font-medium">{formatDate(schedule.schedule_date)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4 text-green-600" />
                              <span>Block {schedule.block} - Floor {schedule.floor_number}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span>Pickup: {schedule.pickup_time}</span>
                              <span>Dropoff: {schedule.dropoff_start_time}-{schedule.dropoff_end_time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={schedule.is_active ? "default" : "secondary"}>
                                {schedule.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {schedule.is_holiday && (
                                <Badge variant="destructive">
                                  Holiday: {schedule.holiday_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={schedule.is_active}
                              onCheckedChange={() => handleToggleDateScheduleStatus(schedule.id)}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDateSchedule(schedule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {dateSchedules.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No date schedules found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
