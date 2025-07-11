"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LogOut, Clock, CheckCircle, AlertCircle, FileText, Send } from "lucide-react"

export default function ParticipantDashboard() {
  const [submissionStatus] = useState("pending") // pending, submitted, locked

  const mockProblemStatement = `
Design an effective prompt for a large language model to analyze customer feedback and categorize it into the following categories:
1. Product Quality Issues
2. Service Experience
3. Pricing Concerns
4. Feature Requests
5. General Satisfaction

Your prompt should:
- Be clear and specific
- Include examples where appropriate
- Handle edge cases and ambiguous feedback
- Provide consistent categorization results
- Include confidence scoring for each categorization

The LLM should also provide a brief explanation for its categorization decision.
  `

  const getStatusIcon = () => {
    switch (submissionStatus) {
      case "submitted":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "locked":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = () => {
    switch (submissionStatus) {
      case "submitted":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Submitted
          </Badge>
        )
      case "locked":
        return <Badge variant="destructive">Locked</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Participant Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, John Doe</span>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Competition Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon()}
                    Competition Status
                  </CardTitle>
                  {getStatusBadge()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Time Remaining</span>
                      <span className="font-medium">5 days, 14 hours</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>

                  {submissionStatus === "pending" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You haven't submitted your solution yet. Make sure to submit before the deadline!
                      </AlertDescription>
                    </Alert>
                  )}

                  {submissionStatus === "submitted" && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Your submission has been received and is under evaluation.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Problem Statement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Problem Statement
                </CardTitle>
                <CardDescription>Read the problem carefully and design your prompt solution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{mockProblemStatement}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Submission Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Your Solution
                </CardTitle>
                <CardDescription>Submit your prompt and expected LLM output</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Button asChild size="lg">
                    <Link href="/participant/submission">
                      {submissionStatus === "submitted" ? "View Submission" : "Create Submission"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Competition Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Participants</span>
                  <span className="font-medium">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Submissions</span>
                  <span className="font-medium">892</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Deadline</span>
                  <span className="font-medium">Mar 30, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Rank</span>
                  <span className="font-medium">-</span>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li>• Prompt must be clear and specific</li>
                  <li>• Include example inputs/outputs</li>
                  <li>• Test your prompt thoroughly</li>
                  <li>• Submit before the deadline</li>
                  <li>• One submission per participant</li>
                </ul>
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Contact our support team if you have any questions.</p>
                <Button variant="outline" className="w-full bg-transparent">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
