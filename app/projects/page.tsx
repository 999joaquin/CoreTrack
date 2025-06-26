import { Suspense } from "react"
import { ProjectsContent } from "@/components/projects/projects-content"
import { ProjectsSkeleton } from "@/components/projects/projects-skeleton"

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsContent />
    </Suspense>
  )
}
