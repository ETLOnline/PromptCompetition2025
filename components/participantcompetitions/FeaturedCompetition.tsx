"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Trophy, Star, Zap, Sparkles, Users } from "lucide-react"
import { useCountdownTimer } from "@/hooks/useCountdownTimer"
import { countDocuments } from "@/lib/firebase/countDocuments"

interface Competition {
  id: string
  title: string
  description: string
  startDeadline: any
  endDeadline: any
  createdAt?: string
  isActive?: boolean
  isLocked?: boolean
  isFeatured?: boolean
  mode?: string
  prizeMoney?: string
  level?: string
}

interface FeaturedCompetitionProps {
  competition: Competition
  status: {
    status: string
    label: string
    color: string
    dotColor: string
  }
  startDateTime: { date: string; time: string }
  endDateTime: { date: string; time: string }
  isRegistered: boolean
  isCompleted: boolean
  isButtonLoading: boolean
  onButtonClick: (competition: Competition) => void
}

export const FeaturedCompetition = ({
  competition,
  status,
  startDateTime,
  endDateTime,
  isRegistered,
  isCompleted,
  isButtonLoading,
  onButtonClick,
}: FeaturedCompetitionProps) => {
  const targetDate = new Date(competition.startDeadline?.seconds * 1000 || competition.startDeadline);
  const countdown = useCountdownTimer(targetDate);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);

  useEffect(() => {
    const fetchParticipantCount = async () => {
      const count = await countDocuments('users');
      setParticipantCount(count);
    };
    fetchParticipantCount();
  }, []);

  // Animated counter effect
  useEffect(() => {
    if (participantCount === 0) return;
    
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = participantCount / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= participantCount) {
        setDisplayCount(participantCount);
        clearInterval(timer);
      } else {
        setDisplayCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [participantCount]);

  const getDescriptionPreview = () => {
    const lines = competition.description.split('\n');
    if (lines.length <= 4) return competition.description;
    return lines.slice(0, 4).join('\n');
  };

  const showReadMore = competition.description.split('\n').length > 4;

  const getButtonText = () => {
    if (status.status === "ENDED") return "View Results";
    if (isRegistered) return isCompleted ? "View Results" : "Continue Competition";
    return "Register Now";
  };

  const showButton = (status.status === "ACTIVE" || status.status === "UPCOMING" || (status.status === "ENDED" && isRegistered)) &&
    !(competition.level === "Level 2" && !isRegistered);

  return (
    <div className="relative group mb-6 sm:mb-8">
      {/* Animated border gradient - matching AppecInfoBox */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-[#0f172a] via-[#1e40af] to-[#0f172a] rounded-xl sm:rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition duration-500" />
      
      <Card className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border-0">
        {/* Decorative background patterns */}
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-50 to-transparent rounded-full -translate-y-24 sm:-translate-y-48 translate-x-24 sm:translate-x-48 opacity-40" />
        <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-tr from-slate-50 to-transparent rounded-full translate-y-20 sm:translate-y-40 -translate-x-20 sm:-translate-x-40 opacity-40" />

        <CardContent className="relative p-4 sm:p-6 md:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Title and Status */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <Badge className="bg-[#0f172a] text-white border-0 px-3 sm:px-4 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-xs sm:text-sm">FEATURED EVENT</span>
                  </Badge>
                  {competition.level && (
                    <Badge className="bg-purple-600 text-white border-0 px-3 sm:px-4 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="font-bold text-xs sm:text-sm">{competition.level}</span>
                    </Badge>
                  )}
                  <Badge className={`${status.color} border font-medium px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm`}>
                    <div className={`w-2 h-2 ${status.dotColor} rounded-full mr-2`}></div>
                    {status.label}
                  </Badge>
                  {isRegistered && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border font-medium px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                      <Trophy className="w-3 h-3 mr-1.5 sm:mr-2" />
                      Registered
                    </Badge>
                  )}
                  {isCompleted && (
                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 border font-medium px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm">
                      <Trophy className="w-3 h-3 mr-1.5 sm:mr-2" />
                      Completed
                    </Badge>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#0f172a] leading-tight">
                  {competition.title}
                </h2>

                <div className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">
                  <p className="whitespace-pre-line">
                    {isDescriptionExpanded ? competition.description : getDescriptionPreview()}
                  </p>
                  {showReadMore && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-[#0f172a] font-semibold hover:text-blue-700 transition-colors mt-2 inline-flex items-center gap-1 text-sm sm:text-base"
                    >
                      {isDescriptionExpanded ? 'Show less' : '... Read more'}
                    </button>
                  )}
                </div>
              </div>

              {/* Competition Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Start Date</p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 sm:mt-1">
                      {startDateTime.date}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-600">{startDateTime.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">End Date</p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 sm:mt-1">
                      {endDateTime.date}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-600">{endDateTime.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">Mode</p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 sm:mt-1 capitalize">{competition.mode || "Online"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-yellow-700 font-medium uppercase tracking-wide">Prize Money</p>
                    <p className="text-xs sm:text-sm font-bold text-yellow-900 mt-0.5 sm:mt-1">PKR {competition.prizeMoney || "TBD"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - CTA and Countdown */}
            <div className="lg:col-span-1 flex flex-col gap-3 sm:gap-4">
              {/* Registered Participants Count */}
              <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-lg">
                <div className="text-center space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Registered Participants</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold">{displayCount}</div>
                    <div className="text-[10px] sm:text-xs uppercase opacity-90 mt-1 sm:mt-2">Students Joined</div>
                  </div>
                </div>
              </div>

              {/* Countdown Timer for Upcoming */}
              {status.status === "UPCOMING" && !countdown.isExpired && (
                <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl shadow-lg">
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider">Competition Starts In</p>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {countdown.days > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3">
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold">{countdown.days}</div>
                          <div className="text-[8px] sm:text-[10px] uppercase opacity-75 mt-0.5 sm:mt-1">Days</div>
                        </div>
                      )}
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3">
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold">{String(countdown.hours).padStart(2, '0')}</div>
                        <div className="text-[8px] sm:text-[10px] uppercase opacity-75 mt-0.5 sm:mt-1">Hours</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3">
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold">{String(countdown.minutes).padStart(2, '0')}</div>
                        <div className="text-[8px] sm:text-[10px] uppercase opacity-75 mt-0.5 sm:mt-1">Mins</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 sm:p-3">
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold">{String(countdown.seconds).padStart(2, '0')}</div>
                        <div className="text-[8px] sm:text-[10px] uppercase opacity-75 mt-0.5 sm:mt-1">Secs</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            {/* Additional Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-blue-900">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-blue-600 text-blue-600" />
                  <p className="text-xs sm:text-sm font-semibold">Featured Competition</p>
                </div>
                <p className="text-[10px] sm:text-xs text-blue-700 leading-relaxed">
                  This is our premier event. Don't miss out on this exclusive opportunity to compete and win amazing prizes!
                </p>
              </div>
              {/* CTA Button */}
              {showButton && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onButtonClick(competition);
                  }}
                  disabled={isButtonLoading}
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#0f172a] text-white rounded-lg sm:rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  {isButtonLoading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm sm:text-base">Loading...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      {getButtonText()}
                    </>
                  )}
                </Button>
              )}

              
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
