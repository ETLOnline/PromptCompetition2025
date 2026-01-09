"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { Check, Trophy, Users, AlertCircle, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * ═════════════════════════════════════════════════════════════════
 * Competition Progress Timeline - Beautiful Widget
 * ═════════════════════════════════════════════════════════════════
 *
 * DESIGN PHILOSOPHY:
 * • 100% Frontend-only (no API calls, no heavy logic)
 * • Single render computation (no polling, no intervals)
 * • Milestone spacing is VISUAL (not date-based)
 * • Progress bar fills based on actual dates
 * • Beautiful animations + visual clarity
 *
 * PERFORMANCE:
 * • Calculation happens once on render
 * • O(1) complexity for progress calculation
 * • No expensive DOM queries
 * • Respects React best practices with useMemo
 */

// ═══════════════════════════════════════════════════════════════
// CONFIG: Dates & Milestones (6 FIXED STAGES)
// ═══════════════════════════════════════════════════════════════

const COMPETITION_CONFIG = {
  preCompetition: new Date("2025-12-15T00:00:00").getTime(),
  level1: new Date("2026-01-17T00:00:00").getTime(),
  level1Results: new Date("2026-01-17T23:59:59").getTime(), // End of Level 1
  level2Start: new Date("2026-01-18T00:00:00").getTime(),
  level2End: new Date("2026-01-25T23:59:59").getTime(),
  finalResults: new Date("2026-01-28T00:00:00").getTime(),
}

interface Milestone {
  id: string
  label: string
  date: string // ISO string
  endDate?: string
  displayDate: string
  icon: React.ElementType
  description: string
  note?: string
  stageIndex: number // Which stage (0-5)
}

const MILESTONES: Milestone[] = [
  {
    id: "precompetition",
    label: "Pre-Competition",
    date: "2025-12-15",
    displayDate: "15 Dec – 16 Jan",
    icon: Flag,
    description: "Registration Open",
    note: "Prepare and register for the competition.",
    stageIndex: 0,
  },
  {
    id: "level1",
    label: "Level 1",
    date: "2026-01-17",
    displayDate: "17 Jan",
    icon: Flag,
    description: "Competition Day",
    note: "All registered participants compete.",
    stageIndex: 1,
  },
  {
    id: "level1results",
    label: "Level 1 Results",
    date: "2026-01-17",
    endDate: "2026-01-17",
    displayDate: "17 Jan (EOD)",
    icon: Trophy,
    description: "Leaderboard Published",
    note: "Top 20 participants announced.",
    stageIndex: 2,
  },
  {
    id: "level2start",
    label: "Level 2 Start",
    date: "2026-01-18",
    displayDate: "18 Jan",
    icon: Users,
    description: "Level 2 Begins",
    note: "Daily live sessions for top 20 participants till 25th January.",
    stageIndex: 3,
  },
  {
    id: "level2end",
    label: "Level 2 End",
    date: "2026-01-25",
    displayDate: "25 Jan",
    icon: Users,
    description: "Level 2 Concludes",
    note: "Final submissions from qualified participants.",
    stageIndex: 4,
  },
  {
    id: "finalresults",
    label: "Final Results",
    date: "2026-01-28",
    displayDate: "28 Jan",
    icon: Trophy,
    description: "Winners Announced",
    note: "Competition will conclude. Winners will be revealed!",
    stageIndex: 5,
  },
]

// ═══════════════════════════════════════════════════════════════
// HELPERS: Pure Functions (No Side Effects)
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate current stage (0-5) based on current date
 * Stage-based progress, NOT percentage-based
 *
 * EFFICIENCY:
 * • O(1) - simple date comparisons
 * • No loops or recursion
 * • Returns discrete stage number
 */
function calculateCurrentStage(now: number): number {
  const config = COMPETITION_CONFIG

  if (now < config.preCompetition) return -1 // Before competition exists
  if (now < config.level1) return 0 // Pre-Competition
  if (now < config.level1Results) return 1 // Level 1 active
  if (now < config.level2Start) return 2 // Level 1 Results published
  if (now < config.level2End) return 3 // Level 2 Start
  if (now <= config.level2End) return 4 // Level 2 End
  if (now < config.finalResults) return 4 // Waiting for final results
  return 5 // Final Results announced
}

/**
 * Determine milestone state based on current stage
 * States: "upcoming" | "active" | "completed"
 *
 * EFFICIENCY:
 * • O(1) - constant time comparisons
 * • No external calls
 */
function getMilestoneState(
  currentStage: number,
  milestone: Milestone
): "upcoming" | "active" | "completed" {
  if (currentStage > milestone.stageIndex) return "completed"
  if (currentStage === milestone.stageIndex) return "active"
  return "upcoming"
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CompetitionProgressTimeline() {
  // Single source of truth for current time
  const now = useMemo(() => Date.now(), [])

  // Calculate current stage (0-5, not percentage)
  const currentStage = useMemo(() => calculateCurrentStage(now), [now])

  // Determine state for all milestones
  const states = useMemo(
    () => MILESTONES.map((m) => getMilestoneState(currentStage, m)),
    [currentStage]
  )

  // Format today's date
  const todayDate = new Date(now).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  // Calculate stage label for display
  const stageLabel = currentStage >= 0 && currentStage < MILESTONES.length
    ? MILESTONES[currentStage].label
    : "Not Started"

  return (
    <motion.div
      className="w-full py-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* ═════════════════════════════════════════════════════════════
          BENTO WIDGET CARD - PRETTY & COLORFUL
          ═════════════════════════════════════════════════════════════ */}
      <div className="relative group">
        {/* Animated border gradient - matching AppecInfoBox style */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500 via-emerald-500 to-orange-500 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition duration-500" />

        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Decorative background patterns */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-full -translate-y-32 translate-x-32 opacity-50" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-50 to-transparent rounded-full translate-y-24 -translate-x-24 opacity-50" />

          <div className="relative p-4 sm:p-5 md:p-7">
            {/* ──────────────────────────────────────────────────────
                HEADER SECTION
                ────────────────────────────────────────────────────── */}
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Icon Container */}
              <motion.div
                className="hidden sm:flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-[#0f172a] shadow-lg shadow-gray-900/20 shrink-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </motion.div>

              {/* Title & Info */}
              <div className="flex-1 pr-8 sm:pr-10">
                {/* Badge */}
                <motion.div
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-purple-100 text-purple-700 border-0 mb-2 sm:mb-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="text-[10px] sm:text-xs font-semibold tracking-wider">PROGRESS TRACKER</span>
                </motion.div>

                {/* Title */}
                <motion.h2
                  className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 leading-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  Competition Timeline
                </motion.h2>

                {/* Description */}
                <motion.p
                  className="text-xs sm:text-sm text-gray-600 leading-relaxed break-words"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Prompt Engineering Competition 2026 • Track your journey
                </motion.p>
              </div>

              {/* Progress Display */}
              <motion.div
                className="text-right shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="text-base sm:text-lg font-bold text-gray-900">
                  Stage {currentStage + 1}/6
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  {stageLabel}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                  {todayDate}
                </div>
              </motion.div>
            </div>

            {/* ──────────────────────────────────────────────────────
                PROGRESS BAR WITH MILESTONES (STAGE-BASED)
                ────────────────────────────────────────────────────── */}
            <div className="relative w-full mb-3 px-4 sm:px-6">
              {/* Background track */}
              <div className="h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
                {/* Single progress fill - fills to current stage position (aligned with badges) */}
                <div
                  className="h-full bg-[#0f172a] transition-all duration-300"
                  style={{
                    // Badges are at 0%, 20%, 40%, 60%, 80%, 100% (evenly distributed)
                    // So fill to: stage 0 -> 0%, stage 1 -> 20%, stage 2 -> 40%, etc.
                    width: `${(currentStage / (MILESTONES.length - 1)) * 100}%`
                  }}
                />
              </div>

              {/* Stage markers/nodes */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 sm:left-6 sm:right-6 flex justify-between">
                {MILESTONES.map((milestone, index) => {
                  const state = states[index]
                  const colors = [
                    { glow: "bg-blue-400", grad: "from-blue-500 to-blue-600", border: "border-blue-700" },
                    { glow: "bg-indigo-400", grad: "from-indigo-500 to-indigo-600", border: "border-indigo-700" },
                    { glow: "bg-purple-400", grad: "from-purple-500 to-purple-600", border: "border-purple-700" },
                    { glow: "bg-pink-400", grad: "from-pink-500 to-pink-600", border: "border-pink-700" },
                    { glow: "bg-orange-400", grad: "from-orange-500 to-orange-600", border: "border-orange-700" },
                    { glow: "bg-emerald-400", grad: "from-emerald-500 to-emerald-600", border: "border-emerald-700" },
                  ]
                  const color = colors[index % colors.length]

                  return (
                    <motion.div
                      key={milestone.id}
                      className="flex flex-col items-center"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.4 + index * 0.12,
                        type: "spring",
                        stiffness: 350,
                        damping: 35,
                      }}
                    >
                      {/* Node circle */}
                      <div
                        className={cn(
                          "relative w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10",
                          state === "completed" &&
                          `bg-gradient-to-br ${color.grad} ${color.border} text-white shadow-lg`,
                          state === "active" &&
                          `bg-gradient-to-br ${color.grad} ${color.border} text-white shadow-lg`,
                          state === "upcoming" &&
                          "bg-white border-gray-300 text-gray-400 shadow-sm"
                        )}
                      >
                        {state === "completed" ? (
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" strokeWidth={3} />
                        ) : (
                          <milestone.icon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        )}
                      </div>

                      {/* Label below */}
                      <div
                        className={cn(
                          "absolute -bottom-6 sm:-bottom-7 text-[8px] sm:text-[10px] md:text-xs font-bold text-center leading-tight whitespace-nowrap",
                          "max-w-[50px] sm:max-w-[80px] md:max-w-none",
                          "overflow-hidden text-ellipsis sm:overflow-visible",
                          state === "upcoming" && "text-gray-500",
                          state === "active" && "text-gray-900 font-extrabold",
                          state === "completed" && "text-gray-700"
                        )}
                      >
                        <span className="block sm:hidden">
                          {milestone.id === "precompetition" ? "Pre-Comp" :
                            milestone.id === "level1" ? "Level 1" :
                              milestone.id === "level1results" ? "L1 Results" :
                                milestone.id === "level2start" ? "L2 Start" :
                                  milestone.id === "level2end" ? "L2 End" :
                                    milestone.id === "finalresults" ? "Final" :
                                      milestone.label}
                        </span>
                        <span className="hidden sm:block">{milestone.label}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Spacing for milestone labels */}
            <div className="h-10 sm:h-11 md:h-12" />

            {/* ──────────────────────────────────────────────────────
                MILESTONE DETAILS CARDS - AppecInfoBox Style (6 Stages)
                ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
              {MILESTONES.map((milestone, index) => {
                const state = states[index]
                const cardColors = [
                  {
                    border: "border-blue-200",
                    hoverBorder: "hover:border-blue-300",
                    iconBg: "bg-blue-100",
                    icon: "text-blue-600",
                    badge: "bg-blue-100 text-blue-700",
                  },
                  {
                    border: "border-indigo-200",
                    hoverBorder: "hover:border-indigo-300",
                    iconBg: "bg-indigo-100",
                    icon: "text-indigo-600",
                    badge: "bg-indigo-100 text-indigo-700",
                  },
                  {
                    border: "border-purple-200",
                    hoverBorder: "hover:border-purple-300",
                    iconBg: "bg-purple-100",
                    icon: "text-purple-600",
                    badge: "bg-purple-100 text-purple-700",
                  },
                  {
                    border: "border-pink-200",
                    hoverBorder: "hover:border-pink-300",
                    iconBg: "bg-pink-100",
                    icon: "text-pink-600",
                    badge: "bg-pink-100 text-pink-700",
                  },
                  {
                    border: "border-orange-200",
                    hoverBorder: "hover:border-orange-300",
                    iconBg: "bg-orange-100",
                    icon: "text-orange-600",
                    badge: "bg-orange-100 text-orange-700",
                  },
                  {
                    border: "border-emerald-200",
                    hoverBorder: "hover:border-emerald-300",
                    iconBg: "bg-emerald-100",
                    icon: "text-emerald-600",
                    badge: "bg-emerald-100 text-emerald-700",
                  },
                ]
                const cardColor = cardColors[index % cardColors.length]

                return (
                  <motion.div
                    key={milestone.id}
                    className="relative group/card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 + index * 0.1, duration: 0.5 }}
                  >
                    <div
                      className={cn(
                        "relative bg-white border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all hover:shadow-md hover:scale-[1.02]",
                        `${cardColor.border} ${cardColor.hoverBorder}`
                      )}
                    >
                      {/* Icon & Label */}
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0 transition-colors",
                            `${cardColor.iconBg} ${cardColor.icon}`
                          )}
                        >
                          {state === "completed" ? (
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={3} />
                          ) : (
                            <milestone.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          )}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-gray-900 break-words line-clamp-2">{milestone.label}</div>
                      </div>

                      {/* Date Badge */}
                      <div className={cn(
                        "inline-block text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full mb-2 sm:mb-3",
                        cardColor.badge
                      )}>
                        {milestone.displayDate}
                      </div>

                      {/* Description */}
                      <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-2 break-words line-clamp-2">
                        {milestone.description}
                      </div>

                      {/* Note */}
                      {milestone.note && (
                        <div className="text-[10px] sm:text-xs text-gray-600 leading-relaxed break-words">
                          ✓ {milestone.note}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* ──────────────────────────────────────────────────────
                QUALIFICATION RULE - MINIMALISTIC BENTO
                ────────────────────────────────────────────────────── */}
            <motion.div
              className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-2 border-amber-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.5 }}
            >
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shrink-0">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-800 leading-snug break-words">
                Only the <span className="font-bold text-amber-900">top 20 participants</span> from <span className="font-semibold text-blue-700">Level 1</span> will qualify for <span className="font-semibold text-purple-700">Level 2</span>. Give your best effort!
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

