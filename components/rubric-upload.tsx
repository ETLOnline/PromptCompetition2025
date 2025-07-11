"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Download, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface RubricFile {
  id: string
  name: string
  type: "pdf" | "markdown"
  uploadDate: string
  size: string
  isActive: boolean
}

export function RubricUpload() {
  const [rubrics, setRubrics] = useState<RubricFile[]>([
    {
      id: "1",
      name: "Evaluation_Rubric_v1.pdf",
      type: "pdf",
      uploadDate: "2024-03-20",
      size: "245 KB",
      isActive: true,
    },
    {
      id: "2",
      name: "Scoring_Guidelines.md",
      type: "markdown",
      uploadDate: "2024-03-18",
      size: "12 KB",
      isActive: false,
    },
  ])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const newRubric: RubricFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.name.endsWith(".pdf") ? "pdf" : "markdown",
        uploadDate: new Date().toISOString().split("T")[0],
        size: `${Math.round(file.size / 1024)} KB`,
        isActive: false,
      }

      setRubrics((prev) => [...prev, newRubric])
      toast.success(`${file.name} has been uploaded successfully.`)
    }
  }

  const handleDeleteRubric = (id: string) => {
    setRubrics((prev) => prev.filter((r) => r.id !== id))
    toast.success("Rubric file has been removed.")
  }

  const handleActivateRubric = (id: string) => {
    setRubrics((prev) =>
      prev.map((r) => ({
        ...r,
        isActive: r.id === id,
      })),
    )
    toast.success("This rubric is now active for evaluation.")
  }

  const getFileIcon = (type: string) => {
    return <FileText className="h-5 w-5 text-blue-500" />
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Evaluation Rubrics</CardTitle>
          <CardDescription>
            Upload PDF or Markdown files containing evaluation criteria and scoring guidelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rubric-upload">Upload Rubric File</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept=".pdf,.md,.markdown"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="rubric-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("rubric-upload")?.click()}
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">Supported formats: PDF, Markdown (.md)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Rubrics */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Rubrics</CardTitle>
          <CardDescription>Manage evaluation rubrics and scoring guidelines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rubrics.map((rubric) => (
              <div key={rubric.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getFileIcon(rubric.type)}
                  <div>
                    <h4 className="font-medium flex items-center gap-2">{rubric.name}</h4>
                    {rubric.isActive && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                    )}
                    <p className="text-sm text-gray-600">
                      {rubric.size} • Uploaded {rubric.uploadDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  {!rubric.isActive && (
                    <Button variant="outline" size="sm" onClick={() => handleActivateRubric(rubric.id)}>
                      Activate
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteRubric(rubric.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {rubrics.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No rubrics uploaded yet. Upload your first evaluation rubric above.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rubric Template */}
      <Card>
        <CardHeader>
          <CardTitle>Rubric Template</CardTitle>
          <CardDescription>Download a template to create standardized evaluation rubrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF Template
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Markdown Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
