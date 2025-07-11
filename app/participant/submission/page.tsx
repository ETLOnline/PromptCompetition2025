"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Save, Send, Upload, AlertCircle } from "lucide-react"

export default function SubmissionPage() {
  const [prompt, setPrompt] = useState("")
  const [llmOutput, setLlmOutput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraft, setIsDraft] = useState(true)
  const router = useRouter()

  const handleSaveDraft = () => {
    toast.success("Your work has been saved as a draft.")
    setIsDraft(true)
  }

  const handleSubmit = async () => {
    if (!prompt.trim() || !llmOutput.trim()) {
      toast.error("Please fill in both the prompt and LLM output fields.")
      return
    }

    setIsSubmitting(true)

    // Simulate submission
    setTimeout(() => {
      toast.success("Your solution has been submitted for evaluation.")
      router.push("/participant/dashboard")
      setIsSubmitting(false)
    }, 2000)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setLlmOutput(content)
        toast.success(`${file.name} has been loaded into the LLM output field.`)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/participant/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Submit Your Solution</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Make sure to test your prompt thoroughly before submitting. You can only submit once!
            </AlertDescription>
          </Alert>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Prompt Section */}
            <Card>
              <CardHeader>
                <CardTitle>Your Prompt</CardTitle>
                <CardDescription>Design your prompt for the customer feedback categorization task</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="prompt">Prompt Text</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Enter your carefully crafted prompt here..."
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value)
                      setIsDraft(false)
                    }}
                    className="min-h-[400px] font-mono text-sm"
                  />
                  <div className="text-xs text-gray-500">
                    Characters: {prompt.length} | Words: {prompt.split(/\s+/).filter(Boolean).length}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LLM Output Section */}
            <Card>
              <CardHeader>
                <CardTitle>Expected LLM Output</CardTitle>
                <CardDescription>Provide sample output or upload a file with expected results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="llm-output">LLM Output</Label>
                    <div className="ml-auto">
                      <input
                        type="file"
                        accept=".txt,.md"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="llm-output"
                    placeholder="Paste or type the expected LLM output here..."
                    value={llmOutput}
                    onChange={(e) => {
                      setLlmOutput(e.target.value)
                      setIsDraft(false)
                    }}
                    className="min-h-[400px] font-mono text-sm"
                  />
                  <div className="text-xs text-gray-500">
                    Characters: {llmOutput.length} | Words: {llmOutput.split(/\s+/).filter(Boolean).length}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {isDraft ? (
                    <>
                      <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                      Unsaved changes
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      Draft saved
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleSaveDraft}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit Solution"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
