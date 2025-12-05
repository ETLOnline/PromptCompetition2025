"use client"

import { useRef, useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { fetchCompetitions } from "@/lib/api" // Import your API utility

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Trophy,
  Users,
  Award,
  Target,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Sparkles,
  Zap,
  Star,
  MessageCircle, 
  Globe,
  Eye,
  LayoutDashboard
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import TypingPromptInput from "@/components/typing-prompt-input"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import ContactForm from "@/components/contact-form"
import { CompetitionCardSkeleton } from "@/components/competition-card-skeleton"
import { ViewCompetitionDetailsModal } from "@/components/view-competition-details-modal"

// The Main Component
function CompetitionEventsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isAtEnd, setIsAtEnd] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const router = useRouter()

  const checkScrollability = () => {
    const el = scrollContainerRef.current
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth
      setIsScrollable(hasOverflow)
      setIsAtStart(el.scrollLeft === 0)
      setIsAtEnd(el.scrollWidth - el.scrollLeft <= el.clientWidth + 1)
    }
  }

  useEffect(() => {
    const loadCompetitions = async () => {
      setIsLoadingEvents(true)
      try {
        const data = await fetchCompetitions()
        const now = new Date()

        const processedCompetitions = data
          .map((comp: any) => {
            const start = new Date(comp.startDeadline)
            const end = new Date(comp.endDeadline)
            let status = "Upcoming"
            if (now >= start && now <= end) {
              status = "Active"
            } else if (now > end) {
              status = "Finished"
            }
            return {
              ...comp, // Keep all original competition data
              status,
              date: start.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              time:
                start.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }) + " UTC",
            }
          })
          .filter((event) => event.status === "Active" || event.status === "Upcoming")

        setEvents(processedCompetitions)
      } catch (error) {
        console.error("Error loading competitions:", error)
      } finally {
        setIsLoadingEvents(false)
      }
    }
    loadCompetitions()
  }, [])

  useEffect(() => {
    checkScrollability()
    window.addEventListener("resize", checkScrollability)
    const el = scrollContainerRef.current
    if (el) {
      el.addEventListener("scroll", checkScrollability)
    }
    return () => {
      window.removeEventListener("resize", checkScrollability)
      if (el) {
        el.removeEventListener("scroll", checkScrollability)
      }
    }
  }, [events])

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current
    if (el) {
      const scrollAmount = el.clientWidth * 0.8
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "Upcoming":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "Finished":
        return "bg-slate-50 text-slate-700 border-slate-200"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const handleViewDetails = (event: any) => {
    setSelectedCompetition(event)
    setIsDetailsModalOpen(true)
  }

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-gray-50/30" />
      <div className="container mx-auto p-6 space-y-8 relative">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-lg sm:rounded-xl px-2.5 py-1 sm:px-4 sm:py-2 mb-4">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            <span className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">Live Events</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-6">
            Prompt Competition
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            Join our exciting competition to showcase your prompt engineering skills and compete with the best minds in AI.
          </p>
        </div>
        {isScrollable &&
          !isLoadingEvents &&
          events.length > 0 && (
            <div className="flex justify-center gap-4 mb-8">
              <Button
                onClick={() => handleScroll("left")}
                disabled={isAtStart}
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-xl border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 disabled:opacity-30 bg-white/80 backdrop-blur-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => handleScroll("right")}
                disabled={isAtEnd}
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-xl border-2 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 disabled:opacity-30 bg-white/80 backdrop-blur-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        <div className="w-full">
          {isLoadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
              {[...Array(3)].map((_, i) => (
                <CompetitionCardSkeleton key={i} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-muted-foreground text-base sm:text-lg w-full px-4">
              No active or upcoming competitions found. Check back later!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  className="w-full"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="bg-white shadow-lg rounded-xl h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-slate-600/5" />
                      <CardHeader className="p-4 sm:p-6 md:p-8 relative">
                        <div className="flex justify-between items-start mb-4 sm:mb-6">
                          <div className="space-y-2 flex-1">
                            <Badge className={`${getStatusBadge(event.status)} border font-medium px-2 py-0.5 text-xs sm:px-3 sm:py-1 sm:text-sm`}>
                              {event.status}
                            </Badge>
                            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight">
                              {event.title}
                            </CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(event)}
                            className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl hover:scale-110 transition-transform duration-300 hover:bg-gradient-to-br hover:from-blue-200 hover:to-purple-200"
                          >
                            <Eye className="h-5 w-5 text-blue-600" />
                          </Button>
                        </div>
                      </CardHeader>
                    </div>
                    <CardContent className="p-4 sm:p-6 md:p-8 pt-0 mt-auto space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Date</p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900">{event.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Time</p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900">{event.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            {event.mode === "online" || event.location === "online" ? (
                              <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                            ) : (
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">
                              Mode
                            </p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 capitalize">
                              {event.mode || event.location || "Online"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50/50 rounded-lg">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Prize</p>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900">{event.prizeMoney}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        {(event.status === "Active" || event.status === "Upcoming") && (
                          <Button
                            onClick={() => router.push("/auth/login")}
                            className="w-full gap-2 px-4 sm:px-6 md:px-8 py-3 sm:py-4 h-12 sm:h-14 text-sm sm:text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                          >
                            <Zap className="h-5 w-5" />
                            <span className="font-semibold">Join Now</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Competition Details Modal */}
      <ViewCompetitionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedCompetition(null)
        }}
        competition={selectedCompetition}
      />
    </section>
  )
}

function RedirectHandler() {
  const { role, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const getDashboardUrl = () => {
    if (!role) return "/profile-setup"
    
    switch (role) {
      case "admin":
      case "superadmin":
        return "/admin"
      case "judge":
        return "/judge"
      case "participant":
        return "/participant"
      default:
        return "/profile-setup"
    }
  }

  // Conditional redirection logic
  useEffect(() => {
    // Wait until loading is complete
    if (loading) return

    // Check if redirect query parameter is "false"
    const redirectParam = searchParams.get("redirect")
    const shouldSkipRedirect = redirectParam === "false"

    // If user is logged in (has a role) and redirect is not disabled, redirect to dashboard
    if (role && !shouldSkipRedirect) {
      const dashboardUrl = getDashboardUrl()
      router.push(dashboardUrl)
    }
  }, [loading, role, searchParams, router])

  return null
}

export default function HomePage() {
  const { role, loading } = useAuth()

  const getDashboardUrl = () => {
    if (!role) return "/profile-setup"
    
    switch (role) {
      case "admin":
      case "superadmin":
        return "/admin"
      case "judge":
        return "/judge"
      case "participant":
        return "/participant"
      default:
        return "/profile-setup"
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <RedirectHandler />
      </Suspense>
      <StructuredData />
      <div className="flex min-h-screen flex-col pt-2">
        <Navbar />
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden min-h-screen flex items-center justify-center bg-white">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-100/20 to-blue-100/20 rounded-full blur-3xl" />
          <div className="container mx-auto p-6 py-8 md:py-16 relative z-10">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">
              {/* Removed hero badge section as requested */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight pb-2"
                style={{ lineHeight: '1.2' }}
              >
                All Pakistan Prompt Engineering Competition
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-4xl leading-relaxed px-4"
              >
                Join the nation's premier competition for prompt engineering excellence. Showcase your skills, compete
                with the best, and shape the future of AI interaction.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-full max-w-2xl"
              >
                <TypingPromptInput />
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        
        {/* Prize Pool Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-amber-100/30 to-yellow-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          
          <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-emerald-200 shadow-lg"
              >
                <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wide">Prize Pool</span>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent leading-tight"
              >
                Compete & Win Big!
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed"
              >
                Showcase your talent, rise to the challenge, and claim your share of an exciting cash prize pool. 
                Whether you're aiming for the top spot or simply want to test your skills, every position counts!
              </motion.p>
            </div>
            
            <div className="max-w-5xl mx-auto px-4">
              {/* Total Prize Pool Highlight */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative mb-6 sm:mb-8"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 rounded-2xl blur-xl opacity-30" />
                <Card className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 rounded-2xl overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
                  <CardContent className="relative p-4 sm:p-6 md:p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl mb-3 sm:mb-4 shadow-lg border-2 border-emerald-200">
                      <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2">Total Prize Pool</h3>
                    <p className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent mb-2">
                      PKR 275,000
                    </p>
                    <p className="text-slate-300 text-[10px] sm:text-xs md:text-sm">Plus certificates and recognition for all winners</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Prize Tiers */}
              <div className="grid gap-3 sm:gap-4 mb-6 sm:mb-8">
                {[
                  { position: "1st Prize", amount: "PKR 100,000", rank: 1, gradient: "from-amber-500 to-yellow-500", bgGradient: "from-amber-50 to-yellow-50", icon: "🥇" },
                  { position: "2nd Prize", amount: "PKR 75,000", rank: 2, gradient: "from-slate-400 to-slate-500", bgGradient: "from-slate-50 to-slate-100", icon: "🥈" },
                  { position: "3rd Prize", amount: "PKR 50,000", rank: 3, gradient: "from-orange-600 to-amber-700", bgGradient: "from-orange-50 to-amber-50", icon: "🥉" },
                  { position: "4th Prize", amount: "PKR 30,000", rank: 4, gradient: "from-blue-500 to-purple-500", bgGradient: "from-blue-50 to-purple-50", icon: "🏆" },
                  { position: "5th Prize", amount: "PKR 20,000", rank: 5, gradient: "from-emerald-500 to-teal-500", bgGradient: "from-emerald-50 to-teal-50", icon: "⭐" },
                ].map((prize, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="relative group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${prize.gradient} rounded-xl blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                    <Card className={`relative bg-gradient-to-br ${prize.bgGradient} border-2 border-white/50 rounded-xl shadow-lg overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full" />
                      <CardContent className="p-3 sm:p-4 md:p-5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className={`relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${prize.gradient} rounded-lg sm:rounded-xl flex items-center justify-center shadow-md transform group-hover:scale-105 transition-all duration-300 flex-shrink-0`}>
                              <span className="text-lg sm:text-xl md:text-2xl">{prize.icon}</span>
                              <div className="absolute -top-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                <span className="text-[10px] sm:text-xs font-bold text-slate-900">{prize.rank}</span>
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 truncate">{prize.position}</h3>
                              <p className="text-[10px] sm:text-xs text-slate-600 font-medium">Achievement Award</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-black whitespace-nowrap" style={{ color: '#0f172a' }}>
                              {prize.amount}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-2xl blur-xl opacity-20" />
                <Card className="relative bg-white border-0 rounded-2xl shadow-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-blue-50/50" />
                  <CardContent className="relative p-4 sm:p-6 md:p-8 text-center space-y-3 sm:space-y-4">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border-2 border-emerald-200">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wide">Free to Participate</span>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                        Ready to Showcase Your Skills?
                      </h3>
                      <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
                        Join thousands of participants competing for glory and prizes.
                      </p>
                    </div>

                    <SignedOut>
                      <Button
                        onClick={() => (window.location.href = '/auth/register')}
                        className="group relative gap-2 px-6 sm:px-8 py-4 sm:py-5 h-auto text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800"
                      >
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
                        <span>Register Now & Compete</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Button>
                    </SignedOut>
                    <SignedIn>
                        <Link href={getDashboardUrl()}>
                          <Button
                            disabled={loading}
                            className="group relative gap-2 px-6 sm:px-8 py-4 sm:py-5 h-auto text-sm sm:text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                          >
                            <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
                            <span>Go to Dashboard</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </Button>
                        </Link>
                    </SignedIn>

                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-emerald-700 flex-wrap">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-[10px] sm:text-xs md:text-sm font-semibold">
                        No registration fees • 100% Free
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto p-6 space-y-8">
            {/* Section Heading */}
            <div className="text-center max-w-3xl mx-auto space-y-4 px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Why Participate in APPEC?
              </h2>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground">
                Take your AI skills to the next level by competing in a national prompt engineering competition designed
                to challenge, evaluate, and reward the best talent across the country.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 px-4">
              <Card className="bg-white shadow-lg rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    National Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                    Compete at the national level and gain recognition for your prompt engineering skills.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Expert Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                    Your submissions are evaluated by advanced LLMs and expert human reviewers.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Award className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Prestigious Awards
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                    Win certificates, prizes, and recognition from leading AI organizations.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600" />
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Skill Development
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                    Enhance your prompt engineering abilities through challenging real-world problems.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
            {/* How It Works */}
            <Card className="bg-white shadow-lg rounded-xl mx-4">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-8 sm:mb-12">
                  How It Works
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                  <div className="text-center group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 hover:scale-110 transition-all duration-200">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                      Register & Login
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Create your account and access the competition platform.</p>
                  </div>
                  <div className="text-center group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 hover:scale-110 transition-all duration-200">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600">2</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                      Submit Your Prompt
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Craft and submit your prompt according to challenges assigned.</p>
                  </div>
                  <div className="text-center group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 hover:scale-110 transition-all duration-200">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">3</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                      Get Evaluated
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Receive automated scoring and potential expert review.</p>
                  </div>
                  <div className="text-center group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 hover:scale-110 transition-all duration-200">
                      <span className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">4</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                      Receive Prizes
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Win exciting cash prizes and recognition for top rankings.</p>
                  </div>
                </div>

                {/* Register Now Button */}
                <div className="mt-8 sm:mt-12 text-center space-y-3">
                  <SignedOut>
                    <Button
                      onClick={() => (window.location.href = '/auth/register')}
                      className="w-full sm:w-auto gap-2 px-6 sm:px-10 py-4 sm:py-5 h-auto text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      style={{ backgroundColor: '#0f172a' }}
                    >
                      <Zap className="h-5 w-5" />
                      Register Now
                    </Button>
                  </SignedOut>
                  <SignedIn>
                    <Link href={getDashboardUrl()}>
                      <Button
                        disabled={loading}
                        className="w-full sm:w-auto gap-2 px-6 sm:px-10 py-4 sm:py-5 h-auto text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#0f172a' }}
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        Go to Dashboard
                      </Button>
                    </Link>
                  </SignedIn>
                  <p className="text-sm sm:text-base text-emerald-700 font-semibold">
                    Participation in the competition is completely free
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        {/* Events Section */}
        <section id="events">
          <CompetitionEventsSection />
        </section>
        {/* Contact Section */}
        <section id="contact" className="py-24 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50/20 via-transparent to-blue-50/20" />
          <div className="container mx-auto p-6 space-y-8 relative">
            <div className="text-center space-y-4 mb-12 sm:mb-16 px-4">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white border border-gray-200 rounded-lg sm:rounded-xl px-2.5 py-1 sm:px-3 md:px-4 sm:py-1.5 md:py-2 mb-4">
                <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-purple-600" />
                <span className="text-[10px] sm:text-xs md:text-sm font-medium text-black uppercase tracking-wide">Get In Touch</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-black">Contact Us</h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-black max-w-3xl mx-auto leading-relaxed">
                Have questions about the competition? We're here to help you succeed.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 px-4">
              {/* Contact Info Card */}
              <Card className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl border-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 pointer-events-none" />
                <CardHeader className="p-4 sm:p-6 md:p-8 relative">
                  <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                    Let's Connect
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg">
                    Reach out through your preferred channel - we're here to help
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 md:p-8 pt-0 space-y-4 sm:space-y-6">
                  {[
                    {
                    icon: Mail,
                    title: "Email",
                    details: [
                      { text: "info@etlonline.org", isEmail: true },
                      { text: "Perfect for detailed inquiries", isEmail: false }
                    ],
                    bgColor: "bg-blue-100",
                    iconColor: "text-blue-600",
                  },
                    {
                      icon: MessageCircle,
                      title: "Contact Form",
                      details: ["Fill out our online form", "Quick and convenient"],
                      bgColor: "bg-emerald-100",
                      iconColor: "text-emerald-600",
                    },
                    {
                      icon: Users,
                      title: "Social Media",
                      details: [
                        "Follow us on our social channels",
                        "Stay updated with our latest news",
                      ],
                      bgColor: "bg-purple-100",
                      iconColor: "text-purple-600",
                    },
                  ].map((contact, index) => (
                    <div key={index} className="flex items-start gap-2.5 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 rounded-xl bg-white shadow">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${contact.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                      >
                        <contact.icon className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${contact.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-black mb-1">{contact.title}</h3>
                        {contact.details.map((detail, idx) => (
                          <p key={idx} className="text-black text-xs sm:text-sm">
                            {typeof detail === 'string' ? (
                              detail
                            ) : detail.isEmail ? (
                              <a 
                                href={`mailto:${detail.text}`}
                                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                              >
                                {detail.text}
                              </a>
                            ) : (
                              detail.text
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card className="bg-white rounded-xl border-0">
                <CardContent className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </>
  )
}