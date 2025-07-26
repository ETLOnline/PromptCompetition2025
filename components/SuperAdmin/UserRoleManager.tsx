// components/SuperAdmin/UserRoleManager.tsx
"use client"

import { useEffect, useState } from "react"

interface User {
  uid: string
  email: string
  displayName: string
  role: string
}

export default function UserRoleManager() {
  const [adminsAndJudges, setAdminsAndJudges] = useState<User[]>([])
  const [fetchedUser, setFetchedUser] = useState<User | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchAdminsAndJudges()
  }, [])

  const fetchAdminsAndJudges = async () => {
    try {
      setLoading(true)
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      const filtered = data.users.filter((u: User) => u.role === "admin" || u.role === "judge")
      setAdminsAndJudges(filtered)
    } catch (err) {
      console.error("Error loading admins/judges", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserByEmail = async () => {
    if (!query.trim()) return
    try {
      setSearching(true)
      const token = await getIdToken()
      const res = await fetch(
        `http://localhost:8080/superadmin/user-by-email?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        setFetchedUser(null)
        return
      }

      const user = await res.json()
      setFetchedUser(user)
    } catch (err) {
      console.error("Search failed", err)
      setFetchedUser(null)
    } finally {
      setSearching(false)
    }
  }

  const updateRole = async (uid: string, role: string | null) => {
    const endpoint = role ? "assign-role" : "revoke-role"
    const body = role ? { uid, role } : { uid }
    const token = await getIdToken()

    const res = await fetch(`http://localhost:8080/superadmin/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      fetchAdminsAndJudges()
      setFetchedUser(null)
      setQuery("")
    }
  }

  return (
    <div className="space-y-10">
      {/* Current Admins & Judges */}
      <div>
        <h2 className="text-xl text-[#56ffbc] font-semibold mb-4">Current Admins & Judges</h2>
        {loading ? (
          <p className="text-white">Loading...</p>
        ) : (
          <div className="space-y-4">
            {adminsAndJudges.map((user) => (
              <div
                key={user.uid}
                className="bg-[#121244] rounded-lg p-4 border border-white/10 flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-semibold">{user.displayName || user.email}</p>
                  <p className="text-gray-400 text-sm">UID: {user.uid}</p>
                  <p className="text-blue-300 text-sm capitalize">Role: {user.role}</p>
                </div>
                <button
                  onClick={() => updateRole(user.uid, null)}
                  className="bg-red-600 px-3 py-1 rounded text-sm text-white hover:bg-red-500"
                >
                  Remove Role
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search and Modify Any User */}
      <div>
        <h2 className="text-xl text-[#56ffbc] font-semibold mb-4">Find and Manage User by Email</h2>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by email"
            className="px-4 py-2 rounded-md bg-[#1c1c3a] text-white w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={fetchUserByEmail}
            disabled={searching}
            className="bg-[#56ffbc] text-[#07073a] font-semibold px-4 py-2 rounded hover:bg-[#3cf0a3]"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>

        {fetchedUser && (
          <div className="bg-[#121244] rounded-lg p-4 border border-white/10 flex justify-between items-center">
            <div>
              <p className="text-white font-semibold">{fetchedUser.displayName || fetchedUser.email}</p>
              <p className="text-gray-400 text-sm">UID: {fetchedUser.uid}</p>
              <p className="text-blue-300 text-sm capitalize">Current Role: {fetchedUser.role}</p>
            </div>
            <div className="flex gap-2">
              {fetchedUser.role !== "admin" && (
                <button
                  onClick={() => updateRole(fetchedUser.uid, "admin")}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Promote to Admin
                </button>
              )}
              {fetchedUser.role !== "judge" && (
                <button
                  onClick={() => updateRole(fetchedUser.uid, "judge")}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Promote to Judge
                </button>
              )}
              {fetchedUser.role !== "user" && (
                <button
                  onClick={() => updateRole(fetchedUser.uid, null)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
                >
                  Remove Role
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

async function getIdToken(): Promise<string> {
  const { getAuth } = await import("firebase/auth")
  const user = getAuth().currentUser
  if (!user) throw new Error("No user signed in")
  return await user.getIdToken()
}
