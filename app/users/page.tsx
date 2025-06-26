import { Suspense } from "react"
import { UsersContent } from "@/components/users/users-content"
import { UsersSkeleton } from "@/components/users/users-skeleton"

export default function UsersPage() {
  return (
    <Suspense fallback={<UsersSkeleton />}>
      <UsersContent />
    </Suspense>
  )
}
