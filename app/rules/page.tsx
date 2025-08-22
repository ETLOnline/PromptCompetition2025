import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Clock, Users, Trophy, Award } from "lucide-react"

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
                Please read and understand all rules before participating in any competition
              </p>
            </div>
            <div className="space-y-8">
              {/* General Eligibility */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Users className="h-6 w-6 text-emerald-500" />
                    General Eligibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Open to participants worldwide unless specified otherwise</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Age requirements vary by competition (will be specified in each competition)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Individual participation only (no team submissions unless specified)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Valid email address and account registration required</p>
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
                      Submit both your crafted prompts
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">
                      Prompts must be original and created specifically for the competition
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Maximum one submission per participant per challenge</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Submissions can be updated until the competition deadline</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">All submissions must be in English unless specified otherwise</p>
                  </div>
                </CardContent>
              </Card>

              {/* Evaluation Process */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Award className="h-6 w-6 text-emerald-500" />
                    Evaluation Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-emerald-600">Automated Evaluation</h3>
                    <p className="text-muted-foreground">
                      All submissions are evaluated by multiple AI models for initial scoring and consistency checks
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-emerald-600">Expert Review</h3>
                    <p className="text-muted-foreground">
                      High-scoring submissions are reviewed by expert judges for final ranking
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
                    <p className="text-sm text-muted-foreground italic">
                      Note: Specific scoring criteria may vary by competition type
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline & Deadlines */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Clock className="h-6 w-6 text-slate-500" />
                    Timeline & Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Registration</p>
                      <p className="text-muted-foreground">Registration opens when competition is announced and closes at the submission deadline</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Submission Period</p>
                      <p className="text-muted-foreground">Specific dates and times will be clearly stated for each competition</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">Results Announcement</p>
                      <p className="text-muted-foreground">Results typically announced within 1-2 weeks after submission deadline</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-blue-700 font-medium">⏰ All times are in UTC unless specified otherwise</p>
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
                    <p className="text-muted-foreground">Collaboration with other participants (unless team competition)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Using automated tools to generate prompts</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Submitting inappropriate, offensive, or harmful content</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Creating multiple accounts or fake registrations</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Attempting to manipulate the evaluation system</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-red-700 font-medium">⚠️ Violation of any rule may result in immediate disqualification</p>
                  </div>
                </CardContent>
              </Card>

              {/* Prizes and Recognition */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Prizes & Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                    <h3 className="text-lg font-semibold text-yellow-700 mb-2">Prize Structure</h3>
                    <p className="text-muted-foreground">
                      Prize amounts and rewards vary by competition and will be clearly specified in each competition announcement.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <h4 className="font-semibold text-emerald-700 mb-2">Recognition</h4>
                      <ul className="space-y-1 text-muted-foreground text-sm">
                        <li>• Digital certificates for winners</li>
                        <li>• Public recognition on our platform</li>
                        <li>• Featured showcase of winning submissions</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-700 mb-2">Additional Benefits</h4>
                      <ul className="space-y-1 text-muted-foreground text-sm">
                        <li>• Portfolio enhancement opportunities</li>
                        <li>• Access to exclusive competitions</li>
                        <li>• Community recognition and networking</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fair Play & Integrity */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center gap-2">
                    <Badge variant="outline" className="text-slate-700 border-slate-300">
                      Fair Play & Integrity
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">We maintain a zero-tolerance policy for cheating and misconduct</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">All submissions are checked for originality and authenticity</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">Decisions made by the judging panel are final</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">We reserve the right to modify rules with appropriate notice</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Support */}
              <Card className="bg-white border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground">
                    Questions or Concerns?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about these rules or need clarification about a specific competition, please don't hesitate to contact our support team.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm text-muted-foreground">
                      Competition-specific details (dates, prizes, requirements) will be provided in each individual competition announcement.
                    </p>
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