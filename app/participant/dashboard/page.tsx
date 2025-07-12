"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LogOut, Clock, CheckCircle, AlertCircle, FileText, Send, Star, Users, Calendar, 
  ArrowRight, Play, RefreshCw, Copy, Zap, Save, ChevronLeft, ChevronRight, Eye,
  Maximize2, Minimize2, Pin, PinOff
} from "lucide-react"

export default function CombinedParticipantDashboard() {
  const [submissionStatus] = useState("pending") // pending, submitted, locked
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [activeTab, setActiveTab] = useState("combined")
  
  // Layout state
  const [isProblemPinned, setIsProblemPinned] = useState(true)
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false)
  
  // Submission state
  const [prompt, setPrompt] = useState("")
  const [testOutput, setTestOutput] = useState("")
  const [finalOutput, setFinalOutput] = useState("")
  const [isTestingPrompt, setIsTestingPrompt] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(true)
  const [hasTestedPrompt, setHasTestedPrompt] = useState(false)
  const [testHistory, setTestHistory] = useState([])

  const availableTopics = [
    {
      id: 1,
      title: "Customer Feedback Analysis",
      description: "Design a prompt to categorize customer feedback into structured categories with confidence scoring",
      participants: 1247,
      deadline: "Mar 30, 2024",
      category: "Text Classification",
      status: "active",
      tags: ["NLP", "Classification", "Sentiment Analysis"],
      sampleInput: `Sample customer feedback:\n"I love the new features in your app, but the loading time is really slow. The customer service team was very helpful when I called yesterday. However, I think the premium subscription is overpriced for what it offers. Could you add a dark mode option?"`
    },
    {
      id: 2,
      title: "Code Documentation Generator",
      description: "Create a prompt that generates comprehensive documentation for code functions and classes",
      participants: 892,
      deadline: "Apr 5, 2024",
      category: "Code Generation",
      status: "active",
      tags: ["Programming", "Documentation", "Code Analysis"],
      sampleInput: `function calculateTax(income, deductions = 0, taxRate = 0.25) {\n  const taxableIncome = Math.max(0, income - deductions);\n  return taxableIncome * taxRate;\n}`
    },
    {
      id: 3,
      title: "Creative Story Continuation",
      description: "Develop a prompt for continuing stories while maintaining consistent character development and plot",
      participants: 2156,
      deadline: "Mar 25, 2024",
      category: "Creative Writing",
      status: "active",
      tags: ["Creative Writing", "Storytelling", "Character Development"],
      sampleInput: `Story beginning:\n"Sarah had always been afraid of the ocean, but standing at the edge of the cliff, watching the waves crash against the rocks below, she felt something different. The letter in her pocket crinkled as the wind picked up, and she knew there was no turning back now."`
    },
    {
      id: 4,
      title: "Technical Troubleshooting Assistant",
      description: "Build a prompt system for diagnosing and solving technical issues with step-by-step guidance",
      participants: 567,
      deadline: "Apr 10, 2024",
      category: "Problem Solving",
      status: "active",
      tags: ["Technical Support", "Troubleshooting", "Problem Solving"],
      sampleInput: `User Issue:\n"My laptop won't start up. When I press the power button, I can hear the fan running and see some lights, but the screen stays black. It was working fine yesterday."`
    },
    {
      id: 5,
      title: "Data Visualization Recommendations",
      description: "Create prompts that suggest optimal chart types and visualization strategies for datasets",
      participants: 789,
      deadline: "Mar 28, 2024",
      category: "Data Analysis",
      status: "active",
      tags: ["Data Science", "Visualization", "Analytics"],
      sampleInput: `Dataset description:\n"Sales data with columns: date, product_category, region, revenue, units_sold, customer_age_group. Contains 12 months of data across 5 regions and 8 product categories. Want to identify trends and patterns for executive presentation."`
    },
    {
      id: 6,
      title: "Meeting Summary Generator",
      description: "Design a prompt to extract key decisions, action items, and summaries from meeting transcripts",
      participants: 1543,
      deadline: "Apr 1, 2024",
      category: "Text Summarization",
      status: "ending_soon",
      tags: ["Summarization", "Meeting Notes", "Action Items"],
      sampleInput: `Meeting transcript:\n"Thanks everyone for joining. Let's start with the Q1 results. Sarah, can you walk us through the numbers? Sure, we hit $2.3M in revenue, which is 15% above target. The mobile app launch was successful. However, we're behind on the customer service tickets - averaging 48 hours response time instead of our 24-hour goal. We need to hire 2 more support staff by end of March."`
    }
  ]

  const getStatusIcon = () => {
    switch (submissionStatus) {
      case "submitted":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "locked":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = () => {
    switch (submissionStatus) {
      case "submitted":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Submitted
          </Badge>
        )
      case "locked":
        return <Badge variant="destructive">Locked</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic)
    setActiveTab("combined")
  }

  const handleTestPrompt = async () => {
    if (!prompt.trim()) return

    setIsTestingPrompt(true)
    setTestOutput("")

    // Simulate AI response
    setTimeout(() => {
      let mockOutput = ""
      
      switch (selectedTopic.id) {
        case 1:
          mockOutput = `Based on the customer feedback analysis:

**Categorization Results:**
1. **Feature Requests** (Confidence: 85%)
   - Dark mode option request

2. **Product Quality Issues** (Confidence: 78%) 
   - Slow loading time concerns

3. **Service Experience** (Confidence: 92%)
   - Positive customer service interaction

4. **Pricing Concerns** (Confidence: 88%)
   - Premium subscription pricing feedback

5. **General Satisfaction** (Confidence: 75%)
   - Overall positive sentiment with specific concerns

**Explanation:**
The feedback contains multiple categories. The customer expresses satisfaction with new features and customer service (positive), but raises concerns about performance (loading time), pricing (premium subscription cost), and requests additional features (dark mode).`
          break
        case 2:
          mockOutput = `/**
 * Calculate Tax Function Documentation
 * 
 * @function calculateTax
 * @description Calculates the tax amount based on income, deductions, and tax rate
 * 
 * @param {number} income - The gross income amount
 * @param {number} [deductions=0] - Optional deductions to subtract from income
 * @param {number} [taxRate=0.25] - Tax rate as a decimal (default 25%)
 * 
 * @returns {number} The calculated tax amount
 * 
 * @example
 * calculateTax(50000, 5000, 0.25) // Returns 11250
 * calculateTax(30000) // Returns 7500 (using defaults)
 */`
          break
        default:
          mockOutput = `AI response for ${selectedTopic.title}:\n\nThis would be the AI's response to your prompt based on the sample input provided. The response would be tailored to the specific requirements of this competition topic.`
      }

      setTestOutput(mockOutput)
      setHasTestedPrompt(true)
      setIsDraft(false)
      
      const newTest = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        prompt: prompt,
        output: mockOutput
      }
      setTestHistory(prev => [newTest, ...prev.slice(0, 4)])
      
      setIsTestingPrompt(false)
    }, 2000)
  }

  const handleSaveDraft = () => {
    setIsDraft(true)
    setTimeout(() => {
      console.log("Draft saved")
    }, 500)
  }

  const handleUseThisOutput = () => {
    setFinalOutput(testOutput)
    setIsDraft(false)
  }

  const handleSubmit = async () => {
    if (!prompt.trim() || !hasTestedPrompt) return

    setIsSubmitting(true)

    if (!finalOutput && testOutput) {
      setFinalOutput(testOutput)
    }

    setTimeout(() => {
      setIsSubmitting(false)
      // Show success message or redirect
    }, 2000)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const mockProblemStatement = selectedTopic ? `Design an effective prompt for a large language model to ${selectedTopic.description.toLowerCase()}.

Your prompt should:
- Be clear and specific
- Include examples where appropriate
- Handle edge cases and ambiguous inputs
- Provide consistent results
- Include confidence scoring when applicable

The LLM should also provide a brief explanation for its decisions and reasoning.

**Evaluation Criteria:**
- Accuracy and relevance of outputs
- Consistency across different inputs
- Clarity of instructions
- Handling of edge cases
- Overall prompt engineering quality` : ""

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {selectedTopic && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedTopic(null)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Topics
              </Button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedTopic ? selectedTopic.title : "Participant Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, John Doe</span>
            <Button variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!selectedTopic ? (
          /* Topic Selection View */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Challenge</h2>
              <p className="text-gray-600">Select a competition topic to participate in</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTopics.map((topic) => (
                <Card key={topic.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{topic.title}</CardTitle>
                        <Badge variant="outline" className="mb-2">
                          {topic.category}
                        </Badge>
                      </div>
                      {topic.status === "ending_soon" && (
                        <Badge variant="destructive" className="ml-2">
                          Ending Soon
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm leading-relaxed">
                      {topic.description}
                    </CardDescription>
                    
                    <div className="flex flex-wrap gap-1">
                      {topic.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Participants
                        </span>
                        <span className="font-medium">{topic.participants.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deadline
                        </span>
                        <span className="font-medium">{topic.deadline}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={() => handleTopicSelect(topic)}
                    >
                      Select This Topic
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Card className="inline-block">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>Total Active Competitions: {availableTopics.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Total Participants: {availableTopics.reduce((sum, topic) => sum + topic.participants, 0).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Combined Problem Statement & Solution View */
          <div className="space-y-6">
            
            {/* Topic Header */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{selectedTopic.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{selectedTopic.category}</Badge>
                      {getStatusBadge()}
                    </div>
                    <CardDescription>{selectedTopic.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsRightPanelExpanded(!isRightPanelExpanded)}
                    >
                      {isRightPanelExpanded ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Competition Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon()}
                  Competition Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Time Remaining</span>
                      <span className="font-medium">5 days, 14 hours</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>

                  {submissionStatus === "pending" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You haven't submitted your solution yet. Make sure to submit before the deadline!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Competition Info Sidebar - Only visible when not expanded */}
            {!isRightPanelExpanded && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Competition Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Participants</span>
                      <span className="font-medium">{selectedTopic.participants.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Deadline</span>
                      <span className="font-medium">{selectedTopic.deadline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Your Rank</span>
                      <span className="font-medium">-</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Layout */}
            <div className={`grid gap-6 ${isRightPanelExpanded ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
              
              {/* Problem Statement Section */}
              <div className="space-y-6">

                {/* Guidelines */}
                <Card>
                  <CardHeader>
                    <CardTitle>Submission Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 text-gray-600">
                      <li>• Prompt must be clear and specific</li>
                      <li>• Include example inputs/outputs</li>
                      <li>• Test your prompt thoroughly</li>
                      <li>• Submit before the deadline</li>
                      <li>• One submission per participant</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="sticky top-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Problem Statement
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsProblemPinned(!isProblemPinned)}
                      >
                        {isProblemPinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{mockProblemStatement}</pre>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Sample Input:</h4>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTopic.sampleInput}</pre>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(selectedTopic.sampleInput)}
                        className="mt-2"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Sample
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedTopic.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Solution Section */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Your Solution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="prompt">Prompt Text</Label>
                        <Textarea
                          id="prompt"
                          placeholder="Enter your carefully crafted prompt here..."
                          value={prompt}
                          onChange={(e) => {
                            setPrompt(e.target.value)
                            setIsDraft(false)
                          }}
                          className="min-h-[250px] font-mono text-sm"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500">
                            Characters: {prompt.length} | Words: {prompt.split(/\s+/).filter(Boolean).length}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={handleSaveDraft}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save Draft
                            </Button>
                            <Button 
                              onClick={handleTestPrompt} 
                              disabled={!prompt.trim() || isTestingPrompt}
                              size="sm"
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
                      </div>

                      {/* Status Indicators */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          {isDraft ? (
                            <>
                              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-yellow-700">Unsaved changes</span>
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-700">Draft saved</span>
                            </>
                          )}
                        </div>
                        
                        {hasTestedPrompt && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Prompt tested</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Output Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        AI Output
                      </CardTitle>
                      {testOutput && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Tested
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {testOutput ? (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">{testOutput}</pre>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 rounded-lg text-center">
                          <Zap className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">Test your prompt to see the AI output</p>
                        </div>
                      )}
                      
                    </div>
                  </CardContent>
                </Card>

                {/* Final Submission */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Final Submission
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleSubmit} 
                          disabled={isSubmitting || !hasTestedPrompt} 
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isSubmitting ? "Submitting..." : "Submit Solution"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab("preview")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                      
                      {!hasTestedPrompt && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Please test your prompt at least once before submitting.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Test History */}
                {testHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Test History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {testHistory.map((test) => (
                          <div key={test.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500">{test.timestamp}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setPrompt(test.prompt)
                                  setTestOutput(test.output)
                                }}
                              >
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
          </div>
        )}
      </div>
    </div>
  )
}