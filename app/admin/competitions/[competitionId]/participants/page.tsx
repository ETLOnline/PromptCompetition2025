"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, ChevronLeft, RefreshCw, Search, X, ChevronRight, Target } from 'lucide-react'

import { fetchWithAuth } from "@/lib/api";

const ITEMS_PER_PAGE = 12

type Participant = {
  uid: string
  email?: string
  fullName?: string
  challengesCompleted?: number
  registeredAt?: any
}

// Avatar color generator based on name
const getAvatarColor = (name: string) => {
  const colors = [
    "bg-blue-500",
    "bg-red-500", 
    "bg-purple-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500"
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export default function ParticipantsPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  
  const checkAuth = async () => {
    try {
      setLoading(true)
      await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`);
    } 
    catch (error) 
    {
      router.push("/");
    } 
    finally 
    {
      setLoading(false);
    }
  };

  useEffect(() => {

    checkAuth();

    if (!competitionId) return

    setLoading(true)
    
    const q = query(collection(db, `competitions/${competitionId}/participants`))

    const unsub = onSnapshot(
      q,
      snap => {
        const rows: Participant[] = snap.docs.map(d => {
          const data = d.data() as any
          return {
            uid: d.id,
            email: data.email ?? "",
            fullName: data.fullName ?? "",
            challengesCompleted: Number(data.challengesCompleted ?? data.challengeCount ?? 0),
            registeredAt: data.registeredAt ?? data.createdAt ?? null,
          }
        })
        setParticipants(rows)
        setLoading(false)
      },
      _err => setLoading(false)
    )

    return () => unsub()
  }, [competitionId])

  const formatDate = (v: any) => {
    if (!v) return "Never"
    if (typeof v?.toDate === "function") {
      return v.toDate().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    }
    try {
      return new Date(v).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return "Invalid Date"
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return participants
    return participants.filter(p =>
      (p.email ?? "").toLowerCase().includes(q) ||
      (p.fullName ?? "").toLowerCase().includes(q) ||
      p.uid.toLowerCase().includes(q)
    )
  }, [participants, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedParticipants = filtered.slice(startIndex, endIndex)

  useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* Participants Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <div>
                <CardTitle className="text-xl">Participants ({filtered.length})</CardTitle>
                <CardDescription>
                  List of all registered participants for this competition
                </CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search participants..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-10"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearch("")}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
                  <p className="text-muted-foreground">Loading participants...</p>
                </div>
              </div>
            ) : paginatedParticipants.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No participants found</h3>
                    <p className="text-muted-foreground">
                      {search ? "Try adjusting your search criteria" : "No participants have registered for this competition yet"}
                    </p>
                  </div>
                  {search && (
                    <Button variant="outline" onClick={() => setSearch("")}>
                      Clear search
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px] text-gray-900">Participant</TableHead>
                      <TableHead className="w-[200px] text-gray-900">Challenges Completed</TableHead>
                      <TableHead className="w-[160px] text-gray-900">Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedParticipants.map((participant) => {
                      const displayName = participant.fullName || participant.email || "Unknown User"
                      const initials = displayName.length >= 2 
                        ? displayName.substring(0, 2).toUpperCase()
                        : displayName.charAt(0).toUpperCase()
                      const avatarColor = getAvatarColor(displayName)
                      
                      return (
                        <TableRow key={participant.uid} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="w-[300px]">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`${avatarColor} text-white font-medium`}>
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="font-medium leading-none">
                                  {participant.fullName || "Unknown User"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {participant.email || "No email provided"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="w-[200px]">
                            <div className="flex items-center space-x-2 text-sm text-gray-900">
                                <span>{participant.challengesCompleted ?? 0}</span>
                            </div>
                            </TableCell>
                            <TableCell className="w-[160px] text-sm text-gray-900">
                            {formatDate(participant.registeredAt)}
                            </TableCell>

                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} participants
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(page - 1)} 
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
