"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Edit,
  Trophy,
  Calendar,
  ArrowLeft,
  RefreshCw,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  Lock,
  Trash2,
} from "lucide-react"

export default function EditCompetitions() {
  const { role, user } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [competitionToDelete, setCompetitionToDelete] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user || role !== "superadmin") {
      router.push("/admin")
      return
    }

    const fetchCompetitions = async () => {
      try {
        setLoading(true)
        const snapshot = await getDocs(collection(db, "competitions"))
        const comps = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setCompetitions(comps)
      } catch (error) {
        console.error("Error fetching competitions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitions()
  }, [user, role])

  const handleDeleteClick = (competition: any) => {
    setCompetitionToDelete(competition)
    setDeleteDialogOpen(true)
  }

  // const handleDelete = async () => {
  //   if (!competitionToDelete) return

  //   try {
  //     setDeleting(true)
  //     await deleteDoc(doc(db, "competitions", competitionToDelete.id))
  //     setCompetitions((prev) => prev.filter((c) => c.id !== competitionToDelete.id))
  //     setDeleteDialogOpen(false)
  //     setCompetitionToDelete(null)
  //   } catch (err) {
  //     console.error("Error deleting competition:", err)
  //   } finally {
  //     setDeleting(false)
  //   }
  // }

  const handleDelete = async () => {
  if (!competitionToDelete) return

  try {
    setDeleting(true)

    const res = await fetch("/api/delete-competition", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: competitionToDelete.id }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      console.error("Admin deletion failed:", errorData)
      return
    }

    setCompetitions((prev) => prev.filter((c) => c.id !== competitionToDelete.id))
    setDeleteDialogOpen(false)
    setCompetitionToDelete(null)
  } catch (err) {
    console.error("Unexpected error during deletion:", err)
  } finally {
    setDeleting(false)
  }
}


  // Helper function to format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Helper function to format date and time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Loading skeleton component
  const CompetitionSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
          <div className="p-2 rounded-lg bg-muted w-9 h-9"></div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-20"></div>
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-4 bg-muted rounded w-28"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <div className="h-6 bg-muted rounded w-16"></div>
            <div className="h-6 bg-muted rounded w-14"></div>
          </div>
          <div className="h-8 bg-muted rounded w-16"></div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Edit Competitions
            </h1>
            <p className="text-lg text-muted-foreground">Manage and edit your competition settings and details</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/admin")} className="gap-2 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
                <p className="text-muted-foreground font-medium">Loading competitions...</p>
                <p className="text-sm text-muted-foreground">Please wait while we fetch your competitions</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <CompetitionSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          /* Competitions Grid */
          <>
            {competitions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No competitions found</h3>
                      <p className="text-muted-foreground">Create your first competition to get started</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {competitions.map((comp) => (
                  <Card
                    key={comp.id}
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-xl font-semibold line-clamp-2">{comp.title}</CardTitle>
                          <CardDescription className="line-clamp-3">{comp.description}</CardDescription>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50">
                          <Trophy className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {/* Competition Details */}
                      <div className="space-y-3">
                        {comp.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{comp.location}</span>
                          </div>
                        )}
                        {comp.prizeMoney && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            <span>{comp.prizeMoney}</span>
                          </div>
                        )}
                        {comp.startDeadline && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Starts: {formatDateTime(comp.startDeadline)}</span>
                          </div>
                        )}
                        {comp.endDeadline && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Ends: {formatDateTime(comp.endDeadline)}</span>
                          </div>
                        )}
                        {comp.createdAt && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Created: {formatDate(comp.createdAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          {comp.isActive ? (
                            <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-slate-600 border-slate-200">
                              <Clock className="w-3 h-3" />
                              Inactive
                            </Badge>
                          )}
                          {comp.isLocked && (
                            <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200">
                              <Lock className="w-3 h-3" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/admin/edit-competitions/${comp.id}`)}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(comp)
                            }}
                            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete Competition
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{competitionToDelete?.title}"</strong>? This action cannot be
              undone and will permanently remove the competition and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Competition
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
