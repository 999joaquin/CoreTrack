import { Suspense } from "react"
import { TasksContent } from "@/components/tasks/tasks-content"
import { TasksSkeleton } from "@/components/tasks/tasks-skeleton"

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksSkeleton />}>
      <TasksContent />
    </Suspense>
  )
}
