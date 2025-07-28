// app/admin/edit-competitions/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function EditCompetitions() {
  const { role, user } = useAuth()
  const router = useRouter()
  const [competitions, setCompetitions] = useState<any[]>([])

  useEffect(() => {
    if (!user || role !== "superadmin") {
      router.push("/admin")
      return
    }

    const fetchCompetitions = async () => {
      const snapshot = await getDocs(collection(db, "competitions"))
      const comps = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCompetitions(comps)
    }

    fetchCompetitions()
  }, [user, role])

  return (
    <div className="min-h-screen bg-[#07073a] text-white px-6 py-10">
      <h1 className="text-4xl font-extrabold text-[#56ffbc] mb-10 text-center">
        Edit Competitions
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {competitions.map((comp) => (
          <Card
            key={comp.id}
            className="bg-[#0c0c4f] border border-[#56ffbc]/20 shadow-lg rounded-2xl hover:scale-[1.02] transition-transform duration-300"
          >
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
              <div>
                <CardTitle className="text-[#56ffbc] text-xl font-semibold mb-2">
                  {comp.title}
                </CardTitle>
                <p className="text-gray-300 text-sm line-clamp-3">
                  {comp.description}
                </p>
              </div>
              <Button
                size="sm"
                className="mt-4 self-start bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/90 text-[#07073a] font-semibold hover:from-[#56ffbc]/90 hover:to-[#56ffbc]/80 shadow-md"
                onClick={() => router.push(`/admin/edit-competitions/${comp.id}`)}
              >
                Edit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
