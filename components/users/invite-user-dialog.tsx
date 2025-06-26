"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mail, CheckCircle } from "lucide-react"
import { inviteUserByEmail } from "@/lib/admin-actions"
import { logActivity } from "@/lib/activity-actions"

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<"admin" | "user">("user")
  const [invitationSent, setInvitationSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await inviteUserByEmail(email, fullName, role)

      if (result.success) {
        setInvitationSent(true)
        toast({
          title: "Invitation Sent Successfully",
          description: `An invitation email has been sent to ${email}. They will receive instructions to set up their account.`,
        })

        // Log user invitation activity
        try {
          await logActivity({
            action: "invited",
            entity_type: "user",
            entity_id: email, // Use email as ID since user doesn't exist yet
            details: {
              email: email,
              full_name: fullName,
              role: role,
              invitation_method: "email",
            },
          })
        } catch (activityError) {
          console.error("Failed to log activity:", activityError)
        }

        // Don't close immediately, show success state
        setTimeout(() => {
          // Reset form
          setEmail("")
          setFullName("")
          setRole("user")
          setInvitationSent(false)
          onSuccess()
        }, 2000)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error inviting user:", error)
      toast({
        title: "Failed to Send Invitation",
        description: error.message || "There was an error sending the invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setEmail("")
      setFullName("")
      setRole("user")
      setInvitationSent(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {invitationSent ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Mail className="h-5 w-5" />}
            {invitationSent ? "Invitation Sent!" : "Invite New User"}
          </DialogTitle>
          <DialogDescription>
            {invitationSent
              ? `The invitation has been sent to ${email}. They will receive an email with instructions to join your team.`
              : "Send an invitation to a new team member. They will receive an email to set up their account."}
          </DialogDescription>
        </DialogHeader>

        {invitationSent ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                    Invitation sent successfully!
                  </h4>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <p>
                      • Email sent to: <strong>{email}</strong>
                    </p>
                    <p>
                      • Role assigned: <strong>{role}</strong>
                    </p>
                    <p>• They will receive login instructions via email</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">What happens next?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• The user will receive an email invitation</li>
                <li>• They can click the link to set their password</li>
                <li>• Once confirmed, they'll have {role} access to CoreTrack</li>
                <li>• You can manage their permissions in the Users section</li>
              </ul>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name (optional)"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as "admin" | "user")} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Regular User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {role === "admin"
                  ? "Administrators can manage users, projects, and all system settings."
                  : "Regular users can create and manage their own projects and tasks."}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Email Invitation</h4>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• An invitation email will be sent to {email || "the user"}</li>
                    <li>• They can click the link to set up their password</li>
                    <li>• Once confirmed, they'll have {role} access to CoreTrack</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !email.trim()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
