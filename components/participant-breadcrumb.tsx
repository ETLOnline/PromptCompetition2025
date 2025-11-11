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
      className="bg-gradient-to-r from-blue-50/20 to-gray-50/30 rounded-lg py-1.5 px-4 flex items-center gap-2 animate-pulse"
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

  useEffect(() => {
    let mounted = true;
    async function loadNames() {
      setLoading(true);
      try {
        if (params.competitionId) {
          const competitionRef = doc(db, "competitions", params.competitionId as string);
          const competitionSnap = await getDoc(competitionRef);
          if (competitionSnap.exists() && mounted) {
            setCompetitionName(competitionSnap.data()?.title || "Competition");
          } else if (mounted) {
            setCompetitionName("Competition");
          }
        }
        if (params.competitionId && params.challengeId) {
          const challengeRef = doc(db, "competitions", params.competitionId as string, "challenges", params.challengeId as string);
          const challengeSnap = await getDoc(challengeRef);
          if (challengeSnap.exists() && mounted) {
            setChallengeName(challengeSnap.data()?.title || "Challenge");
          } else if (mounted) {
            setChallengeName("Challenge");
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
  }, [params.competitionId, params.challengeId]);

  // Build breadcrumb items
  let items: BreadcrumbItem[] = [
    {
      label: "Competitions",
      href: "/participant",
    },
  ];

  if (params.competitionId) {
    items.push({
      label: truncate(competitionName || "Competition", 18),
      href: `/participant/${params.competitionId}`,
    });
  }
  if (params.competitionId && params.challengeId) {
    items.push({
      label: truncate(challengeName || "Challenge", 18),
      isCurrent: true,
    });
  } else if (params.competitionId) {
    items[items.length - 1].isCurrent = true;
  } else {
    items[0].isCurrent = true;
  }

  if (loading) return <BreadcrumbSkeleton />;

  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-gradient-to-r from-blue-50/20 to-gray-50/30 rounded-lg py-1.5 px-4 flex items-center gap-1.5"
    >
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {item.icon}
          {item.isCurrent ? (
            <span
              className={clsx(
                "font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500",
                "truncate max-w-[120px] md:max-w-none"
              )}
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href || "#"}
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-1.5 py-0.5 rounded-md hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label={`Go to ${item.label}`}
            >
              <span className="truncate max-w-[100px] md:max-w-none">{item.label}</span>
            </Link>
          )}
          {idx < items.length - 1 && (
            <ChevronRight size={14} className="text-gray-300" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}