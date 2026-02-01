"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing, Settings, Mail, MessageSquare, Clock, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { 
  Notification, 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUserNotificationPreferences,
  updateNotificationPreferences
} from "@/lib/notifications"
import { toast } from "sonner"

interface NotificationCenterProps {
  userId: string
  className?: string
}

export function NotificationCenter({ userId, className }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
  })

  useEffect(() => {
    if (userId) {
      loadNotifications()
      loadUnreadCount()
      loadPreferences()
    }
  }, [userId])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await getUserNotifications(userId)
      setNotifications(data || [])
    } catch (error) {
      console.error("Failed to load notifications:", error)
      setNotifications([])
      // Only show toast in non-demo mode to avoid spam
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder")) {
        toast.error("Failed to load notifications")
      }
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount(userId)
      setUnreadCount(count || 0)
    } catch (error) {
      console.error("Failed to load unread count:", error)
      setUnreadCount(0)
    }
  }

  const loadPreferences = async () => {
    try {
      const prefs = await getUserNotificationPreferences(userId)
      setPreferences(prefs || {
        email_notifications: true,
        sms_notifications: false,
      })
    } catch (error) {
      console.error("Failed to load preferences:", error)
      setPreferences({
        email_notifications: true,
        sms_notifications: false,
      })
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, delivered: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      toast.success("Notification marked as read")
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId)
      setNotifications(prev => prev.map(n => ({ ...n, delivered: true })))
      setUnreadCount(0)
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      toast.error("Failed to mark all notifications as read")
    }
  }

  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    try {
      const newPreferences = { ...preferences, [key]: value }
      setPreferences(newPreferences)
      await updateNotificationPreferences(userId, { [key]: value })
      toast.success("Notification preferences updated")
    } catch (error) {
      console.error("Failed to update preferences:", error)
      toast.error("Failed to update preferences")
      // Revert the change
      setPreferences(prev => ({ ...prev, [key]: !value }))
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-6 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <BellRing className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No notifications yet
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 hover:bg-accent rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(notification.sent_at)}
                        </span>
                        {notification.batch && (
                          <Badge variant="outline" className="text-xs">
                            {notification.batch.batch_number}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!notification.delivered && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <Label htmlFor="email-notifications" className="text-sm">
                Email notifications
              </Label>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => handlePreferenceChange("email_notifications", checked)}
            />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <Label htmlFor="sms-notifications" className="text-sm">
                SMS notifications
              </Label>
            </div>
            <Switch
              id="sms-notifications"
              checked={preferences.sms_notifications}
              onCheckedChange={(checked) => handlePreferenceChange("sms_notifications", checked)}
            />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
