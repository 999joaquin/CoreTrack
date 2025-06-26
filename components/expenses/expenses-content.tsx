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
import { ExpenseDialog } from "./expense-dialog"
import { DeleteExpenseDialog } from "./delete-expense-dialog"
import {
  Plus,
  Search,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Receipt,
  AlertTriangle,
  FolderOpen,
  User,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

interface Expense {
  id: string
  amount: number
  description: string | null
  project_id: string
  task_id: string | null
  created_by: string | null
  expense_date: string
  created_at: string
  project?: {
    title: string
    budget: number | null
  }
  task?: {
    title: string
  }
  creator?: {
    full_name: string | null
    email: string
  }
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

interface BudgetSummary {
  project_id: string
  project_title: string
  budget: number | null
  total_expenses: number
  percentage_used: number
  remaining_budget: number
}

export function ExpensesContent() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [budgetSummaries, setBudgetSummaries] = useState<BudgetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterExpenses()
  }, [expenses, searchTerm, projectFilter, dateFilter])

  const fetchData = async () => {
    try {
      // Fetch expenses with related data
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select(`
          *,
          project:projects(title, budget),
          task:tasks(title),
          creator:profiles(full_name, email)
        `)
        .order("expense_date", { ascending: false })

      if (expensesError) throw expensesError

      // Fetch projects for filters and budget tracking
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, budget")
        .order("title")

      if (projectsError) throw projectsError

      // Fetch tasks for expense assignment
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, project_id")
        .order("title")

      if (tasksError) throw tasksError

      setExpenses(expensesData || [])
      setProjects(projectsData || [])
      setTasks(tasksData || [])

      // Calculate budget summaries
      calculateBudgetSummaries(expensesData || [], projectsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateBudgetSummaries = (expensesData: Expense[], projectsData: Project[]) => {
    const summaries: BudgetSummary[] = projectsData.map((project) => {
      const projectExpenses = expensesData.filter((expense) => expense.project_id === project.id)
      const totalExpenses = projectExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const budget = project.budget || 0
      const percentageUsed = budget > 0 ? Math.round((totalExpenses / budget) * 100) : 0
      const remainingBudget = budget - totalExpenses

      return {
        project_id: project.id,
        project_title: project.title,
        budget,
        total_expenses: totalExpenses,
        percentage_used: percentageUsed,
        remaining_budget: remainingBudget,
      }
    })

    setBudgetSummaries(summaries.filter((summary) => summary.budget > 0 || summary.total_expenses > 0))
  }

  const filterExpenses = () => {
    let filtered = expenses

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (expense) =>
          expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.project?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.task?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.creator?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.creator?.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by project
    if (projectFilter !== "all") {
      filtered = filtered.filter((expense) => expense.project_id === projectFilter)
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfYear = new Date(now.getFullYear(), 0, 1)

      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.expense_date)
        switch (dateFilter) {
          case "today":
            return expenseDate.toDateString() === new Date().toDateString()
          case "week":
            return expenseDate >= startOfWeek
          case "month":
            return expenseDate >= startOfMonth
          case "year":
            return expenseDate >= startOfYear
          default:
            return true
        }
      })
    }

    setFilteredExpenses(filtered)
  }

  const handleExpenseCreated = () => {
    fetchData()
    setIsCreateDialogOpen(false)
    toast({
      title: "Success",
      description: "Expense created successfully",
    })
  }

  const handleExpenseUpdated = () => {
    fetchData()
    setEditingExpense(null)
    toast({
      title: "Success",
      description: "Expense updated successfully",
    })
  }

  const handleExpenseDeleted = () => {
    fetchData()
    setDeletingExpense(null)
    toast({
      title: "Success",
      description: "Expense deleted successfully",
    })
  }

  const getBudgetStatusColor = (percentageUsed: number) => {
    if (percentageUsed >= 100) return "text-red-600"
    if (percentageUsed >= 80) return "text-yellow-600"
    return "text-green-600"
  }

  const getBudgetProgressColor = (percentageUsed: number) => {
    if (percentageUsed >= 100) return "bg-red-500"
    if (percentageUsed >= 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview Cards */}
      {budgetSummaries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetSummaries.slice(0, 3).map((summary) => (
            <Card key={summary.project_id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  {summary.project_title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Budget Usage</span>
                    <span className={`text-sm font-bold ${getBudgetStatusColor(summary.percentage_used)}`}>
                      {summary.percentage_used}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(summary.percentage_used, 100)}
                    className="h-2"
                    style={{
                      backgroundColor: summary.percentage_used >= 100 ? "#fee2e2" : undefined,
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${summary.total_expenses.toLocaleString()}</span>
                    <span>${summary.budget?.toLocaleString() || 0}</span>
                  </div>
                  {summary.remaining_budget < 0 && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      Over budget by ${Math.abs(summary.remaining_budget).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
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

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Expenses</div>
            <div className="text-lg font-bold">${getTotalExpenses().toLocaleString()}</div>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        {filteredExpenses.map((expense, index) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">${expense.amount.toLocaleString()}</h3>
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(expense.expense_date), "MMM dd, yyyy")}
                        </Badge>
                      </div>

                      {expense.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{expense.description}</p>
                      )}

                      <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                        {expense.project && (
                          <div className="flex items-center gap-1">
                            <FolderOpen className="h-3 w-3" />
                            <span>{expense.project.title}</span>
                          </div>
                        )}

                        {expense.task && (
                          <div className="flex items-center gap-1">
                            <span>Task:</span>
                            <span className="font-medium">{expense.task.title}</span>
                          </div>
                        )}

                        {expense.creator && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{expense.creator.full_name || expense.creator.email}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Added {format(new Date(expense.created_at), "MMM dd")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingExpense(expense)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Expense
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingExpense(expense)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Expense
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredExpenses.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Receipt className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || projectFilter !== "all" || dateFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first expense"}
          </p>
          {!searchTerm && projectFilter === "all" && dateFilter === "all" && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <ExpenseDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleExpenseCreated}
        projects={projects}
        tasks={tasks}
      />

      <ExpenseDialog
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        expense={editingExpense}
        onSuccess={handleExpenseUpdated}
        projects={projects}
        tasks={tasks}
      />

      <DeleteExpenseDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
        expense={deletingExpense}
        onSuccess={handleExpenseDeleted}
      />
    </div>
  )
}
