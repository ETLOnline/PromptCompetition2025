import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users, Award, Lightbulb } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#07073a] to-[#0a0a4a]">
      <Navbar />

      <main className="flex-grow">
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About the Competition</h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Empowering Pakistan's next generation of AI innovators through prompt engineering excellence
              </p>
            </div>

            <div className="space-y-8">
              {/* Mission */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Target className="h-6 w-6 text-[#56ffbc]" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    The All Pakistan Prompt Engineering Competition aims to identify, nurture, and celebrate the most
                    talented prompt engineers across Pakistan. We believe that effective prompt engineering is the key
                    to unlocking the full potential of artificial intelligence, and our mission is to foster innovation
                    and excellence in this critical field.
                  </p>
                </CardContent>
              </Card>

              {/* Vision */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-[#56ffbc]" />
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    To establish Pakistan as a global leader in AI prompt engineering by creating a platform that
                    encourages creativity, technical excellence, and innovative problem-solving. We envision a future
                    where Pakistani talent leads the world in human-AI collaboration through masterful prompt design.
                  </p>
                </CardContent>
              </Card>

              {/* Why Prompt Engineering Matters */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Why Prompt Engineering Matters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 leading-relaxed">
                    In the age of artificial intelligence, the ability to communicate effectively with AI systems has
                    become a crucial skill. Prompt engineering is the art and science of crafting instructions that
                    guide AI models to produce desired outputs.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-[#56ffbc]">Economic Impact</h3>
                      <p className="text-gray-300">
                        Skilled prompt engineers can increase AI productivity by 300-500%, making them invaluable in the
                        modern workforce.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-[#56ffbc]">Innovation Driver</h3>
                      <p className="text-gray-300">
                        Creative prompting unlocks new AI capabilities and applications across industries.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-[#56ffbc]">Accessibility</h3>
                      <p className="text-gray-300">
                        Good prompts make AI tools accessible to non-technical users, democratizing AI benefits.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-[#56ffbc]">Quality Assurance</h3>
                      <p className="text-gray-300">
                        Expert prompting ensures AI outputs are accurate, relevant, and aligned with human values.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competition Impact */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Award className="h-6 w-6 text-[#56ffbc]" />
                    Competition Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#56ffbc] mb-2">500+</div>
                      <p className="text-gray-300">Expected Participants</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#56ffbc] mb-2">50+</div>
                      <p className="text-gray-300">Universities Represented</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#56ffbc] mb-2">PKR 500K</div>
                      <p className="text-gray-300">Total Prize Pool</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organizers */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Users className="h-6 w-6 text-[#56ffbc]" />
                    Organizing Committee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    This competition is organized by a consortium of leading Pakistani universities, tech companies, and
                    AI research institutions, working together to promote AI education and innovation in Pakistan.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-[#56ffbc] mb-3">Academic Partners</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li>• National University of Sciences and Technology (NUST)</li>
                        <li>• Lahore University of Management Sciences (LUMS)</li>
                        <li>• University of Engineering and Technology (UET)</li>
                        <li>• Institute of Business Administration (IBA)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#56ffbc] mb-3">Industry Partners</h3>
                      <ul className="space-y-2 text-gray-300">
                        <li>• Pakistan Software Houses Association (P@SHA)</li>
                        <li>• National Incubation Centers</li>
                        <li>• Leading Pakistani Tech Companies</li>
                        <li>• AI Research Labs</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Future Plans */}
              <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Future Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    This competition is just the beginning. We plan to make this an annual event, with each year
                    bringing new challenges, larger prizes, and greater opportunities for Pakistani talent to shine on
                    the global stage.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#56ffbc] rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Establish regional chapters across all provinces</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#56ffbc] rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">
                        Create mentorship programs connecting winners with industry experts
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#56ffbc] rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Launch scholarship programs for top performers</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#56ffbc] rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300">Develop partnerships with international AI organizations</p>
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
