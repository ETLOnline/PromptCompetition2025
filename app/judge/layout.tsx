import type { Metadata } from "next"
import JudgeHeader from "@/components/JudgeHeader"

export const metadata: Metadata = {
  title: "Judge | Empowerment Through Learning",
  description: "Judge interface for scoring and reviewing submissions.",
}

export default function JudgeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <JudgeHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
