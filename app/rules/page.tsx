import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Clock, Users } from "lucide-react"

export default function RulesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#07073a] to-[#0a0a4a]">
      <Navbar />

      <main className="flex-grow">
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Competition Rules & Guidelines</h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Please read and understand all rules before participating in the competition
              </p>
            </div>

            <div className="space-y-8">
              {/* Eligibility */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Users className="h-6 w-6 text-[#56ffbc]" />
                    Eligibility Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Must be a Pakistani citizen or resident</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Age limit: 16-35 years</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">
                      Must be enrolled in or graduated from a recognized educational institution
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Individual participation only (no team submissions)</p>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Guidelines */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-[#56ffbc]" />
                    Submission Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Submit both your crafted prompt and the LLM-generated output</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">
                      Prompt must be original and created specifically for this competition
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Output must be generated using GPT-4, Claude-3, or Gemini-Pro</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Maximum one submission per participant per competition</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Submissions can be updated until the deadline</p>
                  </div>
                </CardContent>
              </Card>

              {/* Evaluation Process */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Badge className="bg-[#56ffbc] text-[#07073a]">Evaluation Process</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[#56ffbc]">Phase 1: Automated Evaluation</h3>
                    <p className="text-gray-300">
                      All submissions are evaluated by multiple AI models for initial scoring
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[#56ffbc]">Phase 2: Expert Review</h3>
                    <p className="text-gray-300">
                      Top-scoring submissions (85+ points) are flagged for manual review by expert judges
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[#56ffbc]">Scoring Criteria</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li>• Creativity and Innovation (25%)</li>
                      <li>• Technical Accuracy (25%)</li>
                      <li>• Problem-Solving Effectiveness (25%)</li>
                      <li>• Output Quality and Relevance (25%)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Important Deadlines */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Clock className="h-6 w-6 text-[#56ffbc]" />
                    Important Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Registration Deadline</p>
                      <p className="text-gray-300">March 10, 2024 at 11:59 PM PKT</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Submission Deadline</p>
                      <p className="text-gray-300">March 15, 2024 at 11:59 PM PKT</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-[#56ffbc] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Results Announcement</p>
                      <p className="text-gray-300">March 25, 2024</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prohibited Actions */}
              <Card className="bg-white/10 backdrop-blur-sm border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                    Prohibited Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Plagiarism or copying prompts from other sources</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Collaboration with other participants</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Using automated tools to generate prompts</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Submitting inappropriate or offensive content</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">Multiple accounts or fake registrations</p>
                  </div>
                </CardContent>
              </Card>

              {/* Prizes and Recognition */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Badge className="bg-yellow-500 text-black">Prizes & Recognition</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <h3 className="text-xl font-bold text-yellow-400 mb-2">1st Place</h3>
                      <p className="text-2xl font-bold text-white">PKR 200,000</p>
                      <p className="text-sm text-gray-300">+ Certificate + Trophy</p>
                    </div>
                    <div className="text-center p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
                      <h3 className="text-xl font-bold text-gray-400 mb-2">2nd Place</h3>
                      <p className="text-2xl font-bold text-white">PKR 150,000</p>
                      <p className="text-sm text-gray-300">+ Certificate + Trophy</p>
                    </div>
                    <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <h3 className="text-xl font-bold text-orange-400 mb-2">3rd Place</h3>
                      <p className="text-2xl font-bold text-white">PKR 100,000</p>
                      <p className="text-sm text-gray-300">+ Certificate + Trophy</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-center mt-4">
                    Top 10 participants will receive certificates of excellence
                  </p>
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
