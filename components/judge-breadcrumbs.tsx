"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronRight, Home } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import clsx from "clsx"

// Allowed judge paths and their breadcrumb labels
const JUDGE_BREADCRUMB_PATHS: Array<{
  match: (segments: string[]) => boolean,
  getItems: (segments: string[], competitionTitle: string | null, challengeTitle: string | null, loadingTitle: boolean) => Array<{ label: string, href: string | null, isLast: boolean, icon?: React.ReactNode }>
}> = [
  {
    // /judge (dashboard)
    match: segs => segs.length === 1 && segs[0] === "judge",
    getItems: () => [
      { label: "Home", href: "/", isLast: false, icon: <Home size={16} className="text-blue-500" /> },
      { label: "Judge Dashboard", href: null, isLast: true },
    ],
  },
  {
    // /judge/{competitionId}
    match: segs => segs.length === 2 && segs[0] === "judge",
    getItems: (segs, competitionTitle, challengeTitle, loadingTitle) => [
      { label: "Home", href: "/", isLast: false, icon: <Home size={16} className="text-blue-500" /> },
      { label: "Dashboard", href: "/judge", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: null, isLast: true },
    ],
  },
  {
    // /judge/{competitionId}/{challengeId}
    match: segs => segs.length === 3 && segs[0] === "judge",
    getItems: (segs, competitionTitle, challengeTitle, loadingTitle) => [
      { label: "Home", href: "/", isLast: false, icon: <Home size={16} className="text-blue-500" /> },
      { label: "Dashboard", href: "/judge", isLast: false },
      { label: loadingTitle ? "..." : competitionTitle || "Competition", href: `/judge/${segs[1]}`, isLast: false },
      { label: loadingTitle ? "..." : challengeTitle || "Challenge", href: null, isLast: true },
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
      <Home size={16} className="text-gray-400" />
      <ChevronRight size={14} className="text-gray-300" />
      <div className="h-3 w-20 bg-gray-200 rounded" />
    </nav>
  )
}

export function JudgeBreadcrumbs() {
  const pathname = usePathname()
  const router = useRouter()
  const [competitionTitle, setCompetitionTitle] = useState<string | null>(null)
  const [challengeTitle, setChallengeTitle] = useState<string | null>(null)
  const [loadingTitle, setLoadingTitle] = useState(false)

  // Split path and filter empty segments
  const segments = pathname.split("/").filter(Boolean)

  // Find if this is a judge path and get competitionId/challengeId
  let competitionId: string | null = null
  let challengeId: string | null = null
  for (const pattern of JUDGE_BREADCRUMB_PATHS) {
    if (pattern.match(segments)) {
      // If path includes a competitionId, fetch title
      if (segments.length >= 2 && segments[0] === "judge") {
        competitionId = segments[1]
      }
      // If path includes a challengeId, fetch challenge title
      if (segments.length >= 3 && segments[0] === "judge") {
        challengeId = segments[2]
      }
      break
    }
  }

  // Fetch competition and challenge titles if needed
  useEffect(() => {
    const fetchTitles = async () => {
      if (competitionId || challengeId) {
        setLoadingTitle(true)
        try {
          // Fetch competition title
          if (competitionId) {
            const competitionRef = doc(db, "competitions", competitionId)
            const competitionSnap = await getDoc(competitionRef)
            if (competitionSnap.exists()) {
              setCompetitionTitle(competitionSnap.data()?.title || null)
            } else {
              setCompetitionTitle(null)
            }
          }

          // Fetch challenge title
          if (challengeId && competitionId) {
            const challengeRef = doc(db, "competitions", competitionId, "challenges", challengeId)
            const challengeSnap = await getDoc(challengeRef)
            if (challengeSnap.exists()) {
              setChallengeTitle(challengeSnap.data()?.title || null)
            } else {
              setChallengeTitle(null)
            }
          }
        } catch (error) {
          console.error("Error fetching titles:", error)
          setCompetitionTitle(null)
          setChallengeTitle(null)
        } finally {
          setLoadingTitle(false)
        }
      } else {
        setCompetitionTitle(null)
        setChallengeTitle(null)
        setLoadingTitle(false)
      }
    }

    fetchTitles()
  }, [competitionId, challengeId])

  // Only show breadcrumbs for allowed paths
  let items: Array<{ label: string, href: string | null, isLast: boolean, icon?: React.ReactNode }> | null = null
  for (const pattern of JUDGE_BREADCRUMB_PATHS) {
    if (pattern.match(segments)) {
      items = pattern.getItems(segments, competitionTitle, challengeTitle, loadingTitle)
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