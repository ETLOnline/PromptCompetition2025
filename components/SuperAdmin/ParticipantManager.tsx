// components/SuperAdmin/ParticipantManager.tsx
"use client"

import { useEffect, useState } from "react"

interface User {
  uid: string
  email: string
  displayName: string
  role: string
}

export default function ParticipantManager() {
  const [participants, setParticipants] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchParticipants = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/superadmin/users`, {
      headers: {
        Authorization: `Bearer ${await getIdToken()}`,
      },
    })
    const data = await res.json()
    const filtered = data.users.filter((user: User) => user.role === "user")
    setParticipants(filtered)
    setLoading(false)
  }

  const removeParticipant = async (uid: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/superadmin/revoke-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await getIdToken()}`,
      },
      body: JSON.stringify({ uid }),
    })
    if (res.ok) {
      fetchParticipants()
    }
  }

  useEffect(() => {
    fetchParticipants()
  }, [])

  if (loading) return <p>Loading participants...</p>

  return (
    <div className="space-y-4">
      {participants.map((user) => (
        <div
          key={user.uid}
          className="bg-[#121244] rounded-lg p-4 flex justify-between items-center border border-white/10"
        >
          <div>
            <p className="font-semibold">{user.displayName || user.email}</p>
            <p className="text-sm text-gray-400">UID: {user.uid}</p>
          </div>
          <button
            onClick={() => removeParticipant(user.uid)}
            className="bg-red-600 px-3 py-1 rounded text-sm text-white hover:bg-red-500"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}

async function getIdToken(): Promise<string> {
  const user = (await import("firebase/auth")).getAuth().currentUser
  if (!user) throw new Error("No user signed in")
  return await user.getIdToken()
}