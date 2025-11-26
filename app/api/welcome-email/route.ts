// app/api/welcome-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { email, fullName } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, error: "Email and full name are required" },
        { status: 400 }
      );
    }

    console.log(`📧 [Next.js API] Preparing to send welcome email to: ${email}`);

    // Get the backend API URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    
    if (!API_URL) {
      console.error("❌ NEXT_PUBLIC_API_URL is not configured");
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Get Clerk token for backend authentication
    const token = await auth().then((auth) => auth.getToken());

    // Forward the request to the Express backend
    const backendUrl = `${API_URL}/welcome`;
    console.log(`🔄 [Next.js API] Forwarding to backend: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ email, fullName }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ [Next.js API] Backend returned error:`, result);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Failed to send welcome email",
          details: result.details 
        },
        { status: response.status }
      );
    }

    console.log(`✅ [Next.js API] Welcome email sent successfully to: ${email}`);
    return NextResponse.json({
      success: true,
      message: "Welcome email sent successfully",
    });

  } catch (error: any) {
    console.error("❌ [Next.js API] Failed to send welcome email:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send welcome email",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
