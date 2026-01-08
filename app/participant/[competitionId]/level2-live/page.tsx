"use client"

import { useParams } from "next/navigation"
import { Level2LiveDashboard } from "@/components/participantcompetitions/Level2LiveDashboard"
import ParticipantBreadcrumb from "@/components/participant-breadcrumb"

export default function Level2LivePage() {
  const params = useParams()
  const competitionId = params.competitionId as string

  return (
    <div className="min-h-screen bg-white">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-transparent rounded-full -translate-y-48 translate-x-48 opacity-40" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-slate-50 to-transparent rounded-full translate-y-40 -translate-x-40 opacity-40" />
      </div>

      <ParticipantBreadcrumb />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl">
        <Level2LiveDashboard competitionId={competitionId} />
      </div>
    </div>
  )
}
