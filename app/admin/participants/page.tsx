"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { User, Submission } from "@/types/auth"
import { ArrowLeft, Search, Download, Eye } from "lucide-react"

export default function AdminParticipantsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [participants, setParticipants] = useState<User[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/auth/login")
      return
    }

    fetchData()
  }, [user, router])

  const fetchData = async () => {
    try {
      const [participantsRes, submissionsRes] = await Promise.all([
        fetch("/api/admin/participants"),
        fetch("/api/admin/submissions"),
      ])

      if (participantsRes.ok) {
        const participantsData = await participantsRes.json()
        setParticipants(participantsData)
      }

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData)
      }
    } catch (error) {
      console.error("Error fetching participants data:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportParticipants = async () => {
    try {
      const response = await fetch("/api/admin/export/participants")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "participants.csv"
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Error exporting participants:", error)
    }
  }

  if (!user || user.role !== "admin") return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const filteredParticipants = participants.filter(
    (participant) =>
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.institution.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => router.push("/admin")} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Participants</h1>
                <p className="text-gray-600">View and manage registered participants</p>
              </div>
            </div>
            <Button onClick={exportParticipants}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Participants Overview</CardTitle>
                  <CardDescription>Total registered participants: {participants.length}</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search participants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredParticipants.map((participant) => {
                  const participantSubmissions = submissions.filter((s) => s.userId === participant.id)
                  const averageScore =
                    participantSubmissions.length > 0
                      ? participantSubmissions.reduce((acc, sub) => acc + sub.averageScore, 0) /
                        participantSubmissions.length
                      : 0

                  return (
                    <div key={participant.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{participant.name}</div>
                        <div className="text-sm text-gray-600">{participant.email}</div>
                        <div className="text-sm text-gray-500">{participant.institution}</div>
                        <div className="text-xs text-gray-400">
                          Registered: {new Date(participant.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">{participantSubmissions.length}</div>
                          <div className="text-xs text-gray-600">Submissions</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {averageScore > 0 ? averageScore.toFixed(1) : "N/A"}
                          </div>
                          <div className="text-xs text-gray-600">Avg Score</div>
                        </div>
                        <Badge variant={participant.role === "admin" ? "destructive" : "default"}>
                          {participant.role}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // View participant's submissions
                            router.push(`/admin/participants/${participant.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
