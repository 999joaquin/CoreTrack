"use client"

import { createBrowserClient } from "@/lib/supabase"
import { useEffect, useState } from "react"

const SecuritySettings = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const supabase = createBrowserClient()

  return (
    <div>
      <h1>Security Settings</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <p>Here you can manage your security settings.</p>
        </>
      )}
    </div>
  )
}

export default SecuritySettings
