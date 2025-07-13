"use client"

import type { ReactElement } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"

interface FeatureCardProps {
  icon: ReactElement
  title: string
  description: string
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  // Use the specified aquamarine color for the accent, adjusting opacity for theme
  const accentColor = isDark ? "rgba(86, 255, 188, 0.3)" : "rgba(86, 255, 188, 0.5)"

  return (
    <motion.div
      className="relative group h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20 text-white h-full overflow-hidden">
        <CardHeader className="text-center">
          <Icon className="h-12 w-12 text-[#56ffbc] mx-auto mb-2" />
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-gray-300 flex-grow">{description}</CardDescription>
        </CardContent>
      </Card>

      {/* Always visible animated gradient background */}
      <motion.div
        className="absolute inset-0 z-0 opacity-20 dark:opacity-30"
        initial={{ opacity: 0 }}
        animate={{
          background: [
            `radial-gradient(circle at 30% 30%, ${accentColor} 0%, transparent 60%)`,
            `radial-gradient(circle at 70% 70%, ${accentColor} 0%, transparent 60%)`,
          ],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />
    </motion.div>
  )
}
