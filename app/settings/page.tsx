import { Suspense } from "react"
import { SettingsContent } from "@/components/settings/settings-content"
import { SettingsSkeleton } from "@/components/settings/settings-skeleton"

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}
