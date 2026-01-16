//admin\competitions\[competitionId]\challenges\new\page.tsx
"use client"

import type React from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
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

type MultiAudioInputProps = {
  label: string
  description: string
  existingUrls: string[]
  selectedFiles: File[]
  filePreviews: string[]
  isRecording: boolean
  recordingTime: number
  onStartRecording: () => void
  onStopRecording: () => void
  onFileSelect: (files: FileList | null) => void
  onRemoveFile: (index: number) => void
  onRemoveExistingUrl: (index: number) => void
  onPreview: (url: string) => void
  inputId: string
}

// Multi Audio Input Component - Reusable helper for audio handling
const MultiAudioInput: React.FC<MultiAudioInputProps> = ({
  label,
  description,
  existingUrls,
  selectedFiles,
  filePreviews,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onFileSelect,
  onRemoveFile,
  onRemoveExistingUrl,
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
        {/* Recording controls */}
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
        
        {/* Existing audio files from Firestore */}
        {existingUrls.map((url, i) => (
          <div key={`existing-audio-${i}`} className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">Audio File {i + 1}</div>
              <button type="button" onClick={() => onRemoveExistingUrl(i)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <audio controls src={url} className="w-full h-8" onClick={() => onPreview(url)} />
          </div>
        ))}
        
        {/* New audio files to upload */}
        {selectedFiles.map((file, idx) => (
          <div key={`new-audio-${idx}`} className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">{file.name}</div>
              <button type="button" onClick={() => onRemoveFile(idx)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <audio controls src={filePreviews[idx]} className="w-full h-8" onClick={() => onPreview(filePreviews[idx])} />
          </div>
        ))}
        
        {selectedFiles.length === 0 && existingUrls.length === 0 && !isRecording && (
          <div className="text-center text-sm text-gray-400 py-4 border border-dashed border-gray-200 rounded-md">
            No audio files added yet
          </div>
        )}
      </div>
    </div>
  )
}

export default function NewCompetitionPage() {
  const router = useRouter()
  const params = useParams()
  const competitionId = params?.competitionId as string
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || 'dashboard'
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    problemStatement: "",
    systemPrompt: "",
    rubric: [{ name: "", description: "", weight: 1.0 }] as RubricItem[],
    guidelines: "",
    // Refactored: Specific URL arrays for each section
    problemAudioUrls: [] as string[],
    guidelinesAudioUrls: [] as string[],
    visualClueUrls: [] as string[],
  })
  
  const [userUID, setUserID] = useState(null);
  
  // ===== Problem Statement Audio States =====
  const [problemAudioFiles, setProblemAudioFiles] = useState<File[]>([])
  const [problemAudioPreviews, setProblemAudioPreviews] = useState<string[]>([])
  const [isProblemRecording, setIsProblemRecording] = useState(false)
  const [problemMediaRecorder, setProblemMediaRecorder] = useState<MediaRecorder | null>(null)
  const [problemRecordingTime, setProblemRecordingTime] = useState(0)
  
  // ===== Guidelines Audio States =====
  const [guidelinesAudioFiles, setGuidelinesAudioFiles] = useState<File[]>([])
  const [guidelinesAudioPreviews, setGuidelinesAudioPreviews] = useState<string[]>([])
  const [isGuidelinesRecording, setIsGuidelinesRecording] = useState(false)
  const [guidelinesMediaRecorder, setGuidelinesMediaRecorder] = useState<MediaRecorder | null>(null)
  const [guidelinesRecordingTime, setGuidelinesRecordingTime] = useState(0)
  
  // ===== Visual Clues (Images Only) States =====
  const [visualClueFiles, setVisualClueFiles] = useState<File[]>([])
  const [visualCluePreviews, setVisualCluePreviews] = useState<string[]>([])
  


  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  
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
      // cleanup object URLs for all preview types
      problemAudioPreviews.forEach((p) => URL.revokeObjectURL(p))
      guidelinesAudioPreviews.forEach((p) => URL.revokeObjectURL(p))
      visualCluePreviews.forEach((p) => URL.revokeObjectURL(p))
    }
  }, [problemAudioPreviews, guidelinesAudioPreviews, visualCluePreviews])
  
  // Problem Statement Recording Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isProblemRecording) {
      interval = setInterval(() => {
        setProblemRecordingTime((t) => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isProblemRecording])
  
  // Guidelines Recording Timer
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

  const uploadToFirestoreWithData = async (data: typeof formData) => {
    if (!userUID) {
      throw new Error("User not authenticated")
    }

    try {
      const userSnap = await getDoc(doc(db, "users", userUID))
      if (!userSnap.exists()) throw new Error("User document not found")
      const { email = "Not Found", fullName = "" } = userSnap.data()

      const challengeId = await getLatestCustomID(competitionId)

      const batch = writeBatch(db)

      const challengeRef = doc(db, "competitions", competitionId, "challenges", challengeId)
      batch.set(challengeRef, {
        title: data.title,
        problemStatement: data.problemStatement,
        problemAudioUrls: data.problemAudioUrls || [],
        systemPrompt: data.systemPrompt,
        rubric: data.rubric,
        guidelines: data.guidelines,
        guidelinesAudioUrls: data.guidelinesAudioUrls || [],
        visualClueUrls: data.visualClueUrls || [],
        emailoflatestupdate: email,
        nameoflatestupdate: fullName,
        lastupdatetime: Timestamp.now(),
      })

      const competitionRef = doc(db, "competitions", competitionId)
      batch.update(competitionRef, {
        ChallengeCount: increment(1),
      })

      await batch.commit()

      // Update maxScore of competition
      await getMaxScoreForCompetition(competitionId)
      
      console.log("Successfully uploaded to Firestore with all URLs:", {
        problemAudio: data.problemAudioUrls?.length || 0,
        guidelinesAudio: data.guidelinesAudioUrls?.length || 0,
        visualClues: data.visualClueUrls?.length || 0,
      })
    } catch (error: any) {
      console.log("Upload error:", error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation checks for rubric
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

    // Validation: Check mandatory visual clues requirement
    const hasVisualClues = (formData.visualClueUrls?.length || 0) + visualClueFiles.length > 0

    if (!hasVisualClues) {
      toast({
        title: "Missing Visual Clues",
        description: "Please add at least one image for the visual clues section",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Collect all uploaded URLs - Initialize with existing ones
      let finalProblemAudioUrls = [...(formData.problemAudioUrls || [])]
      let finalGuidelinesAudioUrls = [...(formData.guidelinesAudioUrls || [])]
      let finalVisualClueUrls = [...(formData.visualClueUrls || [])]

      // Calculate total files to upload
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
            console.log("Uploaded problem audio:", url)
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
            console.log("Uploaded guidelines audio:", url)
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
            console.log("Uploaded visual clue:", url)
            setUploadProgress((p) => ({ ...p, current: p.current + 1 }))
          } catch (err: any) {
            throw new Error(`Visual clue upload failed: ${err?.message || err}`)
          }
        }
      }



      // Now update formData with all URLs and upload to Firestore
      const finalFormData = {
        ...formData,
        problemAudioUrls: finalProblemAudioUrls,
        guidelinesAudioUrls: finalGuidelinesAudioUrls,
        visualClueUrls: finalVisualClueUrls,
      }

      // Upload to Firestore with the complete data
      await uploadToFirestoreWithData(finalFormData)
      
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
        description: "Challenge created successfully!",
      })
      router.push(`/admin/competitions/${competitionId}/${from}`)
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

  // ===== Problem Statement Audio Handlers =====
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

  const handleProblemAudioInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddProblemAudio(e.target.files)
    e.target.value = ''
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

  // ===== Guidelines Audio Handlers =====
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

  const handleGuidelinesAudioInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddGuidelinesAudio(e.target.files)
    e.target.value = ''
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

  // ===== Visual Clues Image Handlers =====
  const validateAndAddVisualClues = (files: FileList | null) => {
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
      setVisualClueFiles((s) => [...s, ...toAdd])
      setVisualCluePreviews((p) => [...p, ...previews])
    }
  }

  const handleVisualClueInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndAddVisualClues(e.target.files)
    e.target.value = ''
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

  const removeVisualClueUrl = (index: number) => {
    setFormData((p) => ({
      ...p,
      visualClueUrls: (p.visualClueUrls || []).filter((_, i) => i !== index)
    }))
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
              <p className="text-sm text-gray-500 mt-1">Provide the core detail for your challenge</p>
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
            </div>
          </div>

          {/* Problem Statement Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.15s_forwards]">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Problem Statement</h2>
              <p className="text-sm text-gray-500 mt-1">Describe the problem and provide audio guidance (at least one audio file required)</p>
            </div>

            <div className="space-y-5">
              {/* Text Area */}
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
                  rows={4}
                  className="border-gray-200 focus:border-gray-400 focus:ring-0 resize-none"
                />
              </div>

              {/* Audio Input */}
              <MultiAudioInput
                label="Problem Audio Files"
                description="Upload or record audio explaining the problem"
                existingUrls={formData.problemAudioUrls}
                selectedFiles={problemAudioFiles}
                filePreviews={problemAudioPreviews}
                isRecording={isProblemRecording}
                recordingTime={problemRecordingTime}
                onStartRecording={startProblemRecording}
                onStopRecording={stopProblemRecording}
                onFileSelect={(files) => validateAndAddProblemAudio(files)}
                onRemoveFile={removeProblemAudioFile}
                onRemoveExistingUrl={(idx) => setFormData((p) => ({ ...p, problemAudioUrls: (p.problemAudioUrls || []).filter((_, i) => i !== idx) }))}
                onPreview={setPreviewVoice}
                inputId="problem-audio-input"
              />
            </div>
          </div>

          {/* Guidelines Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.2s_forwards]">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Guidelines & Instructions</h2>
              <p className="text-sm text-gray-500 mt-1">Provide guidelines and instructions with required audio guidance (at least one audio file required)</p>
            </div>

            <div className="space-y-5">
              {/* Text Area */}
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
                  rows={4}
                  className="border-gray-200 focus:border-gray-400 focus:ring-0 resize-none"
                />
              </div>

              {/* Audio Input */}
              <MultiAudioInput
                label="Guidelines Audio Files"
                description="Upload or record audio explaining the guidelines"
                existingUrls={formData.guidelinesAudioUrls}
                selectedFiles={guidelinesAudioFiles}
                filePreviews={guidelinesAudioPreviews}
                isRecording={isGuidelinesRecording}
                recordingTime={guidelinesRecordingTime}
                onStartRecording={startGuidelinesRecording}
                onStopRecording={stopGuidelinesRecording}
                onFileSelect={(files) => validateAndAddGuidelinesAudio(files)}
                onRemoveFile={removeGuidelinesAudioFile}
                onRemoveExistingUrl={(idx) => setFormData((p) => ({ ...p, guidelinesAudioUrls: (p.guidelinesAudioUrls || []).filter((_, i) => i !== idx) }))}
                onPreview={setPreviewVoice}
                inputId="guidelines-audio-input"
              />
            </div>
          </div>

          {/* Visual Clues Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.25s_forwards]">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Visual Clues</h2>
              <p className="text-sm text-gray-500 mt-1">Add reference images (at least one image is required)</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-900 mb-2 block">Challenge Images</Label>
              <p className="text-xs text-gray-500 mb-3">Upload visual materials and reference images</p>

              {visualCluePreviews.length === 0 && (formData.visualClueUrls || []).length === 0 ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 p-6 rounded-md text-gray-500 cursor-pointer hover:border-gray-300 transition-colors">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Drag & drop or click to upload images</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WebP</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleVisualClueInput} />
                </label>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                    {(formData.visualClueUrls || []).map((url, i) => (
                      <div key={`existing-visual-${i}`} className="relative overflow-hidden rounded-lg border cursor-pointer hover:opacity-90 transition-opacity" style={{ height: '120px' }} onClick={() => setPreviewImage(url)}>
                        <img src={url} alt={`visual-${i}`} className="w-full h-full object-cover pointer-events-none" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeVisualClueUrl(i) }} className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {visualCluePreviews.map((src, idx) => (
                      <div key={`new-visual-${idx}`} className="relative overflow-hidden rounded-lg border cursor-pointer hover:opacity-90 transition-opacity" style={{ height: '120px' }} onClick={() => setPreviewImage(src)}>
                        <img src={src} alt={`visual-preview-${idx}`} className="w-full h-full object-cover pointer-events-none" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeVisualClueFile(idx) }} className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <input id="visual-input" type="file" accept="image/*" multiple className="hidden" onChange={handleVisualClueInput} />
                    <label htmlFor="visual-input">
                      <Button type="button" variant="outline" className="px-3 py-2" onClick={(e) => { e.preventDefault(); document.getElementById('visual-input')?.click() }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add More Images ({(formData.visualClueUrls||[]).length + visualCluePreviews.length})
                      </Button>
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* System Prompt */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.4s_forwards]">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Evaluation System Prompt</h2>
              <p className="text-sm text-gray-500 mt-1">Instructions for LLM evaluators</p>
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
                placeholder="Enter the system prompt for evaluation (e.g. instructions for LLM evaluators)"
                rows={4}
                className="border-gray-200 focus:border-gray-400 focus:ring-0 resize-none"
                required
              />
            </div>
          </div>


          {/* Evaluation Rubric */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.35s_forwards]">
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
                  style={{ animationDelay: `${0.35 + index * 0.1}s` }}
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

          
          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 opacity-0 animate-[fadeIn_0.5s_ease-in-out_0.45s_forwards]">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/competitions/${competitionId}/${from}`)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingFiles || !weightValid}
              className="bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {uploadingFiles ? `Uploading Files (${uploadProgress.current}/${uploadProgress.total})...` : (loading ? "Creating..." : "Create Challenge")}
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
