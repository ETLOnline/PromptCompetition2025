import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { ClerkProvider } from "@clerk/nextjs"
import { ParticipantCacheProvider } from "@/lib/participant-cache-context"
import { CompetitionCacheProvider } from "@/lib/competition-cache-context"
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Prompt Engineering Competition",
  description: "National competition platform for prompt engineering excellence",
  generator: "EnlightTechAI",
  icons: {
    icon: "/favicon.PNG",                // Standard favicon
    shortcut: "/favicon.PNG",            // Fallback
    apple: "/apple-touch-icon.png",      // iOS homescreen
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <AuthProvider>
            <ProfileCompletionGuard>
              <CompetitionCacheProvider>
                <ParticipantCacheProvider>
                  {children}
                </ParticipantCacheProvider>
              </CompetitionCacheProvider>
            </ProfileCompletionGuard>
            <Toaster />
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
