"use client"

import { useState, useEffect, useRef } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, MessageSquare, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"
import { useToast } from "@/hooks/use-toast"

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false,
  loading: () => <div className="h-[200px] animate-pulse bg-gray-50 rounded"></div>
})

// Create a client-side only sanitizer
const sanitizeHTML = (html: string) => {
  if (typeof window === "undefined") return html
  const DOMPurify = require("isomorphic-dompurify")
  return DOMPurify.sanitize(html)
}

interface JudgeFeedbackSectionProps {
  challengeId: string
  challengeTitle: string
  userRole: "participant" | "admin" | "judge" | "superadmin"
}

interface FeedbackData {
  content: string
  updatedAt: any
  updatedBy: string
}

export const JudgeFeedbackSection = ({
  challengeId,
  challengeTitle,
  userRole,
}: JudgeFeedbackSectionProps) => {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editorContent, setEditorContent] = useState("")
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const canEdit = ["admin", "judge", "superadmin"].includes(userRole)

  useEffect(() => {
    fetchFeedback()
  }, [challengeId])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      const feedbackRef = doc(db, "dailychallenge", challengeId, "judgefeedback", "main_feedback")
      const feedbackDoc = await getDoc(feedbackRef)

      if (feedbackDoc.exists()) {
        setFeedback(feedbackDoc.data() as FeedbackData)
        setEditorContent(feedbackDoc.data().content || "")
      } else {
        setFeedback(null)
        setEditorContent("")
      }
    } catch (error) {
      console.error("Error fetching judge feedback:", error)
      toast({
        title: "Error loading feedback",
        description: "Failed to load judge feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFeedback = async () => {
    if (!user || !canEdit) return

    if (!editorContent.trim() || editorContent === "<p><br></p>") {
      toast({
        title: "Empty feedback",
        description: "Please write some feedback before saving.",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const feedbackRef = doc(db, "dailychallenge", challengeId, "judgefeedback", "main_feedback")

      await setDoc(
        feedbackRef,
        {
          content: editorContent,
          updatedAt: serverTimestamp(),
          updatedBy: user.id,
        },
        { merge: true }
      )

      await fetchFeedback()
      setIsEditing(false)

      toast({
        title: "Feedback saved",
        description: "Judge feedback has been successfully saved.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error saving feedback:", error)
      toast({
        title: "Save failed",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditorContent(feedback?.content || "")
    setIsEditing(false)
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return ""
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["clean"],
    ],
  }

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "color",
    "background",
    "link",
  ]

  // Loading skeleton
  if (loading) {
    return (
      <div className="mt-8 sm:mt-12">
        <Card className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="h-6 w-48 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-8 sm:mt-12">
      <Card className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Judge's Review</h3>
              <p className="text-sm text-gray-600">Official feedback for {challengeTitle}</p>
            </div>
          </div>
          {feedback && !isEditing && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Published
            </Badge>
          )}
        </div>

        {/* Content Area */}
        {!feedback && !isEditing ? (
          // No feedback exists - Empty state
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-6">
              {canEdit
                ? "No feedback has been added yet. Click below to write the first review."
                : "No judge has given feedback yet."}
            </p>
            {canEdit && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#0f172a] hover:bg-[#1e293b] text-white"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Write Feedback
              </Button>
            )}
          </div>
        ) : isEditing ? (
          // Editing mode (for authorized users)
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <ReactQuill
                theme="snow"
                value={editorContent}
                onChange={setEditorContent}
                modules={modules}
                formats={formats}
                placeholder="Write your feedback here..."
                className="judge-feedback-editor"
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                disabled={saving}
                className="border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveFeedback}
                disabled={saving}
                className="bg-[#0f172a] hover:bg-[#1e293b] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Feedback"
                )}
              </Button>
            </div>
          </div>
        ) : (
          // View mode (feedback exists)
          <div>
            <div
              className="prose prose-sm sm:prose max-w-none mb-6 text-gray-700 leading-relaxed feedback-preview-content feedback-preview-scroll"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(feedback?.content || ""),
              }}
            />
            {feedback?.updatedAt && (
              <div className="text-xs text-gray-500 pt-4 border-t border-gray-100">
                Last updated: {formatTimestamp(feedback.updatedAt)}
              </div>
            )}
            {canEdit && (
              <div className="mt-6">
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Feedback
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <style jsx global>{`
        .judge-feedback-editor .ql-container {
          min-height: 200px;
          font-size: 15px;
        }
        .judge-feedback-editor .ql-editor {
          min-height: 200px;
        }
        .judge-feedback-editor .ql-toolbar {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        /* Ensure unordered lists render a simple bullet and avoid duplicated markers */
        .judge-feedback-editor .ql-editor ul {
          list-style-type: disc !important;
          list-style-position: outside !important;
          margin-left: 1.25rem !important;
        }
        .judge-feedback-editor .ql-editor ol {
          list-style-type: decimal !important;
          margin-left: 1.25rem !important;
        }
        /* Remove Quill's inserted pseudo markers if present */
        .judge-feedback-editor .ql-editor ul li::before,
        .judge-feedback-editor .ql-editor ol li::before {
          content: none !important;
        }
        /* Make sure native list markers are visible */
        .judge-feedback-editor .ql-editor ul li,
        .judge-feedback-editor .ql-editor ol li {
          display: list-item !important;
        }

        /* Preview content styling - This is the key fix! */
        .feedback-preview-content {
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
          max-width: 100% !important;
          overflow: hidden !important;
        }
        
        /* Scrollable preview container */
        .feedback-preview-scroll {
          max-height: 350px !important;
          overflow-y: auto !important;
          padding-right: 1rem !important;
        }
        
        /* Custom scrollbar styling */
        .feedback-preview-scroll::-webkit-scrollbar {
          width: 8px !important;
        }
        
        .feedback-preview-scroll::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 4px !important;
        }
        
        .feedback-preview-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 4px !important;
        }
        
        .feedback-preview-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        
        /* Firefox scrollbar styling */
        .feedback-preview-scroll {
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f1f5f9 !important;
        }
        
        .feedback-preview-content ul {
          list-style-type: disc !important;
          list-style-position: outside !important;
          margin-left: 1.5rem !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
        }
        
        .feedback-preview-content ol {
          list-style-type: decimal !important;
          list-style-position: outside !important;
          margin-left: 1.5rem !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
        }
        
        .feedback-preview-content ul li,
        .feedback-preview-content ol li {
          display: list-item !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.6 !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          max-width: 100% !important;
        }
        
        /* Mobile-first paragraph styling (default mobile) */
        .feedback-preview-content p {
          font-size: 0.875rem !important; /* 14px for mobile */
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.5 !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          max-width: 100% !important;
        }
        
        .feedback-preview-content p:empty {
          min-height: 1.2em !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }
        
        .feedback-preview-content p:empty::after {
          content: '' !important;
          display: inline-block !important;
          width: 100% !important;
        }
        
        .feedback-preview-content strong {
          font-weight: 600 !important;
        }
        
        .feedback-preview-content em {
          font-style: italic !important;
        }
        
        .feedback-preview-content u {
          text-decoration: underline !important;
        }
        
        .feedback-preview-content s {
          text-decoration: line-through !important;
        }
        
        .feedback-preview-content a {
          color: #2563eb !important;
          text-decoration: underline !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          font-size: 0.875rem !important; /* 14px for mobile */
        }
        
        /* Mobile-first list item styling */
        .feedback-preview-content ul li,
        .feedback-preview-content ol li {
          font-size: 0.875rem !important; /* 14px for mobile */
        }
        
        /* Mobile-first header styling */
        .feedback-preview-content h1 {
          font-size: 1.25rem !important; /* 20px for mobile */
          font-weight: 700 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.75rem !important;
          line-height: 1.3 !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        .feedback-preview-content h2 {
          font-size: 1.125rem !important; /* 18px for mobile */
          font-weight: 600 !important;
          margin-top: 0.875rem !important;
          margin-bottom: 0.625rem !important;
          line-height: 1.4 !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        .feedback-preview-content h3 {
          font-size: 1rem !important; /* 16px for mobile */
          font-weight: 600 !important;
          margin-top: 0.75rem !important;
          margin-bottom: 0.5rem !important;
          line-height: 1.5 !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        
        /* Desktop/tablet responsive styles (768px and up) */
        @media (min-width: 768px) {
          .feedback-preview-content p {
            font-size: 0.9375rem !important; /* 15px for desktop */
            margin-top: 0.75rem !important;
            margin-bottom: 0.75rem !important;
            line-height: 1.6 !important;
          }
          
          .feedback-preview-content p:empty {
            min-height: 1.5em !important;
          }
          
          .feedback-preview-content a {
            font-size: 0.9375rem !important; /* 15px for desktop */
          }
          
          .feedback-preview-content ul li,
          .feedback-preview-content ol li {
            font-size: 0.9375rem !important; /* 15px for desktop */
          }
          
          .feedback-preview-content h1 {
            font-size: 2rem !important; /* 32px for desktop */
            margin-top: 1.5rem !important;
            margin-bottom: 1rem !important;
            line-height: 1.2 !important;
          }
          
          .feedback-preview-content h2 {
            font-size: 1.5rem !important; /* 24px for desktop */
            margin-top: 1.25rem !important;
            margin-bottom: 0.75rem !important;
            line-height: 1.3 !important;
          }
          
          .feedback-preview-content h3 {
            font-size: 1.25rem !important; /* 20px for desktop */
            margin-top: 1rem !important;
            margin-bottom: 0.5rem !important;
            line-height: 1.4 !important;
          }
        }
      `}</style>
    </div>
  )
}