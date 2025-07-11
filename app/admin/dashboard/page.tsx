"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LogOut, Users, FileText, Award, Settings, Lock, Unlock, Play } from "lucide-react"
import { ParticipantTable } from "@/components/participant-table"
import { ProblemUpload } from "@/components/problem-upload"
import { RubricUpload } from "@/components/rubric-upload"
import { TopSubmissions } from "@/components/top-submissions"

export default function AdminDashboard() {
  const [submissionsLocked, setSubmissionsLocked] = useState(false)

  const stats = {
    totalParticipants: 1247,
    submissions: 892,
    evaluated: 234,
    pending: 658,
  }

  const handleLockSubmissions = () => {
    setSubmissionsLocked(!submissionsLocked)
  }

  const handleTriggerEvaluation = () => {
    // Placeholder for LLM evaluation trigger
    console.log("Triggering LLM evaluation...")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <Badge variant="destructive" className="px-3 py-1">
              ADMIN
            </Badge>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParticipants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submissions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evaluated</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.evaluated}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Competition Controls</CardTitle>
            <CardDescription>Manage submission status and trigger evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant={submissionsLocked ? "destructive" : "default"} onClick={handleLockSubmissions}>
                {submissionsLocked ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock Submissions
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Submissions
                  </>
                )}
              </Button>

              <Button onClick={handleTriggerEvaluation} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Trigger LLM Evaluation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="participants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="rubrics">Rubrics</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="participants">
            <ParticipantTable />
          </TabsContent>

          <TabsContent value="problems">
            <ProblemUpload />
          </TabsContent>

          <TabsContent value="rubrics">
            <RubricUpload />
          </TabsContent>

          <TabsContent value="results">
            <TopSubmissions />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
