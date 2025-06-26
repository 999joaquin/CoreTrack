"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { logActivity } from "@/lib/activity-actions"

export function SecuritySettings() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isToggling2FA, setIsToggling2FA] = useState(false)

  const supabase = createClient()

  const handlePasswordChange = useCallback(async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in both password fields.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsChangingPassword(true)

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setNewPassword("")
      setConfirmPassword("")

      toast({
        title: "Success",
        description: "Password changed successfully!",
      })

      // Log password change activity
      try {
        await logActivity({
          action: "password_changed",
          entity_type: "security",
          entity_id: "user_security",
          details: {
            method: "settings_page",
          },
        })
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }, [newPassword, confirmPassword, supabase.auth])

  const handle2FAToggle = useCallback(async () => {
    setIsToggling2FA(true)
    try {
      // This is a placeholder - actual 2FA implementation would go here
      setTwoFactorEnabled(!twoFactorEnabled)

      toast({
        title: "Success",
        description: `Two-factor authentication ${!twoFactorEnabled ? "enabled" : "disabled"} successfully!`,
      })

      // Log 2FA toggle activity
      try {
        await logActivity({
          action: twoFactorEnabled ? "2fa_disabled" : "2fa_enabled",
          entity_type: "security",
          entity_id: "user_security",
          details: {
            method: "settings_page",
            previous_state: twoFactorEnabled,
            new_state: !twoFactorEnabled,
          },
        })
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle 2FA.",
        variant: "destructive",
      })
    } finally {
      setIsToggling2FA(false)
    }
  }, [twoFactorEnabled])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
            {isChangingPassword ? "Changing Password..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="2fa">Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled ? "Two-factor authentication is enabled" : "Two-factor authentication is disabled"}
              </p>
            </div>
            <Switch id="2fa" checked={twoFactorEnabled} onCheckedChange={handle2FAToggle} disabled={isToggling2FA} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Login Sessions</Label>
              <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
            </div>
            <Button variant="outline" size="sm">
              View Sessions
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security Log</Label>
              <p className="text-sm text-muted-foreground">View recent security-related activities</p>
            </div>
            <Button variant="outline" size="sm">
              View Log
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
