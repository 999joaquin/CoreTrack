"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
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

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  onSuccess: () => void
}

export function ProjectDialog({ open, onOpenChange, project, onSuccess }: ProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [budget, setBudget] = useState("")
  const [status, setStatus] = useState("active")
  const { user } = useAuth()
  const { toast } = useToast()

  const isEditing = !!project

  useEffect(() => {
    if (project) {
      setTitle(project.title)
      setDescription(project.description || "")
      setDeadline(project.deadline ? new Date(project.deadline) : undefined)
      setBudget(project.budget ? project.budget.toString() : "")
      setStatus(project.status)
    } else {
      // Reset form for new project
      setTitle("")
      setDescription("")
      setDeadline(undefined)
      setBudget("")
      setStatus("active")
    }
  }, [project, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      console.error("No user found")
      toast({
        title: "Error",
        description: "You must be logged in to create projects",
        variant: "destructive",
      })
      return
    }

    console.log("Starting project submission...")
    console.log("User:", user.id)
    console.log("Is editing:", isEditing)

    setLoading(true)

    try {
      const projectData = {
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? deadline.toISOString().split("T")[0] : null,
        budget: budget ? Number.parseFloat(budget) : null,
        status,
        ...(isEditing ? {} : { created_by: user.id }),
      }

      console.log("Project data to submit:", projectData)

      let result
      if (isEditing) {
        console.log("Updating project:", project.id)
        const { data, error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", project.id)
          .select()
          .single()

        if (error) {
          console.error("Update error:", error)
          throw error
        }
        result = data
      } else {
        console.log("Creating new project...")
        const { data, error } = await supabase.from("projects").insert([projectData]).select().single()

        if (error) {
          console.error("Insert error:", error)
          throw error
        }
        result = data
      }

      console.log("Project operation successful:", result)

      // Log comprehensive activity
      try {
        await logActivity({
          action: isEditing ? "updated" : "created",
          entity_type: "project",
          entity_id: result.id,
          details: {
            title: projectData.title,
            description: projectData.description,
            budget: projectData.budget,
            deadline: projectData.deadline,
            status: projectData.status,
            previous_values: isEditing
              ? {
                  title: project?.title,
                  description: project?.description,
                  budget: project?.budget,
                  deadline: project?.deadline,
                  status: project?.status,
                }
              : null,
          },
        })
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
      }

      toast({
        title: "Success",
        description: `Project ${isEditing ? "updated" : "created"} successfully`,
      })

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving project - Full error:", error)
      console.error("Error message:", error?.message)
      console.error("Error details:", error?.details)
      console.error("Error hint:", error?.hint)
      console.error("Error code:", error?.code)

      toast({
        title: "Error",
        description: error?.message || error?.details || "Failed to save project. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "Create New Project"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your project details below." : "Fill in the details to create a new project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Project" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
