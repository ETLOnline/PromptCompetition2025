import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users, Award, Lightbulb, Globe, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <main className="flex-grow">
        <section className="py-16 px-4">
          <div className="container mx-auto p-6 max-w-4xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                About Our Platform
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Empowering the next generation of AI innovators through prompt engineering excellence
              </p>
            </div>
            <div className="space-y-8">
              {/* Mission */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    <Target className="h-6 w-6 text-slate-700" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    We aim to identify, nurture, and celebrate the most talented prompt engineers worldwide. 
                    Our platform provides a competitive environment where creativity meets technical excellence, 
                    fostering innovation in the critical field of human-AI interaction through expertly crafted prompts.
                  </p>
                </CardContent>
              </Card>

              {/* Vision */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    <Lightbulb className="h-6 w-6 text-slate-700" />
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    To create a global community of prompt engineering excellence, where talented individuals 
                    can showcase their skills, learn from each other, and push the boundaries of what's possible 
                    in AI communication. We envision a future where effective human-AI collaboration drives 
                    innovation across all industries.
                  </p>
                </CardContent>
              </Card>

              {/* Why Prompt Engineering Matters */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-2xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Why Prompt Engineering Matters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    In the age of artificial intelligence, the ability to communicate effectively with AI systems has
                    become a crucial skill. Prompt engineering is the art and science of crafting instructions that
                    guide AI models to produce desired outputs with precision and creativity.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Productivity Boost
                      </h3>
                      <p className="text-muted-foreground">
                        Skilled prompt engineers can increase AI productivity by 300-500%, making them invaluable 
                        assets in the modern workforce.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-blue-500" />
                        Innovation Driver
                      </h3>
                      <p className="text-muted-foreground">
                        Creative prompting unlocks new AI capabilities and applications across diverse industries 
                        and use cases.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-green-500" />
                        Universal Accessibility
                      </h3>
                      <p className="text-muted-foreground">
                        Well-crafted prompts make AI tools accessible to non-technical users, democratizing 
                        AI benefits worldwide.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                        <Award className="h-5 w-5 text-purple-500" />
                        Quality Assurance
                      </h3>
                      <p className="text-muted-foreground">
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
                  <CardTitle className="text-2xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    What We Offer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-700">Competitive Challenges</h3>
                      <p className="text-muted-foreground">
                        Regular competitions designed to test various aspects of prompt engineering, from creative 
                        writing to technical problem-solving.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-700">Fair Evaluation</h3>
                      <p className="text-muted-foreground">
                        Advanced AI-powered evaluation combined with expert human judgment ensures fair and 
                        comprehensive assessment of submissions.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-700">Global Community</h3>
                      <p className="text-muted-foreground">
                        Connect with prompt engineers from around the world, share knowledge, and learn from 
                        the best in the field.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-700">Recognition & Rewards</h3>
                      <p className="text-muted-foreground">
                        Win prizes, earn certificates, and gain recognition for your prompt engineering skills 
                        and creativity.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competition Types */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-2xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Competition Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-semibold text-blue-700 mb-2">Creative Writing</h3>
                      <p className="text-muted-foreground">
                        Craft prompts that generate compelling stories, poems, and creative content.
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h3 className="text-lg font-semibold text-green-700 mb-2">Technical Problem Solving</h3>
                      <p className="text-muted-foreground">
                        Design prompts for coding, analysis, and complex technical challenges.
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h3 className="text-lg font-semibold text-purple-700 mb-2">Business Applications</h3>
                      <p className="text-muted-foreground">
                        Create prompts for marketing, strategy, and professional communication.
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="text-lg font-semibold text-orange-700 mb-2">Educational Content</h3>
                      <p className="text-muted-foreground">
                        Develop prompts that generate effective learning materials and explanations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Who Can Participate */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    <Users className="h-6 w-6 text-slate-700" />
                    Who Can Participate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Our platform is open to prompt engineering enthusiasts from all backgrounds and experience levels. 
                    Whether you're a student, professional, researcher, or hobbyist, there's a place for you here.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-700 mb-2">Students</div>
                      <p className="text-sm text-muted-foreground">Learn and compete while building your portfolio</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-700 mb-2">Professionals</div>
                      <p className="text-sm text-muted-foreground">Showcase your expertise and stay current</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-700 mb-2">Researchers</div>
                      <p className="text-sm text-muted-foreground">Test new techniques and methodologies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Future Plans */}
              <Card className="bg-white shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-2xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                    Future Developments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We're continuously evolving our platform to provide better experiences and opportunities for 
                    the prompt engineering community. Here's what's coming next:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-muted-foreground">Advanced AI evaluation models for more nuanced scoring</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-muted-foreground">Interactive learning modules and tutorials</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-muted-foreground">Mentorship programs connecting beginners with experts</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-muted-foreground">Industry partnerships for real-world challenge scenarios</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-slate-700 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-muted-foreground">Mobile app for participating in competitions on-the-go</p>
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