"use client"

import type React from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  BarChart3,
  Shield,
  UserCog,
  Edit3,
  Download,
} from "lucide-react"
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded uppercase tracking-wide">
                  {role === "superadmin" ? "SUPER ADMIN" : "ADMIN"}
                </span>
              </div>
              <p className="text-gray-600 text-lg">Manage competitions and monitor submissions</p>
            </div>

            <div className="flex items-center gap-3">
              {role === "superadmin" && (
                <>
                  <Button
                    onClick={() => router.push("/admin/edit-competitions")}
                    className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-2 rounded-lg"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Competition
                  </Button>
                  <Button
                    onClick={handleNewCompetitionClick}
                    className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-2 rounded-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Competition
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={logout}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-lg bg-transparent"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white rounded-2xl border-0 shadow-sm p-6 h-full">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-gray-600 font-medium">Total Participants</h3>
                <div className="text-4xl font-bold text-gray-900">{stats.totalParticipants}</div>
                <p className="text-gray-500 text-sm">Registered users</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-gray-600 font-medium">Total Submissions</h3>
                <div className="text-4xl font-bold text-gray-900">{totalSubmissions}</div>
                <p className="text-gray-500 text-sm">Across all competitions</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white rounded-2xl border-0 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-gray-600 font-medium">Pending Reviews</h3>
                <div className="text-4xl font-bold text-gray-900">{stats.pendingReviews}</div>
                <p className="text-gray-500 text-sm">Flagged for manual review</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Admin Controls */}
          {(role === "admin" || role === "superadmin") && (
            <Card className="bg-white rounded-2xl border-0 shadow-sm p-6 h-full">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Admin Controls</h3>
                    <p className="text-gray-600">Manage roles and judges</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      if (role === "superadmin") {
                        router.push("/admin/superadmin")
                      } else {
                        alert("You don't have permission to manage roles.")
                      }
                    }}
                    className="w-full py-3 rounded-lg font-semibold transition-colors duration-200 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    Manage Roles
                  </Button>
                  <Button
                    onClick={() => {
                      if (role === "superadmin") {
                        router.push("/admin/participant-distribution")
                      } else {
                        alert("You don't have permission to manage roles.")
                      }
                    }}
                    className="w-full py-3 rounded-lg font-semibold transition-colors duration-200 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Judges
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Evaluation */}
          <Card className="bg-white rounded-2xl border-0 shadow-sm p-6 h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Evaluation</h3>
                  <p className="text-gray-600">Manual or LLM scoring</p>
                </div>
              </div>

              <div className="space-y-3">
                <StartEvaluationButton />
                <GenerateLeaderboardButton />
              </div>
            </div>
          </Card>
          {/* Leaderboard Management */}
          <Card className="bg-white rounded-2xl border-0 shadow-sm p-6 h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Trophy className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Leaderboard Management</h3>
                  <p className="text-gray-600">View and export final rankings</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/admin/leaderboard")}
                  className="w-full py-3 rounded-lg font-semibold transition-colors duration-200 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  View Leaderboard
                </Button>

                <DownloadLeaderboardButton />
              </div>
            </div>
          </Card>

        </div>


        {/* Challenges Section */}
        <Card className="bg-white rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <GetChallenges />
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Create New Competition</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                placeholder="e.g., Quantum Prompt Challenge"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                placeholder="e.g., A battle of wits to craft the most efficient and creative prompts"
              />
            </div>
            <div>
              <Label htmlFor="prizeMoney" className="text-sm font-medium text-gray-700">
                Prize Money
              </Label>
              <Input
                id="prizeMoney"
                value={formData.prizeMoney}
                onChange={(e) => handleFormChange("prizeMoney", e.target.value)}
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                placeholder="e.g., 5000$"
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">
                  Start Date & Time
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleFormChange("startTime", e.target.value)}
                  className="mt-1 bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">
                  End Deadline
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleFormChange("endTime", e.target.value)}
                  className="mt-1 bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                Location
              </Label>
              <Select value={formData.location} onValueChange={(value) => handleFormChange("location", value)}>
                <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offsite">Offsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-red-700 text-sm">{formError}</p>
              </div>
            )}
            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-gray-900 text-white hover:bg-gray-800">
                Create Competition
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
