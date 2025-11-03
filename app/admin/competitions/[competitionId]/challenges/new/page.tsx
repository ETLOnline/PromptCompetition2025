//admin\competitions\[competitionId]\challenges\new\page.tsx
"use client"

import type React from "react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, FileText, Image as ImageIcon, Plus, X, AlertCircle, CheckCircle2, Mic, Play, Pause } from 'lucide-react'
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
    systemPrompt: "",
    rubric: [{ name: "", description: "", weight: 1.0 }] as RubricItem[],
    guidelines: "",
    imageUrls: [] as string[],
    voiceNoteUrls: [] as string[],
  })
  
  const [userUID, setUserID] = useState(null);
  
  // Media states
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedVoiceNotes, setSelectedVoiceNotes] = useState<File[]>([])
  const [voiceNotePreviews, setVoiceNotePreviews] = useState<string[]>([])

  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  
  // Preview modal states
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewVoice, setPreviewVoice] = useState<string | null>(null)
    

  useEffect(() => {
    setPageLoading(true)
    checkAuthAndLoad();
    setPageLoading(false)
    
  }, [competitionId])

  useEffect(() => {
    return () => {
      // cleanup object URLs
      imagePreviews.forEach((p) => URL.revokeObjectURL(p))
      voiceNotePreviews.forEach((p) => URL.revokeObjectURL(p))
    }
  }, [imagePreviews, voiceNotePreviews])
  
  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])
  
  const checkAuthAndLoad = async () => {
    try {
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`);
      setUserID(profile.uid)
      // console.log("user role:", profile.role);
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
        systemPrompt: formData.systemPrompt,
        rubric: formData.rubric,
        guidelines: formData.guidelines,
        imageUrls: formData.imageUrls || [],
        voiceNoteUrls: formData.voiceNoteUrls || [],
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
      console.log("Upload error:", error)
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
      // Upload images first (if any)
      if (selectedImages.length > 0) {
        setUploadingImages(true)
        setUploadProgress({ current: 0, total: selectedImages.length })
        const uploadedUrls: string[] = []
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i]
          try {
            const url = await uploadFile(file, 'image')
            uploadedUrls.push(url)
            setUploadProgress((p) => ({ ...p, current: p.current + 1 }))
          } catch (err: any) {
            throw new Error(`Image upload failed: ${err?.message || err}`)
          }
        }
        setFormData((prev) => ({ ...prev, imageUrls: [...(prev.imageUrls || []), ...uploadedUrls] }))
        setUploadingImages(false)
      }

      // Upload voice notes (if any)
      if (selectedVoiceNotes.length > 0) {
        setUploadingVoice(true)
        const uploadedVoiceUrls: string[] = []
        for (let i = 0; i < selectedVoiceNotes.length; i++) {
          const file = selectedVoiceNotes[i]
          try {
            const url = await uploadFile(file, 'voice')
            uploadedVoiceUrls.push(url)
          } catch (err: any) {
            throw new Error(`Voice upload failed: ${err?.message || err}`)
          }
        }
        setFormData((prev) => ({ ...prev, voiceNoteUrls: [...(prev.voiceNoteUrls || []), ...uploadedVoiceUrls] }))
        setUploadingVoice(false)
      }

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

  // Upload helper
  const uploadFile = async (file: File, type: 'image' | 'voice'): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)

    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        body: fd,
      })

      if (!res || !res.success) throw new Error(res?.error || 'Upload failed')
      return res.url
    } catch (err: any) {
      throw err
    }
  }

  // Selection handlers
  const validateAndAddImages = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    const allowed = [
      'image/jpeg','image/jpg','image/png','image/gif','image/webp'
    ]

    const toAdd: File[] = []
    const previews: string[] = []

    for (const f of arr) {
      if (!allowed.includes(f.type)) {
        toast({ title: 'Invalid file', description: `${f.name} is not a supported image`, variant: 'destructive' })
        continue
      }
      toAdd.push(f)
      previews.push(URL.createObjectURL(f))
    }

    if (toAdd.length > 0) {
      setSelectedImages((s) => [...s, ...toAdd])
      setImagePreviews((p) => [...p, ...previews])
    }
  }

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddImages(e.target.files)
    e.target.value = ''
  }

  const removeNewImage = (index: number) => {
    // remove from selectedImages and imagePreviews
    setSelectedImages((s) => s.filter((_, i) => i !== index))
    setImagePreviews((p) => {
      const copy = [...p]
      const url = copy.splice(index, 1)[0]
      if (url) URL.revokeObjectURL(url)
      return copy
    })
  }

  const validateAndAddVoiceNotes = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    const allowed = ['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/webm','audio/x-m4a','audio/m4a']
    
    const toAdd: File[] = []
    const previews: string[] = []
    
    for (const f of arr) {
      if (!allowed.includes(f.type)) {
        toast({ title: 'Invalid file', description: `${f.name} is not a supported audio`, variant: 'destructive' })
        continue
      }
      toAdd.push(f)
      previews.push(URL.createObjectURL(f))
    }
    
    if (toAdd.length > 0) {
      setSelectedVoiceNotes((s) => [...s, ...toAdd])
      setVoiceNotePreviews((p) => [...p, ...previews])
    }
  }
  
  const handleVoiceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddVoiceNotes(e.target.files)
    e.target.value = ''
  }
  
  const removeVoiceNote = (index: number) => {
    setSelectedVoiceNotes((s) => s.filter((_, i) => i !== index))
    setVoiceNotePreviews((p) => {
      const copy = [...p]
      const url = copy.splice(index, 1)[0]
      if (url) URL.revokeObjectURL(url)
      return copy
    })
  }
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
        setSelectedVoiceNotes((s) => [...s, file])
        setVoiceNotePreviews((p) => [...p, URL.createObjectURL(file)])
        stream.getTracks().forEach(track => track.stop())
      }
      
      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (err) {
      toast({ title: 'Error', description: 'Could not access microphone', variant: 'destructive' })
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
              <div>
                <Label htmlFor="systemPrompt" className="text-sm font-medium text-gray-900 mb-2 block">
                  Evaluation Prompt
                </Label>
                <Textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={handleChange}
                  placeholder="Enter the system prompt for evaluation (e.g. instructions for judges or AI)"
                  rows={3}
                  className="border-gray-200 focus:border-gray-400 focus:ring-0 resize-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Challenge Media */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.15s_forwards]">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Challenge Media</h2>
              <p className="text-sm text-gray-500 mt-1">Add optional images and a voice note</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Images */}
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">Challenge Images (optional)</Label>
                <p className="text-xs text-gray-500 mb-3">Add visual clues and reference materials</p>

                {imagePreviews.length === 0 && (formData.imageUrls || []).length === 0 ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 p-6 rounded-md text-gray-500 cursor-pointer">
                    <ImageIcon className="w-6 h-6 mb-2" />
                    <span className="text-sm">Drag & drop or click to upload images</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageInput} />
                  </label>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(formData.imageUrls || []).map((url, i) => (
                        <div key={`existing-${i}`} className="relative overflow-hidden rounded-lg border cursor-pointer hover:opacity-90 transition-opacity" style={{ height: '120px' }} onClick={() => setPreviewImage(url)}>
                          <img src={url} alt={`img-${i}`} className="w-full h-full object-cover pointer-events-none" />
                          <button type="button" onClick={(e) => { e.stopPropagation(); setFormData((p)=> ({ ...p, imageUrls: (p.imageUrls||[]).filter((_, idx)=> idx !== i) })) }} className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 hover:opacity-100">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {imagePreviews.map((src, idx) => (
                        <div key={`new-${idx}`} className="relative overflow-hidden rounded-lg border cursor-pointer hover:opacity-90 transition-opacity" style={{ height: '120px' }} onClick={() => setPreviewImage(src)}>
                          <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover pointer-events-none" />
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeNewImage(idx) }} className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 hover:opacity-100">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3">
                      <input id="image-input" type="file" accept="image/*" multiple className="hidden" onChange={handleImageInput} />
                      <label htmlFor="image-input">
                        <Button type="button" variant="outline" className="px-3 py-2" onClick={(e) => { e.preventDefault(); document.getElementById('image-input')?.click() }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add More Images ({(formData.imageUrls||[]).length + imagePreviews.length})
                        </Button>
                      </label>
                    </div>
                  </>
                )}
              </div>

              {/* Voice Note */}
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">Voice Notes (optional)</Label>
                <p className="text-xs text-gray-500 mb-3">Upload or record audio instructions</p>

                <div className="space-y-3">
                  {/* Recording controls */}
                  <div className="flex gap-2">
                    {!isRecording ? (
                      <Button type="button" variant="outline" onClick={startRecording} className="flex-1">
                        <Mic className="w-4 h-4 mr-2" />
                        Record Voice Note
                      </Button>
                    ) : (
                      <Button type="button" variant="destructive" onClick={stopRecording} className="flex-1">
                        <Pause className="w-4 h-4 mr-2" />
                        Stop Recording ({formatTime(recordingTime)})
                      </Button>
                    )}
                    
                    <input id="voice-input" type="file" accept="audio/*" multiple className="hidden" onChange={handleVoiceInput} />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('voice-input')?.click()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  
                  {/* Existing voice notes from Firestore */}
                  {(formData.voiceNoteUrls || []).map((url, i) => (
                    <div key={`existing-voice-${i}`} className="bg-white border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">Voice Note {i + 1}</div>
                        <button type="button" onClick={() => setFormData((p)=> ({ ...p, voiceNoteUrls: (p.voiceNoteUrls||[]).filter((_, idx)=> idx !== i) }))} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <audio controls src={url} className="w-full" onClick={() => setPreviewVoice(url)} />
                    </div>
                  ))}
                  
                  {/* New voice notes to upload */}
                  {selectedVoiceNotes.map((file, idx) => (
                    <div key={`new-voice-${idx}`} className="bg-white border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">{file.name}</div>
                        <button type="button" onClick={() => removeVoiceNote(idx)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <audio controls src={voiceNotePreviews[idx]} className="w-full" onClick={() => setPreviewVoice(voiceNotePreviews[idx])} />
                    </div>
                  ))}
                  
                  {selectedVoiceNotes.length === 0 && (formData.voiceNoteUrls || []).length === 0 && !isRecording && (
                    <div className="text-center text-sm text-gray-400 py-4">
                      No voice notes added yet
                    </div>
                  )}
                </div>
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
              disabled={loading || uploadingImages || uploadingVoice || !weightValid}
              className="bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {uploadingImages ? `Uploading Images (${uploadProgress.current}/${uploadProgress.total})...` : uploadingVoice ? "Uploading Voice Note..." : (loading ? "Creating..." : "Create Challenge")}
            </Button>
          </div>
        </form>
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* Voice Preview Modal */}
      {previewVoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewVoice(null)}>
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
            <button
              type="button"
              onClick={() => setPreviewVoice(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-semibold mb-4">Voice Note Preview</h3>
            <audio controls src={previewVoice} className="w-full" autoPlay />
          </div>
        </div>
      )}

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
