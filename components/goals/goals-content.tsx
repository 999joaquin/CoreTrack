"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { GoalDialog } from "./goal-dialog"
import { DeleteGoalDialog } from "./delete-goal-dialog"
import { UpdateProgressDialog } from "./update-progress-dialog"
import {
  Plus,
  Search,
  Target,
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  FolderOpen,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Goal {
  id: string
  title: string
  description: string | null
  project_id: string
  target_value: number
  current_value: number
  created_at: string
  updated_at: string
  project?: {
    title: string
    status: string
  }
  linked_tasks?: number
}

interface Project {
  id: string
  title: string
  status: string
}

export function GoalsContent() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [progressFilter, setProgressFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)
  const [updatingProgressGoal, setUpdatingProgressGoal] = useState<Goal | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterGoals()
  }, [goals, searchTerm, projectFilter, progressFilter])

  const fetchData = async () => {
    try {
      // Fetch goals with project info and linked tasks count
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select(`
          *,
          project:projects(title, status)
        `)
        .order("created_at", { ascending: false })

      if (goalsError) throw goalsError

      // Fetch linked tasks count for each goal
      const goalsWithTaskCount = await Promise.all(
        (goalsData || []).map(async (goal) => {
          const { count } = await supabase
            .from("goal_tasks")
            .select("*", { count: "exact", head: true })
            .eq("goal_id", goal.id)

          return {
            ...goal,
            linked_tasks: count || 0,
          }
        }),
      )

      // Fetch projects for the filter dropdown
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, status")
        .order("title")

      if (projectsError) throw projectsError

      setGoals(goalsWithTaskCount)
      setProjects(projectsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch goals",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterGoals = () => {
    let filtered = goals

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (goal) =>
          goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          goal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          goal.project?.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by project
    if (projectFilter !== "all") {
      filtered = filtered.filter((goal) => goal.project_id === projectFilter)
    }

    // Filter by progress
    if (progressFilter !== "all") {
      filtered = filtered.filter((goal) => {
        const progress = getProgressPercentage(goal)
        switch (progressFilter) {
          case "not-started":
            return progress === 0
          case "in-progress":
            return progress > 0 && progress < 100
          case "completed":
            return progress >= 100
          default:
            return true
        }
      })
    }

    setFilteredGoals(filtered)
  }

  const handleGoalCreated = () => {
    fetchData()
    setIsCreateDialogOpen(false)
    toast({
      title: "Success",
      description: "Goal created successfully",
    })
  }

  const handleGoalUpdated = () => {
    fetchData()
    setEditingGoal(null)
    toast({
      title: "Success",
      description: "Goal updated successfully",
    })
  }

  const handleGoalDeleted = () => {
    fetchData()
    setDeletingGoal(null)
    toast({
      title: "Success",
      description: "Goal deleted successfully",
    })
  }

  const handleProgressUpdated = () => {
    fetchData()
    setUpdatingProgressGoal(null)
    toast({
      title: "Success",
      description: "Goal progress updated successfully",
    })
  }

  const getProgressPercentage = (goal: Goal) => {
    if (goal.target_value === 0) return 0
    return Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100)
  }

  const getProgressStatus = (goal: Goal) => {
    const progress = getProgressPercentage(goal)
    if (progress >= 100) return "completed"
    if (progress > 0) return "in-progress"
    return "not-started"
  }

  const getProgressColor = (goal: Goal) => {
    const status = getProgressStatus(goal)
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in-progress":
        return "bg-blue-500"
      case "not-started":
        return "bg-gray-300"
      default:
        return "bg-gray-300"
    }
  }

  const getProgressIcon = (goal: Goal) => {
    const status = getProgressStatus(goal)
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "not-started":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getProgressBadgeVariant = (goal: Goal) => {
    const status = getProgressStatus(goal)
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "not-started":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={progressFilter} onValueChange={setProgressFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Progress</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getProgressIcon(goal)}
                      <CardTitle className="text-lg line-clamp-1">{goal.title}</CardTitle>
                    </div>
                    {goal.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2">{goal.description}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setUpdatingProgressGoal(goal)}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Update Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingGoal(goal)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Goal
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingGoal(goal)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Goal
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {goal.project && (
                  <div className="flex items-center gap-2 mt-3">
                    <FolderOpen className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{goal.project.title}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getProgressBadgeVariant(goal)}>
                        {getProgressStatus(goal).replace("-", " ")}
                      </Badge>
                      <span className="text-sm font-bold">{getProgressPercentage(goal)}%</span>
                    </div>
                  </div>
                  <Progress value={getProgressPercentage(goal)} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{goal.current_value.toLocaleString()}</span>
                    <span>{goal.target_value.toLocaleString()}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    <span>Target: {goal.target_value.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{goal.linked_tasks} tasks</span>
                  </div>
                </div>

                {/* Quick Update Button */}
                <Button variant="outline" size="sm" className="w-full" onClick={() => setUpdatingProgressGoal(goal)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Update Progress
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredGoals.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Target className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No goals found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || projectFilter !== "all" || progressFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Get started by creating your first goal"}
          </p>
          {!searchTerm && projectFilter === "all" && progressFilter === "all" && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <GoalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleGoalCreated}
        projects={projects}
      />

      <GoalDialog
        open={!!editingGoal}
        onOpenChange={(open) => !open && setEditingGoal(null)}
        goal={editingGoal}
        onSuccess={handleGoalUpdated}
        projects={projects}
      />

      <UpdateProgressDialog
        open={!!updatingProgressGoal}
        onOpenChange={(open) => !open && setUpdatingProgressGoal(null)}
        goal={updatingProgressGoal}
        onSuccess={handleProgressUpdated}
      />

      <DeleteGoalDialog
        open={!!deletingGoal}
        onOpenChange={(open) => !open && setDeletingGoal(null)}
        goal={deletingGoal}
        onSuccess={handleGoalDeleted}
      />
    </div>
  )
}
