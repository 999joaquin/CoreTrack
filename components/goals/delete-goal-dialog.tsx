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
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, Loader2 } from "lucide-react"
import { logActivity } from "@/lib/activity-actions"

interface Goal {
  id: string
  title: string
  description: string | null
  project_id: string
  target_value: number
  current_value: number
}

interface DeleteGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal | null
  onSuccess: () => void
}

export function DeleteGoalDialog({ open, onOpenChange, goal, onSuccess }: DeleteGoalDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!goal) return

    console.log("=== DELETE GOAL DEBUG ===")
    console.log("Attempting to delete goal:", goal.id)
    console.log("Goal details:", goal)

    setLoading(true)

    try {
      const { data, error } = await supabase.from("goals").delete().eq("id", goal.id)

      console.log("Delete result:", { data, error })

      if (error) {
        console.log("Delete failed with error:", error)
        throw error
      }

      console.log("Delete successful, calling onSuccess...")

      // Log activity
      try {
        await logActivity({
          action: "deleted",
          entity_type: "goal",
          entity_id: goal.id,
          details: {
            goal_title: goal.title,
            target_value: goal.target_value,
            current_value: goal.current_value,
            progress_percentage: Math.round((goal.current_value / goal.target_value) * 100),
          },
        })
        console.log("Activity logged successfully")
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
        // Don't fail the deletion if activity logging fails
      }

      console.log("Closing dialog and calling onSuccess callback...")
      onOpenChange(false)

      console.log("Calling onSuccess function...")
      onSuccess()

      console.log("onSuccess called, showing toast...")
      toast({
        title: "Success",
        description: "Goal deleted successfully",
      })

      console.log("=== DELETE GOAL COMPLETE ===")
    } catch (error: any) {
      console.error("Error deleting goal:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Goal
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{goal?.title}"? This action cannot be undone and will also remove all task
            associations with this goal.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
