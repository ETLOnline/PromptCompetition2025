import { NextResponse } from "next/server"
import type { User } from "@/types/auth"

// Mock database - in production, use a real database
const users: User[] = []

export async function GET() {
  try {
    const participants = users.filter((u) => u.role === "participant")

    // Create CSV content
    const csvHeader = "ID,Name,Email,Institution,Registration Date\n"
    const csvContent = participants
      .map((p) => `${p.id},"${p.name}","${p.email}","${p.institution}","${new Date(p.createdAt).toISOString()}"`)
      .join("\n")

    const csv = csvHeader + csvContent

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=participants.csv",
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to export participants" }, { status: 500 })
  }
}
