"use client"

import { createBrowserClient } from "@/lib/supabase"
import { useEffect, useState } from "react"

const ProfileSettings = () => {
  const [email, setEmail] = useState<string | null>(null)

  const supabase = createBrowserClient()

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setEmail(user?.email || null)
    }

    getProfile()
  }, [])

  return (
    <div>
      <h1>Profile Settings</h1>
      {email && <p>Email: {email}</p>}
    </div>
  )
}

export default ProfileSettings
