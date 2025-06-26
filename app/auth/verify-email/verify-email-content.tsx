"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, RefreshCw, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export function VerifyEmailContent() {
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get email from URL params or current session
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setUserEmail(emailParam)
    } else {
      // Try to get from current session
      const getCurrentUser = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user?.email) {
          setUserEmail(user.email)
        }
      }
      getCurrentUser()
    }
  }, [searchParams])

  useEffect(() => {
    // Cooldown timer
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendEmail = async () => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "No email address found. Please try signing up again.",
        variant: "destructive",
      })
      return
    }

    setIsResending(true)

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Email Sent",
        description: "A new verification email has been sent to your inbox.",
      })

      // Start cooldown
      setResendCooldown(60)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToSignIn = () => {
    router.push("/auth")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-blue-700">Check Your Email</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                We've sent a verification link to your email address
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Waiting for you to click the link...</span>
              </div>

              {userEmail && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Email sent to:</span>
                  </p>
                  <p className="text-blue-800 font-mono text-sm break-all">{userEmail}</p>
                </div>
              )}

              <div className="space-y-3 text-sm text-gray-600">
                <p className="font-medium">📧 Click the verification link in your email to continue.</p>
                <p>Don't see the email? Check your spam folder.</p>
                <p className="text-xs">The link will take you directly to your dashboard.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
                className="w-full"
                variant="outline"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Email
                  </>
                )}
              </Button>

              <Button onClick={handleBackToSignIn} variant="ghost" className="w-full">
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
