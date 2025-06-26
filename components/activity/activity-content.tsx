"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Search,
  Filter,
  ActivityIcon,
  User,
  ProjectorIcon as Project,
  Target,
  DollarSign,
  Settings,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ActivitySkeleton } from "./activity-skeleton"

interface Activity {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  details: any
  created_at: string
  profiles?: {
    full_name: string | null
    email: string
  }
}

const getActivityIcon = (entityType: string) => {
  switch (entityType) {
    case "project":
      return <Project className="h-4 w-4" />
    case "task":
      return <ActivityIcon className="h-4 w-4" />
    case "goal":
      return <Target className="h-4 w-4" />
    case "expense":
      return <DollarSign className="h-4 w-4" />
    case "user":
      return <User className="h-4 w-4" />
    case "settings":
      return <Settings className="h-4 w-4" />
    default:
      return <ActivityIcon className="h-4 w-4" />
  }
}

const getActivityColor = (action: string) => {
  switch (action) {
    case "create":
      return "bg-green-100 text-green-800 border-green-200"
    case "update":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "delete":
      return "bg-red-100 text-red-800 border-red-200"
    case "complete":
      return "bg-purple-100 text-purple-800 border-purple-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const formatActivityDescription = (activity: Activity) => {
  const userName = activity.profiles?.full_name || activity.profiles?.email || "Someone"
  const { action, entity_type, details } = activity

  switch (entity_type) {
    case "project":
      if (action === "create") {
        return `${userName} created project "${details?.project_name || details?.title}"`
      } else if (action === "update") {
        return `${userName} updated project "${details?.project_name || details?.title}"`
      } else if (action === "delete") {
        return `${userName} deleted project "${details?.project_name || details?.title}"`
      }
      break
    case "task":
      if (action === "create") {
        return `${userName} created task "${details?.task_title || details?.title}"`
      } else if (action === "update") {
        if (details?.status_changed) {
          return `${userName} changed task "${details?.task_title}" status to ${details?.new_status}`
        }
        return `${userName} updated task "${details?.task_title || details?.title}"`
      } else if (action === "delete") {
        return `${userName} deleted task "${details?.task_title || details?.title}"`
      }
      break
    case "goal":
      if (action === "create") {
        return `${userName} created goal "${details?.goal_title || details?.title}"`
      } else if (action === "update") {
        if (details?.progress_updated) {
          return `${userName} updated goal "${details?.goal_title}" progress to ${details?.new_progress}%`
        }
        return `${userName} updated goal "${details?.goal_title || details?.title}"`
      }
      break
    case "expense":
      if (action === "create") {
        return `${userName} added expense "${details?.expense_title}" for $${details?.amount}`
      } else if (action === "update") {
        return `${userName} updated expense "${details?.expense_title}"`
      }
      break
    case "user":
      if (action === "invite") {
        return `${userName} invited ${details?.email} to join`
      } else if (action === "update") {
        return `${userName} updated user profile`
      }
      break
  }

  return `${userName} ${action}d ${entity_type}`
}

export function ActivityContent() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [entityFilter, setEntityFilter] = useState("all")

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = formatActivityDescription(activity).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = actionFilter === "all" || activity.action === actionFilter
    const matchesEntity = entityFilter === "all" || activity.entity_type === entityFilter

    return matchesSearch && matchesAction && matchesEntity
  })

  const todayActivities = filteredActivities.filter((activity) => {
    const today = new Date()
    const activityDate = new Date(activity.created_at)
    return activityDate.toDateString() === today.toDateString()
  })

  const thisWeekActivities = filteredActivities.filter((activity) => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const activityDate = new Date(activity.created_at)
    return activityDate >= weekAgo
  })

  if (loading) {
    return <ActivitySkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
                <SelectItem value="goal">Goals</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredActivities.length})</TabsTrigger>
          <TabsTrigger value="today">Today ({todayActivities.length})</TabsTrigger>
          <TabsTrigger value="week">This Week ({thisWeekActivities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activities found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || actionFilter !== "all" || entityFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Start creating projects, tasks, and goals to see activity here"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.entity_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{formatActivityDescription(activity)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={getActivityColor(activity.action)}>
                          {activity.action}
                        </Badge>
                        <Badge variant="secondary">{activity.entity_type}</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="today" className="space-y-4">
          {todayActivities.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activities today</h3>
                  <p className="text-muted-foreground">Start working on your projects to see activity here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            todayActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.entity_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{formatActivityDescription(activity)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={getActivityColor(activity.action)}>
                          {activity.action}
                        </Badge>
                        <Badge variant="secondary">{activity.entity_type}</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          {thisWeekActivities.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activities this week</h3>
                  <p className="text-muted-foreground">Start working on your projects to see activity here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            thisWeekActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.entity_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{formatActivityDescription(activity)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={getActivityColor(activity.action)}>
                          {activity.action}
                        </Badge>
                        <Badge variant="secondary">{activity.entity_type}</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
