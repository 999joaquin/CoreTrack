"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { inviteUserByEmail } from "@/lib/admin-actions"

export default function DebugInvitationPage() {
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTestInvitation = async () => {
    setLoading(true)
    try {
      const result = await inviteUserByEmail(email, "Test User", "user")
      setResult(result)
      console.log("Invitation result:", result)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Debug Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Test Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <Button onClick={handleTestInvitation} disabled={loading || !email}>
            {loading ? "Sending..." : "Send Test Invitation"}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>
              <strong>Instructions:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter a test email address</li>
              <li>Click "Send Test Invitation"</li>
              <li>Check the email and copy the full URL</li>
              <li>Open browser dev tools and paste the URL</li>
              <li>Check the console logs for parameter details</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
