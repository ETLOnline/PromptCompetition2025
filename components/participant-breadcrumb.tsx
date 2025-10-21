import React from "react";
import { Home, ChevronRight } from "lucide-react";
import { usePathname, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

// Skeleton loader for breadcrumbs
function BreadcrumbSkeleton() {
  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-gradient-to-r from-blue-50/20 to-gray-50/30 rounded-xl shadow-sm py-4 px-6 flex items-center gap-2 animate-pulse"
    >
      <Home size={18} className="text-gray-400" />
      <ChevronRight size={16} className="text-gray-300" />
      <div className="h-4 w-20 bg-gray-200 rounded" />
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

// Fetch competition and challenge names
async function fetchCompetitionName(competitionId: string): Promise<string> {
  // Replace with actual API call or import from lib
  try {
    const res = await fetch(`/api/competition/${competitionId}`);
    if (!res.ok) throw new Error("Failed to fetch competition");
    const data = await res.json();
    return data.name || "Competition";
  } catch {
    return "Competition";
  }
}

async function fetchChallengeName(competitionId: string, challengeId: string): Promise<string> {
  // Replace with actual API call or import from lib
  try {
    const res = await fetch(`/api/competition/${competitionId}/challenge/${challengeId}`);
    if (!res.ok) throw new Error("Failed to fetch challenge");
    const data = await res.json();
    return data.title || "Challenge";
  } catch {
    return "Challenge";
  }
}

export default function ParticipantBreadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [competitionName, setCompetitionName] = React.useState<string>("");
  const [challengeName, setChallengeName] = React.useState<string>("");

  React.useEffect(() => {
    let mounted = true;
    async function loadNames() {
      setLoading(true);
      if (params.competitionId) {
        const compName = await fetchCompetitionName(params.competitionId as string);
        if (mounted) setCompetitionName(compName);
      }
      if (params.competitionId && params.challengeId) {
        const chalName = await fetchChallengeName(
          params.competitionId as string,
          params.challengeId as string
        );
        if (mounted) setChallengeName(chalName);
      }
      setLoading(false);
    }
    loadNames();
    return () => {
      mounted = false;
    };
  }, [params.competitionId, params.challengeId]);

  // Build breadcrumb items
  let items: BreadcrumbItem[] = [
    {
      label: "Home",
      href: "/",
      icon: <Home size={18} className="text-blue-500" />,
    },
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
    items[1].isCurrent = true;
  }

  if (loading) return <BreadcrumbSkeleton />;

  return (
    <nav
      aria-label="Breadcrumb"
      className="bg-gradient-to-r from-blue-50/20 to-gray-50/30 rounded-xl shadow-sm py-4 px-6 flex items-center gap-2 mt-2"
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
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label={`Go to ${item.label}`}
            >
              <span className="truncate max-w-[100px] md:max-w-none">{item.label}</span>
            </Link>
          )}
          {idx < items.length - 1 && (
            <ChevronRight size={16} className="text-gray-300" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
