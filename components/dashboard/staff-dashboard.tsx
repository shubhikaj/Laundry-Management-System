"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Package, Users, Clock, CheckCircle, Bell, RotateCcw } from "lucide-react"
import type { User } from "@/lib/auth"
import { type LaundryBatch, getAllBatches, updateBatchStatus } from "@/lib/laundry"
import { toast } from "sonner"

interface StaffDashboardProps {
  user: User
}

export function StaffDashboard({ user }: StaffDashboardProps) {
  const [batches, setBatches] = useState<LaundryBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<LaundryBatch | null>(null)
  const [newStatus, setNewStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBlock, setSelectedBlock] = useState<string>("A")
  const [isDemo, setIsDemo] = useState(false)
  const [originalBatches, setOriginalBatches] = useState<LaundryBatch[]>([])
  const [updatedBatches, setUpdatedBatches] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadBatches()
  }, [])

  const loadBatches = async () => {
    try {
      const data = await getAllBatches()
      setBatches(data)
      
      // Check if we're in demo mode
      const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL
      setIsDemo(isDemoMode)
      
      // Store original demo data for reset functionality
      if (isDemoMode) {
        setOriginalBatches(data)
      }
    } catch (error) {
      console.error("Failed to load batches:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetDemoData = () => {
    if (isDemo && originalBatches.length > 0) {
      setBatches(originalBatches)
      setUpdatedBatches(new Set())
      toast.success("Demo data reset to original state")
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedBatch || !newStatus) return

    try {
      // In demo mode, update the batch immediately in the UI
      if (isDemo) {
        setBatches(prevBatches => 
          prevBatches.map(batch => 
            batch.id === selectedBatch.id 
              ? { 
                  ...batch, 
                  status: newStatus as any,
                  staff_notes: notes || batch.staff_notes,
                  ready_at: newStatus === "ready_for_pickup" ? new Date().toISOString() : batch.ready_at,
                  dropped_off_at: newStatus === "dropped_off" ? new Date().toISOString() : batch.dropped_off_at,
                  picked_up_at: newStatus === "picked_up" ? new Date().toISOString() : batch.picked_up_at
                }
              : batch
          )
        )
        
        // Mark this batch as updated for visual feedback
        setUpdatedBatches(prev => new Set([...prev, selectedBatch.id]))
        
        // Remove the highlight after 3 seconds
        setTimeout(() => {
          setUpdatedBatches(prev => {
            const newSet = new Set(prev)
            newSet.delete(selectedBatch.id)
            return newSet
          })
        }, 3000)
        
        toast.success(`Demo: Updated batch ${selectedBatch.batch_number} to ${newStatus.replace('_', ' ')}`)
        if (newStatus === "ready_for_pickup") {
          toast.info("Demo: Notification sent to student!")
        }
      } else {
        await updateBatchStatus(selectedBatch.id, newStatus as any, user.id, notes)
        loadBatches()
      }
      
      setSelectedBatch(null)
      setNewStatus("")
      setNotes("")
    } catch (error) {
      console.error("Failed to update status:", error)
      toast.error("Failed to update batch status")
    }
  }

  const handleQuickReadyForPickup = async (batch: LaundryBatch) => {
    try {
      // In demo mode, update the batch immediately in the UI
      if (isDemo) {
        setBatches(prevBatches => 
          prevBatches.map(b => 
            b.id === batch.id 
              ? { 
                  ...b, 
                  status: "ready_for_pickup" as any,
                  staff_notes: "Marked ready for pickup",
                  ready_at: new Date().toISOString()
                }
              : b
          )
        )
        
        // Mark this batch as updated for visual feedback
        setUpdatedBatches(prev => new Set([...prev, batch.id]))
        
        // Remove the highlight after 3 seconds
        setTimeout(() => {
          setUpdatedBatches(prev => {
            const newSet = new Set(prev)
            newSet.delete(batch.id)
            return newSet
          })
        }, 3000)
        
        toast.success(`Demo: Batch ${batch.batch_number} marked as ready for pickup!`)
        toast.info(`Demo: Notification sent to ${batch.student?.full_name}!`)
      } else {
        await updateBatchStatus(batch.id, "ready_for_pickup", user.id, "Marked ready for pickup")
        loadBatches()
      }
    } catch (error) {
      console.error("Failed to mark as ready for pickup:", error)
      toast.error("Failed to mark batch as ready")
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

  // Filter batches by selected block and search term
  const filteredBatches = batches.filter((batch) => {
    const matchesBlock = batch.student?.block === selectedBlock
    const matchesSearch =
      batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.student?.room_number?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesBlock && matchesSearch
  })

  const activeBatches = batches.filter((b) => !["picked_up"].includes(b.status))
  const todayBatches = batches.filter((b) => new Date(b.scheduled_date).toDateString() === new Date().toDateString())
  const blockActiveBatches = filteredBatches.filter((b) => !["picked_up"].includes(b.status))

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Today's Batches</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBatches.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.filter((b) => b.status === "ready_for_pickup").length}</div>
            <p className="text-xs text-muted-foreground">Awaiting pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(batches.map((b) => b.student_id)).size}</div>
            <p className="text-xs text-muted-foreground">Using service</p>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Manage Laundry Batches</span>
          </CardTitle>
          <CardDescription>
            Update batch status and add notes by block
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div>
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

            <div>
              <Input
                placeholder="Search by batch number, student name, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Block {selectedBlock} Batches</h3>
              <Badge variant="outline">{blockActiveBatches.length} active batches</Badge>
            </div>

            {filteredBatches.map((batch) => (
              <div 
                key={batch.id} 
                className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-500 ${
                  updatedBatches.has(batch.id) 
                    ? 'border-green-500 bg-green-50 shadow-lg' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">#{batch.batch_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {batch.student?.full_name} - Floor {batch.student?.floor_number} Room{" "}
                        {batch.student?.room_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Scheduled: {new Date(batch.scheduled_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {batch.staff_notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">Notes: {batch.staff_notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusColor(batch.status)} text-white`}>{formatStatus(batch.status)}</Badge>

                  {batch.status === "washing" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleQuickReadyForPickup(batch)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      Ready
                    </Button>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBatch(batch)
                          setNotes(batch.staff_notes || "")
                        }}
                      >
                        Update
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Batch Status</DialogTitle>
                        <DialogDescription>Update the status for batch #{batch.batch_number}</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">New Status</label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="dropped_off">Dropped Off</SelectItem>
                              <SelectItem value="washing">Washing</SelectItem>
                              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                              <SelectItem value="picked_up">Picked Up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Notes</label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this batch..."
                          />
                        </div>

                        <Button onClick={handleStatusUpdate} className="w-full">
                          Update Status
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}

            {filteredBatches.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No batches found for Block {selectedBlock}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
