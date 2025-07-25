"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { db } from "@/firebase" // make sure this is your Firebase init
import { collection, getDocs, Timestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

type Challenge = {
    id: string
    title: string
    deadline: string
}

export default function ChallengeList() {
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const router = useRouter()

    useEffect(() => {
        const fetchChallenges = async () => {
        const querySnapshot = await getDocs(collection(db, process.env.NEXT_PUBLIC_CHALLENGE_DATABASE))
        const data = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Challenge, "id">),
        }))
        setChallenges(data)
        }

        fetchChallenges()
    }, [])

    return (
        <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Challenges</h2>
        <div className="grid gap-6">
            {challenges.map((challenge) => (
            <Card key={challenge.id} className="shadow-md">
                <CardHeader>
                <CardTitle className="text-xl text-gray-900">{challenge.title}</CardTitle>
                <CardDescription className="mt-1 text-gray-700">
                    Deadline: {new Date((challenge.deadline as any).seconds * 1000).toLocaleString()}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <Button
                    onClick={() => router.push(`/competition/${challenge.id}`)}
                    className="bg-[#56ffbc] text-gray-900 hover:bg-[#45e0a6]"
                >
                    Participate
                </Button>
                </CardContent>
            </Card>
            ))}
        </div>
        </section>
    )
    }
