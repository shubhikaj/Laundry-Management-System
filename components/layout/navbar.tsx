"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, LogOut, Settings } from "lucide-react"
import type { User as UserType } from "@/lib/auth"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { ErrorBoundary, SimpleErrorFallback } from "@/components/error-boundary"

export function Navbar() {
  const [user, setUser] = useState<UserType | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) return null

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500"
      case "staff":
        return "bg-blue-500"
      case "student":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "staff":
        return "bg-blue-100 text-blue-800"
      case "student":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">LMS</h1>
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {user.role === "student" &&
                  user.block &&
                  user.floor_number &&
                  `Block ${user.block} - Floor ${user.floor_number}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.role === "student" && user.id && (
              <ErrorBoundary fallback={SimpleErrorFallback}>
                <NotificationCenter userId={user.id} />
              </ErrorBoundary>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={`${getRoleColor(user.role)} text-white`}>
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfile(true)}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className={`${getRoleColor(user.role)} text-white text-lg`}>
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{user.full_name}</h2>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}
                >
                  {user.role}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription>Your account information and details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Email:</span>
              <span className="col-span-2 text-sm">{user.email}</span>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">Role:</span>
              <span className="col-span-2 text-sm capitalize">{user.role}</span>
            </div>

            {user.role === "student" && (
              <>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">Block:</span>
                  <span className="col-span-2 text-sm">{user.block}</span>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">Floor:</span>
                  <span className="col-span-2 text-sm">{user.floor_number}</span>
                </div>

                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">Room:</span>
                  <span className="col-span-2 text-sm">{user.room_number}</span>
                </div>
              </>
            )}

            {user.phone && (
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">Phone:</span>
                <span className="col-span-2 text-sm">{user.phone}</span>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Notification Preferences</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email Notifications</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${user.email_notifications ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {user.email_notifications ? "Enabled" : "Disabled"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">SMS Notifications</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${user.sms_notifications ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {user.sms_notifications ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {user.role === "student" && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Hostel Information</h3>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Location:</span> Block {user.block}, Floor {user.floor_number}, Room{" "}
                    {user.room_number}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowProfile(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
