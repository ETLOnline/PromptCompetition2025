"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { fetchWithAuth } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Calendar, Clock, Users, Zap, Trophy, RefreshCw, TrendingUp } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, getDoc, deleteDoc, updateDoc, increment, Timestamp } from "firebase/firestore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DailyChallenge {
  id: string
  title: string
  startTime: string
  endTime: string
  totalSubmissions: number
  createdBy: string
  lastUpdatedBy: string
  status: "active" | "ongoing" | "ended" | "upcoming"
  type: "direct" | "reverse" | string
  createdAt?: string
  createdByEmail?: string
  guidelines?: string
  problemStatement?: string
}

export default function DailyChallengeAdmin() {
  const router = useRouter()
  const [challenges, setChallenges] = useState<DailyChallenge[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statsData, setStatsData] = useState({
    totalChallenges: 0,
    totalSubmissions: 0,
    ongoing: 0,
    upcoming: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [challengeToDelete, setChallengeToDelete] = useState<DailyChallenge | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch challenges and stats from Firestore after auth
  useEffect(() => {
    checkAuth()
  }, [router])

  const checkAuth = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
      if (profile.role !== "superadmin") {
        router.push("/admin/select-competition")
        return
      }
      fetchData()
    } catch (error) {
      console.error("Authentication check failed:", error)
      router.push("/")
    }
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      let totalChallenges = 0
      let totalSubmissions = 0
      
      // Fetch from /stats/dailychallenge with error handling
      try {
        const statsDocRef = doc(db, "stats", "dailychallenge")
        const statsDoc = await getDoc(statsDocRef)
        
        if (statsDoc.exists()) {
          const data = statsDoc.data()
          totalChallenges = data?.Totalchallenges || 0
          totalSubmissions = data?.totalsubmission || 0
        } else {
          console.log("Stats document does not exist, using default values")
          // Stats document doesn't exist, keep defaults at 0
        }
      } catch (statsError) {
        console.error("Error fetching stats document:", statsError)
        // Continue with default values (0, 0)
      }
      
      const now = new Date()
      let ongoingCount = 0
      let upcomingCount = 0
      const fetchedChallenges: DailyChallenge[] = []
      
      // Fetch all challenges from dailychallenge collection with error handling
      try {
        const challengesRef = collection(db, "dailychallenge")
        const challengesSnapshot = await getDocs(challengesRef)
        
        // Check if collection is empty
        if (challengesSnapshot.empty) {
          console.log("No challenges found in dailychallenge collection")
        } else {
          challengesSnapshot.forEach((docSnapshot) => {
            try {
              const data = docSnapshot.data()
              
              // Validate required fields
              if (!data) {
                console.warn(`Challenge ${docSnapshot.id} has no data`)
                return
              }
              
              // Convert Firestore Timestamps to Date objects with fallback
              let startTime: Date
              let endTime: Date
              let createdAt: Date
              
              try {
                startTime = data.startTime instanceof Timestamp 
                  ? data.startTime.toDate() 
                  : new Date(data.startTime)
                
                endTime = data.endTime instanceof Timestamp 
                  ? data.endTime.toDate() 
                  : new Date(data.endTime)
                
                createdAt = data.createdAt instanceof Timestamp
                  ? data.createdAt.toDate()
                  : new Date(data.createdAt)
                
                // Check for invalid dates
                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                  console.warn(`Challenge ${docSnapshot.id} has invalid date values`)
                  return
                }
              } catch (dateError) {
                console.error(`Error parsing dates for challenge ${docSnapshot.id}:`, dateError)
                return
              }
              
              // Determine status based on current time
              let status: "active" | "ongoing" | "ended" | "upcoming" = "upcoming"
              if (now >= startTime && now <= endTime) {
                status = "ongoing"
                ongoingCount++
              } else if (now < startTime) {
                status = "upcoming"
                upcomingCount++
              } else if (now > endTime) {
                status = "ended"
              }
              
              // Build challenge object with safe property access
              fetchedChallenges.push({
                id: docSnapshot.id,
                title: data.title || "Untitled Challenge",
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                totalSubmissions: typeof data.totalSubmissions === 'number' ? data.totalSubmissions : 0,
                createdBy: data.createdBy || "Unknown",
                lastUpdatedBy: data.lastUpdatedBy || data.createdBy || "Unknown",
                status: status,
                type: data.type || "direct",
                createdAt: createdAt.toISOString(),
                createdByEmail: data.createdByEmail || undefined,
                guidelines: data.guidelines || undefined,
                problemStatement: data.problemStatement || undefined
              })
            } catch (docError) {
              console.error(`Error processing challenge ${docSnapshot.id}:`, docError)
              // Skip this document and continue with others
            }
          })
        }
      } catch (collectionError) {
        console.error("Error fetching dailychallenge collection:", collectionError)
        // Collection might not exist, continue with empty challenges array
      }
      
      // Sort challenges by createdAt (most recent first)
      fetchedChallenges.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.startTime)
        const dateB = new Date(b.createdAt || b.startTime)
        return dateB.getTime() - dateA.getTime()
      })
      
      setChallenges(fetchedChallenges)
      setStatsData({
        totalChallenges,
        totalSubmissions,
        ongoing: ongoingCount,
        upcoming: upcomingCount
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      // Set default values on error
      setChallenges([])
      setStatsData({
        totalChallenges: 0,
        totalSubmissions: 0,
        ongoing: 0,
        upcoming: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete challenge
  const handleDeleteClick = (challenge: DailyChallenge) => {
    setChallengeToDelete(challenge)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!challengeToDelete) return

    try {
      setIsDeleting(true)

      // Delete the challenge document
      const challengeDocRef = doc(db, "dailychallenge", challengeToDelete.id)
      await deleteDoc(challengeDocRef)

      // Update stats document
      try {
        const statsDocRef = doc(db, "stats", "dailychallenge")
        const statsDoc = await getDoc(statsDocRef)

        if (statsDoc.exists()) {
          // Decrement Totalchallenges by 1 and totalsubmission by challenge's totalSubmissions
          await updateDoc(statsDocRef, {
            Totalchallenges: increment(-1),
            totalsubmission: increment(-challengeToDelete.totalSubmissions)
          })
        } else {
          console.warn("Stats document does not exist, skipping stats update")
        }
      } catch (statsError) {
        console.error("Error updating stats:", statsError)
        // Continue even if stats update fails
      }

      // Update local state
      setChallenges(prev => prev.filter(c => c.id !== challengeToDelete.id))
      setStatsData(prev => ({
        totalChallenges: Math.max(0, prev.totalChallenges - 1),
        totalSubmissions: Math.max(0, prev.totalSubmissions - challengeToDelete.totalSubmissions),
        ongoing: challengeToDelete.status === 'ongoing' ? Math.max(0, prev.ongoing - 1) : prev.ongoing,
        upcoming: challengeToDelete.status === 'upcoming' ? Math.max(0, prev.upcoming - 1) : prev.upcoming
      }))

      // Close dialog and reset state
      setDeleteDialogOpen(false)
      setChallengeToDelete(null)
    } catch (error) {
      console.error("Error deleting challenge:", error)
      alert("Failed to delete challenge. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setChallengeToDelete(null)
  }

  const getStatusColor = (status: DailyChallenge["status"]) => {
    switch (status) {
      case "ongoing":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "active":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "ended":
        return "bg-slate-100 text-slate-600 border-slate-200"
      case "upcoming":
        return "bg-amber-50 text-amber-700 border-amber-200"
      default:
        return "bg-slate-100 text-slate-600 border-slate-200"
    }
  }

  const getTypeColor = (type: DailyChallenge["type"]) => {
    switch (type) {
      case "direct":
        return "bg-slate-100 text-slate-700 border-slate-200"
      case "reverse":
        return "bg-indigo-50 text-indigo-700 border-indigo-200"
      default:
        return "bg-slate-100 text-slate-600 border-slate-200"
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    }
  }

  const filteredChallenges = challenges.filter((challenge) =>
    challenge.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Statistics - using fetched data from Firestore
  const stats = {
    total: statsData.totalChallenges,
    ongoing: statsData.ongoing,
    upcoming: statsData.upcoming,
    totalSubmissions: statsData.totalSubmissions,
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */} 
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0f172a] rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Daily Challenges</h1>
                  <p className="text-slate-500 text-sm">
                    {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => router.push("/admin/daily-challenge/new")}
              className="bg-[#0f172a] hover:bg-[#0d1220] text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Challenges</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Ongoing</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">{stats.ongoing}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Upcoming</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">{stats.upcoming}</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden hover:border-slate-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Submissions</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalSubmissions}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by challenge title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-[#0f172a] focus:ring-[#0f172a]/10 bg-white text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Challenges Table */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
          <CardHeader className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Challenges List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700 px-6 py-3">Challenge</TableHead>
                    <TableHead className="font-semibold text-slate-700 px-6 py-3">Type</TableHead>
                    <TableHead className="font-semibold text-slate-700 px-6 py-3">Time Period</TableHead>
                    <TableHead className="font-semibold text-slate-700 px-6 py-3 text-center">Submissions</TableHead>
                    <TableHead className="font-semibold text-slate-700 px-6 py-3">Created By</TableHead>
                    <TableHead className="font-semibold text-slate-700 px-6 py-3">Last Updated</TableHead>
                    <TableHead className="font-semibold text-slate-700 px-6 py-3">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 px-6 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChallenges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Zap className="w-12 h-12 text-slate-300" />
                          <p className="text-slate-600 font-medium">No challenges found</p>
                          <p className="text-slate-400 text-sm">
                            {searchTerm
                              ? "Try adjusting your search"
                              : "Create your first daily challenge to get started"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChallenges.map((challenge) => {
                      const startDateTime = formatDateTime(challenge.startTime)
                      const endDateTime = formatDateTime(challenge.endTime)
                      return (
                        <TableRow
                          key={challenge.id}
                          className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#0f172a] rounded-md flex items-center justify-center flex-shrink-0">
                                <Zap className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 text-sm">{challenge.title}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge className={`${getTypeColor(challenge.type)} border font-medium text-xs`}>
                              {challenge.type === "direct" ? "Direct" : "Reverse"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{startDateTime.date}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>
                                  {startDateTime.time} → {endDateTime.time}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <span className="font-semibold text-slate-900">{challenge.totalSubmissions}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-sm text-slate-600">{challenge.createdBy}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm text-slate-600">{challenge.lastUpdatedBy}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge
                              className={`${getStatusColor(challenge.status)} border font-medium text-xs capitalize`}
                            >
                              {challenge.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/daily-challenge/${challenge.id}/edit`)}
                                className="h-8 w-8 p-0 hover:bg-slate-100 hover:text-[#0f172a] text-slate-600 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(challenge)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 text-slate-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[380px] p-5">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="p-2.5 rounded-full bg-red-100 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">Delete Challenge</DialogTitle>
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete <strong>{challengeToDelete?.title}</strong>?
              <br />
              <span className="text-red-600 text-sm font-medium">This action cannot be undone.</span>
            </p>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-3">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="flex-1 text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-sm"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
