import { Suspense } from "react"
import { ActivityContent } from "@/components/activity/activity-content"
import { ActivitySkeleton } from "@/components/activity/activity-skeleton"

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
        <p className="text-muted-foreground">Track all activities and changes across your projects</p>
      </div>

      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityContent />
      </Suspense>
    </div>
  )
}
