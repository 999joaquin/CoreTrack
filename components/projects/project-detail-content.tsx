"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { ProjectDialog } from "./project-dialog"
import { DeleteProjectDialog } from "./delete-project-dialog"
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Receipt,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface Project {
  id: string
  title: string
  description: string | null
  deadline: string | null
  budget: number | null
  status: string
  created_by: string | null
  created_at: string
  updated_at: string
}

interface Task {
  id: string
  title: string
  status: "todo" | "in_progress" | "completed"
  priority: "low" | "medium" | "high"
  due_date: string | null
}

interface Goal {
  id: string
  title: string
  target_value: number
  current_value: number
}

interface Expense {
  id: string
  amount: number
  description: string | null
  expense_date: string
}

interface ProjectDetailContentProps {
  projectId: string
}

export function ProjectDetailContent({ projectId }: ProjectDetailContentProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchProjectDetails()
  }, [projectId])

  const fetchProjectDetails = async () => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single()

      if (projectError) throw projectError

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, status, priority, due_date")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (tasksError) throw tasksError

      // Fetch goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select("id, title, target_value, current_value")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (goalsError) throw goalsError

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("id, amount, description, expense_date")
        .eq("project_id", projectId)
        .order("expense_date", { ascending: false })

      if (expensesError) throw expensesError

      setProject(projectData)
      setTasks(tasksData || [])
      setGoals(goalsData || [])
      setExpenses(expensesData || [])
    } catch (error) {
      console.error("Error fetching project details:", error)
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProjectUpdated = () => {
    fetchProjectDetails()
    setEditingProject(null)
    toast({
      title: "Success",
      description: "Project updated successfully",
    })
  }

  const handleProjectDeleted = () => {
    setDeletingProject(null)
    toast({
      title: "Success",
      description: "Project deleted successfully",
    })
    router.push("/projects")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "on-hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString()
  }

  const getCompletionPercentage = () => {
    if (tasks.length === 0) return 0
    const completedTasks = tasks.filter((task) => task.status === "completed").length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  const getBudgetPercentage = () => {
    if (!project?.budget || project.budget === 0) return 0
    return Math.round((getTotalExpenses() / project.budget) * 100)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <p className="text-muted-foreground">{project.description || "No description provided"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditingProject(project)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeletingProject(project)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
            {project.deadline && isOverdue(project.deadline) && (
              <Badge variant="destructive" className="ml-2">
                Overdue
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{getCompletionPercentage()}%</div>
            <Progress value={getCompletionPercentage()} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {tasks.filter((t) => t.status === "completed").length} of {tasks.length} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{project.deadline ? format(new Date(project.deadline), "PPP") : "No deadline set"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
          </CardHeader>
          <CardContent>
            {project.budget ? (
              <div>
                <div className="text-2xl font-bold mb-2">{getBudgetPercentage()}%</div>
                <Progress value={getBudgetPercentage()} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  ${getTotalExpenses().toLocaleString()} of ${project.budget.toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>No budget set</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="goals">Goals ({goals.length})</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTaskStatusIcon(task.status)}
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                {task.priority}
                              </Badge>
                              <Badge variant="outline">{task.status.replace("_", " ")}</Badge>
                            </div>
                          </div>
                        </div>
                        {task.due_date && (
                          <div className="text-sm text-muted-foreground">
                            Due: {format(new Date(task.due_date), "MMM dd")}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                <p className="text-muted-foreground">Tasks for this project will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          {goals.length > 0 ? (
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{goal.title}</h4>
                        <span className="text-sm font-medium">
                          {Math.round((goal.current_value / goal.target_value) * 100)}%
                        </span>
                      </div>
                      <Progress value={(goal.current_value / goal.target_value) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {goal.current_value} of {goal.target_value}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No goals set</h3>
                <p className="text-muted-foreground">Goals for this project will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">${expense.amount.toLocaleString()}</h4>
                          <p className="text-sm text-muted-foreground">{expense.description || "No description"}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(expense.expense_date), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No expenses recorded</h3>
                <p className="text-muted-foreground">Expenses for this project will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ProjectDialog
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        project={editingProject}
        onSuccess={handleProjectUpdated}
      />

      <DeleteProjectDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        project={deletingProject}
        onSuccess={handleProjectDeleted}
      />
    </div>
  )
}
