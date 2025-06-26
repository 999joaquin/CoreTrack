"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/router"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { logActivity } from "@/lib/utils"

interface NotificationPreferences {
  email_updates?: boolean
  push_notifications?: boolean
  sms_notifications?: boolean
}

const NotificationSettings = () => {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const user = session?.user

  const [formData, setFormData] = useState<NotificationPreferences>({})
  const [currentPreferences, setCurrentPreferences] = useState<NotificationPreferences>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPreferences = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/user/notification-preferences`)
        if (response.ok) {
          const data = await response.json()
          setCurrentPreferences(data.preferences)
          setFormData(data.preferences)
        } else {
          console.error("Failed to fetch notification preferences")
        }
      } catch (error) {
        console.error("Error fetching notification preferences:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreferences()
  }, [session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    setFormData({ ...formData, [name]: e.target.checked })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/user/notification-preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Notification settings updated successfully.",
        })
        setCurrentPreferences(formData)
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "Failed to update notification settings.",
        })
        console.error("Failed to update notification settings")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Failed to update notification settings.",
      })
      console.error("Error updating notification settings:", error)
    } finally {
      setIsLoading(false)
    }

    // Log notification settings update activity
    try {
      await logActivity({
        action: "notification_settings_updated",
        entity_type: "settings",
        entity_id: user?.id || "unknown",
        details: {
          updated_preferences: Object.keys(formData).filter(
            (key) => formData[key] !== (currentPreferences?.[key] || false),
          ),
        },
      })
    } catch (activityError) {
      console.error("Failed to log activity:", activityError)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="email_updates">Email Updates</Label>
          <Switch
            id="email_updates"
            checked={formData.email_updates || false}
            onCheckedChange={(checked) => handleChange({ target: { checked } } as any, "email_updates")}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="push_notifications">Push Notifications</Label>
          <Switch
            id="push_notifications"
            checked={formData.push_notifications || false}
            onCheckedChange={(checked) => handleChange({ target: { checked } } as any, "push_notifications")}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="sms_notifications">SMS Notifications</Label>
          <Switch
            id="sms_notifications"
            checked={formData.sms_notifications || false}
            onCheckedChange={(checked) => handleChange({ target: { checked } } as any, "sms_notifications")}
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? "Updating..." : "Update Preferences"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NotificationSettings
