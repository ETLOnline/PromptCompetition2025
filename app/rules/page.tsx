import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Users, FileText, Scale, Calendar } from "lucide-react"

export default function RulesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <main className="flex-grow">
        <section className="py-24 px-4">
          <div className="container mx-auto p-6 space-y-8">
            <div className="text-center mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">
                Competition Rules & Guidelines
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
                Please read and understand all rules before participating in any competition
              </p>
            </div>
            <div className="space-y-8">
              {/* General Eligibility */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                    General Eligibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm sm:text-base text-muted-foreground">Open to students across Pakistan</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm sm:text-base text-muted-foreground">Participants must create original work. No copy-pasting or direct reliance on AI-generated content</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm sm:text-base text-muted-foreground">Must follow prompt ethics, including creativity, neutrality, and authenticity</p>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-700 mb-3">Requirements:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Submit a Visual Interpretation Narrative (VIN)</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Provide a final prompt</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Provide a Translation Rationale (explaining how VIN led to the final prompt)</p>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-700 mb-3">Availability:</h4>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Top 20 participants must be available for live Zoom sessions for Level 2</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Ability to join online sessions and share screen for real-time prompt building</p>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Guidelines */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                    Submission Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <p className="text-sm sm:text-base text-emerald-700 font-medium">Each participant must submit 3 complete sets of the following (for 3 challenges)</p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-700">Components per challenge:</h4>
                    
                    <div className="space-y-2">
                      <h5 className="text-xs sm:text-sm font-medium text-emerald-600">Visual Interpretation Narrative (VIN)</h5>
                      <ul className="space-y-1 ml-6">
                        <li className="text-muted-foreground text-xs sm:text-sm">• 50–100 words</li>
                        <li className="text-muted-foreground text-xs sm:text-sm">• A written interpretation of the provided image</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs sm:text-sm font-medium text-emerald-600">Final Version of the Prompt</h5>
                      <ul className="space-y-1 ml-6">
                        <li className="text-muted-foreground text-xs sm:text-sm">• Clear, ethical, structured, reusable</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-xs sm:text-sm font-medium text-emerald-600">Translation Rationale</h5>
                      <ul className="space-y-1 ml-6">
                        <li className="text-muted-foreground text-xs sm:text-sm">• The "show your work" step</li>
                        <li className="text-muted-foreground text-xs sm:text-sm">• Explains how the VIN connects to the final prompt</li>
                        <li className="text-muted-foreground text-xs sm:text-sm">• Demonstrates reasoning and thought process</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-700">Originality Requirements:</h4>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm sm:text-base text-muted-foreground">Must follow ethical prompt creation practices</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm sm:text-base text-muted-foreground">No direct copy-paste from AI tools</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm sm:text-base text-muted-foreground">AI can be used for brainstorming, but the work must be the participant's own reasoning</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm sm:text-base text-muted-foreground">Creativity, clarity, neutrality, and structure are expected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Evaluation Process */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-foreground flex items-center gap-2">
                    <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                    Evaluation Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold text-emerald-600">Level 1 — Online Judging</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Submissions evaluated by a multi-LLM automated system
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">AI evaluates based on:</p>
                      <ul className="space-y-1 ml-6">
                        <li className="text-sm sm:text-base text-muted-foreground">• Clarity</li>
                        <li className="text-sm sm:text-base text-muted-foreground">• Structure</li>
                        <li className="text-sm sm:text-base text-muted-foreground">• Creativity</li>
                        <li className="text-sm sm:text-base text-muted-foreground">• Neutrality</li>
                      </ul>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      AI flags suspicious entries for human review
                    </p>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      <p className="text-emerald-700 font-medium text-xs sm:text-sm">✓ Top 20 scorers move to Level 2</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h3 className="text-base sm:text-lg font-semibold text-emerald-600">Level 2 — Live Judging on Zoom</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">Participants must:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Join a live session</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Receive a new prompt challenge</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Share screen and build the prompt in real time</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Explain their reasoning and process</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Answer judge questions</p>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h3 className="text-base sm:text-lg font-semibold text-emerald-600">Evaluation Criteria</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Reusability & Clarity</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Creativity & Originality</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Bias & Neutrality Awareness</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Iteration Depth (Process Quality)</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm sm:text-base text-muted-foreground">Authenticity (Low AI Reliance)</p>
                      </li>
                    </ul>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 mt-3">
                      <p className="text-emerald-700 font-medium text-xs sm:text-sm">🏆 Judges then finalize top performers and select the Top 5 winners</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline & Deadlines */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                    Timeline & Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base text-foreground font-medium">Marketing & Training Campaigns</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">1st Dec – 16th Jan</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base text-foreground font-medium">Level 1 Competition Date</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Saturday, 17th January</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base text-foreground font-medium">Level 2 Competition Dates</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">18th January – 25th January (Daily live sessions)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm sm:text-base text-foreground font-medium">Winners Announcement</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">28th January</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                    <p className="text-xs sm:text-sm text-blue-700 font-medium">📅 Mark your calendars and prepare to showcase your prompt engineering skills!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}