"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { InviteUserDialog } from "./invite-user-dialog"
import { EditUserDialog } from "./edit-user-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { updateUserRole } from "@/lib/admin-actions"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  User,
  Mail,
  Calendar,
  Activity,
  Crown,
  UserCheck,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: "admin" | "user"
  avatar_url: string | null
  created_at: string
  updated_at: string
  last_sign_in?: string
  project_count?: number
  task_count?: number
  expense_count?: number
}

interface UserStats {
  total_users: number
  admin_users: number
  regular_users: number
  active_this_month: number
}

export function UsersContent() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [userStats, setUserStats] = useState<UserStats>({
    total_users: 0,
    admin_users: 0,
    regular_users: 0,
    active_this_month: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null)
  const [roleChangeLoading, setRoleChangeLoading] = useState<string | null>(null)
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      // Fetch all user profiles
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (usersError) throw usersError

      // Fetch user activity stats
      const usersWithStats = await Promise.all(
        (usersData || []).map(async (user) => {
          const [projectsResult, tasksResult, expensesResult] = await Promise.all([
            supabase.from("projects").select("id", { count: "exact", head: true }).eq("created_by", user.id),
            supabase.from("tasks").select("id", { count: "exact", head: true }).eq("assigned_to", user.id),
            supabase.from("expenses").select("id", { count: "exact", head: true }).eq("created_by", user.id),
          ])

          return {
            ...user,
            project_count: projectsResult.count || 0,
            task_count: tasksResult.count || 0,
            expense_count: expensesResult.count || 0,
          }
        }),
      )

      setUsers(usersWithStats)

      // Calculate stats
      const stats: UserStats = {
        total_users: usersWithStats.length,
        admin_users: usersWithStats.filter((u) => u.role === "admin").length,
        regular_users: usersWithStats.filter((u) => u.role === "user").length,
        active_this_month: usersWithStats.filter((u) => {
          const lastMonth = new Date()
          lastMonth.setMonth(lastMonth.getMonth() - 1)
          return new Date(u.updated_at) > lastMonth
        }).length,
      }

      setUserStats(stats)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleUserInvited = () => {
    fetchUsers()
    setIsInviteDialogOpen(false)
    toast({
      title: "Success",
      description: "User invitation sent successfully",
    })
  }

  const handleUserUpdated = () => {
    fetchUsers()
    setEditingUser(null)
    toast({
      title: "Success",
      description: "User updated successfully",
    })
  }

  const handleUserDeleted = () => {
    fetchUsers()
    setDeletingUser(null)
    toast({
      title: "Success",
      description: "User deleted successfully",
    })
  }

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    setRoleChangeLoading(userId)

    try {
      const result = await updateUserRole(userId, newRole)

      if (result.success) {
        fetchUsers()
        toast({
          title: "Success",
          description: `User role updated to ${newRole}`,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error("Error updating user role:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setRoleChangeLoading(null)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "user":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3" />
      case "user":
        return <User className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const isCurrentUserAdmin = currentUser && users.find((u) => u.id === currentUser.id)?.role === "admin"

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total_users}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.admin_users}</div>
            <p className="text-xs text-muted-foreground">Admin privileges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.regular_users}</div>
            <p className="text-xs text-muted-foreground">Standard access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.active_this_month}</div>
            <p className="text-xs text-muted-foreground">Recent activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
              <SelectItem value="user">Regular Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isCurrentUserAdmin && (
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        )}
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                      <AvatarFallback>{getInitials(user.full_name, user.email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg line-clamp-1">{user.full_name || "No name set"}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{user.email}</p>
                    </div>
                  </div>

                  {isCurrentUserAdmin && user.id !== currentUser?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(user.id, user.role === "admin" ? "user" : "admin")}
                          disabled={roleChangeLoading === user.id}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {roleChangeLoading === user.id ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Updating...
                            </>
                          ) : user.role === "admin" ? (
                            "Remove Admin"
                          ) : (
                            "Make Admin"
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingUser(user)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Badge className={getRoleColor(user.role)}>
                    {getRoleIcon(user.role)}
                    <span className="ml-1 capitalize">{user.role}</span>
                  </Badge>
                  {user.id === currentUser?.id && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Activity Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">{user.project_count}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{user.task_count}</div>
                    <div className="text-xs text-muted-foreground">Tasks</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{user.expense_count}</div>
                    <div className="text-xs text-muted-foreground">Expenses</div>
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-2 text-sm text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {format(new Date(user.created_at), "MMM dd, yyyy")}</span>
                  </div>
                  {user.updated_at !== user.created_at && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3" />
                      <span>Last active {format(new Date(user.updated_at), "MMM dd, yyyy")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || roleFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No users have been added to the system yet"}
          </p>
          {!searchTerm && roleFilter === "all" && isCurrentUserAdmin && (
            <Button onClick={() => setIsInviteDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite First User
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      {isCurrentUserAdmin && (
        <>
          <InviteUserDialog
            open={isInviteDialogOpen}
            onOpenChange={setIsInviteDialogOpen}
            onSuccess={handleUserInvited}
          />

          <EditUserDialog
            open={!!editingUser}
            onOpenChange={(open) => !open && setEditingUser(null)}
            user={editingUser}
            onSuccess={handleUserUpdated}
          />

          <DeleteUserDialog
            open={!!deletingUser}
            onOpenChange={(open) => !open && setDeletingUser(null)}
            user={deletingUser}
            onSuccess={handleUserDeleted}
          />
        </>
      )}
    </div>
  )
}
