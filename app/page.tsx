"use client"

import { useRef, useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Trophy,
  Users,
  Award,
  Target,
  Shield,
  User,
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Loader,
} from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import TypingPromptInput from "@/components/typing-prompt-input"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import ContactForm from "@/components/contact-form"

// Dummy event data – replace with API data when available
const events = [
  {
    id: 1,
    title: "Quantum Prompt Challenge",
    description: "A battle of wits to craft the most efficient and creative prompts for our quantum AI.",
    status: "Active",
    date: "July 20, 2025",
    time: "18:00 UTC",
    location: "Online",
    prize: "$5,000",
    participants: 128,
  },
  {
    id: 2,
    title: "AI Artistry Showdown",
    description: "Generate breathtaking visuals from complex narrative prompts. The most evocative art wins.",
    status: "Upcoming",
    date: "August 15, 2025",
    time: "20:00 UTC",
    location: "Online",
    prize: "$3,000 + GPU",
    participants: 0,
  },
  {
    id: 3,
    title: "Code-Gen Hackathon",
    description: "Translate complex logic into functional code using only natural language prompts.",
    status: "Finished",
    date: "June 1, 2025",
    time: "12:00 UTC",
    location: "Online",
    prize: "Trophy + Recognition",
    participants: 256,
  },
  {
    id: 4,
    title: "Data Storytelling Contest",
    description: "Analyze a complex dataset and generate a compelling narrative using our data-to-text AI.",
    status: "Upcoming",
    date: "September 5, 2025",
    time: "16:00 UTC",
    location: "Online",
    prize: "$2,500",
    participants: 0,
  },
]

// The Main Component
function CompetitionEventsSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)
  const [isAtStart, setIsAtStart] = useState(true)
  const [isAtEnd, setIsAtEnd] = useState(false)

  // Checks if the container is scrollable and updates the state for button visibility
  const checkScrollability = () => {
    const el = scrollContainerRef.current
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth
      setIsScrollable(hasOverflow)
      setIsAtStart(el.scrollLeft === 0)
      setIsAtEnd(el.scrollWidth - el.scrollLeft <= el.clientWidth + 1) // +1 for minor pixel variations
    }
  }

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
      const scrollAmount = el.clientWidth * 0.8 // Scroll by 80% of the visible width
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-medium uppercase tracking-wide"
      case "Upcoming":
        return "bg-blue-50 text-blue-800 border-blue-200 text-xs font-medium uppercase tracking-wide"
      case "Finished":
        return "bg-gray-50 text-gray-800 border-gray-200 text-xs font-medium uppercase tracking-wide"
      default:
        return "bg-gray-50 text-gray-800 border-gray-200 text-xs font-medium uppercase tracking-wide"
    }
  }

  return (
    <section className="py-16 bg-gradient-to-b from-slate-100 to-slate-150">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Competition Events</h2>
            <p className="text-lg font-medium text-gray-700 max-w-2xl">
              Join our exciting events to showcase your prompt engineering skills.
            </p>
          </div>
          {/* Scroll Buttons */}
          {isScrollable && (
            <div className="flex justify-center md:justify-end gap-3">
              <Button
                onClick={() => handleScroll("left")}
                disabled={isAtStart}
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => handleScroll("right")}
                disabled={isAtEnd}
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Horizontal Scroll Container */}
        <div ref={scrollContainerRef} className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              className="w-[90vw] md:w-[400px] flex-shrink-0"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-white shadow-sm rounded-xl h-full flex flex-col hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl">
                  <div className="flex justify-between items-start mb-4">
                    <CardTitle className="text-xl font-bold text-white">{event.title}</CardTitle>
                    <Badge className={`${getStatusBadge(event.status)} border`}>{event.status}</Badge>
                  </div>
                  <CardDescription className="text-gray-200 text-sm font-medium">{event.description}</CardDescription>
                </CardHeader>

                <CardContent className="p-6 mt-auto">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-indigo-500 rounded flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded flex items-center justify-center">
                        <Clock className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-teal-500 rounded flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded flex items-center justify-center">
                        <Trophy className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{event.prize}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-600">
                      {event.participants.toLocaleString()} participants
                    </span>
                    {event.status === "Active" && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        Join Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-150 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-gray-600" />
          <span className="text-lg font-medium text-gray-700">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen flex-col">
        <Navbar />

        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden min-h-screen flex items-center justify-center">
          
          <div className="container px-4 md:px-6 py-16 md:py-20 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="inline-block rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm mb-6 text-gray-600 font-medium uppercase tracking-wide">
                Prompt Engineering Competition
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6 text-gray-600">
                All Pakistan Prompt Engineering Competition
              </h1>
              <p className="text-xl text-gray-600 md:text-2xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-3xl mb-12">
                Join the nation's premier competition for prompt engineering excellence. Showcase your skills, compete
                with the best, and shape the future of AI interaction.
              </p>
              <TypingPromptInput />

              <div className="flex flex-wrap justify-center gap-4 mt-16">
                  <>
                    <Button
                      variant="outline"
                      className="px-6 py-3 h-12 rounded-xl border-2 bg-gray-600 backdrop-blur-sm hover:bg-white/20 text-white border-white/30 transition-all duration-200"
                      asChild
                    >
                      <Link href="/auth/login/admin">
                        <Shield className="h-5 w-5 mr-2" />
                        <span className="font-medium">Admin Login</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="px-6 py-3 h-12 rounded-xl border-2 bg-gray-600 backdrop-blur-sm hover:bg-white/20 text-white border-white/30 transition-all duration-200"
                      asChild
                    >
                      <Link href="/auth/login">
                        <User className="h-5 w-5 mr-2" />
                        <span className="font-medium">Participant Login</span>
                      </Link>
                    </Button>
                  </>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-slate-100 to-slate-150">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">National Recognition</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <CardDescription className="text-base font-medium text-gray-700">
                    Compete at the national level and gain recognition for your prompt engineering skills.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">Expert Evaluation</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <CardDescription className="text-base font-medium text-gray-700">
                    Your submissions are evaluated by advanced LLMs and expert human reviewers.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">Prestigious Awards</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <CardDescription className="text-base font-medium text-gray-700">
                    Win certificates, prizes, and recognition from leading AI organizations.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">Skill Development</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <CardDescription className="text-base font-medium text-gray-700">
                    Enhance your prompt engineering abilities through challenging real-world problems.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* How It Works */}
            <Card className="bg-white shadow-sm rounded-xl">
              <CardContent className="p-8">
                <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-all duration-200">
                      <span className="text-2xl font-bold text-white">1</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Register & Login</h3>
                    <p className="text-base font-medium text-gray-700">
                      Create your account and access the competition platform.
                    </p>
                  </div>

                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-all duration-200">
                      <span className="text-2xl font-bold text-white">2</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Your Prompt</h3>
                    <p className="text-base font-medium text-gray-700">
                      Craft and submit your prompt with the LLM-generated output.
                    </p>
                  </div>

                  <div className="text-center group">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-all duration-200">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Get Evaluated</h3>
                    <p className="text-base font-medium text-gray-700">
                      Receive automated scoring and potential expert review.
                    </p>
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
        <section id="contact" className="py-16 bg-gradient-to-b from-slate-100 to-slate-150">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-xl font-medium text-gray-700 max-w-3xl mx-auto">
                Have questions about the competition? We're here to help!
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-t-xl">
                  <CardTitle className="text-2xl font-bold text-white">Get in Touch</CardTitle>
                  <CardDescription className="text-gray-200 font-medium">
                    Reach out to us through any of the following channels
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Email</h3>
                      <p className="text-base font-medium text-gray-700">info@promptcompetition.pk</p>
                      <p className="text-base font-medium text-gray-700">support@promptcompetition.pk</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Phone</h3>
                      <p className="text-base font-medium text-gray-700">+92 21 1234 5678</p>
                      <p className="text-base font-medium text-gray-700">+92 42 8765 4321</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Address</h3>
                      <p className="text-base font-medium text-gray-700">
                        National Incubation Center
                        <br />
                        Lahore University of Management Sciences
                        <br />
                        Lahore, Punjab, Pakistan
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Support Hours</h3>
                      <p className="text-base font-medium text-gray-700">Monday - Friday: 9:00 AM - 6:00 PM PKT</p>
                      <p className="text-base font-medium text-gray-700">Saturday: 10:00 AM - 4:00 PM PKT</p>
                      <p className="text-base font-medium text-gray-700">Sunday: Closed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
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
