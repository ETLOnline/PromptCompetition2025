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
} from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import StructuredData from "@/components/structured-data"
import CssGridBackground from "@/components/css-grid-background"
import FramerSpotlight from "@/components/framer-spotlight"
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
  // Add more events as needed
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
        return "bg-[#56ffbc] text-[#07073a] font-bold border border-[#56ffbc] shadow-[0_0_8px_2px_rgba(86,255,188,0.25)]"
      case "Upcoming":
        return "bg-[#56ffbc]/10 text-[#56ffbc] border border-[#56ffbc]/40"
      case "Finished":
        return "bg-white/10 text-gray-400 border border-white/20"
      default:
        return "bg-gray-500 text-white"
    }
  }


  return (
    <section
      className="py-16 relative overflow-hidden"
      style={{
        backgroundColor: "#07073a",
        backgroundImage:
          "radial-gradient(circle at 80% 10%, rgba(86,255,188,0.12) 0%, transparent 60%), " +
          "linear-gradient(#11113D, #07073a), " +
          "linear-gradient(rgba(86,255,188,0.05) 1px, transparent 1px), " +
          "linear-gradient(to right, rgba(86,255,188,0.05) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px",
      }}
    >
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{background: `radial-gradient(circle at 80% 10%, rgba(86,255,188,0.18) 0%, transparent 60%)`}}></div>
      <div className="container mx-auto max-w-7xl px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold text-[#56ffbc] mb-4 drop-shadow-[0_2px_8px_rgba(86,255,188,0.15)]">Competition Events</h2>
            <p className="text-lg text-gray-200 max-w-2xl">
              Join our exciting events to showcase your prompt engineering skills.
            </p>
          </div>

          {/* Animated Scroll Buttons */}
          {isScrollable && (
            <div className="flex justify-center md:justify-end gap-3">
              <motion.button
                onClick={() => handleScroll("left")}
                disabled={isAtStart}
                className="w-12 h-12 rounded-full bg-[#56ffbc] border border-[#56ffbc] text-[#07073a] flex items-center justify-center shadow-[0_0_12px_2px_rgba(86,255,188,0.25)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#56ffbc]/90 hover:scale-110 transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft size={24} />
              </motion.button>
              <motion.button
                onClick={() => handleScroll("right")}
                disabled={isAtEnd}
                className="w-12 h-12 rounded-full bg-[#56ffbc] border border-[#56ffbc] text-[#07073a] flex items-center justify-center shadow-[0_0_12px_2px_rgba(86,255,188,0.25)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#56ffbc]/90 hover:scale-110 transition"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight size={24} />
              </motion.button>
            </div>
          )}
        </div>
        {/* Horizontal Scroll Container */}
        <div ref={scrollContainerRef} className="flex overflow-x-auto gap-8 pb-8 scrollbar-hide">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              className="w-[90vw] md:w-[450px] flex-shrink-0"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border border-[#56ffbc]/40 rounded-2xl h-full flex flex-col group transition-all duration-300 hover:border-[#56ffbc] hover:shadow-[0_0_32px_4px_rgba(86,255,188,0.25)] hover:scale-[1.03] shadow-[0_2px_16px_0_rgba(86,255,188,0.08)]">
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <CardTitle className="text-2xl text-[#56ffbc] group-hover:text-white transition-colors drop-shadow-[0_2px_8px_rgba(86,255,188,0.15)]">
                      {event.title}
                    </CardTitle>
                    <Badge className={getStatusBadge(event.status)}>{event.status}</Badge>
                  </div>
                  <CardDescription className="text-gray-200 text-base">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="grid grid-cols-2 gap-4 mb-6 text-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#56ffbc]" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#56ffbc]" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#56ffbc]" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-[#56ffbc]" />
                      <span>{event.prize}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-sm text-gray-400">{event.participants.toLocaleString()} participants</span>
                    {event.status === "Active" && (
                      <Badge className="bg-[#56ffbc] text-[#07073a] hover:bg-white cursor-pointer px-4 py-2 font-bold border border-[#56ffbc] shadow-[0_0_8px_2px_rgba(86,255,188,0.25)]">
                        Join Now
                      </Badge>
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
    console.log("HomePage: Rendering loading spinner")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  console.log("HomePage: User is", user ? "logged in" : "not logged in", ". Rendering landing page content.")

  return (
    <>
      <StructuredData />
      <div className="flex min-h-screen flex-col">
        <Navbar />

        {/* Hero Section */}
        <section
          id="hero"
          className="relative overflow-hidden min-h-screen flex items-center justify-center overflow-hidden"
        >
          <video
            className="absolute inset-0 w-full h-full object-cover z-[-2] opacity-70"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="https://cocoon.ae/wp-content/uploads/2024/10/gradient-template-kit.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <CssGridBackground />
          <FramerSpotlight />
          <div className="container px-4 md:px-6 py-16 md:py-20 relative z-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="inline-block rounded-lg bg-[#56ffbc]/20 px-3 py-1 text-sm mb-6 text-[#56ffbc] font-medium">
                Prompt Engineering Competition
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-6 text-white">
                All Pakistan Prompt Engineering Competition
              </h1>
              <p className="text-xl text-gray-300 md:text-2xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-2xl mb-12">
                Join the nation's premier competition for prompt engineering excellence. Showcase your skills, compete
                with the best, and shape the future of AI interaction.
              </p>
              <TypingPromptInput />
              <div className="flex flex-wrap justify-center gap-3 mt-16">
                {user ? (
                  <Button
                    className="flex items-center gap-3 px-5 py-6 h-[60px] bg-[#56ffbc] hover:bg-[#56ffbc]/90 text-[#07073a] rounded-xl border-0 relative overflow-hidden group"
                    asChild
                  >
                    <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                      <User className="h-5 w-5 text-[#07073a] relative z-10" />
                      <div className="flex flex-col items-start relative z-10">
                        <span className="text-[15px] font-medium">Go to Dashboard</span>
                      </div>
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      className="px-5 py-6 h-[60px] rounded-xl border-2 border-[#56ffbc]/50 bg-transparent hover:bg-[#56ffbc]/10 text-[15px] font-medium text-[#56ffbc]"
                      asChild
                    >
                      <Link href="/auth/login/admin">
                        <Shield className="h-5 w-5 text-[#56ffbc] mr-2" />
                        <span>Admin Login</span>
                      </Link>
                    </Button>
                    <Button
                      className="px-5 py-6 h-[60px] rounded-xl border-2 border-[#56ffbc]/50 dark:border-[#56ffbc]/50 bg-transparent hover:bg-[#56ffbc]/10 text-[15px] font-medium text-[#56ffbc]"
                      asChild
                    >
                      <Link href="/auth/login">
                        <User className="h-5 w-5 mr-2" />
                        Participant Login
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* --- FEATURES + HOW IT WORKS --- */}
        <section
          className="py-20 bg-[#11113D]"
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #1a1a5a, #11113D 70%)" }}
        >
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
              {/* Card with enhanced styling and hover effects */}
              <Card className="bg-white/5 backdrop-blur-lg rounded-xl border border-[#56ffbc]/20 text-white transition-all duration-300 hover:border-[#56ffbc]/60 hover:shadow-[0_0_20px_rgba(86,255,188,0.2)] hover:-translate-y-2">
                <CardHeader className="text-center">
                  <Trophy className="h-12 w-12 text-[#56ffbc] mx-auto mb-3" />
                  <CardTitle className="text-xl">National Recognition</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Compete at the national level and gain recognition for your prompt engineering skills.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-lg rounded-xl border border-[#56ffbc]/20 text-white transition-all duration-300 hover:border-[#56ffbc]/60 hover:shadow-[0_0_20px_rgba(86,255,188,0.2)] hover:-translate-y-2">
                <CardHeader className="text-center">
                  <Users className="h-12 w-12 text-[#56ffbc] mx-auto mb-3" />
                  <CardTitle className="text-xl">Expert Evaluation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Your submissions are evaluated by advanced LLMs and expert human reviewers.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-lg rounded-xl border border-[#56ffbc]/20 text-white transition-all duration-300 hover:border-[#56ffbc]/60 hover:shadow-[0_0_20px_rgba(86,255,188,0.2)] hover:-translate-y-2">
                <CardHeader className="text-center">
                  <Award className="h-12 w-12 text-[#56ffbc] mx-auto mb-3" />
                  <CardTitle className="text-xl">Prestigious Awards</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Win certificates, prizes, and recognition from leading AI organizations.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-lg rounded-xl border border-[#56ffbc]/20 text-white transition-all duration-300 hover:border-[#56ffbc]/60 hover:shadow-[0_0_20px_rgba(86,255,188,0.2)] hover:-translate-y-2">
                <CardHeader className="text-center">
                  <Target className="h-12 w-12 text-[#56ffbc] mx-auto mb-3" />
                  <CardTitle className="text-xl">Skill Development</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300">
                    Enhance your prompt engineering abilities through challenging real-world problems.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="relative bg-black/20 backdrop-blur-xl rounded-2xl shadow-lg p-8 border border-[#56ffbc]/30 overflow-hidden">
              {/* Enhanced animated gradient */}
              <motion.div
                className="absolute inset-[-100px] z-0 opacity-20"
                animate={{
                  transform: ["rotate(0deg)", "rotate(360deg)"],
                }}
                transition={{
                  duration: 30,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                style={{
                  background: `conic-gradient(from 0deg, transparent 50%, #56FFBC 100%)`,
                }}
              />
              <div className="relative z-10">
                <h2 className="text-4xl font-bold text-center text-white mb-12">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Step with hover effect */}
                  <div className="text-center group">
                    <div className="bg-[#56ffbc]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border-2 border-transparent transition-all duration-300 group-hover:border-[#56ffbc]/50 group-hover:bg-[#56ffbc]/20">
                      <span className="text-3xl font-bold text-[#56ffbc]">1</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Register & Login</h3>
                    <p className="text-gray-300">Create your account and access the competition platform.</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-[#56ffbc]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border-2 border-transparent transition-all duration-300 group-hover:border-[#56ffbc]/50 group-hover:bg-[#56ffbc]/20">
                      <span className="text-3xl font-bold text-[#56ffbc]">2</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Submit Your Prompt</h3>
                    <p className="text-gray-300">Craft and submit your prompt with the LLM-generated output.</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-[#56ffbc]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border-2 border-transparent transition-all duration-300 group-hover:border-[#56ffbc]/50 group-hover:bg-[#56ffbc]/20">
                      <span className="text-3xl font-bold text-[#56ffbc]">3</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Get Evaluated</h3>
                    <p className="text-gray-300">Receive automated scoring and potential expert review.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- EVENTS SECTION --- */}
        <section id="events">
          <CompetitionEventsSection />
        </section>

        {/* --- CONTACT US SECTION --- */}
        <section id="contact" className="relative py-8 px-4 bg-gradient-to-br from-[#07073a] to-[#0a0a4a] overflow-hidden">
          {/* Animated Gradient Background */}
          <motion.div
            className="absolute inset-0 z-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            style={{
              background:
                "radial-gradient(circle at 80% 10%, rgba(86,255,188,0.18) 0%, transparent 60%), " +
                "radial-gradient(circle at 20% 80%, rgba(86,255,188,0.10) 0%, transparent 60%)",
            }}
            transition={{ duration: 2 }}
          />
          <div className="container mx-auto max-w-6xl relative z-10">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Have questions about the competition? We're here to help!
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <Card className="bg-[rgba(7,7,58,0.95)] bg-gradient-to-br from-[#07073a] via-[#10104a] to-[#1a1a5a] border-2 border-[#56ffbc] shadow-2xl hover:shadow-[0_0_32px_8px_rgba(86,255,188,0.18)] transition-shadow duration-500 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">Get in Touch</CardTitle>
                    <CardDescription className="text-gray-300">
                      Reach out to us through any of the following channels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <motion.div className="flex items-start gap-4" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}>
                      <Mail className="h-6 w-6 text-[#56ffbc] mt-1 flex-shrink-0 animate-pulse" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Email</h3>
                        <p className="text-gray-300">info@promptcompetition.pk</p>
                        <p className="text-gray-300">support@promptcompetition.pk</p>
                      </div>
                    </motion.div>

                    <motion.div className="flex items-start gap-4" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}>
                      <Phone className="h-6 w-6 text-[#56ffbc] mt-1 flex-shrink-0 animate-pulse" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Phone</h3>
                        <p className="text-gray-300">+92 21 1234 5678</p>
                        <p className="text-gray-300">+92 42 8765 4321</p>
                      </div>
                    </motion.div>

                    <motion.div className="flex items-start gap-4" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }}>
                      <MapPin className="h-6 w-6 text-[#56ffbc] mt-1 flex-shrink-0 animate-pulse" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Address</h3>
                        <p className="text-gray-300">
                          National Incubation Center
                          <br />
                          Lahore University of Management Sciences
                          <br />
                          Lahore, Punjab, Pakistan
                        </p>
                      </div>
                    </motion.div>

                    <motion.div className="flex items-start gap-4" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }}>
                      <Clock className="h-6 w-6 text-[#56ffbc] mt-1 flex-shrink-0 animate-pulse" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Support Hours</h3>
                        <p className="text-gray-300">Monday - Friday: 9:00 AM - 6:00 PM PKT</p>
                        <p className="text-gray-300">Saturday: 10:00 AM - 4:00 PM PKT</p>
                        <p className="text-gray-300">Sunday: Closed</p>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                <div className="bg-white/5 backdrop-blur-sm border border-[#56ffbc]/20 rounded-lg p-1 shadow-lg hover:shadow-[0_0_32px_4px_rgba(86,255,188,0.15)] transition-shadow duration-500">
                  <ContactForm />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
