import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import ContactForm from "@/components/contact-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#07073a] to-[#0a0a4a]">
      <Navbar />

      <main className="flex-grow">
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Have questions about the competition? We're here to help!
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">Get in Touch</CardTitle>
                    <CardDescription className="text-gray-300">
                      Reach out to us through any of the following channels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-4">
                      <Mail className="h-6 w-6 text-[#56ffbc] mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Email</h3>
                        <p className="text-gray-300">info@promptcompetition.pk</p>
                        <p className="text-gray-300">support@promptcompetition.pk</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Phone className="h-6 w-6 text-[#56ffbc] mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Phone</h3>
                        <p className="text-gray-300">+92 21 1234 5678</p>
                        <p className="text-gray-300">+92 42 8765 4321</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <MapPin className="h-6 w-6 text-[#56ffbc] mt-1 flex-shrink-0" />
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
                    </div>

                    <div className="flex items-start gap-4">
                      <Clock className="h-6 w-6 text-[#56ffbc] mt-1 flex-shrink-0" />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Support Hours</h3>
                        <p className="text-gray-300">Monday - Friday: 9:00 AM - 6:00 PM PKT</p>
                        <p className="text-gray-300">Saturday: 10:00 AM - 4:00 PM PKT</p>
                        <p className="text-gray-300">Sunday: Closed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 backdrop-blur-sm border-[#56ffbc]/20">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">Frequently Asked Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-[#56ffbc] font-semibold mb-2">When is the registration deadline?</h3>
                      <p className="text-gray-300">Registration closes on March 10, 2024 at 11:59 PM PKT.</p>
                    </div>
                    <div>
                      <h3 className="text-[#56ffbc] font-semibold mb-2">Can I update my submission?</h3>
                      <p className="text-gray-300">
                        Yes, you can update your submission until the final deadline on March 15, 2024.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-[#56ffbc] font-semibold mb-2">What AI models can I use?</h3>
                      <p className="text-gray-300">
                        You can use GPT-4, Claude-3, or Gemini-Pro for generating outputs.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-[#56ffbc] font-semibold mb-2">How will winners be announced?</h3>
                      <p className="text-gray-300">
                        Results will be announced on March 25, 2024 via email and on our website.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div>
                <div className="bg-white/5 backdrop-blur-sm border border-[#56ffbc]/20 rounded-lg p-1">
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
