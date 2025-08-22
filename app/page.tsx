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
} from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import TypingPromptInput from "@/components/typing-prompt-input"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import ContactForm from "@/components/contact-form"
import { CompetitionCardSkeleton } from "@/components/competition-card-skeleton" // Import the new skeleton component

// The Main Component
function CompetitionEventsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isAtEnd, setIsAtEnd] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true) // Inline loading state
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
      setIsLoadingEvents(true) // Set loading to true when fetching starts
      try {
        const data = await fetchCompetitions() // Use your API utility
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
              id: comp.id,
              title: comp.title,
              location: comp.location,
              prize: comp.prizeMoney,
              participants: 0, // Assuming participants are not returned by API or always 0 for now
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
          .filter((event) => event.status === "Active" || event.status === "Upcoming") // Filter to show only Active or Upcoming

        setEvents(processedCompetitions)
      } catch (error) {
        console.error("Error loading competitions:", error)
        // You might want to add a toast notification here if you have a toast context available
      } finally {
        setIsLoadingEvents(false) // Set loading to false when fetching finishes
      }
    }
    loadCompetitions()
  }, []) // Empty dependency array means this runs once on mount

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
  }, [events]) // Re-check scrollability when events change

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
          events.length > 0 && ( // Only show scroll buttons if scrollable and not loading
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
            // Render skeleton loaders when loading
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map(
                (
                  _,
                  i, // Render 3 skeleton cards
                ) => (
                  <CompetitionCardSkeleton key={i} />
                ),
              )}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center text-muted-foreground text-lg w-full">
              No active or upcoming competitions found. Check back later!
            </div>
          ) : (
            // Render actual events when loaded
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
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Trophy className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        {/* Removed CardDescription for event.description as requested */}
                        {/* <CardDescription className="text-muted-foreground text-base leading-relaxed">
                          {event.description}
                        </CardDescription> */}
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
                            <MapPin className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                              Location
                            </p>
                            <p className="text-sm font-semibold text-slate-900">{event.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Prize</p>
                            <p className="text-sm font-semibold text-slate-900">{event.prize}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        {/* <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {event.participants.toLocaleString()} participants
                          </span>
                        </div> */}
                        {(event.status === "Active" || event.status === "Upcoming") && (
                          <Button
                            onClick={() => router.push("/auth/login")}
                            className="gap-2 px-8 py-4 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
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
                className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-snug"
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
                    <p className="text-muted-foreground">Craft and submit your prompt with the LLM-generated output.</p>
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
                    Get in Touch
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-lg">
                    Reach out to us through any of the following channels
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  {[
                    {
                      icon: Mail,
                      title: "Email",
                      details: ["info@promptcompetition.pk", "support@promptcompetition.pk"],
                      bgColor: "bg-blue-100",
                      iconColor: "text-blue-600",
                    },
                    {
                      icon: Phone,
                      title: "Phone",
                      details: ["+92 21 1234 5678", "+92 42 8765 4321"],
                      bgColor: "bg-emerald-100",
                      iconColor: "text-emerald-600",
                    },
                    {
                      icon: MapPin,
                      title: "Address",
                      details: [
                        "National Incubation Center",
                        "Lahore University of Management Sciences",
                        "Lahore, Punjab, Pakistan",
                      ],
                      bgColor: "bg-purple-100",
                      iconColor: "text-purple-600",
                    },
                    {
                      icon: Clock,
                      title: "Support Hours",
                      details: [
                        "Monday - Friday: 9:00 AM - 6:00 PM PKT",
                        "Saturday: 10:30 AM - 4:00 PM PKT",
                        "Sunday: Closed",
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
                            {detail}
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
