"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Clock, Building } from "lucide-react"
import { toast } from "sonner"
import {
  type DateSchedule,
  getDateSchedules,
  createDateSchedule,
  updateDateSchedule,
  deleteDateSchedule,
} from "@/lib/date-schedules"

const BLOCKS = ["A", "B", "C", "D", "E"]
const FLOORS = Array.from({ length: 10 }, (_, i) => i + 1)

export function DateScheduleManagement() {
  const [schedules, setSchedules] = useState<DateSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [newSchedule, setNewSchedule] = useState({
    block: "",
    floor_number: "",
    pickup_time: "18:00",
    dropoff_start_time: "08:00",
    dropoff_end_time: "10:00",
    max_batches_per_day: 50,
    notes: "",
  })

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const data = await getDateSchedules()
      setSchedules(data)
    } catch (error) {
      console.error("Failed to load schedules:", error)
      toast.error("Failed to load schedules")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = async () => {
    if (!selectedDate || !newSchedule.block || !newSchedule.floor_number) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      await createDateSchedule({
        ...newSchedule,
        block: newSchedule.block,
        floor_number: parseInt(newSchedule.floor_number.toString()),
        schedule_date: selectedDate.toISOString().split("T")[0],
        is_active: true,
      })
      toast.success("Schedule created successfully")
      loadSchedules()
    } catch (error) {
      console.error("Failed to create schedule:", error)
      toast.error("Failed to create schedule")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Date-Specific Schedule</CardTitle>
          <CardDescription>Set up a schedule for a specific date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label>Block</Label>
                <Select
                  value={newSchedule.block}
                  onValueChange={(value) => setNewSchedule({ ...newSchedule, block: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Block" />
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
                <Label>Floor</Label>
                <Select
                  value={newSchedule.floor_number.toString()}
                  onValueChange={(value) =>
                    setNewSchedule({ ...newSchedule, floor_number: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Floor" />
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
                <Label>Pickup Time</Label>
                <Input
                  type="time"
                  value={newSchedule.pickup_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, pickup_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Drop-off Window</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="time"
                    value={newSchedule.dropoff_start_time}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, dropoff_start_time: e.target.value })
                    }
                  />
                  <Input
                    type="time"
                    value={newSchedule.dropoff_end_time}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, dropoff_end_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleCreateSchedule} className="w-full">
                Create Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date-Specific Schedules</CardTitle>
          <CardDescription>View and manage date-specific schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No date-specific schedules found
              </div>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        Block {schedule.block} - Floor {schedule.floor_number}
                      </p>
                      <Badge variant={schedule.is_active ? "default" : "secondary"}>
                        {schedule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(schedule.schedule_date).toLocaleDateString()} at{" "}
                      {schedule.pickup_time.slice(0, 5)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Drop-off: {schedule.dropoff_start_time.slice(0, 5)} -{" "}
                      {schedule.dropoff_end_time.slice(0, 5)}
                    </p>
                    {schedule.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{schedule.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement edit functionality
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        try {
                          await deleteDateSchedule(schedule.id)
                          toast.success("Schedule deleted")
                          loadSchedules()
                        } catch (error) {
                          console.error("Failed to delete schedule:", error)
                          toast.error("Failed to delete schedule")
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}