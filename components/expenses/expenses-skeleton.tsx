import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ExpensesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Budget Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header Actions Skeleton */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4 flex-wrap">
          <Skeleton className="h-10 flex-1 min-w-64" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Expenses List Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-4 w-full mb-3" />
                    <div className="flex items-center gap-4 flex-wrap">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
