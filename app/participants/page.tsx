"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Clock, Calendar, Loader } from "lucide-react"
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface Competition {
    id: string
    title: string
    description: string
    startDeadline: any
    endDeadline: any
    createdAt?: string
    isActive?: boolean
    isLocked?: boolean
    location?: string
    prizeMoney?: string
}

export default function CompetitionsPage() 
{
    const { user } = useAuth()
    const router = useRouter()
    const [competitions, setCompetitions] = useState<Competition[]>([])
    const [hasCompetitions, setHasCompetitions] = useState(false);
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) 
        {
            router.push("/")
            return
        }
        fetchCompetitions()
    }, [user, router])

    const fetchCompetitions = async () => {
        try 
        {
            setLoading(true)
            
            // fetch all competitions
            const competitionsQuery = query(
            collection(db, "competitions"),
            orderBy("startDeadline", "desc")
            );
            const competitionsSnapshot = await getDocs(competitionsQuery);


            if (competitionsSnapshot.empty) 
            {
                setHasCompetitions(false);
                return [];
            } 
            else 
            {
                setHasCompetitions(true);

                const competitions = competitionsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Competition[];

                setCompetitions(competitions);
            }
        
        } 
        catch (error) 
        {
            console.error("Error fetching competitions:", error)
        } 
        finally 
        {
            setLoading(false)
        }
    }

    const getCompetitionStatus = (competition: Competition) => {
        // First check if competition has isActive field from Firestore
        if (competition.isActive == true) 
        {
            const start = competition.startDeadline?.toDate?.() ?? new Date(competition.startDeadline)
            const end = competition.endDeadline?.toDate?.() ?? new Date(competition.endDeadline)
            const now = new Date()
            const extendedEnd = new Date(end.getTime() + 2 * 60 * 1000)

            if (now < start) 
            {
                return {
                    status: "UPCOMING",
                    message: "Starts soon",
                    bgColor: "bg-blue-50",
                    textColor: "text-blue-800",
                    borderColor: "border-blue-200",
                }
            } 
            else if (now >= start && now <= extendedEnd) 
            {
                return {
                    status: "ACTIVE",
                    message: "Live now",
                    bgColor: "bg-emerald-50",
                    textColor: "text-emerald-800",
                    borderColor: "border-emerald-200",
                }
            } 
            else 
            {
                return {
                    status: "ENDED",
                    message: "Completed",
                    bgColor: "bg-gray-50",
                    textColor: "text-gray-800",
                    borderColor: "border-gray-200",
                }
            }
        }

    }

    const formatDate = (date: any) => {
        const dateObj = date?.toDate?.() ?? new Date(date)
        return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        })
    }

    const handleCompetitionClick = (competitionId: string) => {
        router.push(`/participants/competitions/${competitionId}`)
    }

    if (!user || loading) {
        return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-150 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl flex items-center justify-center">
                <Loader className="h-6 w-6 text-white animate-spin" />
            </div>
            <div className="text-base font-medium text-gray-700">Loading competitions...</div>
            </div>
        </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-150">
        {/* Header */}
        <header className="bg-gradient-to-r from-slate-100 to-slate-150 border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Trophy className="h-7 w-7 text-white" />
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Competitions</h1>
                        <p className="text-base font-medium text-gray-700">Browse and join coding competitions</p>
                    </div>
                </div>
            </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {!hasCompetitions ? (
                <Card className="bg-white shadow-sm rounded-xl">
                    <CardContent className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Trophy className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Competitions Available</h3>
                    <p className="text-base font-medium text-gray-700 max-w-md mx-auto">
                        There are currently no competitions available. Check back later for new competitions.
                    </p>
                    </CardContent>
                </Card>
            ) : 
            (
                <div className="space-y-4">
                    {competitions.map((competition) => {
                    const status = getCompetitionStatus(competition)
                    
                    if (status.status !== "ENDED")
                    {
                        return (
                            <Card
                            key={competition.id}
                            className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group border border-gray-100"
                            onClick={() => handleCompetitionClick(competition.id)}
                            >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                {/* Left Section - Competition Info */}
                                <div className="flex items-center gap-6 flex-1">
                                    {/* Icon */}
                                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                                        <Trophy className="h-6 w-6 text-white" />
                                    </div>

                                    {/* Competition Details */}
                                    <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200 truncate">
                                        {competition.title}
                                        </h3>
                                        <div
                                        className={`px-3 py-1 rounded-lg border text-xs font-medium uppercase tracking-wide flex-shrink-0 ${status.bgColor} ${status.textColor} ${status.borderColor}`}
                                        >
                                        {status.message}
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 line-clamp-2 leading-relaxed mb-3">
                                        {competition.description}
                                    </p>

                                    {/* Timeline - Horizontal */}
                                    <div className="flex items-center gap-6 text-xs text-gray-600">
                                        <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Calendar className="h-2.5 w-2.5 text-blue-600" />
                                        </div>
                                        <span className="font-medium">Starts: {formatDate(competition.startDeadline)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                                            <Clock className="h-2.5 w-2.5 text-red-600" />
                                        </div>
                                        <span className="font-medium">Ends: {formatDate(competition.endDeadline)}</span>
                                        </div>
                                    </div>
                                    </div>
                                </div>

                                    {/* Right Section - Action Button */}
                                    {status.status === "ACTIVE" && (
                                        <div className="flex-shrink-0 ml-6">
                                            <Button
                                            className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-800 hover:to-gray-700 text-white font-medium transition-all duration-200 rounded-lg px-6 py-2.5 focus:ring-2 focus:ring-gray-900/10 focus:ring-offset-2"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleCompetitionClick(competition.id)
                                            }}
                                            >
                                            Join Competition
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            </Card>
                        )
                    }
                })}
                </div>
            )}
        </main>
        </div>
    )
}
