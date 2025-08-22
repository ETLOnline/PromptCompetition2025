import { Clock, CheckCircle, Users, Gavel, Sparkles, Trophy } from "lucide-react"

interface LeaderboardBannerProps {
  topN: number
  judgeEvaluationsComplete: boolean
  competitionTitle: string
  maxScore: number
}

export function LeaderboardBanner({
  topN,
  judgeEvaluationsComplete,
  competitionTitle,
  maxScore,
}: LeaderboardBannerProps) {

  if (judgeEvaluationsComplete) {
    return (
      <div className="relative">
        <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200/80 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full -translate-y-6 translate-x-6 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-200/20 to-emerald-200/20 rounded-full translate-y-4 -translate-x-4 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                      Final Results Complete
                    </h3>
                    <div className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-full shadow-sm">
                      OFFICIAL
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-base text-emerald-800 leading-relaxed">
                    <span className="font-medium">Final leaderboard including judge evaluations for top</span>
                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border-2 border-emerald-300 text-emerald-800 px-4 py-2 rounded-full shadow-sm">
                      <Trophy className="h-4 w-4" />
                      <span className="font-bold text-lg">{topN}</span>
                    </div>
                    <span className="font-medium">participants. Remaining participants ranked by LLM evaluation.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200/80 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -translate-y-6 translate-x-6 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/20 to-blue-200/20 rounded-full translate-y-4 -translate-x-4 blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-pulse shadow-md"></div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                    Preliminary Rankings
                  </h3>
                  <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold rounded-full shadow-sm">
                    LIVE
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-base text-blue-800 leading-relaxed">
                  <span className="font-medium">Current leaderboard based on LLM evaluation. Top</span>
                  <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border-2 border-blue-300 text-blue-800 px-4 py-2 rounded-full shadow-sm">
                    <Trophy className="h-4 w-4" />
                    <span className="font-bold text-lg">{topN}</span>
                  </div>
                  <span className="font-medium">participants are under judge evaluation.</span>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                        <Gavel className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-bounce"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-amber-800">Judge Evaluation</span>
                        <div className="px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-sm animate-pulse">
                          IN PROGRESS
                        </div>
                      </div>
                      <p className="text-xs text-amber-700 font-medium">Final scores will be available soon</p>
                    </div>
                  </div>
                  
                  {/* Progress animation */}
                  <div className="flex-1 flex justify-end">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}