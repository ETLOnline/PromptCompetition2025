"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye } from "lucide-react"

interface Participant {
  id: string
  name: string
  email: string
  institution: string
  status: "registered" | "submitted" | "evaluated"
  score: number | null
  submissionDate: string | null
}

const mockParticipants: Participant[] = [
  {
    id: "1",
    name: "Ahmed Ali",
    email: "ahmed.ali@university.edu.pk",
    institution: "LUMS",
    status: "submitted",
    score: 85,
    submissionDate: "2024-03-25",
  },
  {
    id: "2",
    name: "Fatima Khan",
    email: "fatima.khan@nust.edu.pk",
    institution: "NUST",
    status: "evaluated",
    score: 92,
    submissionDate: "2024-03-24",
  },
  {
    id: "3",
    name: "Hassan Sheikh",
    email: "hassan.sheikh@pu.edu.pk",
    institution: "Punjab University",
    status: "registered",
    score: null,
    submissionDate: null,
  },
  {
    id: "4",
    name: "Ayesha Malik",
    email: "ayesha.malik@fast.edu.pk",
    institution: "FAST-NUCES",
    status: "submitted",
    score: 78,
    submissionDate: "2024-03-26",
  },
  {
    id: "5",
    name: "Usman Tariq",
    email: "usman.tariq@comsats.edu.pk",
    institution: "COMSATS",
    status: "evaluated",
    score: 88,
    submissionDate: "2024-03-23",
  },
]

export function ParticipantTable() {
  const [participants] = useState<Participant[]>(mockParticipants)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch =
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.institution.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || participant.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "registered":
        return <Badge variant="secondary">Registered</Badge>
      case "submitted":
        return <Badge variant="default">Submitted</Badge>
      case "evaluated":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Evaluated
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participant Management</CardTitle>
        <CardDescription>Monitor and manage all competition participants</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search participants..."
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
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="evaluated">Evaluated</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">{participant.name}</TableCell>
                  <TableCell>{participant.email}</TableCell>
                  <TableCell>{participant.institution}</TableCell>
                  <TableCell>{getStatusBadge(participant.status)}</TableCell>
                  <TableCell>
                    {participant.score !== null ? (
                      <span className="font-medium">{participant.score}/100</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {participant.submissionDate || <span className="text-gray-400">Not submitted</span>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredParticipants.length === 0 && (
          <div className="text-center py-8 text-gray-500">No participants found matching your criteria.</div>
        )}
      </CardContent>
    </Card>
  )
}
