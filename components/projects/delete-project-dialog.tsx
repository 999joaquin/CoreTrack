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

interface Project {
  id: string
  title: string
  description: string | null
  deadline: string | null
  budget: number | null
  status: string
  created_by: string | null
}

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  onSuccess: () => void
}

export function DeleteProjectDialog({ open, onOpenChange, project, onSuccess }: DeleteProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!project) return

    console.log("=== DELETE PROJECT DEBUG ===")
    console.log("Attempting to delete project:", project.id)
    console.log("Project details:", project)

    setLoading(true)

    try {
      const { data, error } = await supabase.from("projects").delete().eq("id", project.id)

      console.log("Delete result:", { data, error })

      if (error) throw error

      console.log("Delete successful, calling onSuccess...")

      // Log deletion activity
      try {
        await logActivity({
          action: "deleted",
          entity_type: "project",
          entity_id: project.id,
          details: {
            title: project.title,
            description: project.description,
            budget: project.budget,
            deadline: project.deadline,
            status: project.status,
          },
        })
        console.log("Activity logged successfully")
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
      }

      console.log("Closing dialog and calling onSuccess callback...")
      onOpenChange(false)

      console.log("Calling onSuccess function...")
      onSuccess()

      console.log("onSuccess called, showing toast...")
      toast({
        title: "Success",
        description: "Project deleted successfully",
      })

      console.log("=== DELETE PROJECT COMPLETE ===")
    } catch (error: any) {
      console.error("Error deleting project:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
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
            Delete Project
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{project?.title}"? This action cannot be undone and will also delete all
            associated tasks, goals, and expenses.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
