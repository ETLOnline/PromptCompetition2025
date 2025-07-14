import { NextResponse } from "next/server"
import type { User } from "@/types/auth"

// Mock database - in production, use a real database
const users: User[] = []

export async function GET() {
  try {
    const participants = users.filter((u) => u.role === "participant")
    return NextResponse.json(participants)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
  }
}
