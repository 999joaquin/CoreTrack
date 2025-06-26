"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Shield, Eye, Users, BarChart } from "lucide-react"

export function PrivacySettings() {
  const { toast } = useToast()
  const [privacy, setPrivacy] = useState({
    profileVisibility: true,
    activitySharing: false,
    analyticsOptIn: true,
    marketingEmails: false,
    dataCollection: true,
  })

  const handleSave = () => {
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved.",
    })
  }

  const togglePrivacy = (key: string) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Controls
          </CardTitle>
          <CardDescription>Manage your privacy and data sharing preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Profile Visibility</p>
                <p className="text-sm text-muted-foreground">Allow other users to see your profile information</p>
              </div>
            </div>
            <Switch checked={privacy.profileVisibility} onCheckedChange={() => togglePrivacy("profileVisibility")} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Activity Sharing</p>
                <p className="text-sm text-muted-foreground">Share your activity with team members</p>
              </div>
            </div>
            <Switch checked={privacy.activitySharing} onCheckedChange={() => togglePrivacy("activitySharing")} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <BarChart className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Analytics & Insights</p>
                <p className="text-sm text-muted-foreground">Help improve our service by sharing usage analytics</p>
              </div>
            </div>
            <Switch checked={privacy.analyticsOptIn} onCheckedChange={() => togglePrivacy("analyticsOptIn")} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Data Collection</p>
                <p className="text-sm text-muted-foreground">Allow collection of usage data for service improvement</p>
              </div>
            </div>
            <Switch checked={privacy.dataCollection} onCheckedChange={() => togglePrivacy("dataCollection")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Privacy Settings</Button>
      </div>
    </div>
  )
}
