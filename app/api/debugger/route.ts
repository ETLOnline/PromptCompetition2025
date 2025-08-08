import { logToFile } from "@/loggers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const logMessage = body?.message || "No message provided"

    logToFile(`DEBUG LOG: ${logMessage}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 })
  }
}

// ------------------- Use Case ----------------
// fetch("/api/debugger", {
//     method: "POST",
//     body: JSON.stringify({ message: `user object: ${JSON.stringify(Variable)}` }),
//     headers: {
//         "Content-Type": "application/json",
//     },
// })