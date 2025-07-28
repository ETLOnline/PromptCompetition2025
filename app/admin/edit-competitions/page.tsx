"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trophy, Calendar, Users, ArrowLeft, RefreshCw } from "lucide-react"

export default function EditCompetitions() {
  const { role, user } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-muted rounded w-20"></div>
            <div className="h-4 bg-muted rounded w-16"></div>
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
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {comp.startDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(comp.startDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {comp.participantCount && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{comp.participantCount}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/admin/edit-competitions/${comp.id}`)}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
