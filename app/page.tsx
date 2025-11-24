"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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
  Eye
} from "lucide-react"
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
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-xl px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Live Events</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-6">
            Competition Events
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join our exciting events to showcase your prompt engineering skills and compete with the best minds in AI.
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
        <div ref={scrollContainerRef} className="flex overflow-x-auto gap-8 pb-8 scrollbar-hide">
          {isLoadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <CompetitionCardSkeleton key={i} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-muted-foreground text-lg w-full">
              No active or upcoming competitions found. Check back later!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  className="w-[90vw] md:w-[420px] flex-shrink-0"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="bg-white shadow-lg rounded-xl h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-slate-600/5" />
                      <CardHeader className="p-8 relative">
                        <div className="flex justify-between items-start mb-6">
                          <div className="space-y-2 flex-1">
                            <Badge className={`${getStatusBadge(event.status)} border font-medium px-3 py-1`}>
                              {event.status}
                            </Badge>
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight">
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
                    <CardContent className="p-8 pt-0 mt-auto space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Date</p>
                            <p className="text-sm font-semibold text-slate-900">{event.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Time</p>
                            <p className="text-sm font-semibold text-slate-900">{event.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            {event.mode === "online" || event.location === "online" ? (
                              <Globe className="h-4 w-4 text-purple-600" />
                            ) : (
                              <MapPin className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                              Mode
                            </p>
                            <p className="text-sm font-semibold text-slate-900 capitalize">
                              {event.mode || event.location || "Online"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Prize</p>
                            <p className="text-sm font-semibold text-slate-900">{event.prizeMoney}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        {(event.status === "Active" || event.status === "Upcoming") && (
                          <Button
                            onClick={() => router.push("/auth/login")}
                            className="w-full gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
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

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden min-h-screen flex items-center justify-center bg-white">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-100/20 to-blue-100/20 rounded-full blur-3xl" />
          <div className="container mx-auto p-6 py-20 md:py-32 relative z-10">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-xl px-6 py-3 backdrop-blur-sm"
              >
                <Star className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Prompt Engineering Competition
                </span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight pb-2"
                style={{ lineHeight: '1.2' }}
              >
                All Pakistan Prompt Engineering Competition
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl md:text-2xl text-muted-foreground max-w-4xl leading-relaxed"
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
        <section className="py-20 bg-white">
          <div className="container mx-auto p-6 space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 rounded-xl px-4 py-2 mb-4">
                <Trophy className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Prize Pool</span>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Prize Pool – Compete & Win Big!
              </h2>
              <p className="text-lg text-muted-foreground">
                Showcase your talent, rise to the challenge, and claim your share of an exciting cash prize pool. Whether you're aiming for the top spot or simply want to test your skills, every position counts!
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white shadow-lg rounded-xl">
                <CardHeader className="text-center p-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Cash Prizes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="grid gap-4">
                    {[
                      { position: "1st Prize", amount: "PKR 100,000", rank: 1 },
                      { position: "2nd Prize", amount: "PKR 75,000", rank: 2 },
                      { position: "3rd Prize", amount: "PKR 50,000", rank: 3 },
                      { position: "4th Prize", amount: "PKR 30,000", rank: 4 },
                      { position: "5th Prize", amount: "PKR 20,000", rank: 5 },
                    ].map((prize, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-100 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#10152f] text-white rounded-lg flex items-center justify-center font-bold">
                            {prize.rank}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{prize.position}</h3>
                            <p className="text-sm text-muted-foreground">Achievement Award</p>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-slate-900">
                          {prize.amount}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-8 text-center p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-emerald-600" />
                      <span className="text-lg font-bold text-slate-900">Total Prize Pool</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      PKR 275,000
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">Plus certificates and recognition for all winners!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto p-6 space-y-8">
            {/* Section Heading */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Why Participate in PromptComp?
              </h2>
              <p className="text-lg text-muted-foreground">
                Take your AI skills to the next level by competing in a national prompt engineering competition designed
                to challenge, evaluate, and reward the best talent across the country.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <Card className="bg-white shadow-lg rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="text-center p-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    National Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <CardDescription className="text-muted-foreground">
                    Compete at the national level and gain recognition for your prompt engineering skills.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="text-center p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Expert Evaluation
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <CardDescription className="text-muted-foreground">
                    Your submissions are evaluated by advanced LLMs and expert human reviewers.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="text-center p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Prestigious Awards
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <CardDescription className="text-muted-foreground">
                    Win certificates, prizes, and recognition from leading AI organizations.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-lg rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <CardHeader className="text-center p-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-slate-600" />
                  </div>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Skill Development
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <CardDescription className="text-muted-foreground">
                    Enhance your prompt engineering abilities through challenging real-world problems.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
            {/* How It Works */}
            <Card className="bg-white shadow-lg rounded-xl">
              <CardContent className="p-8">
                <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-12">
                  How It Works
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-all duration-200">
                      <span className="text-2xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                      Register & Login
                    </h3>
                    <p className="text-muted-foreground">Create your account and access the competition platform.</p>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-all duration-200">
                      <span className="text-2xl font-bold text-emerald-600">2</span>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                      Submit Your Prompt
                    </h3>
                    <p className="text-muted-foreground">Craft and submit your prompt according to challenges assigned.</p>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-all duration-200">
                      <span className="text-2xl font-bold text-purple-600">3</span>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                      Get Evaluated
                    </h3>
                    <p className="text-muted-foreground">Receive automated scoring and potential expert review.</p>
                  </div>
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
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 mb-4">
                <Mail className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-black uppercase tracking-wide">Get In Touch</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-black">Contact Us</h2>
              <p className="text-xl text-black max-w-3xl mx-auto leading-relaxed">
                Have questions about the competition? We're here to help you succeed.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Info Card */}
              <Card className="bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-xl border-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 pointer-events-none" />
                <CardHeader className="p-8 relative">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-2">
                    Let's Connect
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-lg">
                    Reach out through your preferred channel - we're here to help
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  {[
                    {
                    icon: Mail,
                    title: "Email",
                    details: [
                      { text: "info@etlonline.org", isEmail: true },
                      { text: "etl1competition@gmail.com", isEmail: true },
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
                    {
                      icon: Globe,
                      title: "Digital First",
                      details: [
                        "Fully online services",
                        "Remote collaboration ready",
                        "Global accessibility",
                      ],
                      bgColor: "bg-slate-100",
                      iconColor: "text-slate-600",
                    },
                  ].map((contact, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-white shadow">
                      <div
                        className={`w-12 h-12 ${contact.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                      >
                        <contact.icon className={`h-6 w-6 ${contact.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-black mb-1">{contact.title}</h3>
                        {contact.details.map((detail, idx) => (
                          <p key={idx} className="text-black text-sm">
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
                <CardContent className="p-8 space-y-6">
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