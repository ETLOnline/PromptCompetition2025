"use client"
import { useEffect } from "react";
import ViewLeaderboardTable from "@/components/ViewLeaderboard"
import { useRouter, useParams } from "next/navigation"

import { fetchWithAuth } from "@/lib/api";

export default function AdminLeaderboardPage() {
  const params = useParams()
  const competitionId = params?.competitionId as string
  const router = useRouter()
  
  useEffect(() => {
    checkAuthAndLoad();
  }, [router])
  
  const checkAuthAndLoad = async () => {
    try {
      await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`);
    } catch (error) {
      router.push("/");
    } 
  };


  if (!competitionId) {
    return <div className="p-6 text-red-600 font-semibold">Error: Competition ID not found in the URL</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <ViewLeaderboardTable competitionId={competitionId} />
      </div>
    </div>
  )
}
