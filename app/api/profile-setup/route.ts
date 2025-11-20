import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, setDoc, collection } from "firebase/firestore"

// Test GET handler to verify route works
export async function GET() {
  return NextResponse.json({ message: "Profile setup API is working!" })
}

export async function POST(req: Request) {
  try {
    console.log("Profile setup API called")
    
    const { userId } = await auth()
    console.log("User ID:", userId)
    
    if (!userId) {
      console.error("No user ID found - unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    console.log("Received data:", JSON.stringify(data, null, 2))
    
    const {
      firstName,
      lastName,
      institution,
      gender,
      city,
      province,
      majors,
      category,
      linkedin,
      bio,
      consent
    } = data

    console.log("Getting Clerk client...")
    const clerk = await clerkClient()

    console.log("Updating user name...")
    await clerk.users.updateUser(userId, {
      firstName,
      lastName
    })

    console.log("Updating user metadata...")
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: 'participant',
        institution,
        gender,
        city,
        province,
        majors,
        category,
        linkedin: linkedin || '',
        bio: bio || '',
        consent
      }
    })

    // Get user email from Clerk
    const clerkUser = await clerk.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress || ''
    console.log("User email:", email)

    console.log("Creating/updating Firestore document...")
    // Create user document in Firestore with Clerk userId
    await setDoc(doc(collection(db, "users"), userId), {
      fullName: `${firstName} ${lastName}`.trim(),
      email,
      institution,
      gender,
      city,
      province,
      majors,
      category,
      linkedin: linkedin || "",
      bio: bio || "",
      consent: !!consent,
      createdAt: new Date().toISOString(),
    })

    console.log("Profile update successful!")
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Errorrrs updating user profile:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    )
  }
}
