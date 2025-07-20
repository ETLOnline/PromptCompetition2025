// components/GetChallenges.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Settings } from "lucide-react"


// -------------------------------- firebase --------------------------------
import { db } from "@/lib/firebase"
import { doc, getDocs, Timestamp, collection } from "firebase/firestore"

type Challenge = {
    id: string
    title: string
    description: string
    problemStatement: string
    guidelines: string
    rubric: string
    deadline: Timestamp
}

export default function GetChallenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const router = useRouter()

    useEffect(() => {
        const fetchChallenges = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "testing"))
            const fetched: Challenge[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            })) as Challenge[]
            setChallenges(fetched)
        } catch (error) {
            console.error("Error fetching challenges:", error)
        }
        }

    fetchChallenges()
    }, [])

    return (
        <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Challenges</h2>
            <Button onClick={() => router.push("/admin/competitions/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
            </Button>
        </div>

        <div className="grid gap-6">
            {challenges.map((challenge) => {
            const deadline = challenge.deadline.toDate()
            const isExpired = deadline < new Date()

            return (
                <Card key={challenge.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">{challenge.title}</CardTitle>
                            <CardDescription className="mt-2">{challenge.description}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                            <Badge variant={!isExpired ? "default" : "destructive"}>
                                {isExpired ? "Expired" : "Upcoming"}
                            </Badge>
                            </div>
                        </div>
                        </div>
                    </CardHeader>   
                    <CardContent>
                        <div className="flex justify-between items-center mb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                            <span className="text-gray-600">Deadline:</span>
                            <span className="font-medium ml-2">{deadline.toLocaleDateString()}</span>
                            </div>
                        </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/competitions/${challenge.id}/edit`)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        </div>
                    </CardContent>
                </Card>
            )
            })}
        </div>
        </div>
    )
}
