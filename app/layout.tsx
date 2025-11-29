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
          <head>
            {/* Meta Pixel Code */}
            <script dangerouslySetInnerHTML={{ __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '25142224062099941');
              fbq('track', 'PageView');
            ` }} />
            <noscript>
              <img height="1" width="1" style={{display: 'none'}} src="https://www.facebook.com/tr?id=25142224062099941&ev=PageView&noscript=1" />
            </noscript>
            {/* End Meta Pixel Code */}
          </head>
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
