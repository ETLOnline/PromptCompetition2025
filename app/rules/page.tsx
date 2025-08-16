import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Clock, Users } from "lucide-react"

export default function RulesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <main className="flex-grow">
        <section className="py-16 px-4">
          <div className="container mx-auto p-6 space-y-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">
                Competition Rules & Guidelines
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Please read and understand all rules before participating in the competition
              </p>
            </div>
            <div className="space-y-8">
              {/* Eligibility */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Users className="h-6 w-6 text-emerald-500" />
                    Eligibility Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Must be a Pakistani citizen or resident</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Age limit: 16-35 years</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Must be enrolled in or graduated from a recognized educational institution
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Individual participation only (no team submissions)</p>
                  </div>
                </CardContent>
              </Card>
              {/* Submission Guidelines */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                    Submission Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Submit both your crafted prompt and the LLM-generated output
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Prompt must be original and created specifically for this competition
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Output must be generated using GPT-4, Claude-3, or Gemini-Pro
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Maximum one submission per participant per competition</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Submissions can be updated until the deadline</p>
                  </div>
                </CardContent>
              </Card>
              {/* Evaluation Process */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      Evaluation Process
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-emerald-600">Phase 1: Automated Evaluation</h3>
                    <p className="text-muted-foreground">
                      All submissions are evaluated by multiple AI models for initial scoring
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-emerald-600">Phase 2: Expert Review</h3>
                    <p className="text-muted-foreground">
                      Top-scoring submissions (85+ points) are flagged for manual review by expert judges
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-emerald-600">Scoring Criteria</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Creativity and Innovation (25%)</li>
                      <li>• Technical Accuracy (25%)</li>
                      <li>• Problem-Solving Effectiveness (25%)</li>
                      <li>• Output Quality and Relevance (25%)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              {/* Important Deadlines */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Clock className="h-6 w-6 text-slate-500" />
                    Important Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Registration Deadline</p>
                      <p className="text-muted-foreground">March 10, 2024 at 11:59 PM PKT</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Submission Deadline</p>
                      <p className="text-muted-foreground">March 15, 2024 at 11:59 PM PKT</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Results Announcement</p>
                      <p className="text-muted-foreground">March 25, 2024</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Prohibited Actions */}
              <Card className="bg-white border-red-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                    Prohibited Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Plagiarism or copying prompts from other sources</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Collaboration with other participants</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Using automated tools to generate prompts</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Submitting inappropriate or offensive content</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Multiple accounts or fake registrations</p>
                  </div>
                </CardContent>
              </Card>
              {/* Prizes and Recognition */}
              {/* <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Badge variant="outline" className="text-slate-700 border-slate-300">
                      Prizes & Recognition
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
                      <h3 className="text-xl font-bold text-yellow-700 mb-2">1st Place</h3>
                      <p className="text-2xl font-bold text-foreground">PKR 200,000</p>
                      <p className="text-sm text-muted-foreground">+ Certificate + Trophy</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                      <h3 className="text-xl font-bold text-slate-700 mb-2">2nd Place</h3>
                      <p className="text-2xl font-bold text-foreground">PKR 150,000</p>
                      <p className="text-sm text-muted-foreground">+ Certificate + Trophy</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200 shadow-sm">
                      <h3 className="text-xl font-bold text-orange-700 mb-2">3rd Place</h3>
                      <p className="text-2xl font-bold text-foreground">PKR 100,000</p>
                      <p className="text-sm text-muted-foreground">+ Certificate + Trophy</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-center mt-4">
                    Top 10 participants will receive certificates of excellence
                  </p>
                </CardContent>
              </Card> */}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
