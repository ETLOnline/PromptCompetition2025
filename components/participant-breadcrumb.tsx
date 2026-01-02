import React from "react";
import { Home, ChevronRight } from "lucide-react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import clsx from "clsx";

// Skeleton loader for breadcrumbs
function BreadcrumbSkeleton() {
  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-gradient-to-r from-blue-50/20 to-gray-50/30 rounded-lg py-1.5 px-2 sm:px-4 flex items-center gap-2 animate-pulse"
    >
      <div className="h-3 w-20 bg-gray-200 rounded" />
    </nav>
  );
}

// Utility to truncate long names for mobile
function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isCurrent?: boolean;
}

export default function ParticipantBreadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [competitionName, setCompetitionName] = useState<string>("");
  const [challengeName, setChallengeName] = useState<string>("");

  // Check if we're on daily challenge route
  const isDailyChallenge = pathname?.includes('/daily-challenge');
  
  // Check if we're on level1 or level2 route
  const isLevel1 = pathname?.includes('/level1');
  const isLevel2 = pathname?.includes('/level2');

  useEffect(() => {
    let mounted = true;
    async function loadNames() {
      setLoading(true);
      try {
        // Handle daily challenge route
        if (isDailyChallenge && params.challengeId) {
            setChallengeName("Daily Challenge");
          
        }
        // Handle regular competition routes
        else if (params.competitionId) {
          const competitionRef = doc(db, "competitions", params.competitionId as string);
          const competitionSnap = await getDoc(competitionRef);
          if (competitionSnap.exists() && mounted) {
            setCompetitionName(competitionSnap.data()?.title || "Competition");
          } else if (mounted) {
            setCompetitionName("Competition");
          }
          
          if (params.challengeId) {
            const challengeRef = doc(db, "competitions", params.competitionId as string, "challenges", params.challengeId as string);
            const challengeSnap = await getDoc(challengeRef);
            if (challengeSnap.exists() && mounted) {
              setChallengeName(challengeSnap.data()?.title || "Challenge");
            } else if (mounted) {
              setChallengeName("Challenge");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching names:", error);
        if (mounted) {
          setCompetitionName("Competition");
          setChallengeName("Challenge");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadNames();
    return () => {
      mounted = false;
    };
  }, [params.competitionId, params.challengeId, isDailyChallenge]);

  // Build breadcrumb items
  let items: BreadcrumbItem[] = [
    {
      label: "Competitions",
      href: "/participant",
    },
  ];

  // Handle daily challenge route
  if (isDailyChallenge) {
    if (params.challengeId) {
      items.push({
        label: truncate(challengeName || "Daily Challenge", 18),
        isCurrent: true,
      });
    } else {
      items[0].isCurrent = true;
    }
  }
  // Handle level1 routes
  else if (isLevel1 && params.competitionId) {
    items.push({
      label: truncate(competitionName || "Competition", 18),
      href: `/participant/${params.competitionId}/level1`,
    });
    if (params.challengeId) {
      items.push({
        label: truncate(challengeName || "Challenge", 18),
        isCurrent: true,
      });
    } else {
      items[items.length - 1].isCurrent = true;
    }
  }
  // Handle level2 routes
  else if (isLevel2 && params.competitionId) {
    items.push({
      label: truncate(competitionName || "Competition", 18),
      href: `/participant/${params.competitionId}/level2`,
    });
    if (params.challengeId) {
      items.push({
        label: truncate(challengeName || "Challenge", 18),
        isCurrent: true,
      });
    } else {
      items[items.length - 1].isCurrent = true;
    }
  }
  // Handle regular competition routes (fallback)
  else if (params.competitionId) {
    items.push({
      label: truncate(competitionName || "Competition", 18),
      href: `/participant/${params.competitionId}`,
    });
    if (params.challengeId) {
      items.push({
        label: truncate(challengeName || "Challenge", 18),
        isCurrent: true,
      });
    } else {
      items[items.length - 1].isCurrent = true;
    }
  } else {
    items[0].isCurrent = true;
  }

  if (loading) return <BreadcrumbSkeleton />;

  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-gradient-to-r from-blue-50/20 to-gray-50/30 rounded-lg py-1.5 px-2 sm:px-4 flex items-center gap-1 sm:gap-1.5 overflow-x-auto"
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <span className="shrink-0">{item.icon}</span>
          {item.isCurrent ? (
            <span
              className={clsx(
                "font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 text-xs sm:text-sm",
                "truncate max-w-[70px] sm:max-w-[120px] md:max-w-none"
              )}
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href || "#"}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-1 sm:px-1.5 py-0.5 rounded-md hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs sm:text-sm"
              aria-label={`Go to ${item.label}`}
            >
              <span className="truncate max-w-[60px] sm:max-w-[100px] md:max-w-none">{item.label}</span>
            </Link>
          )}
          {idx < items.length - 1 && (
            <ChevronRight size={12} className="text-gray-300 shrink-0 sm:hidden" />
          )}
          {idx < items.length - 1 && (
            <ChevronRight size={14} className="text-gray-300 shrink-0 hidden sm:block" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}