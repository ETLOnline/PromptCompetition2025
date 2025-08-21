"use client"

import type React from "react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, FileText, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDocs, Timestamp, collection, getDoc, writeBatch, increment } from "firebase/firestore"

import { fetchWithAuth } from "@/lib/api";

import { getMaxScoreForCompetition } from "@/lib/challengeScore"

  
type RubricItem = {
  name: string
  description: string
  weight: number
}

export default function NewCompetitionPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    problemStatement: "",
    rubric: [{ name: "", description: "", weight: 1.0 }] as RubricItem[],
    guidelines: "",
  })
  
  const [userUID, setUserID] = useState(null);
    

  useEffect(() => {
    setPageLoading(true)
    checkAuthAndLoad();
    setPageLoading(false)
    
  }, [competitionId])
  
  const checkAuthAndLoad = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`);
      setUserID(profile.uid)
    } catch (error) {
      router.push("/");
    } finally {
      setLoading(false);
    }
  };
  

  const calculateTotalWeight = (): number => {
    return formData.rubric.reduce((sum, item) => sum + item.weight, 0)
  }

  const isWeightValid = (): boolean => {
    const total = calculateTotalWeight()
    return Math.abs(total - 1.0) <= 0.01
  }

  const getLatestCustomID = async (competitionId: string): Promise<string> => {
    const querySnapshot = await getDocs(
      collection(db, "competitions", competitionId, "challenges")
    )
    const ids: number[] = []
    querySnapshot.forEach((doc) => {
      const numericID = Number.parseInt(doc.id, 10)
      if (!isNaN(numericID)) ids.push(numericID)
    })
    const nextID = ids.length === 0 ? 1 : Math.max(...ids) + 1
    return nextID.toString().padStart(2, "0")
  }

  const uploadToFirestore = async () => {
    if (!userUID) {
      throw new Error("User not authenticated")
    }

    try {
      // Optional: if you already have fullName/email in context, skip this block
      const userSnap = await getDoc(doc(db, "users", userUID))
      if (!userSnap.exists()) throw new Error("User document not found")
      const { email = "Not Found", fullName = "" } = userSnap.data()

      const challengeId = await getLatestCustomID(competitionId)

      // 1) Build the batch
      const batch = writeBatch(db)

      const challengeRef = doc(db, "competitions", competitionId, "challenges", challengeId)
      batch.set(challengeRef, {
        title: formData.title,
        problemStatement: formData.problemStatement,
        rubric: formData.rubric,
        guidelines: formData.guidelines,
        emailoflatestupdate: email,
        nameoflatestupdate: fullName,
        lastupdatetime: Timestamp.now(),
      })

      const competitionRef = doc(db, "competitions", competitionId)
      batch.update(competitionRef, {
        ChallengeCount: increment(1),
      })

      // 2) Commit batch
      await batch.commit()

      // 3) Update maxScore of competition
      await getMaxScoreForCompetition(competitionId)
    } catch (error: any) {
      toast({
        title: "error",
        description: "Failed to create challenge. Please try again."})
      throw error
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // New check: ensure all weights are > 0
    if (formData.rubric.some(item => item.weight <= 0)) {
      toast({
        title: "Invalid Rubric",
        description: "Each rubric weight must be greater than 0",
        variant: "destructive",
      })
      return
    }

    if (!isWeightValid()) {
      toast({
        title: "Invalid Rubric",
        description: "Rubric weights must sum to exactly 1.0",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await uploadToFirestore()
      toast({
        title: "Success",
        description: "Challenge created successfully!",
      })
      router.push(`/admin/competitions/${competitionId}/dashboard`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive",
      })
      console.error("Create error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleRubricChange = (index: number, field: keyof RubricItem, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      rubric: prev.rubric.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addRubricItem = () => {
    if (formData.rubric.length < 10) {
      setFormData((prev) => ({
        ...prev,
        rubric: [...prev.rubric, { name: "", description: "", weight: 0 }]
      }))
    }
  }

  const removeRubricItem = (index: number) => {
    if (formData.rubric.length > 1) {
      setFormData((prev) => ({
        ...prev,
        rubric: prev.rubric.filter((_, i) => i !== index)
      }))
    }
  }

  const totalWeight = calculateTotalWeight()
  const weightValid = isWeightValid()

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-4">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )

  if (pageLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Create Challenge</h1>
                <p className="text-sm text-gray-500">Define evaluation criteria and requirements</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.1s_forwards]">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-500 mt-1">Provide the core details for your challenge</p>
            </div>
            
            <div className="space-y-5">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-900 mb-2 block">
                  Challenge Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a clear, descriptive title"
                  className="h-11 border-gray-200 focus:border-gray-400 focus:ring-0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="problemStatement" className="text-sm font-medium text-gray-900 mb-2 block">
                  Problem Statement
                </Label>
                <Textarea
                  id="problemStatement"
                  name="problemStatement"
                  value={formData.problemStatement}
                  onChange={handleChange}
                  placeholder="Clearly describe the problem participants need to solve..."
                  rows={4}
                  className="border-gray-200 focus:border-gray-400 focus:ring-0 resize-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Evaluation Rubric */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.2s_forwards]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Evaluation Rubric</h2>
                <p className="text-sm text-gray-500 mt-1">Define weighted criteria for fair evaluation</p>
              </div>
              
              <div className="flex items-center gap-3">
                {weightValid ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Valid</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                      {totalWeight.toFixed(2)} / 1.00
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {formData.rubric.map((item, index) => (
                <div 
                  key={index} 
                  className="border border-gray-100 rounded-lg p-5 bg-gray-50/50 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  {/* Criterion Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-gray-900 text-white rounded-md flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Criterion {index + 1}</h4>
                        <p className="text-xs text-gray-500">{(item.weight * 100).toFixed(0)}% weight</p>
                      </div>
                    </div>
                    
                    {formData.rubric.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRubricItem(index)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <Label htmlFor={`rubric-name-${index}`} className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Criterion Name
                      </Label>
                      <Input
                        id={`rubric-name-${index}`}
                        value={item.name}
                        onChange={(e) => handleRubricChange(index, 'name', e.target.value)}
                        placeholder="e.g., Clarity & Communication"
                        className="h-10 bg-white border-gray-200 focus:border-gray-400 focus:ring-0"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`rubric-weight-${index}`} className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Weight (0-1)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`rubric-weight-${index}`}
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={item.weight}
                          onChange={(e) => handleRubricChange(index, 'weight', parseFloat(e.target.value) || 0)}
                          className="h-10 bg-white border-gray-200 focus:border-gray-400 focus:ring-0"
                          required
                        />
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(item.weight * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`rubric-description-${index}`} className="text-xs font-medium text-gray-700 mb-1.5 block">
                      Description & Guidelines
                    </Label>
                    <Textarea
                      id={`rubric-description-${index}`}
                      value={item.description}
                      onChange={(e) => handleRubricChange(index, 'description', e.target.value)}
                      placeholder="Describe what this criterion evaluates and how it should be assessed..."
                      rows={2}
                      className="bg-white border-gray-200 focus:border-gray-400 focus:ring-0 resize-none"
                      required
                    />
                  </div>
                </div>
              ))}

              {/* Add Criterion Button - Moved to bottom */}
              {formData.rubric.length < 10 && (
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={addRubricItem}
                    variant="outline"
                    className="w-full h-12 border-2 border-dashed border-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Criterion ({formData.rubric.length}/10)
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.4s_forwards]">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">How to craft your prompt</h2>
              <p className="text-sm text-gray-500 mt-1">Provide clear instructions for participants</p>
            </div>
            
            <div>
              <Label htmlFor="guidelines" className="text-sm font-medium text-gray-900 mb-2 block">
                Guidelines
              </Label>
              <Textarea
                id="guidelines"
                name="guidelines"
                value={formData.guidelines}
                onChange={handleChange}
                placeholder="Provide instructions to guide the participants..."
                rows={4}
                className="border-gray-200 focus:border-gray-400 focus:ring-0 resize-none"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.5s_forwards]">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/competitions/${competitionId}/dashboard`)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !weightValid}
              className="bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Challenge"}
            </Button>
          </div>
        </form>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
