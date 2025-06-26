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
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { logActivity } from "@/lib/activity-actions"

interface Expense {
  id: string
  amount: number
  description: string | null
  project_id: string
  task_id: string | null
  created_by: string | null
  expense_date: string
}

interface Project {
  id: string
  title: string
  budget: number | null
}

interface Task {
  id: string
  title: string
  project_id: string
}

interface ExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  onSuccess: () => void
  projects: Project[]
  tasks: Task[]
}

export function ExpenseDialog({ open, onOpenChange, expense, onSuccess, projects, tasks }: ExpenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState("")
  const [taskId, setTaskId] = useState("")
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date())
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const isEditing = !!expense

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString())
      setDescription(expense.description || "")
      setProjectId(expense.project_id)
      setTaskId(expense.task_id || "")
      setExpenseDate(new Date(expense.expense_date))
    } else {
      // Reset form for new expense
      setAmount("")
      setDescription("")
      setProjectId("")
      setTaskId("")
      setExpenseDate(new Date())
    }
    setBudgetWarning(null)
  }, [expense, open])

  useEffect(() => {
    checkBudgetWarning()
  }, [amount, projectId])

  const checkBudgetWarning = async () => {
    if (!amount || !projectId || Number.parseFloat(amount) <= 0) {
      setBudgetWarning(null)
      return
    }

    try {
      const project = projects.find((p) => p.id === projectId)
      if (!project?.budget) {
        setBudgetWarning(null)
        return
      }

      // Get current expenses for this project
      const { data: currentExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("project_id", projectId)
        .neq("id", expense?.id || "")

      const totalCurrentExpenses = currentExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0
      const newExpenseAmount = Number.parseFloat(amount)
      const totalWithNewExpense = totalCurrentExpenses + newExpenseAmount
      const budgetUsagePercentage = (totalWithNewExpense / project.budget) * 100

      if (budgetUsagePercentage > 100) {
        const overBudget = totalWithNewExpense - project.budget
        setBudgetWarning(
          `This expense will put the project over budget by $${overBudget.toLocaleString()}. Total will be $${totalWithNewExpense.toLocaleString()} of $${project.budget.toLocaleString()} budget.`,
        )
      } else if (budgetUsagePercentage > 80) {
        setBudgetWarning(
          `This expense will use ${budgetUsagePercentage.toFixed(1)}% of the project budget ($${totalWithNewExpense.toLocaleString()} of $${project.budget.toLocaleString()}).`,
        )
      } else {
        setBudgetWarning(null)
      }
    } catch (error) {
      console.error("Error checking budget:", error)
    }
  }

  const getFilteredTasks = () => {
    return tasks.filter((task) => task.project_id === projectId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !projectId) return

    setLoading(true)

    try {
      const expenseData = {
        amount: Number.parseFloat(amount),
        description: description.trim() || null,
        project_id: projectId,
        task_id: taskId || null,
        expense_date: expenseDate ? expenseDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        ...(isEditing ? {} : { created_by: user.id }),
      }

      let result

      if (isEditing) {
        const { error } = await supabase.from("expenses").update(expenseData).eq("id", expense.id)

        if (error) throw error
        result = { id: expense.id }
      } else {
        const { data, error } = await supabase.from("expenses").insert([expenseData]).select().single()

        if (error) throw error
        result = data
      }

      // Log comprehensive activity
      try {
        await logActivity({
          action: isEditing ? "updated" : "created",
          entity_type: "expense",
          entity_id: result.id,
          details: {
            amount: expenseData.amount,
            description: expenseData.description,
            project_id: expenseData.project_id,
            task_id: expenseData.task_id,
            expense_date: expenseData.expense_date,
            previous_values: isEditing
              ? {
                  amount: expense?.amount,
                  description: expense?.description,
                  expense_date: expense?.expense_date,
                }
              : null,
          },
        })
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
      }

      onSuccess()
    } catch (error: any) {
      console.error("Error saving expense:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save expense",
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
          <DialogTitle>{isEditing ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your expense details below." : "Fill in the details to add a new expense."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Expense Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expenseDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expenseDate ? format(expenseDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={expenseDate} onSelect={setExpenseDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter expense description"
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
                    {project.budget && (
                      <span className="text-muted-foreground ml-2">(Budget: ${project.budget.toLocaleString()})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task">Task (Optional)</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Select task (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific task</SelectItem>
                {getFilteredTasks().map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget Warning */}
          {budgetWarning && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{budgetWarning}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !amount || !projectId || Number.parseFloat(amount) <= 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Expense" : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
