"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2, Key } from "lucide-react"
import Link from "next/link"

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "set-password">("loading")
  const [message, setMessage] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [settingPassword, setSettingPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    handleEmailConfirmation()
  }, [searchParams])

  const handleEmailConfirmation = async () => {
    try {
      // Get current URL for debugging
      const currentUrl = window.location.href
      const urlHash = window.location.hash

      // Get all possible parameters from URL and hash
      const token_hash = searchParams.get("token_hash")
      const type = searchParams.get("type")
      const access_token = searchParams.get("access_token")
      const refresh_token = searchParams.get("refresh_token")
      const expires_in = searchParams.get("expires_in")
      const token_type = searchParams.get("token_type")
      const next = searchParams.get("next") ?? "/dashboard"

      // Check hash parameters too (sometimes Supabase puts tokens in hash)
      let hashParams = new URLSearchParams()
      if (urlHash) {
        const hashString = urlHash.substring(1) // Remove the #
        hashParams = new URLSearchParams(hashString)
      }

      const hashAccessToken = hashParams.get("access_token")
      const hashRefreshToken = hashParams.get("refresh_token")
      const hashTokenHash = hashParams.get("token_hash")
      const hashType = hashParams.get("type")

      // Debug logging
      console.log("=== CONFIRMATION DEBUG ===")
      console.log("Full URL:", currentUrl)
      console.log("URL Hash:", urlHash)
      console.log("Search params:", Object.fromEntries(searchParams.entries()))
      console.log("Hash params:", Object.fromEntries(hashParams.entries()))
      console.log("token_hash (search):", token_hash)
      console.log("token_hash (hash):", hashTokenHash)
      console.log("type (search):", type)
      console.log("type (hash):", hashType)
      console.log("access_token (search):", access_token ? "present" : "missing")
      console.log("access_token (hash):", hashAccessToken ? "present" : "missing")
      console.log("refresh_token (search):", refresh_token ? "present" : "missing")
      console.log("refresh_token (hash):", hashRefreshToken ? "present" : "missing")
      console.log("========================")

      // Use hash parameters if search parameters are empty
      const finalTokenHash = token_hash || hashTokenHash
      const finalType = type || hashType
      const finalAccessToken = access_token || hashAccessToken
      const finalRefreshToken = refresh_token || hashRefreshToken

      // Check for new-style invitation (token_hash + type)
      if (finalTokenHash && finalType) {
        console.log("Detected invitation link with token_hash")
        if (finalType === "invite") {
          setStatus("set-password")
          setMessage("Please set your password to complete your account setup.")
          return
        } else {
          // Regular email confirmation
          const { error } = await supabase.auth.verifyOtp({
            token_hash: finalTokenHash,
            type: finalType as any,
          })

          if (error) {
            console.error("Confirmation error:", error)
            setStatus("error")
            setMessage(error.message || "Failed to confirm email")
          } else {
            setStatus("success")
            setMessage("Email confirmed successfully!")
            setTimeout(() => {
              router.push(next)
            }, 2000)
          }
          return
        }
      }

      // Check for old-style invitation (access_token + refresh_token)
      if (finalAccessToken && finalRefreshToken) {
        console.log("Detected invitation link with access tokens")
        setStatus("set-password")
        setMessage("Please set your password to complete your account setup.")
        return
      }

      // Check for any other common parameters
      const error_code = searchParams.get("error_code") || hashParams.get("error_code")
      const error_description = searchParams.get("error_description") || hashParams.get("error_description")

      if (error_code || error_description) {
        console.log("Detected error in URL:", { error_code, error_description })
        setStatus("error")
        setMessage(error_description || `Error: ${error_code}`)
        return
      }

      // If we get here, no valid parameters were found
      console.log("No valid confirmation parameters found")
      setStatus("error")
      setMessage("Invalid confirmation link. Please check your email for the correct link or request a new invitation.")
    } catch (error) {
      console.error("Unexpected error:", error)
      setStatus("error")
      setMessage("An unexpected error occurred")
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long")
      return
    }

    setSettingPassword(true)

    try {
      // Check both search params and hash params
      const urlHash = window.location.hash
      let hashParams = new URLSearchParams()
      if (urlHash) {
        hashParams = new URLSearchParams(urlHash.substring(1))
      }

      const token_hash = searchParams.get("token_hash") || hashParams.get("token_hash")
      const type = searchParams.get("type") || hashParams.get("type")
      const access_token = searchParams.get("access_token") || hashParams.get("access_token")
      const refresh_token = searchParams.get("refresh_token") || hashParams.get("refresh_token")

      if (token_hash && type === "invite") {
        // Use the new token-based flow
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: "invite",
        })

        if (error) {
          throw error
        }

        // Now update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        })

        if (updateError) {
          throw updateError
        }
      } else if (access_token && refresh_token) {
        // Try the old token-based flow
        // Set the session first
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (sessionError) {
          throw sessionError
        }

        // Then update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: password,
        })

        if (updateError) {
          throw updateError
        }
      } else {
        throw new Error("Invalid invitation link - missing required parameters")
      }

      setStatus("success")
      setMessage("Password set successfully! Redirecting to dashboard...")

      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error: any) {
      console.error("Password setup error:", error)
      setMessage(error.message || "Failed to set password")
    } finally {
      setSettingPassword(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">CoreTrack</CardTitle>
          <CardDescription>
            {status === "set-password" ? "Complete Account Setup" : "Email Confirmation"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Processing your confirmation...</p>
            </>
          )}

          {status === "set-password" && (
            <>
              <Key className="h-12 w-12 mx-auto text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2">Set Your Password</h3>
                <p className="text-muted-foreground mb-4">{message}</p>
              </div>

              <form onSubmit={handleSetPassword} className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                  />
                </div>

                {message && !message.includes("Please set") && <p className="text-sm text-red-600">{message}</p>}

                <Button type="submit" className="w-full" disabled={settingPassword}>
                  {settingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Setup
                </Button>
              </form>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-700">Success!</h3>
                <p className="text-muted-foreground">{message}</p>
                <p className="text-sm text-muted-foreground mt-2">Redirecting to dashboard...</p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-700">Error</h3>
                <p className="text-muted-foreground">{message}</p>
              </div>
              <div className="space-y-2">
                <Link href="/auth">
                  <Button className="w-full">Back to Sign In</Button>
                </Link>
                <p className="text-xs text-muted-foreground">
                  Need help? Contact support or try requesting a new invitation.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
