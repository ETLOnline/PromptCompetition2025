"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronRight, Home } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Allowed admin paths and their breadcrumb labels
const ADMIN_BREADCRUMB_PATHS: Array<{
  match: (segments: string[]) => boolean,
  getItems: (segments: string[], competitionTitle: string | null, loadingTitle: boolean) => Array<{ label: string, href: string | null, isLast: boolean, icon?: React.ReactNode }>
}> = [
  {
    // /admin/select-competition
    match: segs => segs.length === 2 && segs[0] === "admin" && segs[1] === "select-competition",
    getItems: () => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/dashboard
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "dashboard",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Overview", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/challenges
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "challenges",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Challenges", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/challenges/new
    match: segs => segs.length === 5 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "challenges" && segs[4] === "new",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Challenges", href: `/admin/competitions/${segs[2]}/challenges`, isLast: false },
      { label: "New Challenge", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/challenges/[id]/edit
    match: segs => segs.length === 6 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "challenges" && segs[5] === "edit",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Challenges", href: `/admin/competitions/${segs[2]}/challenges`, isLast: false },
      { label: "Edit Challenge", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/participants
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "participants",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Participants", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/submissions
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "submissions",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Submissions", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/judge-evaluations
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "judge-evaluations",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Judge Evaluations", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/llm-evaluations
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "llm-evaluations",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "LLM Evaluations", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/participant-distribution
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "participant-distribution",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Participant Distribution", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/leaderboard
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "leaderboard",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Leaderboard", href: null, isLast: true },
    ],
  },
  {
    // /admin/manage-roles
    match: segs => segs.length === 2 && segs[0] === "admin" && segs[1] === "manage-roles",
    getItems: () => [
      { label: "Home", href: "/admin", isLast: false, icon: <Home className="w-4 h-4 mr-1" /> },
      { label: "Manage Roles", href: null, isLast: true },
    ],
  },
]

export function AdminBreadcrumbs() {
  const pathname = usePathname()
  const router = useRouter()
  const [competitionTitle, setCompetitionTitle] = useState<string | null>(null)
  const [loadingTitle, setLoadingTitle] = useState(false)

  // Split path and filter empty segments
  const segments = pathname.split("/").filter(Boolean)

  // Find if this is a competition path and get competitionId
  let competitionId: string | null = null
  for (const pattern of ADMIN_BREADCRUMB_PATHS) {
    if (pattern.match(segments)) {
      // If path includes a competitionId, fetch title
      if (segments[1] === "competitions" && segments.length >= 3) {
        competitionId = segments[2]
      }
      break
    }
  }

  // Fetch competition title if needed
  useEffect(() => {
    if (competitionId) {
      setLoadingTitle(true)
      const fetchTitle = async () => {
        try {
          const ref = doc(db, "competitions", competitionId!)
          const snap = await getDoc(ref)
          if (snap.exists()) {
            setCompetitionTitle(snap.data()?.title || null)
          } else {
            setCompetitionTitle(null)
          }
        } catch {
          setCompetitionTitle(null)
        } finally {
          setLoadingTitle(false)
        }
      }
      fetchTitle()
    } else {
      setCompetitionTitle(null)
    }
  }, [competitionId])

  // Only show breadcrumbs for allowed paths
  let items: Array<{ label: string, href: string | null, isLast: boolean, icon?: React.ReactNode }> | null = null
  for (const pattern of ADMIN_BREADCRUMB_PATHS) {
    if (pattern.match(segments)) {
      items = pattern.getItems(segments, competitionTitle, loadingTitle)
      break
    }
  }
  if (!items) return null

  return (
    <nav className="w-full border-t bg-gray-50 px-4 sm:px-8 py-2 flex items-center overflow-x-auto text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 whitespace-nowrap">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center">
            {item.href ? (
              <button
                type="button"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => router.push(item.href!)}
              >
                {item.icon}
                {item.label}
              </button>
            ) : (
              <span className="flex items-center text-gray-900 font-semibold px-2 py-1 cursor-default">
                {item.icon}
                {item.label}
              </span>
            )}
            {idx < items.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}