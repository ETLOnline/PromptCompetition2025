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
import { Plus, Users, Trophy, FileText, Settings, Activity } from "lucide-react"
import GetChallenges from "@/components/GetChallenges"
import StartEvaluationButton from "@/components/StartEvaluation"
import GenerateLeaderboardButton from "@/components/GenerateLeaderboard"
import DownloadLeaderboardButton from "@/components/DownloadLeaderboard"
import { collection, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
  //const [loading, setLoading] = useState(true)

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

    // Real-time listener for users (total participants)
    const unsubscribeUsers = onSnapshot(collection(db, process.env.NEXT_PUBLIC_USER_DATABASE!), (snapshot) => {
      setStats((prev) => ({
        ...prev,
        totalParticipants: snapshot.size,
      }))
    })

    // Cleanup both listeners on unmount
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

  if (!user || (role !== "admin" && role !== "superadmin")) return null

  // console.log("User role:", role)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-150">
      <header className="bg-gradient-to-r from-slate-100 to-slate-200 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Left Section: Enhanced Icon + Title + Stats */}
          <div className="flex items-start sm:items-center gap-4">
            
            
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                  Admin Dashboard
                </h1>
                <span className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full uppercase tracking-wide">
                  {role === "superadmin" ? "Super Admin" : "Admin"}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm sm:text-base">
                Manage competitions and monitor submissions
              </p>
              
            </div>
          </div>

          {/* Right Section: Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-end items-center">
            {role === "superadmin" && (
              <>
                <button
                  className="px-4 py-2.5 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-small rounded-lg hover:shadow-lg hover:from-gray-800 hover:to-gray-700 focus-visible:ring-2 focus-visible:ring-gray-500 transition-all duration-200"
                  onClick={() => router.push("/admin/edit-competitions")}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <span>Edit Competition</span>
                  </div>
                </button>
              
              <button
                className="px-4 py-2.5 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-small rounded-lg hover:shadow-lg hover:from-gray-800 hover:to-gray-700 focus-visible:ring-2 focus-visible:ring-gray-500 transition-all duration-200"
                onClick={handleNewCompetitionClick}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <span>New Competition</span>
                </div>
              </button>
            </>
            )}
            <button 
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-small rounded-lg hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-400 transition-all duration-200"
              onClick={logout}
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>

      <main className="max-w-6xl mx-auto py-10 px-6 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Total Participants</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 group-hover:shadow-sm transition-all duration-200">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalParticipants.toLocaleString()}</div>
              <p className="text-sm text-gray-700 font-medium">Registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Total Submissions</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 group-hover:shadow-sm transition-all duration-200">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-2">{totalSubmissions}</div>
              <p className="text-sm text-gray-700 font-medium">Across all competitions</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700">Pending Reviews</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 group-hover:shadow-sm transition-all duration-200">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-gray-900 mb-2">{stats.pendingReviews.toLocaleString()}</div>
              <p className="text-sm text-gray-700 font-medium">Flagged for manual review</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-100 to-slate-150 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-lg font-bold">Leaderboard Management</CardTitle>
                  <CardDescription className="text-gray-700 font-medium">
                    View and export final rankings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                size="lg"
                onClick={() => router.push("/admin/leaderboard")}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white font-medium hover:shadow-md transition-all duration-200"
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Leaderboard
              </Button>
              <DownloadLeaderboardButton />
            </CardContent>
          </Card>

          {(role === "admin" || role === "superadmin") && (
            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 group">
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-100 to-slate-150 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 group-hover:shadow-sm transition-all duration-200">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 text-lg font-bold">Admin Controls</CardTitle>
                    <CardDescription className="text-gray-700 font-medium">
                      Manage roles and judges
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Manage Roles button */}
                <Button
                  size="lg"
                  className={`w-full font-medium transition-all duration-200 ${
                    role === "superadmin"
                      ? "bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:shadow-md"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
                  }`}
                  //disabled={role !== "superadmin"}
                  onClick={() => {
                    if (role === "superadmin") {
                      router.push("/admin/superadmin")
                    } else {
                      alert("You don't have permission to manage roles.")
                    }
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Roles
                </Button>
                {/* Second button: e.g. Judge Management */}
                <Button
                  size="lg"
                  className={`w-full font-medium transition-all duration-200 ${
                    role === "superadmin"
                      ? "bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:shadow-md"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
                  }`}
                  //disabled={role !== "superadmin"}
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

          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-100 to-slate-150 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-lg font-bold">Evaluation</CardTitle>
                  <CardDescription className="text-gray-700 font-medium">Manual or LLM scoring</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StartEvaluationButton />
              <GenerateLeaderboardButton />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <GetChallenges />
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-white border border-gray-200 text-gray-900 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-gray-900 text-2xl font-bold">Create New Competition</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-gray-700 font-medium">
                  Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                  placeholder="e.g., Quantum Prompt Challenge"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-700 font-medium">
                  Description
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                  placeholder="e.g., A battle of wits to craft the most efficient and creative prompts"
                />
              </div>
              <div>
                <Label htmlFor="prizeMoney" className="text-gray-700 font-medium">
                  Prize Money
                </Label>
                <Input
                  id="prizeMoney"
                  value={formData.prizeMoney}
                  onChange={(e) => handleFormChange("prizeMoney", e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                  placeholder="e.g., 5000$"
                />
              </div>
              <div>
                <Label htmlFor="startTime" className="text-gray-700 font-medium">
                  Start Date & Time
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleFormChange("startTime", e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-gray-700 font-medium">
                  End Deadline
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleFormChange("endTime", e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-gray-700 font-medium">
                  Location
                </Label>
                <Select value={formData.location} onValueChange={(value) => handleFormChange("location", value)}>
                  <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 text-gray-900">
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
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:shadow-md transition-all duration-200"
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