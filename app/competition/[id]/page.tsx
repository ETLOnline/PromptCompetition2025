"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type { Competition, Submission } from "@/types/auth"
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  Send, 
  CheckCircle, 
  RefreshCw, 
  Play, 
  Save, 
  Zap, 
  Eye, 
  AlertCircle,
  History,
  RotateCcw,
  Trophy,
  Target
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { use } from "react"

export default function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [prompt, setPrompt] = useState("")
  const [llmOutput, setLlmOutput] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [isDraft, setIsDraft] = useState(false)
  const [hasTestedPrompt, setHasTestedPrompt] = useState(false)
  const [testOutput, setTestOutput] = useState("")
  const [isTestingPrompt, setIsTestingPrompt] = useState(false)
  const [testHistory, setTestHistory] = useState<any[]>([])

  const resolvedParams = use(params)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchCompetitionData()
  }, [user, resolvedParams.id, router])

  const fetchCompetitionData = async () => {
    try {
      const [competitionRes, submissionRes] = await Promise.all([
        fetch(`/api/competitions/${resolvedParams.id}`),
        fetch(`/api/submissions/competition/${resolvedParams.id}`),
      ])

      if (competitionRes.ok) {
        const competitionData = await competitionRes.json()
        setCompetition(competitionData)
      }

      if (submissionRes.ok) {
        const submissionData = await submissionRes.json()
        setSubmission(submissionData)
        if (submissionData) {
          setPrompt(submissionData.prompt)
          setLlmOutput(submissionData.llmOutput)
          setHasTestedPrompt(true)
        }
      }
    } catch (error) {
      console.error("Error fetching competition data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestPrompt = () => {
    setIsTestingPrompt(true)
    setTimeout(() => {
      const output = `Output for: ${prompt}`
      setTestOutput(output)
      setHasTestedPrompt(true)
      setIsTestingPrompt(false)
      const historyEntry = {
        id: Date.now(),
        prompt,
        output,
        timestamp: new Date().toLocaleString(),
      }
      setTestHistory([historyEntry, ...testHistory])
    }, 1000)
  }

  const handleSaveDraft = () => {
    setIsDraft(false)
    toast({ title: "Draft Saved", description: "Your draft has been saved locally." })
  }

  const handleSubmit = async () => {
    if (!prompt.trim() || !testOutput.trim()) {
      toast({
        title: "Error",
        description: "Please test your prompt before submitting.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: resolvedParams.id,
          prompt,
          llmOutput: testOutput,
        }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Submission saved successfully!" })
        fetchCompetitionData()
      } else {
        throw new Error("Submission failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-[#56ffbc] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading competition...</p>
        </div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="bg-white shadow-xl border-0 max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Competition Not Found</h2>
            <p className="text-gray-600 mb-6">The competition you're looking for doesn't exist or has been removed.</p>
            <Button 
              className="bg-[#56ffbc] hover:bg-[#45e6a8] text-gray-800 font-semibold px-6 py-2 shadow-md" 
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompetitionLocked = competition.isLocked
  const hasSubmission = !!submission
  const canSubmit = !isCompetitionLocked && hasTestedPrompt && !submitting

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/dashboard")} 
                className="mr-4 text-gray-700 hover:text-[#56ffbc] hover:bg-[#56ffbc]/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Trophy className="h-8 w-8 text-[#56ffbc]" />
                  <h1 className="text-3xl font-bold text-gray-800">{competition.title}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="secondary" 
                    className={`font-medium px-3 py-1 ${
                      isCompetitionLocked 
                        ? "bg-red-100 text-red-700 border-red-200" 
                        : "bg-green-100 text-green-700 border-green-200"
                    }`}
                  >
                    {isCompetitionLocked ? "Locked" : "Active"}
                  </Badge>
                  {hasSubmission && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Competition Info */}
          <div className="space-y-6">
            {/* Guidelines Card */}
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-[#56ffbc]/10 to-blue-50 border-b border-gray-100">
                <CardTitle className="text-gray-800 text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#56ffbc]" />
                  Submission Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-[#56ffbc] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="leading-relaxed">Prompt must be clear and specific</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-[#56ffbc] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="leading-relaxed">Include example inputs/outputs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-[#56ffbc] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="leading-relaxed">Test your prompt thoroughly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-[#56ffbc] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="leading-relaxed">Submit before the deadline</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-[#56ffbc] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="leading-relaxed">One submission per participant</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Competition Details Card */}
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                <CardTitle className="text-gray-800 text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Competition Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{competition.description}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Problem Statement</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                      {competition.problemStatement}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Deadline
                  </h3>
                  <p className="text-gray-700 bg-orange-50 p-3 rounded-lg border border-orange-200">
                    {new Date(competition.deadline).toLocaleDateString()} at{" "}
                    {new Date(competition.deadline).toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Solution Workspace */}
          <div className="space-y-6">
            {/* Prompt Input Card */}
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-[#56ffbc]/10 to-green-50 border-b border-gray-100">
                <CardTitle className="text-gray-800 text-lg font-semibold flex items-center gap-2">
                  <Send className="h-5 w-5 text-[#56ffbc]" />
                  Your Solution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-gray-800 font-medium mb-2 block">
                    Prompt Text
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Enter your carefully crafted prompt here..."
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value)
                      setIsDraft(true)
                    }}
                    className="min-h-[250px] font-mono text-sm bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-500 focus:border-[#56ffbc] focus:ring-[#56ffbc] focus:bg-white transition-colors"
                    disabled={isCompetitionLocked}
                  />
                </div>
                
                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500">
                    Characters: {prompt.length} | Words: {prompt.split(/\s+/).filter(Boolean).length}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSaveDraft}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      disabled={!isDraft}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button 
                      onClick={handleTestPrompt} 
                      disabled={!prompt.trim() || isTestingPrompt || isCompetitionLocked}
                      size="sm"
                      className="bg-[#56ffbc] hover:bg-[#45e6a8] text-gray-800 font-semibold shadow-md"
                    >
                      {isTestingPrompt ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Test Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Status Indicators */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    {isDraft ? (
                      <>
                        <div className="h-2 w-2 bg-amber-400 rounded-full animate-pulse"></div>
                        <span className="text-amber-600">Unsaved changes</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-600">Draft saved</span>
                      </>
                    )}
                  </div>
                  {hasTestedPrompt && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Prompt tested</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Output Card */}
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-gray-800 text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    AI Output
                  </CardTitle>
                  {testOutput && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Tested
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {testOutput ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {testOutput}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
                    <Zap className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">Test your prompt to see the AI output</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submission Card */}
            <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-[#56ffbc]/10 border-b border-gray-100">
                <CardTitle className="text-gray-800 text-lg font-semibold flex items-center gap-2">
                  <Send className="h-5 w-5 text-green-600" />
                  Final Submission
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!canSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Submitting..." : "Submit Solution"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                    disabled={!testOutput}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
                
                {!hasTestedPrompt && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      Please test your prompt at least once before submitting.
                    </AlertDescription>
                  </Alert>
                )}
                
                {isCompetitionLocked && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      This competition is locked. No new submissions are allowed.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Test History Card */}
            {testHistory.length > 0 && (
              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
                  <CardTitle className="text-gray-800 text-lg font-semibold flex items-center gap-2">
                    <History className="h-5 w-5 text-indigo-600" />
                    Test History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {testHistory.map((test) => (
                      <div 
                        key={test.id} 
                        className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">{test.timestamp}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setPrompt(test.prompt)
                              setTestOutput(test.output)
                            }}
                            className="text-[#56ffbc] hover:text-[#45e6a8] hover:bg-[#56ffbc]/10"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Restore
                          </Button>
                        </div>
                        <p className="text-sm text-gray-700 truncate">
                          {test.prompt.slice(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}