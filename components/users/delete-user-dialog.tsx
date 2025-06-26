"use client"

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
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Loader2 } from "lucide-react"
import { deleteUserById } from "@/lib/admin-actions"
import { logActivity } from "@/lib/activity-actions"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: "admin" | "user"
}

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfile | null
  onSuccess: () => void
}

export function DeleteUserDialog({ open, onOpenChange, user, onSuccess }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!user || confirmEmail !== user.email) return

    setLoading(true)

    try {
      // Log user deletion activity
      try {
        await logActivity({
          action: "deleted",
          entity_type: "user",
          entity_id: user.id,
          details: {
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            deletion_method: "admin_action",
          },
        })
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
      }

      const result = await deleteUserById(user.id)

      if (result.success) {
        toast({
          title: "User Deleted",
          description: `User account for ${user.email} has been permanently deleted.`,
        })
        onSuccess()
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isConfirmValid = confirmEmail === user?.email

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete User Account
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete the user account for <strong>{user?.full_name || user?.email}</strong>{" "}
            and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-destructive mb-2">Warning: This action cannot be undone</h4>
            <ul className="text-sm text-destructive/80 space-y-1">
              <li>• The user will be completely removed from Supabase Auth</li>
              <li>• All projects created by this user will be deleted</li>
              <li>• All tasks assigned to this user will be unassigned</li>
              <li>• All expenses created by this user will be deleted</li>
              <li>• The user will lose access to the system immediately</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmEmail">
              Type <strong>{user?.email}</strong> to confirm deletion
            </Label>
            <Input
              id="confirmEmail"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Enter email to confirm"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || !isConfirmValid}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete User Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
