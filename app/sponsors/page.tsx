import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Award, 
  Mail, 
  CheckCircle2, 
  Star, 
  TrendingUp, 
  Users, 
  Megaphone, 
  Trophy,
  Briefcase,
  Globe,
  Building2,
  Sparkles,
  Target,
  Rocket,
  Heart
} from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "Sponsors - All Pakistan Prompt Engineering Competition 2025",
  description: "Partner with us to shape Pakistan's AI future through strategic sponsorship opportunities.",
}

export default function SponsorsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 opacity-60"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-20"></div>
        
        <div className="container mx-auto w-full sm:max-w-6xl relative z-10">
          <div className="text-center space-y-4 sm:space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-blue-100 to-green-100 border border-blue-200">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Partnership Opportunities</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight px-2">
              Partnering with Pakistan&apos;s
              <span className="block mt-2 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                AI Future
              </span>
            </h1>

            {/* Intro Copy */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Partner with us to shape Pakistan&apos;s AI future. We offer four strategic sponsorship tiers designed to maximize your brand impact while supporting national digital transformation.
            </p>

            {/* Contact CTA */}
            <div className="pt-4 sm:pt-6">
              <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-blue-500 to-green-500">
                    <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Ready to make an impact?</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Contact us to sponsor the event</p>
                  </div>
                </div>
                <Link href="mailto:info@ETLOnline.org">
                  <Button 
                    size="lg"
                    className="text-xs sm:text-sm text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                    style={{ backgroundColor: '#0f172a' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 relative z-10" />
                    <span className="relative z-10">info@ETLOnline.org</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Sponsors Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto w-full sm:max-w-6xl">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-100 mb-4">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <span className="text-xs sm:text-sm font-semibold text-blue-600">Our Valued Partners</span>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 px-2">
              Current Sponsors
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Join these forward-thinking organizations shaping the future of AI in Pakistan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-full justify-center md:justify-center lg:justify-center xl:justify-center">
                  <Link href="https://acme-one.com/" target="_blank" rel="noopener noreferrer" className="block">
                    <Card className="border-2 border-blue-400 hover:border-blue-600 hover:shadow-xl transition-all duration-300 bg-white cursor-pointer">
                      <CardHeader className="text-center pb-4 flex flex-col items-center">
                        <img src="/images/sponsers/acme.png" alt="ACME ONE Logo" className="object-contain mx-auto mb-4 w-32 h-20" />
                        <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 mb-3">
                          <span className="text-xs font-bold text-blue-700">PLATINUM TIER</span>
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900">ACME ONE</CardTitle>
                      </CardHeader>
                    </Card>
                  </Link>

                  <Link href="https://99technologies.com/" target="_blank" rel="noopener noreferrer" className="block">
                    <Card className="border-2 border-blue-400 hover:border-blue-600 hover:shadow-xl transition-all duration-300 bg-white cursor-pointer">
                      <CardHeader className="text-center pb-4 flex flex-col items-center">
                        <img src="/images/sponsers/ninetynine.png" alt="Ninety Nine Technologies Logo" className="object-contain mx-auto mb-4 w-32 h-20" />
                        <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 mb-3">
                          <span className="text-xs font-bold text-blue-700">PLATINUM TIER</span>
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900">Ninety Nine Technologies</CardTitle>
                      </CardHeader>
                    </Card>
                  </Link>
          </div>
        </div>
      </section>

      {/* Sponsorship Packages Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto w-full sm:max-w-7xl">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-green-100 mb-4">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="text-xs sm:text-sm font-semibold text-green-600">Investment Opportunities</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Sponsorship Packages & Benefits
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the tier that aligns with your brand&apos;s vision and impact goals
            </p>
          </div>

          {/* Sponsorship Tiers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12 w-full">
            {/* Platinum Tier */}
              <Card className="relative border-2 border-blue-500 shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-blue-200 transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div className="px-2 py-0.5 sm:px-4 sm:py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
                    <span className="text-[10px] sm:text-xs font-bold text-white">MOST POPULAR</span>
                  </div>
                </div>
              <CardHeader className="text-center pt-8">
                <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 w-16 h-16 flex items-center justify-center">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold" style={{ color: '#0f172a' }}>Platinum</CardTitle>
                <CardDescription className="text-lg sm:text-xl font-bold text-blue-600 mt-2">Rs. 300,000</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Exclusive naming rights</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Logo on all event materials</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Brand feature in national media coverage</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Feature in post-event report</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Logo on event landing page</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Social media highlight video</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Judge or mentor opportunity</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Brand email to all participants</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Impact & visibility report</span>
                </div>
              </CardContent>
            </Card>

            {/* Gold Tier */}
            <Card className="border-2 border-yellow-500 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-yellow-200 transition-all duration-300 transform hover:-translate-y-2">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 w-16 h-16 flex items-center justify-center">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold" style={{ color: '#0f172a' }}>Gold</CardTitle>
                <CardDescription className="text-lg sm:text-xl font-bold text-yellow-600 mt-2">Rs. 200,000</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Logo on all event materials</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Brand feature in national media coverage</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Feature in post-event report</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Logo on event landing page</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Social media highlight video</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Judge or mentor opportunity</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Brand email to all participants</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Impact & visibility report</span>
                </div>
              </CardContent>
            </Card>

            {/* Silver Tier */}
            <Card className="border-2 border-gray-400 shadow-lg bg-gradient-to-br from-gray-50 to-slate-50 hover:shadow-gray-300 transition-all duration-300 transform hover:-translate-y-2">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 w-16 h-16 flex items-center justify-center">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold" style={{ color: '#0f172a' }}>Silver</CardTitle>
                <CardDescription className="text-lg sm:text-xl font-bold text-gray-600 mt-2">Rs. 100,000</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Feature in post-event report</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Logo on event landing page</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Judge or mentor opportunity</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Brand email to all participants</span>
                </div>
              </CardContent>
            </Card>

            {/* Community Partner Tier */}
            <Card className="border-2 border-green-400 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-green-200 transition-all duration-300 transform hover:-translate-y-2">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 w-16 h-16 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold" style={{ color: '#0f172a' }}>Community Partner</CardTitle>
                <CardDescription className="text-lg sm:text-xl font-bold text-green-600 mt-2">In-kind</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Feature in post-event report</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Judge or mentor opportunity</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Brand email to all participants</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Funds Utilization Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto w-full sm:max-w-6xl">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-blue-100 mb-4">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <span className="text-xs sm:text-sm font-semibold text-blue-600">Your Investment Impact</span>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 px-2">
              How We Utilize Sponsorship Funds
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Every rupee invested creates lasting impact on Pakistan&apos;s AI ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full">
            {/* Prize Pool & Awards */}
            <Card className="border-2 border-transparent hover:border-blue-400 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 flex items-center justify-center shadow-lg">
                  <Trophy className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold" style={{ color: '#0f172a' }}>
                  Prize Pool & Awards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center leading-relaxed">
                  Cash prizes, certificates of excellence, and internship opportunities to recognize and reward 
                  outstanding prompt engineering talent across Pakistan.
                </p>
              </CardContent>
            </Card>

            {/* Platform Development */}
            <Card className="border-2 border-transparent hover:border-green-400 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 flex items-center justify-center shadow-lg">
                  <Briefcase className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold" style={{ color: '#0f172a' }}>
                  Platform Development & HR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center leading-relaxed">
                  Hiring dedicated event managers and developing robust online infrastructure to ensure seamless 
                  competition execution and exceptional participant experience.
                </p>
              </CardContent>
            </Card>

            {/* Marketing & Outreach */}
            <Card className="border-2 border-transparent hover:border-purple-400 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 flex items-center justify-center shadow-lg">
                  <Megaphone className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold" style={{ color: '#0f172a' }}>
                  Marketing & Nationwide Outreach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center leading-relaxed">
                  Comprehensive marketing campaigns across universities, digital platforms, and social media to 
                  maximize participation and create national awareness.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-200 rounded-full blur-3xl opacity-20"></div>
        
        <div className="container mx-auto w-full sm:max-w-4xl relative z-10">
          <Card className="border-2 shadow-2xl bg-white/80 backdrop-blur-sm" style={{ borderColor: '#0f172a' }}>
            <CardHeader className="text-center space-y-3 sm:space-y-4 pb-4 sm:pb-6">
              <div className="mx-auto p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-500 to-green-500 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-lg">
                <Globe className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#0f172a' }}>
                Ready to Partner?
              </CardTitle>
              <CardDescription className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                Contact us to discuss sponsorship packages and explore how we can customize opportunities to align with your brand&apos;s vision and goals.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:gap-6 pb-6 sm:pb-8">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md">
                <Link href="mailto:info@ETLOnline.org" className="flex-1">
                  <Button 
                    size="lg"
                    className="w-full text-xs sm:text-sm text-white shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
                    style={{ backgroundColor: '#0f172a' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 relative z-10" />
                    <span className="relative z-10">info@ETLOnline.org</span>
                  </Button>
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 text-center">
                Our team will respond within 24-48 hours to discuss partnership opportunities
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      </div>
      <Footer />
    </>
  )
}
