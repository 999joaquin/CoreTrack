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

interface Task {
  id: string
  title: string
  description: string | null
  project_id: string
  assigned_to: string | null
  status: "todo" | "in_progress" | "completed"
  priority: "low" | "medium" | "high"
  due_date: string | null
  parent_task_id: string | null
}

interface DeleteTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task | null
  onSuccess: () => void
}

export function DeleteTaskDialog({ open, onOpenChange, task, onSuccess }: DeleteTaskDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!task) return

    setLoading(true)

    try {
      console.log("=== DELETE TASK DEBUG ===")
      console.log("Attempting to delete task:", task.id)
      console.log("Task details:", task)

      // Delete the task
      const { data, error } = await supabase.from("tasks").delete().eq("id", task.id).select()

      console.log("Delete result:", { data, error })

      if (error) {
        console.error("Supabase delete error:", error)
        throw error
      }

      console.log("Delete successful, calling onSuccess...")

      // Log activity (user_id is handled internally by logActivity)
      try {
        await logActivity({
          action: "delete",
          entity_type: "task",
          entity_id: task.id,
          details: {
            task_title: task.title,
            project_id: task.project_id,
            status: task.status,
            priority: task.priority,
          },
        })
        console.log("Activity logged successfully")
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
        // Don't fail the deletion if activity logging fails
      }

      // Close dialog and trigger success callback
      console.log("Closing dialog and calling onSuccess callback...")
      onOpenChange(false)

      // Call onSuccess to refresh the task list
      console.log("Calling onSuccess function...")
      onSuccess()

      console.log("onSuccess called, showing toast...")
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })

      console.log("=== DELETE TASK COMPLETE ===")
    } catch (error: any) {
      console.error("Error deleting task:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
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
            Delete Task
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{task?.title}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
