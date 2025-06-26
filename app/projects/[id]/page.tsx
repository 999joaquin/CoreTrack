import { Suspense } from "react"
import { ProjectDetailContent } from "@/components/projects/project-detail-content"
import { ProjectDetailSkeleton } from "@/components/projects/project-detail-skeleton"

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params

  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <ProjectDetailContent projectId={id} />
    </Suspense>
  )
}
