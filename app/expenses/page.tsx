import { Suspense } from "react"
import { ExpensesContent } from "@/components/expenses/expenses-content"
import { ExpensesSkeleton } from "@/components/expenses/expenses-skeleton"

export default function ExpensesPage() {
  return (
    <Suspense fallback={<ExpensesSkeleton />}>
      <ExpensesContent />
    </Suspense>
  )
}
