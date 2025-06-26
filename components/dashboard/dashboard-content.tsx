"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import {
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  FileText,
  Target,
  Receipt,
  UserPlus,
  Settings,
  Shield,
  Bell,
} from "lucide-react"

interface DashboardStats {
  totalProjects: number
  completedTasks: number
  totalTasks: number
  overdueTasks: number
  totalSpend: number
  totalBudget: number
}

interface RecentActivity {
  id: string
  action: string
  entity_type: string
  entity_id: string
  created_at: string
  details: any
  profiles: {
    full_name: string
    avatar_url?: string
  }
}

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    completedTasks: 0,
    totalTasks: 0,
    overdueTasks: 0,
    totalSpend: 0,
    totalBudget: 0,
  })
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch projects count
      const { count: projectsCount } = await supabase.from("projects").select("*", { count: "exact", head: true })

      // Fetch tasks stats
      const { data: tasks } = await supabase.from("tasks").select("status, due_date")

      const completedTasks = tasks?.filter((task) => task.status === "completed").length || 0
      const totalTasks = tasks?.length || 0
      const overdueTasks =
        tasks?.filter((task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed")
          .length || 0

      // Fetch budget and expenses
      const { data: projects } = await supabase.from("projects").select("budget")

      const { data: expenses } = await supabase.from("expenses").select("amount")

      const totalBudget = projects?.reduce((sum, project) => sum + (project.budget || 0), 0) || 0
      const totalSpend = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0

      // Fetch recent activities with profile info
      const { data: recentActivities } = await supabase
        .from("activities")
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      setStats({
        totalProjects: projectsCount || 0,
        completedTasks,
        totalTasks,
        overdueTasks,
        totalSpend,
        totalBudget,
      })

      setActivities(recentActivities || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (entityType: string, action: string) => {
    switch (entityType) {
      case "project":
        return <FolderOpen className="h-4 w-4" />
      case "task":
        return action === "completed" ? <CheckCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />
      case "goal":
        return <Target className="h-4 w-4" />
      case "expense":
        return <Receipt className="h-4 w-4" />
      case "user":
        return <UserPlus className="h-4 w-4" />
      case "profile":
        return <Settings className="h-4 w-4" />
      case "security":
        return <Shield className="h-4 w-4" />
      case "notification":
        return <Bell className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getActivityColor = (entityType: string, action: string) => {
    switch (action) {
      case "created":
        return "text-green-600"
      case "updated":
        return "text-blue-600"
      case "deleted":
        return "text-red-600"
      case "completed":
        return "text-purple-600"
      case "invited":
        return "text-orange-600"
      default:
        return "text-gray-600"
    }
  }

  const formatActivityDescription = (activity: RecentActivity) => {
    const { action, entity_type, details, profiles } = activity
    const userName = profiles?.full_name || "Someone"

    switch (entity_type) {
      case "project":
        if (action === "created") {
          return `${userName} created project "${details?.name || "Untitled Project"}"`
        } else if (action === "updated") {
          const changes = []
          if (details?.previousName && details?.currentName) {
            changes.push(`renamed from "${details.previousName}" to "${details.currentName}"`)
          }
          if (details?.status) {
            changes.push(`status changed to ${details.status}`)
          }
          if (details?.budget) {
            changes.push(`budget updated to $${details.budget}`)
          }
          return `${userName} updated project "${details?.name || "Project"}"${changes.length > 0 ? ` - ${changes[0]}` : ""}`
        } else if (action === "deleted") {
          return `${userName} deleted project "${details?.name || "Project"}"`
        }
        break

      case "task":
        if (action === "created") {
          return `${userName} created task "${details?.title || "Untitled Task"}"`
        } else if (action === "updated") {
          if (details?.status === "completed") {
            return `${userName} completed task "${details?.title || "Task"}"`
          } else if (details?.previousStatus && details?.currentStatus) {
            return `${userName} moved task "${details?.title || "Task"}" from ${details.previousStatus} to ${details.currentStatus}`
          }
          return `${userName} updated task "${details?.title || "Task"}"`
        } else if (action === "deleted") {
          return `${userName} deleted task "${details?.title || "Task"}"`
        }
        break

      case "goal":
        if (action === "created") {
          return `${userName} created goal "${details?.title || "Untitled Goal"}"`
        } else if (action === "updated") {
          if (details?.progress !== undefined) {
            return `${userName} updated progress on "${details?.title || "Goal"}" to ${details.progress}%`
          }
          return `${userName} updated goal "${details?.title || "Goal"}"`
        } else if (action === "completed") {
          return `${userName} completed goal "${details?.title || "Goal"}"`
        }
        break

      case "expense":
        if (action === "created") {
          return `${userName} added expense "${details?.description || "Expense"}" - $${details?.amount || 0}`
        } else if (action === "updated") {
          return `${userName} updated expense "${details?.description || "Expense"}"`
        }
        break

      case "user":
        if (action === "invited") {
          return `${userName} invited ${details?.email || "a user"} to join`
        } else if (action === "updated") {
          return `${userName} updated user profile for ${details?.email || "user"}`
        }
        break

      case "profile":
        if (action === "updated") {
          const changes = []
          if (details?.name) changes.push("name")
          if (details?.bio) changes.push("bio")
          if (details?.avatar) changes.push("avatar")
          return `${userName} updated their ${changes.length > 0 ? changes.join(", ") : "profile"}`
        }
        break

      case "security":
        if (action === "password_changed") {
          return `${userName} changed their password`
        } else if (action === "2fa_enabled") {
          return `${userName} enabled two-factor authentication`
        } else if (action === "2fa_disabled") {
          return `${userName} disabled two-factor authentication`
        }
        break

      case "notification":
        if (action === "preferences_updated") {
          return `${userName} updated notification preferences`
        }
        break

      default:
        return `${userName} ${action} ${entity_type}`
    }

    return `${userName} ${action} ${entity_type}`
  }

  const completionPercentage = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
  const budgetPercentage = stats.totalBudget > 0 ? Math.round((stats.totalSpend / stats.totalBudget) * 100) : 0

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +2 from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <Progress value={completionPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {stats.completedTasks} of {stats.totalTasks} tasks completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.overdueTasks}</div>
              <p className="text-xs text-muted-foreground">Require immediate attention</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgetPercentage}%</div>
              <Progress value={budgetPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                ${stats.totalSpend.toLocaleString()} of ${stats.totalBudget.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`mt-0.5 ${getActivityColor(activity.entity_type, activity.action)}`}>
                      {getActivityIcon(activity.entity_type, activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{formatActivityDescription(activity)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.entity_type}
                    </Badge>
                  </motion.div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent activity to display</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Coming Soon Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium mb-1">Trello Integration</h3>
                <p className="text-xs text-muted-foreground">Sync tasks with Trello boards</p>
              </div>
              <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium mb-1">Jira Integration</h3>
                <p className="text-xs text-muted-foreground">Connect with Jira projects</p>
              </div>
              <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <h3 className="font-medium mb-1">AI Predictions</h3>
                <p className="text-xs text-muted-foreground">Smart project insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
