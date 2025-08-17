import type { Metadata } from "next"
import ParticipantHeader from "@/components/ParticipantHeader"

export const metadata: Metadata = {
  title: "Participant | Empowerment Through Learning",
  description: "Participant portal for viewing and submitting to competitions.",
}

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <ParticipantHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  )
}