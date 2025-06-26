import type React from "react"
import { ProfileSettings } from "./profile-settings"
import { SecuritySettings } from "./security-settings"

type SettingsContentProps = {}

const SettingsContent: React.FC<SettingsContentProps> = () => {
  return (
    <div>
      <h2>Settings</h2>
      <ProfileSettings />
      <SecuritySettings />
    </div>
  )
}

export default SettingsContent
