"use client"

import type React from "react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getAuth } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDocs, Timestamp, collection, getDoc, updateDoc, increment } from "firebase/firestore"
import { orderBy, limit, query } from "firebase/firestore"

// 🆕 RubricItem type
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
  const [startDeadline, setStartDeadline] = useState<string | null>(null)
  const [endDeadline, setEndDeadline] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problemStatement: "",
    rubric: [
      {
        name: "",
        description: "",
        weight: 1.0
      }
    ] as RubricItem[],
    guidelines: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      const competitionDoc = await getDoc(doc(db, "competitions", competitionId))
      if (competitionDoc.exists()) {
        const data = competitionDoc.data()
        const start = data.startDeadline?.toDate?.() ?? new Date(data.startDeadline)
        const end = data.endDeadline?.toDate?.() ?? new Date(data.endDeadline)
        setStartDeadline(start.toISOString().slice(0, 16))
        setEndDeadline(end.toISOString().slice(0, 16))
      }
      const user = await getAuth().currentUser?.getIdTokenResult()
      const claims = user?.claims as { role?: string }
      const role = claims?.role ?? null
      setUserRole(role)
    }
    fetchData()
  }, [competitionId])

  // Helper function to calculate total weight
  const calculateTotalWeight = (): number => {
    return formData.rubric.reduce((sum, item) => sum + item.weight, 0)
  }

  // Helper function to check if weights are valid (within tolerance)
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
    const ID = await getLatestCustomID(competitionId)
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")

    const userUID = user.uid
    const userDocRef = doc(db, "users", userUID)
    const userDocSnap = await getDoc(userDocRef)
    if (!userDocSnap.exists()) throw new Error("User document not found")

    const userData = userDocSnap.data()
    const email = userData.email ?? ""
    const fullName = userData.fullName ?? ""

    await setDoc(
      doc(db, "competitions", competitionId, "challenges", ID),
      {
        title: formData.title,
        problemStatement: formData.problemStatement,
        rubric: formData.rubric, // 🆕 Store structured rubric array
        guidelines: formData.guidelines,
        startDeadline: Timestamp.fromDate(new Date(startDeadline!)),
        endDeadline: Timestamp.fromDate(new Date(endDeadline!)),
        emailoflatestupdate: email,
        nameoflatestupdate: fullName,
        lastupdatetime: Timestamp.now(),
      }
    )
        
    // Increment the ChallengeCount in the competition document
    const competitionDocRef = doc(db, "competitions", competitionId)
    await updateDoc(competitionDocRef, {
      ChallengeCount: increment(1),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate rubric weights
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

  const handleDeadlineChange = (key: "start" | "end", value: string) => {
    if (key === "start") setStartDeadline(value)
    else setEndDeadline(value)
  }

  const totalWeight = calculateTotalWeight()
  const weightValid = isWeightValid()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-150">
      <header className="bg-gradient-to-r from-slate-100 to-slate-150 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full flex items-center py-6 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Challenge</h1>
            </div>
            <div>
              <Button
                variant="ghost"
                onClick={() => router.push(`/admin/competitions/${competitionId}/dashboard`)}
                className="mr-4 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-150 rounded-t-xl">
              <CardTitle className="text-xl font-bold text-gray-900">Challenge Details</CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Fill in the details for the new Challenge. All fields are required.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Challenge Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter Challenge title"
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problemStatement" className="text-sm font-medium text-gray-700">
                    Problem Statement
                  </Label>
                  <Textarea
                    id="problemStatement"
                    name="problemStatement"
                    value={formData.problemStatement}
                    onChange={handleChange}
                    placeholder="Detailed problem statement"
                    rows={6}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200 resize-none"
                    required
                  />
                </div>

                {/* 🆕 Rubric Builder Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">
                      Evaluation Rubric
                    </Label>
                    <div className="flex items-center gap-4">
                      <div className={`text-sm font-medium ${weightValid ? 'text-green-600' : 'text-red-600'}`}>
                        Total Weight: {totalWeight.toFixed(2)} / 1.00
                      </div>
                      {!weightValid && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs font-medium">Must equal 1.0</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {formData.rubric.map((item, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-sm font-medium text-gray-700">
                              Criterion {index + 1}
                            </h4>
                            {formData.rubric.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRubricItem(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`rubric-name-${index}`} className="text-xs font-medium text-gray-600">
                                Name
                              </Label>
                              <Input
                                id={`rubric-name-${index}`}
                                value={item.name}
                                onChange={(e) => handleRubricChange(index, 'name', e.target.value)}
                                placeholder="e.g., Clarity"
                                className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`rubric-description-${index}`} className="text-xs font-medium text-gray-600">
                                Description
                              </Label>
                              <Textarea
                                id={`rubric-description-${index}`}
                                value={item.description}
                                onChange={(e) => handleRubricChange(index, 'description', e.target.value)}
                                placeholder="e.g., How clearly is the prompt phrased?"
                                rows={2}
                                className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200 resize-none"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`rubric-weight-${index}`} className="text-xs font-medium text-gray-600">
                                Weight
                              </Label>
                              <Input
                                id={`rubric-weight-${index}`}
                                type="number"
                                min="0"
                                max="1"
                                step="0.01"
                                value={item.weight}
                                onChange={(e) => handleRubricChange(index, 'weight', parseFloat(e.target.value) || 0)}
                                className="w-24 bg-gray-50 border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200"
                                required
                              />
                              <span className="text-xs text-gray-500">
                                ({(item.weight * 100).toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {formData.rubric.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRubricItem}
                      className="w-full border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Criterion ({formData.rubric.length}/10)
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guidelines" className="text-sm font-medium text-gray-700">
                    Submission Guidelines
                  </Label>
                  <Textarea
                    id="guidelines"
                    name="guidelines"
                    value={formData.guidelines}
                    onChange={handleChange}
                    placeholder="Submission guidelines"
                    rows={4}
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all duration-200 resize-none"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={loading || !weightValid}
                    className="bg-gradient-to-r from-gray-700 to-gray-600 text-white hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium px-6"
                  >
                    {loading ? "Creating..." : "Create Challenge"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/competitions/${competitionId}/dashboard`)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 bg-transparent px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
