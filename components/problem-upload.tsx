"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Upload, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface ProblemStatement {
  id: string
  title: string
  content: string
  createdAt: string
  isActive: boolean
}

export function ProblemUpload() {
  const [problems, setProblems] = useState<ProblemStatement[]>([
    {
      id: "1",
      title: "Customer Feedback Categorization",
      content: "Design an effective prompt for a large language model to analyze customer feedback...",
      createdAt: "2024-03-20",
      isActive: true,
    },
  ])
  const [newProblem, setNewProblem] = useState({ title: "", content: "" })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setNewProblem((prev) => ({ ...prev, content }))
        toast.success(`${file.name} has been loaded.`)
      }
      reader.readAsText(file)
    }
  }

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Simulate CSV processing
      toast.success("Processing multiple problem statements...")
    }
  }

  const handleAddProblem = () => {
    if (!newProblem.title.trim() || !newProblem.content.trim()) {
      toast.error("Please provide both title and content.")
      return
    }

    const problem: ProblemStatement = {
      id: Date.now().toString(),
      title: newProblem.title,
      content: newProblem.content,
      createdAt: new Date().toISOString().split("T")[0],
      isActive: false,
    }

    setProblems((prev) => [...prev, problem])
    setNewProblem({ title: "", content: "" })
    toast.success("New problem statement has been created.")
  }

  const handleDeleteProblem = (id: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== id))
    toast.success("Problem statement has been removed.")
  }

  const handleActivateProblem = (id: string) => {
    setProblems((prev) =>
      prev.map((p) => ({
        ...p,
        isActive: p.id === id,
      })),
    )
    toast.success("This problem is now active for participants.")
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Problem Statements</CardTitle>
          <CardDescription>Add new problem statements for the competition</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Single Problem Upload */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="problem-title">Problem Title</Label>
              <Input
                id="problem-title"
                placeholder="Enter problem title..."
                value={newProblem.title}
                onChange={(e) => setNewProblem((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="problem-content">Problem Content</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="text-upload"
                  />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("text-upload")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Text
                  </Button>
                </div>
              </div>
              <Textarea
                id="problem-content"
                placeholder="Enter or paste the problem statement here..."
                value={newProblem.content}
                onChange={(e) => setNewProblem((prev) => ({ ...prev, content: e.target.value }))}
                className="min-h-[200px]"
              />
            </div>

            <Button onClick={handleAddProblem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Problem Statement
            </Button>
          </div>

          {/* Batch Upload */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Batch Upload</h3>
            <div className="flex items-center gap-4">
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" id="csv-upload" />
              <Button variant="outline" onClick={() => document.getElementById("csv-upload")?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
              <span className="text-sm text-gray-600">Upload multiple problems via CSV file</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Problems */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Problem Statements</CardTitle>
          <CardDescription>Manage and activate problem statements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {problems.map((problem) => (
              <div key={problem.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {problem.title}
                      {problem.isActive && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Created: {problem.createdAt}</p>
                  </div>
                  <div className="flex gap-2">
                    {!problem.isActive && (
                      <Button variant="outline" size="sm" onClick={() => handleActivateProblem(problem.id)}>
                        Activate
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteProblem(problem.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{problem.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
