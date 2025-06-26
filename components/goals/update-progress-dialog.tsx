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
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Loader2, TrendingUp, Target } from "lucide-react"
import { logActivity } from "@/lib/activity-actions"

interface Goal {
  id: string
  title: string
  description: string | null
  project_id: string
  target_value: number
  current_value: number
}

interface UpdateProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal | null
  onSuccess: () => void
}

export function UpdateProgressDialog({ open, onOpenChange, goal, onSuccess }: UpdateProgressDialogProps) {
  const [loading, setLoading] = useState(false)
  const [currentValue, setCurrentValue] = useState("")
  const [increment, setIncrement] = useState("")
  const [updateMode, setUpdateMode] = useState<"set" | "increment">("set")
  const { toast } = useToast()

  useEffect(() => {
    if (goal) {
      setCurrentValue(goal.current_value.toString())
      setIncrement("")
      setUpdateMode("set")
    }
  }, [goal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal) return

    setLoading(true)

    try {
      let newValue: number
      const previousValue = goal.current_value

      if (updateMode === "set") {
        newValue = Number.parseInt(currentValue) || 0
      } else {
        const incrementValue = Number.parseInt(increment) || 0
        newValue = goal.current_value + incrementValue
      }

      // Ensure the value doesn't exceed target or go below 0
      newValue = Math.max(0, Math.min(newValue, goal.target_value))

      const { error } = await supabase.from("goals").update({ current_value: newValue }).eq("id", goal.id)

      if (error) throw error

      // Log progress update activity
      try {
        await logActivity({
          action: "progress_updated",
          entity_type: "goal",
          entity_id: goal.id,
          details: {
            title: goal.title,
            previous_value: previousValue,
            new_value: newValue,
            target_value: goal.target_value,
            progress_change: newValue - previousValue,
            previous_progress_percentage: Math.round((previousValue / goal.target_value) * 100),
            new_progress_percentage: Math.round((newValue / goal.target_value) * 100),
            update_mode: updateMode,
            increment_value: updateMode === "increment" ? Number.parseInt(increment) || 0 : null,
          },
        })
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
      }

      onSuccess()
      toast({
        title: "Success",
        description: "Goal progress updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating goal progress:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update goal progress",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPreviewValue = () => {
    if (!goal) return 0

    if (updateMode === "set") {
      return Math.max(0, Math.min(Number.parseInt(currentValue) || 0, goal.target_value))
    } else {
      const incrementValue = Number.parseInt(increment) || 0
      return Math.max(0, Math.min(goal.current_value + incrementValue, goal.target_value))
    }
  }

  const getPreviewPercentage = () => {
    if (!goal || goal.target_value === 0) return 0
    return Math.round((getPreviewValue() / goal.target_value) * 100)
  }

  if (!goal) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Update Progress
          </DialogTitle>
          <DialogDescription>Update the progress for "{goal.title}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Progress */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round((goal.current_value / goal.target_value) * 100)}%
              </span>
            </div>
            <Progress value={(goal.current_value / goal.target_value) * 100} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{goal.current_value.toLocaleString()}</span>
              <span>{goal.target_value.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Update Mode Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={updateMode === "set" ? "default" : "outline"}
                size="sm"
                onClick={() => setUpdateMode("set")}
                className="flex-1"
              >
                Set Value
              </Button>
              <Button
                type="button"
                variant={updateMode === "increment" ? "default" : "outline"}
                size="sm"
                onClick={() => setUpdateMode("increment")}
                className="flex-1"
              >
                Add/Subtract
              </Button>
            </div>

            {updateMode === "set" ? (
              <div className="space-y-2">
                <Label htmlFor="current">Set Current Value</Label>
                <Input
                  id="current"
                  type="number"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder="Enter new value"
                  min="0"
                  max={goal.target_value}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="increment">Add/Subtract Value</Label>
                <Input
                  id="increment"
                  type="number"
                  value={increment}
                  onChange={(e) => setIncrement(e.target.value)}
                  placeholder="Enter increment (use negative for subtract)"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use positive numbers to add, negative numbers to subtract
                </p>
              </div>
            )}

            {/* Preview */}
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Preview</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">
                  {getPreviewValue().toLocaleString()} / {goal.target_value.toLocaleString()}
                </span>
                <span className="text-sm font-bold">{getPreviewPercentage()}%</span>
              </div>
              <Progress value={getPreviewPercentage()} className="h-2" />
              {getPreviewValue() >= goal.target_value && (
                <p className="text-xs text-green-600 mt-2 font-medium">🎉 Goal will be completed!</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading || (updateMode === "set" && !currentValue) || (updateMode === "increment" && !increment)
                }
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Progress
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
