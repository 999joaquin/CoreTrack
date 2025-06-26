"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signIn, signUp } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, EyeOff, Check, X, Shield } from "lucide-react"
import { logActivity } from "@/lib/activity-actions"
import { cn } from "@/lib/utils"

interface PasswordStrength {
  score: number
  label: string
  color: string
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    special: boolean
  }
}

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: "Very Weak",
    color: "text-red-500",
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      special: false,
    },
  })

  const router = useRouter()
  const { toast } = useToast()

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    const requirements = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    }

    const score = Object.values(requirements).filter(Boolean).length

    let label = "Very Weak"
    let color = "text-red-500"

    if (score === 4) {
      label = "Strong"
      color = "text-green-500"
    } else if (score === 3) {
      label = "Good"
      color = "text-yellow-500"
    } else if (score === 2) {
      label = "Fair"
      color = "text-orange-500"
    } else if (score === 1) {
      label = "Weak"
      color = "text-red-400"
    }

    return { score, label, color, requirements }
  }

  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password))
    }
  }, [password])

  const isPasswordValid = passwordStrength.score === 4
  const doPasswordsMatch = password === confirmPassword && confirmPassword !== ""

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { error } = await signIn(email, password)

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Signed in successfully!",
      })
      router.push("/dashboard")

      // Log sign in activity
      try {
        await logActivity({
          action: "signed_in",
          entity_type: "auth",
          entity_id: email,
          details: {
            email: email,
            method: "email_password",
          },
        })
      } catch (activityError) {
        console.error("Failed to log activity:", activityError)
      }
    }

    setIsLoading(false)
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isPasswordValid) {
      toast({
        title: "Invalid Password",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      })
      return
    }

    if (!doPasswordsMatch) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string

    try {
      const { data, error } = await signUp(email, password, fullName)

      if (error) {
        console.error("Signup error:", error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        console.log("Signup successful:", data)
        toast({
          title: "Success",
          description: "Account created! Please check your email to verify your account.",
        })

        // Redirect to verification page
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)

        // Log sign up activity (this might fail if profile doesn't exist yet, but that's ok)
        try {
          await logActivity({
            action: "signed_up",
            entity_type: "auth",
            entity_id: email,
            details: {
              email: email,
              full_name: fullName,
              method: "email_password",
            },
          })
        } catch (activityError) {
          console.error("Failed to log activity (this is normal for new users):", activityError)
        }
      }
    } catch (error: any) {
      console.error("Unexpected signup error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                CoreTrack
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">Secure project management platform</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger value="signin" className="data-[state=active]:bg-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="h-11 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullName" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="signup-fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="h-11 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {password && (
                      <div className="space-y-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Password Strength:</span>
                          <span className={cn("text-sm font-medium", passwordStrength.color)}>
                            {passwordStrength.label}
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              passwordStrength.score === 1 && "bg-red-500 w-1/4",
                              passwordStrength.score === 2 && "bg-orange-500 w-2/4",
                              passwordStrength.score === 3 && "bg-yellow-500 w-3/4",
                              passwordStrength.score === 4 && "bg-green-500 w-full",
                            )}
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-xs">
                            {passwordStrength.requirements.length ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span className={passwordStrength.requirements.length ? "text-green-600" : "text-red-600"}>
                              At least 8 characters
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-xs">
                            {passwordStrength.requirements.uppercase ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span
                              className={passwordStrength.requirements.uppercase ? "text-green-600" : "text-red-600"}
                            >
                              One uppercase letter
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-xs">
                            {passwordStrength.requirements.lowercase ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span
                              className={passwordStrength.requirements.lowercase ? "text-green-600" : "text-red-600"}
                            >
                              One lowercase letter
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-xs">
                            {passwordStrength.requirements.special ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span className={passwordStrength.requirements.special ? "text-green-600" : "text-red-600"}>
                              One special character
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className={cn(
                          "h-11 pr-10",
                          confirmPassword && !doPasswordsMatch && "border-red-500 focus:border-red-500",
                        )}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {confirmPassword && (
                      <div className="flex items-center space-x-2 text-xs">
                        {doPasswordsMatch ? (
                          <>
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="text-green-600">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-red-500" />
                            <span className="text-red-600">Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    disabled={isLoading || !isPasswordValid || !doPasswordsMatch}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
