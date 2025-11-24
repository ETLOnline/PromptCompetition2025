import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const { email, fullName } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json(
        { success: false, error: "Email and full name are required" },
        { status: 400 }
      );
    }

    // Send welcome email through backend
    console.log(`Preparing to send welcome email to: ${email}`);
    const result = await sendWelcomeEmail(email, fullName);
    console.log("Welcome email sent successfully:", result);
    
    return NextResponse.json({
      success: true,
      message: "Welcome email sent successfully"
    });

  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to send welcome email" 
      },
      { status: 500 }
    );
  }
}