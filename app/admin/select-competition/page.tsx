"use client"
import type React from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit3, Trophy, Calendar, MapPin, Users, RefreshCw } from "lucide-react"
import { collection, onSnapshot, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Competition {
  id: string
  title: string
  description: string
  prizeMoney: string
  startDeadline: string
  endDeadline: string
  location: string
  isActive: boolean
  isLocked: boolean
}

// Competition Skeleton Component
const CompetitionSkeleton = () => (
  <Card className="bg-white rounded-2xl border-0 shadow-sm animate-pulse">
    <CardContent className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16 ml-2"></div>
          </div>
        </div>
        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        {/* Action Button */}
        <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
      </div>
    </CardContent>
  </Card>
)

export default function CompetitionSelector() {
  const { user, role, logout } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
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

    const unsubscribe = onSnapshot(collection(db, "competitions"), (snapshot) => {
      const competitionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Competition[]
      setCompetitions(competitionsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  const getCompetitionStatus = (competition: Competition) => {
    const now = new Date()
    const startDate = new Date(competition.startDeadline)
    const endDate = new Date(competition.endDeadline)

    if (competition.isLocked) {
      return { label: "Locked", color: "bg-gray-100 text-gray-700" }
    }
    if (!competition.isActive) {
      return { label: "Inactive", color: "bg-red-100 text-red-700" }
    }
    if (now < startDate) {
      return { label: "Upcoming", color: "bg-blue-100 text-blue-700" }
    }
    if (now > endDate) {
      return { label: "Ended", color: "bg-gray-100 text-gray-700" }
    }
    return { label: "Active", color: "bg-green-100 text-green-700" }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleManageClick = (competitionId: string) => {
    router.push(`/admin/dashboard?competitionId=${competitionId}`)
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
      if (!user) {
        setFormError("User not authenticated.")
        return
      }

      await addDoc(collection(db, "competitions"), {
        title,
        description,
        prizeMoney,
        startDeadline: startDateTime.toISOString(),
        endDeadline: endDateTime.toISOString(),
        location,
        isActive: true,
        isLocked: false,
        createdAt: new Date().toISOString(),
        createdBy: {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
        },
      })

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

  if (!user || (role !== "admin" && role !== "superadmin")) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl font-bold text-gray-900">Select a Competition to Manage</h1>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded uppercase tracking-wide">
                    {role === "superadmin" ? "SUPER ADMIN" : "ADMIN"}
                  </span>
                </div>
                <p className="text-gray-600 text-lg">Choose a competition to access its management dashboard</p>
              </div>
              <div className="flex items-center gap-3">
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

        {/* Loading Content */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="space-y-8">
            {/* Loading Message */}
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <RefreshCw className="w-12 h-12 text-gray-400 animate-spin mx-auto" />
                <div className="space-y-2">
                  <p className="text-gray-700 font-semibold text-lg">Loading competitions...</p>
                  <p className="text-gray-500">Please wait while we fetch your competitions from the database</p>
                </div>
              </div>
            </div>

            {/* Skeleton Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <CompetitionSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Select a Competition to Manage</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded uppercase tracking-wide">
                  {role === "superadmin" ? "SUPER ADMIN" : "ADMIN"}
                </span>
              </div>
              <p className="text-gray-600 text-lg">Choose a competition to access its management dashboard</p>
            </div>
            <div className="flex items-center gap-3">
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
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Superadmin Actions */}
        {role === "superadmin" && (
          <div className="mb-8 flex items-center gap-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Competition
            </Button>
            <Button
              onClick={() => router.push("/admin/edit-competitions")}
              className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-2 rounded-lg"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Competitions
            </Button>
          </div>
        )}

        {/* Competitions Grid */}
        {competitions.length === 0 ? (
          <Card className="bg-white rounded-2xl border-0 shadow-sm p-12 text-center">
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Trophy className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No competitions available yet</h3>
              <p className="text-gray-600">
                {role === "superadmin"
                  ? "Create your first competition to get started."
                  : "Contact a super admin to create competitions."}
              </p>
              {role === "superadmin" && (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gray-900 text-white hover:bg-gray-800 px-6 py-2 rounded-lg mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Competition
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((competition) => {
              const status = getCompetitionStatus(competition)
              return (
                <Card
                  key={competition.id}
                  className="bg-white rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{competition.title}</h3>
                          <Badge className={`${status.color} border-0 font-medium`}>{status.label}</Badge>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{competition.description}</p>
                      </div>
                      {/* Details */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span>
                            {formatDate(competition.startDeadline)} - {formatDate(competition.endDeadline)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span className="capitalize">{competition.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span>{competition.prizeMoney}</span>
                        </div>
                      </div>
                      {/* Action */}
                      <Button
                        onClick={() => handleManageClick(competition.id)}
                        className="w-full bg-gray-900 text-white hover:bg-gray-800 py-2 rounded-lg"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Competition
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Competition Modal */}
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
                placeholder="e.g., $5,000"
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
