import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Brain, Award } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            All Pakistan Prompt Engineering Competition
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join the nation's premier competition to showcase your prompt engineering skills and compete with the best
            minds in AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/login">Participant Login</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              <Link href="/auth/admin-login">Admin Access</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <CardTitle>National Competition</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Compete with participants from across Pakistan in this prestigious event.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <CardTitle>AI Excellence</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Demonstrate your mastery of prompt engineering and AI interaction.</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle>Expert Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your submissions will be evaluated by industry experts and AI specialists.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Award className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <CardTitle>Recognition</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Win certificates, prizes, and recognition in the AI community.</CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Competition Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <h3 className="font-semibold text-lg mb-2">Registration</h3>
                <p className="text-gray-600">March 1-15, 2024</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Competition Period</h3>
                <p className="text-gray-600">March 16-30, 2024</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Results</h3>
                <p className="text-gray-600">April 5, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
