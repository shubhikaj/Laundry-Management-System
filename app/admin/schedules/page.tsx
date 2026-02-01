"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScheduleManagement } from "@/components/admin/schedule-management"
import { DateScheduleManagement } from "@/components/admin/date-schedule-management"

export default function SchedulesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Laundry Schedules</h1>
      <Tabs defaultValue="regular" className="space-y-4">
        <TabsList>
          <TabsTrigger value="regular">Regular Schedules</TabsTrigger>
          <TabsTrigger value="date-specific">Date-Specific Schedules</TabsTrigger>
        </TabsList>
        <TabsContent value="regular">
          <ScheduleManagement />
        </TabsContent>
        <TabsContent value="date-specific">
          <DateScheduleManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}