import { Suspense } from "react"
import { NotificationsContent } from "@/components/notifications/notifications-content"
import { NotificationsSkeleton } from "@/components/notifications/notifications-skeleton"

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Manage all your notifications in one place</p>
      </div>

      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsContent />
      </Suspense>
    </div>
  )
}
