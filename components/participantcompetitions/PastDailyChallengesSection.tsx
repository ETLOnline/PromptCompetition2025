"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import { FileText, MessageSquare, Calendar, ChevronRight, ImageIcon } from "lucide-react"
import dynamic from "next/dynamic"
import {
  DialogDescription,
} from "@/components/ui/dialog"

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

interface DailyChallenge {
  id: string
  title: string
  problemStatement: string
  guidelines: string
  startTime: any
  endTime: any
  status: string
  type: string
  totalSubmissions: number
  createdAt?: any
  createdBy?: string
  problemAudioUrls?: string[]
  guidelinesAudioUrls?: string[]
  visualClueUrls?: string[]
}

interface FeedbackData {
  content: string
  updatedAt: any
  updatedBy: string
}

interface PastDailyChallengesSectionProps {
  challenges: DailyChallenge[]
}

export const PastDailyChallengesSection = ({ challenges }: PastDailyChallengesSectionProps) => {
  const [challengesWithFeedback, setChallengesWithFeedback] = useState<DailyChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [judgeFeedback, setJudgeFeedback] = useState<FeedbackData | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  useEffect(() => {
    filterChallengesWithFeedback()
  }, [challenges])

  const filterChallengesWithFeedback = async () => {
    try {
      setLoading(true)
      const challengesWithJudgeFeedback: DailyChallenge[] = []

      for (const challenge of challenges) {
        // Check if judge feedback exists for this challenge
        const feedbackRef = doc(db, "dailychallenge", challenge.id, "judgefeedback", "main_feedback")
        const feedbackDoc = await getDoc(feedbackRef)
        
        if (feedbackDoc.exists()) {
          challengesWithJudgeFeedback.push(challenge)
        }
      }

      setChallengesWithFeedback(challengesWithJudgeFeedback)
    } catch (error) {
      console.error("Error filtering challenges with feedback:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJudgeFeedback = async (challengeId: string) => {
    try {
      setLoadingFeedback(true)
      const feedbackRef = doc(db, "dailychallenge", challengeId, "judgefeedback", "main_feedback")
      const feedbackDoc = await getDoc(feedbackRef)

      if (feedbackDoc.exists()) {
        setJudgeFeedback(feedbackDoc.data() as FeedbackData)
      } else {
        setJudgeFeedback(null)
      }
    } catch (error) {
      console.error("Error fetching judge feedback:", error)
      setJudgeFeedback(null)
    } finally {
      setLoadingFeedback(false)
    }
  }

  const handleViewDetails = (challenge: DailyChallenge) => {
    setSelectedChallenge(challenge)
    setShowDetailsModal(true)
  }

  const handleViewFeedback = async (challenge: DailyChallenge) => {
    setSelectedChallenge(challenge)
    setShowFeedbackModal(true)
    await fetchJudgeFeedback(challenge.id)
  }

  const formatDate = (timestamp: any) => {
    let date: Date
    if (timestamp?._seconds) {
      date = new Date(timestamp._seconds * 1000)
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000)
    } else {
      date = new Date(timestamp)
    }

    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    })
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

  // Don't render if no challenges with feedback
  if (!loading && challengesWithFeedback.length === 0) {
    return null
  }

  return (
    <div className="mt-8 sm:mt-12">
      {/* Section Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-600 rounded-full flex-shrink-0"></div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Past Daily Challenges</h3>
          {!loading && challengesWithFeedback.length > 0 && (
            <Badge className="bg-amber-600 text-white border-0 font-medium text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 sm:py-1">
              {challengesWithFeedback.length} Reviewed
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed ml-4 sm:ml-5 md:ml-6">
          View past challenges with judge feedback and reviews
        </p>
      </div>

      {/* Challenges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="animate-pulse space-y-3">
                  <div className="w-3/4 h-5 bg-slate-200 rounded" />
                  <div className="w-full h-4 bg-slate-200 rounded" />
                  <div className="w-5/6 h-4 bg-slate-200 rounded" />
                  <div className="w-1/2 h-4 bg-slate-200 rounded" />
                  <div className="flex gap-2 pt-2">
                    <div className="flex-1 h-9 bg-slate-200 rounded" />
                    <div className="flex-1 h-9 bg-slate-200 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {challengesWithFeedback.map((challenge) => (
            <Card 
              key={challenge.id}
              className="bg-white border border-slate-200 rounded-lg sm:rounded-xl overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
            >
              <CardContent className="p-0">
                {/* Card Header with Gradient */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-300 font-medium text-xs px-2.5 py-1">
                      Completed
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-slate-600 bg-white/60 px-2 py-1 rounded-full">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatDate(challenge.endTime)}</span>
                    </div>
                  </div>
                  
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2 mb-2">
                    {challenge.title}
                  </h4>
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-medium capitalize">{challenge.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-medium">{challenge.totalSubmissions || 0} submissions</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                    {challenge.problemStatement}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewDetails(challenge)}
                      variant="outline"
                      className="flex-1 h-9 text-xs sm:text-sm font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      View Details
                    </Button>
                    <Button
                      onClick={() => handleViewFeedback(challenge)}
                      className="flex-1 h-9 text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-sm transition-all duration-200"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                      Judge Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Challenge Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-white border-slate-200 max-w-3xl w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-2 sm:space-y-3 pb-3 sm:pb-4 border-b border-slate-200">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 bg-indigo-100 rounded-lg sm:rounded-xl flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-slate-900">Challenge Details</DialogTitle>
                <DialogDescription className="text-slate-600 text-xs sm:text-sm mt-1">
                  Complete information about this challenge
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedChallenge && (
            <div className="space-y-4 sm:space-y-5 pt-3 sm:pt-4">
              {/* Challenge Title */}
              {selectedChallenge.title && (
                <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-5 border border-slate-200">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {selectedChallenge.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-xs">
                      Completed
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(selectedChallenge.endTime)}
                    </span>
                  </div>
                </div>
              )}

              {/* Problem Statement */}
              {(selectedChallenge.problemStatement || (selectedChallenge.problemAudioUrls && selectedChallenge.problemAudioUrls.length > 0)) && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900">Problem Statement</h4>
                  </div>
                  {selectedChallenge.problemStatement && (
                    <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedChallenge.problemStatement}
                      </p>
                    </div>
                  )}
                  {selectedChallenge.problemAudioUrls && selectedChallenge.problemAudioUrls.length > 0 && (
                    <div className="space-y-2">
                      {selectedChallenge.problemAudioUrls.map((url: string, index: number) => (
                        <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <p className="text-xs font-medium text-slate-600 mb-2">Audio {index + 1}</p>
                          <audio controls src={url} className="w-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Guidelines */}
              {(selectedChallenge.guidelines || (selectedChallenge.guidelinesAudioUrls && selectedChallenge.guidelinesAudioUrls.length > 0)) && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900">Guidelines</h4>
                  </div>
                  {selectedChallenge.guidelines && (
                    <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedChallenge.guidelines}
                      </p>
                    </div>
                  )}
                  {selectedChallenge.guidelinesAudioUrls && selectedChallenge.guidelinesAudioUrls.length > 0 && (
                    <div className="space-y-2">
                      {selectedChallenge.guidelinesAudioUrls.map((url: string, index: number) => (
                        <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <p className="text-xs font-medium text-slate-600 mb-2">Audio {index + 1}</p>
                          <audio controls src={url} className="w-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Visual Clues */}
              {selectedChallenge.visualClueUrls && selectedChallenge.visualClueUrls.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900">
                      Visual Clues ({selectedChallenge.visualClueUrls.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedChallenge.visualClueUrls.map((url: string, index: number) => (
                      <div key={index} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                        <img
                          src={url}
                          alt={`Visual clue ${index + 1}`}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenge Stats */}
              <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Challenge Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{selectedChallenge.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total Submissions</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedChallenge.totalSubmissions || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Judge Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-amber-600" />
              Judge's Review
            </DialogTitle>
          </DialogHeader>
          {selectedChallenge && (
            <div className="space-y-4">
              {/* Challenge Title */}
              <div className="pb-3 border-b">
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedChallenge.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {formatDate(selectedChallenge.endTime)}
                </p>
              </div>

              {/* Feedback Content */}
              {loadingFeedback ? (
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-5/6" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-4/6" />
                </div>
              ) : judgeFeedback ? (
                <div>
                  <div
                    className="prose prose-sm sm:prose max-w-none mb-6 text-gray-700 leading-relaxed feedback-preview-content feedback-preview-scroll"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(judgeFeedback.content) }}
                  />
                  <div className="mt-4 pt-3 border-t text-xs text-slate-500">
                    Last updated: {formatTimestamp(judgeFeedback.updatedAt)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No feedback available for this challenge</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quill Styles */}
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
