import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users, Award, Lightbulb, Globe, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
            <main className="flex-grow">
              <section className="py-24 px-4">
                <div className="container mx-auto p-6 space-y-8">
                  <div className="text-center mb-12">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">
                About Our Platform
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
                Nurturing the next generation of AI talent through prompt engineering excellence among Pakistani students
              </p>
            </div>
            <div className="space-y-8">
              {/* Mission */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                    We aim to identify, nurture, and celebrate the most talented prompt engineering students across Pakistan. 
                    Our platform provides a competitive environment where creativity meets technical excellence, 
                    fostering innovation in the critical field of human-AI interaction through expertly crafted prompts and visual interpretation skills.
                  </p>
                </CardContent>
              </Card>

              {/* Vision */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                    To create a vibrant community of prompt engineering excellence among students in Pakistan, where talented individuals 
                    can showcase their skills, learn from each other, and push the boundaries of what's possible 
                    in AI communication. We envision a future where effective human-AI collaboration drives 
                    innovation and prepares the next generation for AI-integrated careers.
                  </p>
                </CardContent>
              </Card>

              {/* Why Prompt Engineering Matters */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Why Prompt Engineering Matters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    In the age of artificial intelligence, the ability to communicate effectively with AI systems has
                    become a crucial skill. Prompt engineering is the art and science of crafting instructions that
                    guide AI models to produce desired outputs with precision and creativity.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-3">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-700 flex items-center gap-2">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                        Productivity Boost
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Skilled prompt engineers can increase AI productivity by 300-500%, making them invaluable 
                        assets in the modern workforce.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-700 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        Innovation Driver
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Creative prompting unlocks new AI capabilities and applications across diverse industries 
                        and use cases.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-700 flex items-center gap-2">
                        <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        Universal Accessibility
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Well-crafted prompts make AI tools accessible to non-technical users, democratizing 
                        AI benefits worldwide.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-700 flex items-center gap-2">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                        Quality Assurance
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Expert prompting ensures AI outputs are accurate, relevant, and aligned with human values 
                        and expectations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Features */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    What We Offer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-700">Visual Interpretation Challenges</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Unique competitions that test your ability to interpret visual content and translate insights 
                        into effective prompts through Visual Interpretation Narratives (VIN).
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-700">Two-Level Evaluation</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Multi-LLM automated evaluation for initial screening, followed by live Zoom sessions 
                        for top 20 participants with real-time prompt building and expert judging.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-700">Student Community</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Connect with talented prompt engineering students from across Pakistan, share knowledge, 
                        and learn from peers in an academic-focused environment.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-700">Recognition & Rewards</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Win prizes, earn certificates, and gain recognition for your prompt engineering skills, 
                        creativity, and analytical thinking abilities.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competition Format */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Competition Format
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="text-base sm:text-lg font-semibold text-blue-700 mb-2">Visual Interpretation Narrative (VIN)</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Create a 50-100 word written interpretation of provided images, demonstrating your analytical and creative thinking skills.
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="text-base sm:text-lg font-semibold text-green-700 mb-2">Final Prompt Creation</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Develop clear, ethical, structured, and reusable prompts based on your visual interpretation and understanding.
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h3 className="text-base sm:text-lg font-semibold text-purple-700 mb-2">Translation Rationale</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Explain your reasoning process - how your VIN connects to your final prompt, demonstrating your thought process and methodology.
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="text-base sm:text-lg font-semibold text-orange-700 mb-2">Live Evaluation (Top 20)</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Top performers participate in live Zoom sessions with real-time prompt building, screen sharing, and direct interaction with judges.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Who Can Participate */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
                    Who Can Participate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
                    Our competition is exclusively open to students across Pakistan. This focused approach allows us to 
                    nurture the next generation of AI talent and provide targeted educational opportunities in prompt engineering.
                  </p>
                  <div className="space-y-4">
                    <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                      <h3 className="text-lg sm:text-xl font-bold text-emerald-700 mb-3">📚 Students in Pakistan</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        Open to all students currently enrolled in educational institutions across Pakistan
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="text-sm sm:text-base font-semibold text-slate-700">Requirements:</h4>
                          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                            <li>• Must create original work</li>
                            <li>• Follow ethical prompt practices</li>
                            <li>• Available for live Zoom sessions (if top 20)</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm sm:text-base font-semibold text-slate-700">Benefits:</h4>
                          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                            <li>• Learn cutting-edge AI skills</li>
                            <li>• Build your portfolio</li>
                            <li>• Win prizes and recognition</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Future Plans */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Future Developments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                    We're continuously evolving our competition platform to provide better experiences and learning 
                    opportunities for Pakistani students. Here's what's coming in future editions:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm sm:text-base text-muted-foreground">Enhanced multi-LLM evaluation models for more nuanced VIN scoring</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm sm:text-base text-muted-foreground">Interactive prompt engineering workshops and training sessions</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm sm:text-base text-muted-foreground">Mentorship programs connecting top performers with industry experts</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm sm:text-base text-muted-foreground">University partnerships for academic integration and recognition</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm sm:text-base text-muted-foreground">Mobile app for easier participation and real-time updates</p>
                    </div>
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