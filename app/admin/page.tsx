"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, Trophy, FileText, Download, Settings, BarChart3, Filter, Search } from "lucide-react"
import GetChallenges from "@/components/GetChallenges"

export default function AdminDashboard() {
  const { user, role, logout } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalParticipants: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
  })
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    
    fetchData()
  }, [user, role, router])
  
  const fetchData = async () => {
    try {
      const [competitionsRes, submissionsRes, statsRes] = await Promise.all([
        fetch("/api/admin/competitions"),
        fetch("/api/admin/submissions"),
        fetch("/api/admin/stats"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportParticipantData = async () => {
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
      console.error("Error exporting participant data:", error)
    }
  }

  if (!user || role !== "admin") return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07073a]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#56ffbc]/20 border-t-[#56ffbc]"></div>
          <p className="text-[#56ffbc] font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07073a] text-white">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-[#0c0c4f] to-[#07073a] border-b border-[#56ffbc]/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#56ffbc] to-[#56ffbc]/80 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-[#07073a]" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/80 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-300 text-lg">Manage competitions and monitor submissions</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/90 text-[#07073a] font-semibold hover:from-[#56ffbc]/90 hover:to-[#56ffbc]/80 shadow-lg shadow-[#56ffbc]/25 transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Competition
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-[#56ffbc]/50 text-[#56ffbc] hover:bg-[#56ffbc]/10 hover:border-[#56ffbc] transition-all duration-300" 
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-6 space-y-10">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20 hover:border-[#56ffbc]/40 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-[#56ffbc]/80">Total Participants</CardTitle>
                <div className="p-2 rounded-lg bg-[#56ffbc]/10 group-hover:bg-[#56ffbc]/20 transition-colors">
                  <Users className="h-5 w-5 text-[#56ffbc]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-white mb-2">{stats.totalParticipants.toLocaleString()}</div>
              <p className="text-sm text-gray-400">Registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20 hover:border-[#56ffbc]/40 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-[#56ffbc]/80">Total Submissions</CardTitle>
                <div className="p-2 rounded-lg bg-[#56ffbc]/10 group-hover:bg-[#56ffbc]/20 transition-colors">
                  <FileText className="h-5 w-5 text-[#56ffbc]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-white mb-2">{stats.totalSubmissions.toLocaleString()}</div>
              <p className="text-sm text-gray-400">Across all competitions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20 hover:border-[#56ffbc]/40 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-[#56ffbc]/80">Pending Reviews</CardTitle>
                <div className="p-2 rounded-lg bg-[#56ffbc]/10 group-hover:bg-[#56ffbc]/20 transition-colors">
                  <Trophy className="h-5 w-5 text-[#56ffbc]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-white mb-2">{stats.pendingReviews.toLocaleString()}</div>
              <p className="text-sm text-gray-400">Flagged for manual review</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Action Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Data Export Card */}
          <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#56ffbc]/10">
                  <Download className="h-5 w-5 text-[#56ffbc]" />
                </div>
                <div>
                  <CardTitle className="text-[#56ffbc] text-lg">Data Export</CardTitle>
                  <CardDescription className="text-gray-400">Download CSV reports</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-[#56ffbc]/30 text-[#07073a] hover:bg-[#56ffbc]/10 hover:border-[#56ffbc] transition-all duration-300"
                onClick={exportParticipantData}
              >
                <Download className="h-4 w-4 mr-3" />
                Export All Participants
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-[#56ffbc]/30 text-[#07073a] hover:bg-[#56ffbc]/10 hover:border-[#56ffbc] transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-3" />
                Export All Submissions
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#56ffbc]/10">
                  <BarChart3 className="h-5 w-5 text-[#56ffbc]" />
                </div>
                <div>
                  <CardTitle className="text-[#56ffbc] text-lg">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-400">Management tools</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-[#56ffbc]/30 text-[#07073a] hover:bg-[#56ffbc]/10 hover:border-[#56ffbc] transition-all duration-300"
                onClick={() => router.push("/admin/reviews")}
              >
                <Trophy className="h-4 w-4 mr-3" />
                Manual Review Panel
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-[#56ffbc]/30 text-[#07073a] hover:bg-[#56ffbc]/10 hover:border-[#56ffbc] transition-all duration-300"
                onClick={() => router.push("/admin/participants")}
              >
                <Users className="h-4 w-4 mr-3" />
                Manage Participants
              </Button>
            </CardContent>
          </Card>

          {/* Evaluation Card */}
          <Card className="bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#56ffbc]/10">
                  <Trophy className="h-5 w-5 text-[#56ffbc]" />
                </div>
                <div>
                  <CardTitle className="text-[#56ffbc] text-lg">Evaluation</CardTitle>
                  <CardDescription className="text-gray-400">Manual or LLM scoring</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/90 text-[#07073a] font-semibold hover:from-[#56ffbc]/90 hover:to-[#56ffbc]/80 shadow-lg shadow-[#56ffbc]/25 transition-all duration-300"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Start Evaluation
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Challenges Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#0c0c4f]/50 to-[#07073a]/50 rounded-xl border border-[#56ffbc]/10 p-6">
            <GetChallenges />
          </div>
        </div>
      </main>
    </div>
  )
}