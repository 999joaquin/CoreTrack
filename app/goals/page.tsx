import { Suspense } from "react"
import { GoalsContent } from "@/components/goals/goals-content"
import { GoalsSkeleton } from "@/components/goals/goals-skeleton"

export default function GoalsPage() {
  return (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsContent />
    </Suspense>
  )
}
