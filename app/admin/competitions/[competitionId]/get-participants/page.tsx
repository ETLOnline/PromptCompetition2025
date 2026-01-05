"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { 
  collection, 
  onSnapshot, 
  query, 
  getDocs, 
  writeBatch, 
  doc, 
  orderBy, 
  limit,
  deleteDoc 
} from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
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
  Users, 
  Download, 
  Loader2, 
  AlertTriangle, 
  Trash2,
  Trophy,
  ChevronLeft,
  UserPlus
} from 'lucide-react'
import { fetchWithAuth } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type Competition = {
  id: string
  title: string
}

type Participant = {
  userid: string
  email: string
  fullName: string
  rank: number
}

type LeaderboardEntry = {
  userid: string
  email: string
  fullName: string
  rank: number
}

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

export default function GetParticipantsPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>("")
  const [topN, setTopN] = useState<string>("20")
  const [isImporting, setIsImporting] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null)
  const [pendingImport, setPendingImport] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)
        await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
      } catch (error) {
        router.push("/")
        return
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const competitionsRef = collection(db, 'competitions')
        const snapshot = await getDocs(competitionsRef)
        const comps: Competition[] = snapshot.docs
          .filter(d => d.id !== competitionId) // Exclude current competition
          .map(d => ({
            id: d.id,
            title: d.data().title || 'Untitled Competition'
          }))
        setCompetitions(comps)
      } catch (error) {
        console.error("Error fetching competitions:", error)
      }
    }

    fetchCompetitions()
  }, [competitionId])

  useEffect(() => {
    if (!competitionId) return

    const q = query(collection(db, `competitions/${competitionId}/participants`))

    const unsub = onSnapshot(q, snap => {
      const parts: Participant[] = snap.docs.map(d => {
        const data = d.data()
        return {
          userid: d.id,
          email: data.email || "",
          fullName: data.fullName || "",
          rank: data.rank || 0
        }
      })
      // Sort by rank
      parts.sort((a, b) => a.rank - b.rank)
      setParticipants(parts)
    })

    return () => unsub()
  }, [competitionId])

  const handleImportClick = async () => {
    if (!selectedCompetitionId || !topN || parseInt(topN) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a competition and enter a valid number.",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)

    try {
      // Fetch top N from selected competition's finalLeaderboard
      const leaderboardRef = collection(db, `competitions/${selectedCompetitionId}/finalLeaderboard`)
      const q = query(leaderboardRef, orderBy("rank", "asc"), limit(parseInt(topN)))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        toast({
          title: "No Data Found",
          description: "No leaderboard data found in the selected competition.",
          variant: "destructive"
        })
        setIsImporting(false)
        return
      }

      const leaderboardData: LeaderboardEntry[] = snapshot.docs.map(d => {
        const data = d.data()
        return {
          userid: d.id,
          email: data.email || "",
          fullName: data.fullName || "",
          rank: data.rank || 0
        }
      })

      setPendingImport(leaderboardData)

      // Check if current competition already has participants
      if (participants.length > 0) {
        setShowOverwriteDialog(true)
      } else {
        await executeImport(leaderboardData)
      }

    } catch (error) {
      console.error("Error importing participants:", error)
      toast({
        title: "Import Failed",
        description: "An error occurred while importing participants.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  const executeImport = async (data: LeaderboardEntry[]) => {
    setIsImporting(true)
    
    try {
      const batch = writeBatch(db)
      
      // First, delete all existing participants
      const participantsRef = collection(db, `competitions/${competitionId}/participants`)
      const existingParticipants = await getDocs(participantsRef)
      existingParticipants.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      // Then add the new participants
      data.forEach(entry => {
        const participantRef = doc(db, `competitions/${competitionId}/participants`, entry.userid)
        batch.set(participantRef, {
          email: entry.email,
          fullName: entry.fullName,
          rank: entry.rank,
          userid: entry.userid
        })
      })

      await batch.commit()
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.length} participants!`,
      })
      setShowOverwriteDialog(false)
      setPendingImport([])
      
    } catch (error) {
      console.error("Error writing participants:", error)
      toast({
        title: "Import Failed",
        description: "An error occurred while writing participants to the database.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDeleteClick = (participant: Participant) => {
    setParticipantToDelete(participant)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!participantToDelete) return

    try {
      await deleteDoc(doc(db, `competitions/${competitionId}/participants`, participantToDelete.userid))
      setShowDeleteDialog(false)
      setParticipantToDelete(null)
    } catch (error) {
      console.error("Error deleting participant:", error)
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the participant.",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-gray-600 animate-spin mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto space-y-8">
        {/* Import Section */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Get Participants</CardTitle>
                <CardDescription>
                  Import top performers from a Level 1 competition
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <Label htmlFor="competition-select">Source Competition</Label>
                <Select
                  value={selectedCompetitionId}
                  onValueChange={setSelectedCompetitionId}
                >
                  <SelectTrigger id="competition-select">
                    <SelectValue placeholder="Select a competition" />
                  </SelectTrigger>
                  <SelectContent 
                    position="popper" 
                    side="bottom" 
                    align="start"
                    className="max-h-60 overflow-y-auto"
                  >
                    {competitions.map(comp => (
                      <SelectItem key={comp.id} value={comp.id}>
                        {comp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="top-n-input">Top N Participants</Label>
                <Input
                  id="top-n-input"
                  type="number"
                  min="1"
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                  placeholder="e.g., 20"
                />
              </div>

              <Button
                onClick={handleImportClick}
                disabled={isImporting || !selectedCompetitionId || !topN}
                className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Fetch and Import
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Participants Table */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Current Participants ({participants.length})</CardTitle>
                <CardDescription>
                  Manage participants for this competition
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {participants.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">No participants yet</h3>
                    <p className="text-muted-foreground">
                      Import participants from a Level 1 competition to get started
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] text-gray-900">Rank</TableHead>
                      <TableHead className="text-gray-900">Participant</TableHead>
                      <TableHead className="text-gray-900">User ID</TableHead>
                      <TableHead className="w-[100px] text-gray-900 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => {
                      const displayName = participant.fullName || participant.email || "Unknown User"
                      const initials = displayName.length >= 2 
                        ? displayName.substring(0, 2).toUpperCase()
                        : displayName.charAt(0).toUpperCase()
                      const avatarColor = getAvatarColor(displayName)
                      
                      return (
                        <TableRow key={participant.userid} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {participant.rank <= 3 && (
                                <Trophy className={`h-4 w-4 ${
                                  participant.rank === 1 ? 'text-yellow-500' :
                                  participant.rank === 2 ? 'text-gray-400' :
                                  'text-orange-600'
                                }`} />
                              )}
                              <span className="text-gray-900">#{participant.rank}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`${avatarColor} text-white font-medium`}>
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="font-medium leading-none text-gray-900">
                                  {participant.fullName || "Unknown User"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {participant.email || "No email provided"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {participant.userid}
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(participant)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overwrite Warning Dialog */}
      <AlertDialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <AlertDialogTitle>Overwrite Existing Participants?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              This competition already has {participants.length} participant(s). 
              Importing will overwrite the existing participants. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowOverwriteDialog(false)
                setPendingImport([])
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeImport(pendingImport)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Yes, Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle>Delete Participant?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Are you sure you want to delete <strong>{participantToDelete?.fullName || participantToDelete?.email}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false)
              setParticipantToDelete(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
