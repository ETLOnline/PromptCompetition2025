"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronRight, Home } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import clsx from "clsx"

// Allowed admin paths and their breadcrumb labels
const ADMIN_BREADCRUMB_PATHS: Array<{
  match: (segments: string[]) => boolean,
  getItems: (segments: string[], competitionTitle: string | null, loadingTitle: boolean) => Array<{ label: string, href: string | null, isLast: boolean, icon?: React.ReactNode }>
}> = [
  {
    // /admin/select-competition
    match: segs => segs.length === 2 && segs[0] === "admin" && segs[1] === "select-competition",
    getItems: () => [
      { label: "Competitions", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/dashboard
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "dashboard",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Overview", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/challenges
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "challenges",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Challenges", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/challenges/new
    match: segs => segs.length === 5 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "challenges" && segs[4] === "new",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "New Challenge", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/challenges/[id]/edit
    match: segs => segs.length === 6 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "challenges" && segs[5] === "edit",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Edit Challenge", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/participants
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "participants",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Participants", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/submissions
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "submissions",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Submissions", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/judge-evaluations
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "judge-evaluations",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Judge Evaluations", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/llm-evaluations
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "llm-evaluations",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "LLM Evaluations", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/participant-distribution
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "participant-distribution",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Participant Distribution", href: null, isLast: true },
    ],
  },
  {
    // /admin/competitions/{id}/leaderboard
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "competitions" && segs[3] === "leaderboard",
    getItems: (segs, competitionTitle, loadingTitle) => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/admin/competitions/${segs[2]}/dashboard`, isLast: false },
      { label: "Leaderboard", href: null, isLast: true },
    ],
  },
  {
    // /admin/manage-roles
    match: segs => segs.length === 2 && segs[0] === "admin" && segs[1] === "manage-roles",
    getItems: () => [
      { label: "Competitions", href: "/admin/select-competition", isLast: false },
      { label: "Manage Roles", href: null, isLast: true },
    ],
  },
  {
    // /admin/daily-challenge
    match: segs => segs.length === 2 && segs[0] === "admin" && segs[1] === "daily-challenge",
    getItems: () => [
      { label: "Daily Challenges", href: null, isLast: true },
    ],
  },
  {
    // /admin/daily-challenge/[challengeId]/dashboard
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "daily-challenge" && segs[3] === "dashboard",
    getItems: (segs) => [
      { label: "Daily Challenges", href: "/admin/daily-challenge", isLast: false },
      { label: "Challenge Dashboard", href: null, isLast: true },
    ],
  },
  {
    // /admin/daily-challenge/new
    match: segs => segs.length === 3 && segs[0] === "admin" && segs[1] === "daily-challenge" && segs[2] === "new",
    getItems: () => [
      { label: "Daily Challenges", href: "/admin/daily-challenge", isLast: false },
      { label: "New Challenge", href: null, isLast: true },
    ],
  },
  {
    // /admin/daily-challenge/[challengeId]/edit
    match: segs => segs.length === 4 && segs[0] === "admin" && segs[1] === "daily-challenge" && segs[3] === "edit",
    getItems: () => [
      { label: "Daily Challenges", href: "/admin/daily-challenge", isLast: false },
      { label: "Edit Challenge", href: null, isLast: true },
    ],
  },
]

// Utility to truncate long names for mobile
function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "..." : str
}

// Skeleton loader for breadcrumbs
function BreadcrumbSkeleton() {
  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-gradient-to-r from-blue-50/20 to-gray-50/30 rounded-lg py-1.5 px-4 flex items-center gap-2 animate-pulse"
    >
      <div className="h-3 w-20 bg-gray-200 rounded" />
    </nav>
  )
}

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

  if (loadingTitle) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <BreadcrumbSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav
          aria-label="Breadcrumb"
          className="bg-gradient-to-r from-blue-50/20 to-gray-50/30 rounded-lg py-1.5 px-4 flex items-center gap-1.5"
        >
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {item.icon}
              {item.isLast ? (
                <span
                  className={clsx(
                    "font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500",
                    "truncate max-w-[120px] md:max-w-none"
                  )}
                  aria-current="page"
                >
                  {truncate(item.label, 18)}
                </span>
              ) : (
                <Link
                  href={item.href || "#"}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-1.5 py-0.5 rounded-md hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  aria-label={`Go to ${item.label}`}
                >
                  <span className="truncate max-w-[100px] md:max-w-none">{truncate(item.label, 18)}</span>
                </Link>
              )}
              {idx < items.length - 1 && (
                <ChevronRight size={14} className="text-gray-300" />
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}