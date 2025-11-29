"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import  Navbar  from '@/components/navbar'
import Footer  from '@/components/footer'
import { PlayCircle, BookOpen, ExternalLink, ChevronRight } from 'lucide-react'

interface Resource {
  category: string
  title: string
  subtitle?: string
  description?: string
  url: string
  tag: string
  tagColor: string
}

const resources: Resource[] = [
  {
    category: "APPEC Tutorial & Video Guides",
    title: "1. APPEC Tutorial",
    subtitle: "Competition Guide",
    url: "https://youtube.com/playlist?list=PLqGws5awKyhhq9QMwR5wYJBNSNjZaxTmt",
    tag: "Essential for Participants",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    category: "APPEC Tutorial & Video Guides",
    title: "2. The ULTIMATE 2025 Guide",
    subtitle: "Master the Formula",
    url: "https://www.youtube.com/watch?v=bIxbpIwYTXI",
    tag: "Beginner Foundation",
    tagColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    category: "APPEC Tutorial & Video Guides",
    title: "3. The ADVANCED 2025 Guide",
    subtitle: "21 Transformative Prompts",
    url: "https://www.youtube.com/watch?v=qBlX6FhDm2E",
    tag: "Advanced Strategy",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    category: "APPEC Tutorial & Video Guides",
    title: "4. Best AI Prompt Techniques",
    subtitle: "High-Leverage Methods",
    url: "https://www.youtube.com/watch?v=GTjACKMujwA",
    tag: "Competitive Edge",
    tagColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    category: "APPEC Tutorial & Video Guides",
    title: "5. What Works & What Doesn't",
    subtitle: "2025 Overview",
    url: "https://www.youtube.com/watch?v=eKuFqQKYRrA",
    tag: "Best Practices",
    tagColor: "bg-slate-50 text-slate-700 border-slate-200"
  },
  {
    category: "Articles & Documentation",
    title: "OpenAI – Prompt Engineering",
    description: "Official authoritative guide on practical rules for LLMs.",
    url: "https://platform.openai.com/docs/guides/prompt-engineering",
    tag: "Official Guide",
    tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    category: "Articles & Documentation",
    title: "Braintrust – Best Practices",
    description: "Data-driven optimization and systematic methods.",
    url: "https://www.braintrust.dev/articles/systematic-prompt-engineering",
    tag: "Optimization",
    tagColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    category: "Articles & Documentation",
    title: "CodeSignal – 2025 Practices",
    description: "Breakdown of chain-of-thought and few-shot prompting.",
    url: "https://www.codesignal.com/blog/prompt-engineering-best-practices-2025/",
    tag: "Practical Checklist",
    tagColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    category: "Articles & Documentation",
    title: "Lakera – Ultimate Guide",
    description: "Broad coverage from basics to model-specific nuances.",
    url: "https://www.lakera.ai/blog/prompt-engineering-guide",
    tag: "Deep Dive",
    tagColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    category: "Articles & Documentation",
    title: "MIT Sloan – Effective Prompts",
    description: "Business context, limitations, and strategy.",
    url: "https://mitsloanedtech.mit.edu/ai/basics/effective-prompts/",
    tag: "Business Context",
    tagColor: "bg-slate-50 text-slate-700 border-slate-200"
  }
]

const TutorialsPage: React.FC = () => {
  const categories = Array.from(new Set(resources.map(r => r.category)))

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-screen flex items-center justify-center bg-white">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-100/20 to-blue-100/20 rounded-full blur-3xl" />
          <div className="container mx-auto p-6 py-8 md:py-16 relative z-10">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent leading-tight pb-2"
              >
                APPEC Learning Resources
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl sm:text-2xl md:text-3xl text-muted-foreground"
              >
                Master the Art of Prompt Engineering
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-4xl leading-relaxed px-4"
              >
                Thank you for registering! To help you prepare and perform your best, we've compiled powerful learning resources, from beginner to advanced, covering the latest techniques in prompt design, optimization, and strategy.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Resources Sections */}
        {categories.map((category, categoryIndex) => (
          <section key={category} className="py-20 bg-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-gray-50/30" />
            <div className="container mx-auto p-6 space-y-8 relative">
              <div className="text-center space-y-4 mb-16">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-lg sm:rounded-xl px-2.5 py-1 sm:px-4 sm:py-2 mb-4">
                  {category === "APPEC Tutorial & Video Guides" ? (
                    <PlayCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  ) : (
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  )}
                  <span className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">{category}</span>
                </div>
                <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-6">
                  {category}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {resources.filter(r => r.category === category).map((resource, index) => (
                  <motion.div
                    key={resource.title}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="bg-white shadow-lg rounded-xl h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden group">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-slate-600/5" />
                      </div>
                      <CardHeader className="p-4 sm:p-6 md:p-8 pt-0 mt-auto space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                            category === "APPEC Tutorial & Video Guides" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                          }`}>
                            {category === "APPEC Tutorial & Video Guides" ? (
                              <PlayCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                            ) : (
                              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                            )}
                          </div>
                          <Badge className={`${resource.tagColor} border`}>
                            {resource.tag}
                          </Badge>
                        </div>
                        <div>
                          <CardTitle className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                            {resource.title}
                          </CardTitle>
                          {resource.subtitle && (
                            <p className="text-sm text-muted-foreground mt-1">{resource.subtitle}</p>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 md:p-8 pt-0 space-y-4 sm:space-y-6">
                        {resource.description && (
                          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                            {resource.description}
                          </CardDescription>
                        )}
                        <Button
                          asChild
                          className="w-full bg-[#0f172a] hover:bg-slate-800 text-white flex items-center justify-center gap-2"
                        >
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            View Resource
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Next Steps CTA Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-amber-100/30 to-yellow-100/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-4 px-4">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent leading-tight"
              >
                Stay Updated
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed"
              >
                Follow us on LinkedIn for the latest competition timelines.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Button asChild className="bg-[#0f172a] hover:bg-slate-800 text-white px-6 py-3 flex items-center gap-2">
                  <a href="https://www.linkedin.com/company/etlonline" target="_blank" rel="noopener noreferrer">
                    Follow on LinkedIn
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}

export default TutorialsPage