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
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { logActivity } from "@/lib/activity-actions"

interface Goal {
  id: string
  title: string
  description: string | null
  project_id: string
  target_value: number
  current_value: number
}

interface Project {
  id: string
  title: string
  status: string
}

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: Goal | null
  onSuccess: () => void
  projects: Project[]
}

export function GoalDialog({ open, onOpenChange, goal, onSuccess, projects }: GoalDialogProps) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [currentValue, setCurrentValue] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()

  const isEditing = !!goal

  useEffect(() => {
    if (goal) {
      setTitle(goal.title)
      setDescription(goal.description || "")
      setProjectId(goal.project_id)
      setTargetValue(goal.target_value.toString())
      setCurrentValue(goal.current_value.toString())
    } else {
      // Reset form for new goal
      setTitle("")
      setDescription("")
      setProjectId("")
      setTargetValue("")
      setCurrentValue("0")
    }
  }, [goal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !projectId) return

    setLoading(true)

    try {
      const goalData = {
        title: title.trim(),
        description: description.trim() || null,
        project_id: projectId,
        target_value: Number.parseInt(targetValue) || 100,
        current_value: Number.parseInt(currentValue) || 0,
      }

      let result

      if (isEditing) {
        const { error } = await supabase.from("goals").update(goalData).eq("id", goal.id)

        if (error) throw error
        result = { id: goal.id }
      } else {
        const { data, error } = await supabase.from("goals").insert([goalData]).select("id").single()

        if (error) throw error
        result = data
      }

      onSuccess()

      // Log comprehensive activity
      try {
        await logActivity({
          action: isEditing ? "updated" : "created",
          entity_type: "goal",
          entity_id: result.id,
          details: {
            title: goalData.title,
            description: goalData.description,
            project_id: goalData.project_id,
            target_value: goalData.target_value,
            current_value: goalData.current_value,
            progress_percentage: Math.round((goalData.current_value / goalData.target_value) * 100),
            previous_values: isEditing
              ? {
                  title: goal?.title,
                  description: goal?.description,
                  target_value: goal?.target_value,
                  current_value: goal?.current_value,
                }
              : null,
          },
        })
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
      }
    } catch (error: any) {
      console.error("Error saving goal:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save goal",
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
          <DialogTitle>{isEditing ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your goal details below." : "Fill in the details to create a new goal."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter goal title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter goal description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select value={projectId} onValueChange={setProjectId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target Value *</Label>
              <Input
                id="target"
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="100"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current">Current Value</Label>
              <Input
                id="current"
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Progress Preview</div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">
                {currentValue || 0} / {targetValue || 100}
              </span>
              <span className="text-sm font-medium">
                {targetValue && currentValue
                  ? Math.min(Math.round((Number.parseInt(currentValue) / Number.parseInt(targetValue)) * 100), 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    targetValue && currentValue
                      ? Math.min((Number.parseInt(currentValue) / Number.parseInt(targetValue)) * 100, 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !projectId || !targetValue}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Goal" : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
