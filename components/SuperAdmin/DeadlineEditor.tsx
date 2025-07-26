// components/SuperAdmin/DeadlineEditor.tsx
"use client"

import { useEffect, useState } from "react"

export default function DeadlineEditor() {
  const [deadline, setDeadline] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDeadline()
  }, [])

  const fetchDeadline = async () => {
    try {
      const res = await fetch(`/api/deadline`)
      const data = await res.json()
      setDeadline(data.deadline)
      setLoading(false)
    } catch (err) {
      console.error("Failed to fetch deadline", err)
    }
  }

  const saveDeadline = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/deadline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getIdToken()}`,
        },
        body: JSON.stringify({ deadline }),
      })

      if (!res.ok) throw new Error("Failed to update deadline")
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading current deadline...</p>

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-white/80">
        Submission Deadline:
      </label>
      <input
        type="datetime-local"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="bg-[#1c1c3a] text-white px-4 py-2 rounded-md border border-white/20"
      />
      <button
        onClick={saveDeadline}
        disabled={saving}
        className="bg-green-500 px-4 py-2 rounded-md hover:bg-green-600 text-white"
      >
        {saving ? "Saving..." : "Save Deadline"}
      </button>
    </div>
  )
}

async function getIdToken(): Promise<string> {
  const user = (await import("firebase/auth")).getAuth().currentUser
  if (!user) throw new Error("No user signed in")
  return await user.getIdToken()
}
