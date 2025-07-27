'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Adjust import path as needed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, FileText, MessageSquare, Save, ArrowLeft, Star, Clock, ChevronDown, ChevronRight, AlertCircle, CheckCircle, X, Lock } from 'lucide-react';

interface Submission {
  id: string;
  participant_ID: string;
  challenge_ID: string;
  promptText: string;
  submittedAt: any;
  status: string;
}

interface Challenge {
  id: string;
  title: string;
  problemStatement: string;
}

interface JudgeScore {
  judgeId: string;
  score: number;
  comment?: string;
  updatedAt: any;
}

interface SubmissionWithChallenge extends Submission {
  challenge: Challenge;
  judgeScore?: JudgeScore;
}

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'warning';
  submissionId?: string;
}

interface ParticipantData {
  id: string;
  locked?: boolean;
}

export default function JudgeReviewPage() {
  const params = useParams();
  const router = useRouter();
  const participantId = params.id as string;
  
  const [submissions, setSubmissions] = useState<SubmissionWithChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, boolean>>({});
  const [expandedProblemStatements, setExpandedProblemStatements] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockConfirmText, setLockConfirmText] = useState('');
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null);
  const [participantData, setParticipantData] = useState<ParticipantData | null>(null);

  // Mock judge ID - replace with actual auth context in production
  const judgeId = "current-judge-id";

  useEffect(() => {
    fetchSubmissions();
    fetchParticipantData();
  }, [participantId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch submissions for this participant
      const submissionsQuery = query(
        collection(db, process.env.NEXT_PUBLIC_SUBMISSION_DATABASE || 'submissions'),
        where("participant_ID", "==", participantId)
      );
      
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const submissionsData = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Submission[];

      // Fetch challenge data and judge scores for each submission
      const submissionsWithChallenges = await Promise.all(
        submissionsData.map(async (submission) => {
          // Fetch challenge data
          const challengeDoc = await getDoc(doc(db, 'challenges', submission.challenge_ID));
          const challenge = challengeDoc.exists() ? 
            { id: challengeDoc.id, ...challengeDoc.data() } as Challenge :
            { id: submission.challenge_ID, title: 'Unknown Challenge', problemStatement: 'Challenge not found' };

          // Fetch existing judge score
          const judgeScoreDoc = await getDoc(doc(db, 'submissions', submission.id, 'evaluation', 'Judge_Score'));
          const judgeScore = judgeScoreDoc.exists() ? judgeScoreDoc.data() as JudgeScore : undefined;

          return {
            ...submission,
            challenge,
            judgeScore
          };
        })
      );

      setSubmissions(submissionsWithChallenges);

      // Pre-fill scores and comments from existing judge scores
      const initialScores: Record<string, number> = {};
      const initialComments: Record<string, string> = {};
      
      submissionsWithChallenges.forEach(submission => {
        if (submission.judgeScore) {
          initialScores[submission.id] = submission.judgeScore.score;
          initialComments[submission.id] = submission.judgeScore.comment || '';
        }
      });

      setScores(initialScores);
      setComments(initialComments);
      
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (submissionId: string, score: number) => {
    setScores(prev => ({ ...prev, [submissionId]: score }));
  };

  const handleCommentChange = (submissionId: string, comment: string) => {
    setComments(prev => ({ ...prev, [submissionId]: comment }));
  };

  const toggleSubmissionExpanded = (submissionId: string) => {
    setExpandedSubmissions(prev => ({ ...prev, [submissionId]: !prev[submissionId] }));
  };

  const toggleProblemStatementExpanded = (submissionId: string) => {
    setExpandedProblemStatements(prev => ({ ...prev, [submissionId]: !prev[submissionId] }));
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning', submissionId?: string) => {
    setNotification({ message, type, submissionId });
    setTimeout(() => setNotification(null), 5000); // Auto dismiss after 5 seconds
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  const fetchParticipantData = async () => {
    try {
      const participantDoc = await getDoc(doc(db, 'participants', participantId));
      if (participantDoc.exists()) {
        setParticipantData({ id: participantDoc.id, ...participantDoc.data() } as ParticipantData);
      }
    } catch (error) {
      console.error('Error fetching participant data:', error);
    }
  };

  const saveScore = async (submissionId: string) => {
    // Check if participant is locked
    if (participantData?.locked) {
      showNotification('This participant\'s judgement is locked and cannot be modified.', 'error');
      return;
    }

    // Check if this is an update (existing score)
    const existingSubmission = submissions.find(s => s.id === submissionId);
    if (existingSubmission?.judgeScore) {
      setPendingSubmissionId(submissionId);
      setIsConfirmModalOpen(true);
      return;
    }

    // Proceed with saving
    await performSaveScore(submissionId);
  };

  const performSaveScore = async (submissionId: string) => {
    try {
      setSaving(submissionId);
      
      const score = scores[submissionId];
      const comment = comments[submissionId];

      if (!score || score < 1 || score > 10) {
        showNotification('Please enter a valid score between 1 and 10', 'error', submissionId);
        return;
      }

      const judgeScoreData = {
        judgeId,
        score,
        comment: comment || '',
        updatedAt: serverTimestamp()
      };

      await setDoc(
        doc(db, 'submissions', submissionId, 'evaluation', 'Judge_Score'),
        judgeScoreData
      );

      // Update local state
      setSubmissions(prev => 
        prev.map(submission => 
          submission.id === submissionId 
            ? { ...submission, judgeScore: judgeScoreData as JudgeScore }
            : submission
        )
      );

      showNotification('Score saved successfully!', 'success', submissionId);
    } catch (error) {
      console.error('Error saving score:', error);
      showNotification('Error saving score. Please try again.', 'error', submissionId);
    } finally {
      setSaving(null);
    }
  };

  const handleConfirmUpdate = async () => {
    setIsConfirmModalOpen(false);
    if (pendingSubmissionId) {
      await performSaveScore(pendingSubmissionId);
      setPendingSubmissionId(null);
    }
  };

  const handleCancelUpdate = () => {
    setIsConfirmModalOpen(false);
    setPendingSubmissionId(null);
  };

  const handleLockParticipant = () => {
    // Check if all submissions have scores
    const unscored = submissions.filter(s => !s.judgeScore);
    if (unscored.length > 0) {
      showNotification(`Please score all submissions before locking. ${unscored.length} submission(s) remaining.`, 'warning');
      return;
    }
    setIsLockModalOpen(true);
  };

  const performLockParticipant = async () => {
    if (lockConfirmText !== 'SURE') {
      showNotification('Please type "SURE" to confirm locking.', 'error');
      return;
    }

    try {
      // Lock the participant
      await setDoc(doc(db, 'participants', participantId), {
        locked: true,
        lockedBy: judgeId,
        lockedAt: serverTimestamp()
      }, { merge: true });

      // Update all submissions to judgement_complete
      const updatePromises = submissions.map(submission => 
        setDoc(doc(db, 'submissions', submission.id), {
          status: 'judgement_complete'
        }, { merge: true })
      );

      await Promise.all(updatePromises);

      // Update local state
      setParticipantData(prev => prev ? { ...prev, locked: true } : null);
      setSubmissions(prev => 
        prev.map(submission => ({ ...submission, status: 'judgement_complete' }))
      );

      setIsLockModalOpen(false);
      setLockConfirmText('');
      showNotification('Participant judgement locked successfully. No further changes can be made.', 'success');
    } catch (error) {
      console.error('Error locking participant:', error);
      showNotification('Error locking participant. Please try again.', 'error');
    }
  };

  const handleCancelLock = () => {
    setIsLockModalOpen(false);
    setLockConfirmText('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07073a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#56ffbc] mx-auto mb-4"></div>
          <p className="text-gray-300">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07073a] text-white">
      {/* Notification Component */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div
            className={`
              p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 transform translate-x-0
              ${notification.type === 'success' 
                ? 'bg-gradient-to-r from-green-500/20 to-[#56ffbc]/20 border-green-500/30 text-green-100' 
                : notification.type === 'error'
                ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30 text-red-100'
                : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-100'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {notification.type === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                {notification.type === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                {notification.type === 'warning' && (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{notification.message}</p>
              </div>
              <Button
                onClick={dismissNotification}
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-6 w-6 p-0 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Score Updates */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-gradient-to-r from-[#0c0c4f] to-[#07073a] border border-[#56ffbc]/30 rounded-xl shadow-2xl p-6 w-[350px] text-center backdrop-blur-sm">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-[#56ffbc]/10">
                <AlertCircle className="w-8 h-8 text-[#56ffbc]" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Update Score?</h2>
            <p className="text-gray-300 mb-6">This submission already has a score. Are you sure you want to update it?</p>
            <div className="flex justify-center gap-4">
              <Button
                className="bg-gradient-to-r from-[#56ffbc] to-[#45e6a8] text-[#07073a] hover:shadow-lg hover:shadow-[#56ffbc]/25 transition-all duration-300 font-semibold px-6"
                onClick={handleConfirmUpdate}
              >
                Yes, Update
              </Button>
              <Button
                variant="outline"
                className="border-[#56ffbc]/30 text-gray-300 hover:bg-[#56ffbc]/10 hover:border-[#56ffbc]/50 transition-all duration-300 px-6"
                onClick={handleCancelUpdate}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Participant Modal */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-gradient-to-r from-[#0c0c4f] to-[#07073a] border border-red-500/30 rounded-xl shadow-2xl p-6 w-[400px] text-center backdrop-blur-sm">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <Lock className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Lock Participant Judgement</h2>
            <p className="text-gray-300 mb-4">
              This will permanently lock all judgements for this participant. 
              <span className="text-red-400 font-semibold"> You will not be able to make any changes after this action.</span>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type <span className="text-red-400 font-bold">"SURE"</span> to confirm:
              </label>
              <input
                type="text"
                value={lockConfirmText}
                onChange={(e) => setLockConfirmText(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#07073a]/50 border border-red-500/30 text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all duration-300 text-center font-mono"
                placeholder="Type SURE"
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button
                className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 font-semibold px-6 disabled:opacity-50"
                onClick={performLockParticipant}
                disabled={lockConfirmText !== 'SURE'}
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock Permanently
              </Button>
              <Button
                variant="outline"
                className="border-[#56ffbc]/30 text-gray-300 hover:bg-[#56ffbc]/10 hover:border-[#56ffbc]/50 transition-all duration-300 px-6"
                onClick={handleCancelLock}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Animated Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c4f] to-[#07073a] opacity-50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2356ffbc\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
        
        <div className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                onClick={() => router.back()}
                variant="outline"
                size="sm"
                className="border-[#56ffbc]/20 text-[#56ffbc] hover:bg-[#56ffbc]/10 hover:border-[#56ffbc]/40 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#56ffbc]/20 to-[#56ffbc]/10 border border-[#56ffbc]/20 backdrop-blur-sm">
                <Trophy className="w-8 h-8 text-[#56ffbc]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-[#56ffbc] bg-clip-text text-transparent">
                  Judge Review Panel
                  {participantData?.locked && (
                    <span className="ml-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                      <Lock className="w-4 h-4" />
                      LOCKED
                    </span>
                  )}
                </h1>
                <p className="text-gray-300 text-lg mt-1">
                  Participant ID: <span className="text-[#56ffbc] font-mono">{participantId}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {submissions.length === 0 ? (
          <Card className="bg-gradient-to-r from-[#0c0c4f] to-[#07073a] border-[#56ffbc]/20 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Submissions Found</h3>
              <p className="text-gray-400">This participant hasn't submitted any challenges yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-[#0c0c4f] to-[#07073a] border-[#56ffbc]/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-[#56ffbc]/10">
                      <FileText className="w-6 h-6 text-[#56ffbc]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{submissions.length}</p>
                      <p className="text-gray-400">Total Submissions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-[#0c0c4f] to-[#07073a] border-[#56ffbc]/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-[#56ffbc]/10">
                      <Star className="w-6 h-6 text-[#56ffbc]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {submissions.filter(s => s.judgeScore).length}
                      </p>
                      <p className="text-gray-400">Scored</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-[#0c0c4f] to-[#07073a] border-[#56ffbc]/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-[#56ffbc]/10">
                      <Clock className="w-6 h-6 text-[#56ffbc]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {submissions.filter(s => !s.judgeScore).length}
                      </p>
                      <p className="text-gray-400">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-[#0c0c4f] to-[#07073a] border-[#56ffbc]/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="text-center">
                    {!participantData?.locked ? (
                      <Button
                        onClick={handleLockParticipant}
                        disabled={submissions.filter(s => !s.judgeScore).length > 0}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold w-full"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Lock Judgement
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-red-400">
                        <Lock className="w-5 h-5" />
                        <span className="font-semibold">Locked</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {!participantData?.locked ? 'Complete all scores first' : 'Judgement is final'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submissions List */}
            <div className="space-y-4">
              {submissions.map((submission, index) => (
                <Card 
                  key={submission.id} 
                  className="bg-gradient-to-r from-[#0c0c4f] to-[#07073a] border-[#56ffbc]/20 backdrop-blur-sm hover:border-[#56ffbc]/40 transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-[#56ffbc]/10">
                          <FileText className="w-6 h-6 text-[#56ffbc]" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-white">
                            {submission.challenge.title}
                          </CardTitle>
                          <CardDescription className="text-gray-400 mt-1">
                            Submission #{index + 1} • {submission.status}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {submission.judgeScore && (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#56ffbc]/10 border border-[#56ffbc]/20">
                            <Star className="w-4 h-4 text-[#56ffbc]" />
                            <span className="text-[#56ffbc] font-semibold">
                              {submission.judgeScore.score}/10
                            </span>
                          </div>
                        )}
                        
                        <Button
                          onClick={() => toggleSubmissionExpanded(submission.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-[#56ffbc] hover:bg-[#56ffbc]/10 transition-all duration-300"
                        >
                          {expandedSubmissions[submission.id] ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedSubmissions[submission.id] && (
                    <CardContent className="space-y-6 pt-0">
                      {/* Participant's Solution */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">Participant's Solution</h4>
                        <div className="p-4 rounded-lg bg-[#07073a]/50 border border-[#56ffbc]/10">
                          <p className="text-gray-300 whitespace-pre-wrap">
                            {submission.promptText}
                          </p>
                        </div>
                      </div>

                      {/* Scoring Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Score Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Score (1-10)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={scores[submission.id] || ''}
                              onChange={(e) => handleScoreChange(submission.id, parseInt(e.target.value))}
                              className={`
                                w-full px-4 py-3 rounded-lg bg-[#07073a]/50 border text-white placeholder-gray-400 
                                focus:outline-none focus:ring-1 transition-all duration-300
                                ${notification?.submissionId === submission.id && notification.type === 'error'
                                  ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                                  : 'border-[#56ffbc]/20 focus:border-[#56ffbc]/40 focus:ring-[#56ffbc]/20'
                                }
                              `}
                              placeholder="Enter score (1-10)"
                            />
                            {scores[submission.id] && (scores[submission.id] < 1 || scores[submission.id] > 10) && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                              </div>
                            )}
                          </div>
                          {scores[submission.id] && (scores[submission.id] < 1 || scores[submission.id] > 10) && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Score must be between 1 and 10
                            </p>
                          )}
                        </div>

                        {/* Comment Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Comment (Optional)
                          </label>
                          <textarea
                            value={comments[submission.id] || ''}
                            onChange={(e) => handleCommentChange(submission.id, e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg bg-[#07073a]/50 border border-[#56ffbc]/20 text-white placeholder-gray-400 focus:outline-none focus:border-[#56ffbc]/40 focus:ring-1 focus:ring-[#56ffbc]/20 transition-all duration-300 resize-none"
                            placeholder="Add feedback for the participant..."
                          />
                        </div>
                      </div>

                      {/* Problem Statement Dropdown */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-white">Problem Statement</h4>
                          <Button
                            onClick={() => toggleProblemStatementExpanded(submission.id)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-[#56ffbc] hover:bg-[#56ffbc]/10 transition-all duration-300"
                          >
                            {expandedProblemStatements[submission.id] ? (
                              <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                Hide Problem
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-4 h-4 mr-2" />
                                Show Problem
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {expandedProblemStatements[submission.id] && (
                          <div className="p-4 rounded-lg bg-[#07073a]/50 border border-[#56ffbc]/10">
                            <p className="text-gray-300 whitespace-pre-wrap">
                              {submission.challenge.problemStatement}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4 border-t border-[#56ffbc]/10">
                        <Button
                          onClick={() => saveScore(submission.id)}
                          disabled={saving === submission.id || !scores[submission.id] || scores[submission.id] < 1 || scores[submission.id] > 10 || participantData?.locked}
                          className="bg-gradient-to-r from-[#56ffbc] to-[#45e6a8] text-[#07073a] hover:shadow-lg hover:shadow-[#56ffbc]/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold px-6 py-2"
                        >
                          {saving === submission.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#07073a] mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              {submission.judgeScore ? 'Update Score' : 'Save Score'}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}