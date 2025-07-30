"use client"

import type React from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Plus,
  Users,
  Trophy,
  FileText,
  Settings,
  Activity,
  Download,
  BarChart3,
  Loader,
  Shield,
  UserCog,
} from "lucide-react"
import GetChallenges from "@/components/GetChallenges"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getLeaderboardEntries } from "@/lib/firebase/leaderboard"

export default function AdminDashboard() {
  const { user, role, logout } = useAuth()
  const router = useRouter()
  const [totalSubmissions, setSubmissionCount] = useState<number>(0)
  const [stats, setStats] = useState({
    totalParticipants: 0,
    pendingReviews: 0,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prizeMoney: "",
    startTime: "",
    endTime: "",
    location: "online",
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Loading states for buttons
  const [evaluationLoading, setEvaluationLoading] = useState(false)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const unsubscribeSubmissions = onSnapshot(
      collection(db, process.env.NEXT_PUBLIC_SUBMISSION_DATABASE!),
      (snapshot) => {
        setSubmissionCount(snapshot.size)
      },
    )

    const unsubscribeUsers = onSnapshot(collection(db, process.env.NEXT_PUBLIC_USER_DATABASE!), (snapshot) => {
      setStats((prev) => ({
        ...prev,
        totalParticipants: snapshot.size,
      }))
    })

    return () => {
      unsubscribeSubmissions()
      unsubscribeUsers()
    }
  }, [user, role, router])

  const handleNewCompetitionClick = () => {
    if (role !== "superadmin") {
      alert("You are not allowed to create new competitions.")
      return
    }
    setIsModalOpen(true)
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormError(null)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const { title, description, prizeMoney, startTime, endTime, location } = formData

    if (!title || !description || !prizeMoney || !startTime || !endTime || !location) {
      setFormError("All fields are required.")
      return
    }

    const startDateTime = new Date(startTime)
    const endDateTime = new Date(endTime)

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setFormError("Invalid start or end date/time.")
      return
    }

    if (endDateTime <= startDateTime) {
      setFormError("End time must be after start time.")
      return
    }

    try {
      const response = await fetch("/api/admin/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({
          title,
          description,
          prizeMoney,
          startDeadline: startDateTime.toISOString(),
          endDeadline: endDateTime.toISOString(),
          location,
          isActive: true,
          isLocked: false,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create competition")
      }

      setIsModalOpen(false)
      setFormData({
        title: "",
        description: "",
        prizeMoney: "",
        startTime: "",
        endTime: "",
        location: "online",
      })
    } catch (error) {
      console.error("Error creating competition:", error)
      setFormError("Failed to create competition. Please try again.")
    }
  }

  // Download Leaderboard Handler
  const handleDownloadLeaderboard = async () => {
    const { entries } = await getLeaderboardEntries()

    const csvContent = [
      ["Rank", "Full Name", "Email", "Score"],
      ...entries.map((e) => [e.rank, e.fullName, e.email, e.totalScore]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "leaderboard.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Start Evaluation Handler
  const handleStartEvaluation = async () => {
    setEvaluationLoading(true)
    try {
      const res = await fetch("http://localhost:8080/bulk-evaluate/start-evaluation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Evaluation failed")
      console.log("✅ Judge llm evaluation completed and uploaded to Firestore.")
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`)
    } finally {
      setEvaluationLoading(false)
    }
  }

  // Generate Leaderboard Handler
  const handleGenerateLeaderboard = async () => {
    setLeaderboardLoading(true)
    try {
      const res = await fetch("http://localhost:8080/leaderboard/generate", {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")
      console.log("✅ Leaderboard generation completed.")
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`)
    } finally {
      setLeaderboardLoading(false)
    }
  }

  if (!user || (role !== "admin" && role !== "superadmin")) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start sm:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-semibold text-slate-900 leading-tight">Admin Dashboard</h1>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full uppercase tracking-wide ${
                      role === "superadmin"
                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {role === "superadmin" ? "Super Admin" : "Admin"}
                  </span>
                </div>
                <p className="text-slate-600 text-sm sm:text-base">Manage competitions and monitor submissions</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-end items-center">
              {role === "superadmin" && (
                <>
                  <button
                    className="px-4 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-500 transition-all duration-200"
                    onClick={() => router.push("/admin/edit-competitions")}
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Edit Competition</span>
                    </div>
                  </button>

                  <button
                    className="px-4 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-500 transition-all duration-200"
                    onClick={handleNewCompetitionClick}
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>New Competition</span>
                    </div>
                  </button>
                </>
              )}
              <button
                className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 transition-all duration-200"
                onClick={logout}
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-10 px-6 space-y-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Participants */}
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Participants</CardTitle>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalParticipants.toLocaleString()}</div>
              <p className="text-sm text-slate-500">Registered users</p>
            </CardContent>
          </Card>

          {/* Total Submissions */}
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Submissions</CardTitle>
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-slate-900 mb-1">{totalSubmissions}</div>
              <p className="text-sm text-slate-500">Across all competitions</p>
            </CardContent>
          </Card>

          {/* Pending Reviews */}
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Pending Reviews</CardTitle>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <Activity className="h-4 w-4 text-amber-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-slate-900 mb-1">{stats.pendingReviews.toLocaleString()}</div>
              <p className="text-sm text-slate-500">Flagged for manual review</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard Management */}
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <Trophy className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 text-lg font-semibold">Leaderboard Management</CardTitle>
                  <CardDescription className="text-slate-600">View and export final rankings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Button
                size="lg"
                onClick={() => router.push("/admin/leaderboard")}
                className="w-full bg-slate-900 text-white font-medium hover:bg-slate-800 hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Leaderboard
              </Button>

              {/* Download Leaderboard Button - Now consistent */}
              <Button
                size="lg"
                onClick={handleDownloadLeaderboard}
                className="w-full bg-slate-900 text-white font-medium hover:bg-slate-800 hover:shadow-md transition-all duration-200 rounded-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Leaderboard
              </Button>
            </CardContent>
          </Card>

          {/* Admin Controls */}
          {(role === "admin" || role === "superadmin") && (
            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-slate-200">
              <CardHeader className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                    <Shield className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-slate-900 text-lg font-semibold">Admin Controls</CardTitle>
                    <CardDescription className="text-slate-600">Manage roles and judges</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <Button
                  size="lg"
                  className={`w-full font-medium transition-all duration-200 rounded-lg ${
                    role === "superadmin"
                      ? "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
                  onClick={() => {
                    if (role === "superadmin") {
                      router.push("/admin/superadmin")
                    } else {
                      alert("You don't have permission to manage roles.")
                    }
                  }}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Manage Roles
                </Button>
                <Button
                  size="lg"
                  className={`w-full font-medium transition-all duration-200 rounded-lg ${
                    role === "superadmin"
                      ? "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
                  onClick={() => {
                    if (role === "superadmin") {
                      router.push("/admin/participant-distribution")
                    } else {
                      alert("You don't have permission to manage roles.")
                    }
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Judges
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Evaluation */}
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-900 text-lg font-semibold">Evaluation</CardTitle>
                  <CardDescription className="text-slate-600">Manual or LLM scoring</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {/* Start Evaluation Button */}
              <Button
                size="lg"
                onClick={handleStartEvaluation}
                disabled={evaluationLoading}
                className="w-full bg-slate-900 text-white font-medium hover:bg-slate-800 hover:shadow-md transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {evaluationLoading ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                {evaluationLoading ? "Evaluating..." : "Start Evaluation"}
              </Button>

              {/* Generate Leaderboard Button - Now consistent */}
              <Button
                size="lg"
                onClick={handleGenerateLeaderboard}
                disabled={leaderboardLoading}
                className="w-full bg-slate-900 text-white font-medium hover:bg-slate-800 hover:shadow-md transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {leaderboardLoading ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trophy className="h-4 w-4 mr-2" />
                )}
                {leaderboardLoading ? "Generating..." : "Generate Leaderboard"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <GetChallenges />
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-white border border-slate-200 text-slate-900 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-slate-900 text-xl font-semibold">Create New Competition</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-slate-700 font-medium">
                  Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  placeholder="e.g., Quantum Prompt Challenge"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-slate-700 font-medium">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  placeholder="e.g., A battle of wits to craft the most efficient and creative prompts"
                />
              </div>
              <div>
                <Label htmlFor="prizeMoney" className="text-slate-700 font-medium">
                  Prize Money
                </Label>
                <Input
                  id="prizeMoney"
                  value={formData.prizeMoney}
                  onChange={(e) => handleFormChange("prizeMoney", e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  placeholder="e.g., 5000$"
                />
              </div>
              <div>
                <Label htmlFor="startTime" className="text-slate-700 font-medium">
                  Start Date & Time
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleFormChange("startTime", e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-slate-700 font-medium">
                  End Deadline
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleFormChange("endTime", e.target.value)}
                  className="bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-slate-700 font-medium">
                  Location
                </Label>
                <Select value={formData.location} onValueChange={(value) => handleFormChange("location", value)}>
                  <SelectTrigger className="bg-slate-50 border-slate-300 text-slate-900">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offsite">Offsite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formError && <p className="text-red-600 text-sm font-medium">{formError}</p>}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md transition-all duration-200"
                >
                  Create Competition
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
