"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, Mic, Pause, Calendar } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDocs, Timestamp, collection, getDoc } from "firebase/firestore"
import { fetchWithAuth } from "@/lib/api"

type MultiAudioInputProps = {
  label: string
  description: string
  selectedFiles: File[]
  filePreviews: string[]
  isRecording: boolean
  recordingTime: number
  onStartRecording: () => void
  onStopRecording: () => void
  onFileSelect: (files: FileList | null) => void
  onRemoveFile: (index: number) => void
  onPreview: (url: string) => void
  inputId: string
}

const MultiAudioInput: React.FC<MultiAudioInputProps> = ({
  label,
  description,
  selectedFiles,
  filePreviews,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onFileSelect,
  onRemoveFile,
  onPreview,
  inputId,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div>
      <Label className="text-sm font-medium text-gray-900 mb-2 block">{label}</Label>
      <p className="text-xs text-gray-500 mb-3">{description}</p>

      <div className="space-y-3">
        <div className="flex gap-2">
          {!isRecording ? (
            <Button type="button" variant="outline" onClick={onStartRecording} className="flex-1">
              <Mic className="w-4 h-4 mr-2" />
              Record Audio
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={onStopRecording} className="flex-1">
              <Pause className="w-4 h-4 mr-2" />
              Stop Recording ({formatTime(recordingTime)})
            </Button>
          )}
          
          <input id={inputId} type="file" accept="audio/*" multiple className="hidden" onChange={(e) => onFileSelect(e.target.files)} />
          <Button type="button" variant="outline" onClick={() => document.getElementById(inputId)?.click()}>
            <Plus className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
        
        {selectedFiles.map((file, idx) => (
          <div key={`audio-${idx}`} className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">{file.name}</div>
              <button type="button" onClick={() => onRemoveFile(idx)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <audio controls src={filePreviews[idx]} className="w-full h-8" />
          </div>
        ))}
        
        {selectedFiles.length === 0 && !isRecording && (
          <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-md">
            <p className="text-sm text-gray-500">No audio files added yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NewDailyChallengeePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    type: "direct" as "direct" | "reverse",
    problemStatement: "",
    guidelines: "",
    startDate: "",
  })
  
  const [userUID, setUserID] = useState<string | null>(null)
  
  // Problem Statement Audio States
  const [problemAudioFiles, setProblemAudioFiles] = useState<File[]>([])
  const [problemAudioPreviews, setProblemAudioPreviews] = useState<string[]>([])
  const [isProblemRecording, setIsProblemRecording] = useState(false)
  const [problemMediaRecorder, setProblemMediaRecorder] = useState<MediaRecorder | null>(null)
  const [problemRecordingTime, setProblemRecordingTime] = useState(0)
  
  // Guidelines Audio States
  const [guidelinesAudioFiles, setGuidelinesAudioFiles] = useState<File[]>([])
  const [guidelinesAudioPreviews, setGuidelinesAudioPreviews] = useState<string[]>([])
  const [isGuidelinesRecording, setIsGuidelinesRecording] = useState(false)
  const [guidelinesMediaRecorder, setGuidelinesMediaRecorder] = useState<MediaRecorder | null>(null)
  const [guidelinesRecordingTime, setGuidelinesRecordingTime] = useState(0)
  
  // Visual Clues (Images) States
  const [visualClueFiles, setVisualClueFiles] = useState<File[]>([])
  const [visualCluePreviews, setVisualCluePreviews] = useState<string[]>([])

  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  
  // Preview modal states
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewVoice, setPreviewVoice] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  useEffect(() => {
    return () => {
      problemAudioPreviews.forEach((p) => URL.revokeObjectURL(p))
      guidelinesAudioPreviews.forEach((p) => URL.revokeObjectURL(p))
      visualCluePreviews.forEach((p) => URL.revokeObjectURL(p))
    }
  }, [problemAudioPreviews, guidelinesAudioPreviews, visualCluePreviews])
  
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isProblemRecording) {
      interval = setInterval(() => {
        setProblemRecordingTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isProblemRecording])
  
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isGuidelinesRecording) {
      interval = setInterval(() => {
        setGuidelinesRecordingTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isGuidelinesRecording])

  const checkAuthAndLoad = async () => {
    try {
      setPageLoading(true)
      const profile = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_ADMIN_AUTH}`)
      if (profile.role !== "superadmin") {
        router.push("/admin/select-competition")
        return
      }
      setUserID(profile.uid)
    } catch (error) {
      router.push("/")
    } finally {
      setPageLoading(false)
    }
  }

  const getLatestCustomID = async (): Promise<string> => {
    const querySnapshot = await getDocs(collection(db, "dailychallenge"))
    const ids: number[] = []
    querySnapshot.forEach((doc) => {
      const numericID = Number.parseInt(doc.id, 10)
      if (!isNaN(numericID)) ids.push(numericID)
    })
    const nextID = ids.length === 0 ? 1 : Math.max(...ids) + 1
    return nextID.toString().padStart(2, "0")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: Either problem statement text or audio must be provided
    const hasProblemText = formData.problemStatement.trim().length > 0
    const hasProblemAudio = problemAudioFiles.length > 0

    if (!hasProblemText && !hasProblemAudio) {
      toast({
        title: "Missing Problem Statement",
        description: "Please provide either problem statement text or audio file",
        variant: "destructive",
      })
      return
    }

    // Validation: Either guidelines text or audio must be provided
    const hasGuidelinesText = formData.guidelines.trim().length > 0
    const hasGuidelinesAudio = guidelinesAudioFiles.length > 0

    if (!hasGuidelinesText && !hasGuidelinesAudio) {
      toast({
        title: "Missing Guidelines",
        description: "Please provide either guidelines text or audio file",
        variant: "destructive",
      })
      return
    }

    // Validation: Start date is required
    if (!formData.startDate) {
      toast({
        title: "Missing Start Date",
        description: "Please select a start date for the challenge",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let finalProblemAudioUrls: string[] = []
      let finalGuidelinesAudioUrls: string[] = []
      let finalVisualClueUrls: string[] = []

      const totalFilesToUpload = 
        problemAudioFiles.length + 
        guidelinesAudioFiles.length + 
        visualClueFiles.length

      setUploadProgress({ current: 0, total: totalFilesToUpload })

      // Upload Problem Audio Files
      if (problemAudioFiles.length > 0) {
        setUploadingFiles(true)
        for (let i = 0; i < problemAudioFiles.length; i++) {
          const file = problemAudioFiles[i]
          try {
            const url = await uploadFile(file, 'voice')
            finalProblemAudioUrls.push(url)
            setUploadProgress((p) => ({ ...p, current: p.current + 1 }))
          } catch (err: any) {
            throw new Error(`Problem audio upload failed: ${err?.message || err}`)
          }
        }
      }

      // Upload Guidelines Audio Files
      if (guidelinesAudioFiles.length > 0) {
        for (let i = 0; i < guidelinesAudioFiles.length; i++) {
          const file = guidelinesAudioFiles[i]
          try {
            const url = await uploadFile(file, 'voice')
            finalGuidelinesAudioUrls.push(url)
            setUploadProgress((p) => ({ ...p, current: p.current + 1 }))
          } catch (err: any) {
            throw new Error(`Guidelines audio upload failed: ${err?.message || err}`)
          }
        }
      }

      // Upload Visual Clue Images
      if (visualClueFiles.length > 0) {
        for (let i = 0; i < visualClueFiles.length; i++) {
          const file = visualClueFiles[i]
          try {
            const url = await uploadFile(file, 'image')
            finalVisualClueUrls.push(url)
            setUploadProgress((p) => ({ ...p, current: p.current + 1 }))
          } catch (err: any) {
            throw new Error(`Visual clue upload failed: ${err?.message || err}`)
          }
        }
      }

      // Get user details
      if (!userUID) throw new Error("User not authenticated")
      
      const userSnap = await getDoc(doc(db, "users", userUID))
      if (!userSnap.exists()) throw new Error("User document not found")
      const { email = "Not Found", fullName = "" } = userSnap.data()

      // Get next challenge ID
      const challengeId = await getLatestCustomID()

      // Calculate end date (24 hours after start date)
      const startDateTime = new Date(formData.startDate)
      startDateTime.setHours(0, 0, 0, 0) // Start at midnight
      const endDateTime = new Date(startDateTime)
      endDateTime.setHours(23, 59, 59, 999) // End at 23:59:59

      // Create challenge document
      const challengeRef = doc(db, "dailychallenge", challengeId)
      await setDoc(challengeRef, {
        title: formData.title,
        type: formData.type,
        problemStatement: formData.problemStatement,
        problemAudioUrls: finalProblemAudioUrls,
        guidelines: formData.guidelines,
        guidelinesAudioUrls: finalGuidelinesAudioUrls,
        visualClueUrls: finalVisualClueUrls,
        startTime: Timestamp.fromDate(startDateTime),
        endTime: Timestamp.fromDate(endDateTime),
        totalSubmissions: 0,
        createdBy: fullName || email,
        createdByEmail: email,
        lastUpdatedBy: fullName || email,
        lastUpdateTime: Timestamp.now(),
        createdAt: Timestamp.now(),
        status: "upcoming", // Will be updated based on dates
      })

      // Update stats document
      const statsRef = doc(db, "stats","dailychallenge")
      const statsSnap = await getDoc(statsRef)
      
      if (!statsSnap.exists()) {
        // Create new stats document
        await setDoc(statsRef, {
          Totalchallenges: 1,
          totalsubmission: 0,
        })
      } else {
        // Increment total challenges
        const currentTotal = statsSnap.data().Totalchallenges || 0
        await setDoc(statsRef, {
          Totalchallenges: currentTotal + 1,
          totalsubmission: statsSnap.data().totalsubmission || 0,
        })
      }

      // Clear all file states
      setProblemAudioFiles([])
      setProblemAudioPreviews([])
      setGuidelinesAudioFiles([])
      setGuidelinesAudioPreviews([])
      setVisualClueFiles([])
      setVisualCluePreviews([])

      setUploadingFiles(false)

      toast({
        title: "Success",
        description: "Daily challenge created successfully!",
      })
      router.push("/admin/daily-challenge")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive",
      })
      console.error("Create error:", error)
    } finally {
      setLoading(false)
      setUploadingFiles(false)
    }
  }

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

  // Problem Statement Audio Handlers
  const validateAndAddProblemAudio = (files: FileList | null) => {
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
      setProblemAudioFiles((s) => [...s, ...toAdd])
      setProblemAudioPreviews((p) => [...p, ...previews])
    }
  }

  const removeProblemAudioFile = (index: number) => {
    setProblemAudioFiles((s) => s.filter((_, i) => i !== index))
    setProblemAudioPreviews((p) => {
      const copy = [...p]
      const url = copy.splice(index, 1)[0]
      if (url) URL.revokeObjectURL(url)
      return copy
    })
  }

  const startProblemRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `problem-recording-${Date.now()}.webm`, { type: 'audio/webm' })
        setProblemAudioFiles((s) => [...s, file])
        setProblemAudioPreviews((p) => [...p, URL.createObjectURL(file)])
        stream.getTracks().forEach(track => track.stop())
      }
      
      setProblemMediaRecorder(recorder)
      recorder.start()
      setIsProblemRecording(true)
      setProblemRecordingTime(0)
    } catch (err) {
      toast({ title: 'Error', description: 'Could not access microphone', variant: 'destructive' })
    }
  }

  const stopProblemRecording = () => {
    if (problemMediaRecorder && isProblemRecording) {
      problemMediaRecorder.stop()
      setIsProblemRecording(false)
      setProblemMediaRecorder(null)
    }
  }

  // Guidelines Audio Handlers
  const validateAndAddGuidelinesAudio = (files: FileList | null) => {
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
      setGuidelinesAudioFiles((s) => [...s, ...toAdd])
      setGuidelinesAudioPreviews((p) => [...p, ...previews])
    }
  }

  const removeGuidelinesAudioFile = (index: number) => {
    setGuidelinesAudioFiles((s) => s.filter((_, i) => i !== index))
    setGuidelinesAudioPreviews((p) => {
      const copy = [...p]
      const url = copy.splice(index, 1)[0]
      if (url) URL.revokeObjectURL(url)
      return copy
    })
  }

  const startGuidelinesRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], `guidelines-recording-${Date.now()}.webm`, { type: 'audio/webm' })
        setGuidelinesAudioFiles((s) => [...s, file])
        setGuidelinesAudioPreviews((p) => [...p, URL.createObjectURL(file)])
        stream.getTracks().forEach(track => track.stop())
      }
      
      setGuidelinesMediaRecorder(recorder)
      recorder.start()
      setIsGuidelinesRecording(true)
      setGuidelinesRecordingTime(0)
    } catch (err) {
      toast({ title: 'Error', description: 'Could not access microphone', variant: 'destructive' })
    }
  }

  const stopGuidelinesRecording = () => {
    if (guidelinesMediaRecorder && isGuidelinesRecording) {
      guidelinesMediaRecorder.stop()
      setIsGuidelinesRecording(false)
      setGuidelinesMediaRecorder(null)
    }
  }

  // Visual Clues Image Handlers
  const validateAndAddVisualClues = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    const allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp']

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
      setVisualClueFiles((s) => [...s, ...toAdd])
      setVisualCluePreviews((p) => [...p, ...previews])
    }
  }

  const removeVisualClueFile = (index: number) => {
    setVisualClueFiles((s) => s.filter((_, i) => i !== index))
    setVisualCluePreviews((p) => {
      const copy = [...p]
      const url = copy.splice(index, 1)[0]
      if (url) URL.revokeObjectURL(url)
      return copy
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between py-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-24 bg-gray-100 rounded animate-pulse" />
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
                <h1 className="text-2xl font-semibold text-gray-900">Create Daily Challenge</h1>
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
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                <p className="text-sm text-gray-600">Provide the core details for your challenge</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-900 mb-2 block">
                  Challenge Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter challenge title..."
                  required
                  className="border-gray-300"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2 block">Challenge Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="direct"
                      checked={formData.type === "direct"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#0f172a] border-gray-300 focus:ring-[#0f172a] focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">Direct</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="reverse"
                      checked={formData.type === "reverse"}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#0f172a] border-gray-300 focus:ring-[#0f172a] focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">Reverse</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Problem Statement</h2>
                <p className="text-sm text-gray-600">Describe the problem and provide audio guidance</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="problemStatement" className="text-sm font-medium text-gray-900 mb-2 block">
                  Problem Statement Text
                </Label>
                <Textarea
                  id="problemStatement"
                  name="problemStatement"
                  value={formData.problemStatement}
                  onChange={handleChange}
                  placeholder="Clearly describe the problem participants need to solve..."
                  rows={6}
                  className="border-gray-300"
                />
              </div>

              <MultiAudioInput
                label="Problem Audio Files"
                description="Upload or record audio explaining the problem"
                selectedFiles={problemAudioFiles}
                filePreviews={problemAudioPreviews}
                isRecording={isProblemRecording}
                recordingTime={problemRecordingTime}
                onStartRecording={startProblemRecording}
                onStopRecording={stopProblemRecording}
                onFileSelect={validateAndAddProblemAudio}
                onRemoveFile={removeProblemAudioFile}
                onPreview={setPreviewVoice}
                inputId="problem-audio-input"
              />
            </div>
          </div>

          {/* Guidelines & Instructions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Guidelines & Instructions</h2>
                <p className="text-sm text-gray-600">Provide guidelines and instructions with audio guidance</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="guidelines" className="text-sm font-medium text-gray-900 mb-2 block">
                  Guidelines Text
                </Label>
                <Textarea
                  id="guidelines"
                  name="guidelines"
                  value={formData.guidelines}
                  onChange={handleChange}
                  placeholder="Provide instructions to guide the participants..."
                  rows={6}
                  className="border-gray-300"
                />
              </div>

              <MultiAudioInput
                label="Guidelines Audio Files"
                description="Upload or record audio explaining the guidelines"
                selectedFiles={guidelinesAudioFiles}
                filePreviews={guidelinesAudioPreviews}
                isRecording={isGuidelinesRecording}
                recordingTime={guidelinesRecordingTime}
                onStartRecording={startGuidelinesRecording}
                onStopRecording={stopGuidelinesRecording}
                onFileSelect={validateAndAddGuidelinesAudio}
                onRemoveFile={removeGuidelinesAudioFile}
                onPreview={setPreviewVoice}
                inputId="guidelines-audio-input"
              />
            </div>
          </div>

          {/* Visual Clues */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Visual Clues</h2>
                <p className="text-sm text-gray-600">Add reference images</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-900 mb-2 block">Challenge Images</Label>
              <p className="text-xs text-gray-500 mb-3">Upload visual materials and reference images</p>

              <div className="space-y-3">
                <input
                  id="visual-clue-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => validateAndAddVisualClues(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('visual-clue-input')?.click()}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {visualClueFiles.map((file, idx) => (
                    <div key={`img-${idx}`} className="relative group">
                      <img
                        src={visualCluePreviews[idx]}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeVisualClueFile(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {visualClueFiles.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500">No images added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Challenge Start Date */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Challenge Schedule</h2>
                <p className="text-sm text-gray-600">Set the start date (challenge runs for 24 hours)</p>
              </div>
            </div>

            <div>
              <Label htmlFor="startDate" className="text-sm font-medium text-gray-900 mb-2 block">
                Start Date
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="border-gray-300"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-2">
                Challenge will automatically end 24 hours after the start date
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingFiles}
              className="bg-gray-900 hover:bg-gray-800"
            >
              {uploadingFiles
                ? `Uploading... ${uploadProgress.current}/${uploadProgress.total}`
                : loading
                ? "Creating..."
                : "Create Challenge"}
            </Button>
          </div>
        </form>
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* Voice Preview Modal */}
      {previewVoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewVoice(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Audio Preview</h3>
              <button onClick={() => setPreviewVoice(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <audio controls src={previewVoice} className="w-full" />
          </div>
        </div>
      )}

      <style jsx global>{`
        input[type="radio"]:checked {
          background-color: #0f172a !important;
          border-color: #0f172a !important;
          accent-color: #0f172a !important;
        }
        input[type="radio"]:checked:hover {
          background-color: #0f172a !important;
          border-color: #0f172a !important;
        }
        input[type="radio"]:checked:focus {
          background-color: #0f172a !important;
          border-color: #0f172a !important;
        }
        input[type="radio"] {
          accent-color: #0f172a !important;
        }
      `}</style>
    </div>
  )
}
