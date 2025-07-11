"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Eye, Edit, Trophy, Medal, Award, Search } from "lucide-react"

interface Submission {
  id: string
  participantName: string
  participantEmail: string
  institution: string
  autoScore: number
  manualScore: number | null
  finalScore: number
  rank: number
  status: "auto-evaluated" | "manually-reviewed" | "final"
  submissionDate: string
  comments: string
}

const mockSubmissions: Submission[] = [
  {
    id: "1",
    participantName: "Fatima Khan",
    participantEmail: "fatima.khan@nust.edu.pk",
    institution: "NUST",
    autoScore: 92,
    manualScore: 95,
    finalScore: 95,
    rank: 1,
    status: "final",
    submissionDate: "2024-03-24",
    comments: "Excellent prompt design with comprehensive examples and edge case handling.",
  },
  {
    id: "2",
    participantName: "Usman Tariq",
    participantEmail: "usman.tariq@comsats.edu.pk",
    institution: "COMSATS",
    autoScore: 88,
    manualScore: 90,
    finalScore: 90,
    rank: 2,
    status: "final",
    submissionDate: "2024-03-23",
    comments: "Strong technical approach with good categorization logic.",
  },
  {
    id: "3",
    participantName: "Ahmed Ali",
    participantEmail: "ahmed.ali@university.edu.pk",
    institution: "LUMS",
    autoScore: 85,
    manualScore: null,
    finalScore: 85,
    rank: 3,
    status: "auto-evaluated",
    submissionDate: "2024-03-25",
    comments: "",
  },
  {
    id: "4",
    participantName: "Ayesha Malik",
    participantEmail: "ayesha.malik@fast.edu.pk",
    institution: "FAST-NUCES",
    autoScore: 78,
    manualScore: 82,
    finalScore: 82,
    rank: 4,
    status: "manually-reviewed",
    submissionDate: "2024-03-26",
    comments: "Good attempt but could improve prompt specificity.",
  },
]

export function TopSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>(mockSubmissions)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [topN, setTopN] = useState("10")
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [reviewData, setReviewData] = useState({ score: "", comments: "" })

  const filteredSubmissions = submissions
    .filter((submission) => {
      const matchesSearch =
        submission.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.participantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.institution.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || submission.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .slice(0, Number.parseInt(topN))

  const handleManualReview = (submission: Submission) => {
    setSelectedSubmission(submission)
    setReviewData({
      score: submission.manualScore?.toString() || "",
      comments: submission.comments || "",
    })
  }

  const handleSaveReview = () => {
    if (!selectedSubmission) return

    const updatedSubmissions = submissions.map((sub) => {
      if (sub.id === selectedSubmission.id) {
        const manualScore = Number.parseInt(reviewData.score)
        return {
          ...sub,
          manualScore,
          finalScore: manualScore,
          status: "manually-reviewed" as const,
          comments: reviewData.comments,
        }
      }
      return sub
    })

    // Re-rank submissions
    const rankedSubmissions = updatedSubmissions
      .sort((a, b) => b.finalScore - a.finalScore)
      .map((sub, index) => ({ ...sub, rank: index + 1 }))

    setSubmissions(rankedSubmissions)
    setSelectedSubmission(null)
    setReviewData({ score: "", comments: "" })

    toast.success("Manual review has been updated successfully.")
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="font-bold text-lg">#{rank}</span>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "auto-evaluated":
        return <Badge variant="secondary">Auto Evaluated</Badge>
      case "manually-reviewed":
        return <Badge variant="default">Manually Reviewed</Badge>
      case "final":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Final
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Submissions</CardTitle>
          <CardDescription>View and manually review the highest-scoring submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="auto-evaluated">Auto Evaluated</SelectItem>
                <SelectItem value="manually-reviewed">Manually Reviewed</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
            <Select value={topN} onValueChange={setTopN}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Top N" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="25">Top 25</SelectItem>
                <SelectItem value="50">Top 50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Auto Score</TableHead>
                  <TableHead>Manual Score</TableHead>
                  <TableHead>Final Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">{getRankIcon(submission.rank)}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{submission.participantName}</div>
                        <div className="text-sm text-gray-600">{submission.participantEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>{submission.institution}</TableCell>
                    <TableCell>
                      <span className="font-medium">{submission.autoScore}/100</span>
                    </TableCell>
                    <TableCell>
                      {submission.manualScore !== null ? (
                        <span className="font-medium">{submission.manualScore}/100</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-lg">{submission.finalScore}/100</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleManualReview(submission)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Manual Review</DialogTitle>
                              <DialogDescription>
                                Review and update the score for {selectedSubmission?.participantName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Auto Score</Label>
                                  <div className="text-2xl font-bold">{selectedSubmission?.autoScore}/100</div>
                                </div>
                                <div>
                                  <Label htmlFor="manual-score">Manual Score</Label>
                                  <Input
                                    id="manual-score"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={reviewData.score}
                                    onChange={(e) => setReviewData((prev) => ({ ...prev, score: e.target.value }))}
                                    placeholder="Enter score (0-100)"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="comments">Comments</Label>
                                <Textarea
                                  id="comments"
                                  value={reviewData.comments}
                                  onChange={(e) => setReviewData((prev) => ({ ...prev, comments: e.target.value }))}
                                  placeholder="Add your review comments..."
                                  className="min-h-[100px]"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSaveReview}>Save Review</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">No submissions found matching your criteria.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
