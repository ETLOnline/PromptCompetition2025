"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  UserCheck,
  Settings,
  Shuffle,
  Trophy,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Hash,
  Info,
  Loader,
  Users,
  Target,
  ArrowRight,
  Check,
  Clock,
  Zap,
  ChevronRight,
  Star,
  Award,
  TrendingUp,
} from "lucide-react"
import { writeBatch, doc, collection, query, orderBy, limit, getDocs, getDoc, setDoc, Timestamp, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { getIdTokenResult, User } from "firebase/auth"
//const [currentUser, setCurrentUser] = useState<User | null>(null)
import { getIdToken } from "@/lib/firebaseAuth"

interface Judge {
    id: string
    name: string
    email: string
    institution?: string
    totalAssigned?: number
    status?: "available" | "busy" | "offline"
}

interface JudgeCapacity {
    judgeId: string
    capacity: number
}

type AssignmentMethod = "Round-Robin" | "Weighted" | "Automatic"

export default function ParticipantDistribution() {
    const router = useRouter()
    const params = useParams()
    const competitionId = params?.competitionId as string
    const [totalParticipants, setTotalParticipants] = useState<number>(0)
    const [judges, setJudges] = useState<Judge[]>([])
    const [selectedJudges, setSelectedJudges] = useState<string[]>([])
    const [assignmentMethod, setAssignmentMethod] = useState<AssignmentMethod | null>(null)
    const [judgeCapacities, setJudgeCapacities] = useState<JudgeCapacity[]>([])
    const [loading, setLoading] = useState(false)
    const [fetchingData, setFetchingData] = useState(true)
    const [judgeAssignments, setJudgeAssignments] = useState<{ [key: string]: number }>({})
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [judgeSearch, setJudgeSearch] = useState("")
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
    const [existingAssignments, setExistingAssignments] = useState<{ [key: string]: number }>({})
    const [currentStep, setCurrentStep] = useState<number>(1)
    const [selectedTopN, setSelectedTopN] = useState<number>(0)
    const [initialTopN, setInitialTopN] = useState<number | null>(null)
    const [configExists, setConfigExists] = useState(false)

    // ───── CONFIGURATION STATE ────────────────────────────────
    const [savedConfig, setSavedConfig] = useState<{
    selectedTopN: number;
    timestamp: Timestamp;
    } | null>(null);

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    

    // Auth and data fetching
    useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
        try {
            const idTokenResult = await getIdTokenResult(user, true);
            const role = idTokenResult.claims.role;
            console.log("🎭 Role from token:", role);
            if (role !== "superadmin") {
            router.push("/");
            return;
            }

            setCurrentUser(user);
            await fetchData();

            // Load existing selectedTopN configuration
            const configDocRef = doc(db, "leaderboard", "configurations");
            const configSnapshot = await getDoc(configDocRef);

            if (configSnapshot.exists()) {
            const data = configSnapshot.data();
            if (data[user.uid]?.selectedTopN) {
                setSelectedTopN(data[user.uid].selectedTopN);
            }
            }
        } catch (error) {
            console.error("Error getting user role or loading config:", error);
            router.push("/auth/login/admin");
        }
        } else {
        router.push("/auth/login/admin");
        }
    });

    return () => unsubscribe();
    }, [router]);

    // Update current step based on form completion
    useEffect(() => {
        if (selectedTopN > 0) {
        setCurrentStep(2)
        if (assignmentMethod) {
            setCurrentStep(3)
        }
        } else {
        setCurrentStep(1)
        }
    }, [selectedTopN, assignmentMethod])

    const fetchData = async () => {
        setFetchingData(true)
        try {
        // 1. Get total count of participants from leaderboard
        const leaderboardSnapshot = await getDocs(
        collection(db, "competitions", competitionId, "leaderboard")
        )
        setTotalParticipants(leaderboardSnapshot.size)

        // 2. Get judges from backend API using proper role-based filtering
        const token = await getIdToken()
        const url = `${process.env.NEXT_PUBLIC_API_URL}/superadmin/users?role=judge`
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch judges: ${res.status}`)
        }

        const data = await res.json()
        const judgeUsers = data.users || []

        if (!Array.isArray(judgeUsers)) {
            showToast("Invalid judge data received", "error")
        return
        }
        // 3. Transform API judge data for frontend state
        const judgesData: Judge[] = judgeUsers.map((user: any) => ({
            id: user.uid,
            name: user.displayName || user.email.split("@")[0] || "Unknown Judge",
            email: user.email,
            totalAssigned: 0,
        }))

        setJudges(judgesData)

        // 4. Fetch existing judge assignments
        await fetchExistingAssignments(judgesData)
        } catch (error) {
        console.error("Error fetching data:", error)
        showToast("Failed to load data from database", "error")
        } finally {
        setFetchingData(false)
        }
    }

    const fetchExistingAssignments = async (judgesData: Judge[]) => {
        try {
        console.log("Accessing path: competitions/" + competitionId + "/judges");
        
        const judgeDocRefs = judgesData.map(j => doc(db, "competitions", competitionId, "judges", j.id))
        const judgeDocs = await Promise.all(judgeDocRefs.map(getDoc))

        const assignments: { [key: string]: number } = {}
        judgeDocs.forEach((doc, i) => {
        if (doc.exists()) {
            const data = doc.data()
            if (data.assignedCount && data.assignedCount > 0) {
            assignments[judgesData[i].id] = data.assignedCount
            }
        }
        })



        setExistingAssignments(assignments)
        setJudgeAssignments(assignments)
        } catch (error) {
        console.error("Error fetching existing assignments:", error)
        }
    }

    // Auto-populate judge capacities when judges are selected for weighted method
    useEffect(() => {
        if (assignmentMethod === "Weighted") {
        const newCapacities = selectedJudges.map((judgeId) => ({
            judgeId,
            capacity: judgeCapacities.find((jc) => jc.judgeId === judgeId)?.capacity || 1,
        }))

        // Only update if the capacities array has actually changed
        const hasChanged =
            newCapacities.length !== judgeCapacities.length ||
            newCapacities.some(
            (nc, index) =>
                !judgeCapacities[index] ||
                nc.judgeId !== judgeCapacities[index].judgeId ||
                nc.capacity !== judgeCapacities[index].capacity,
            )

        if (hasChanged) {
            setJudgeCapacities(newCapacities)
        }
        }
    }, [selectedJudges, assignmentMethod])

    const handleSaveConfig = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user || selectedTopN === 0) return;

        // If a config already exists *and* the number changed, confirm overwrite.
        if (savedConfig && savedConfig.selectedTopN !== selectedTopN) {
            setShowConfirmDialog(true);
            return;
        }

        await saveConfigToFirestore(user.uid);
        };

        const saveConfigToFirestore = async (uid: string) => {
        try {
            const cfgRef = doc(db, "competitions", competitionId, "leaderboard", "configurations")
            await setDoc(
            cfgRef,
            {
                [uid]: {
                userId: uid,
                timestamp: serverTimestamp(),
                selectedTopN,
                },
            },
            { merge: true }
            );

            showToast("Configuration saved ✔️", "success");
            setSavedConfig({ selectedTopN, timestamp: serverTimestamp() as any });
        } catch (err) {
            console.error("Save config error:", err);
            showToast("Could not save configuration", "error");
        }
        };


    const handleDistributeParticipants = async () => {
        if (selectedTopN === 0 || !assignmentMethod) {
        showToast("Please complete all required fields", "error")
        return
        }

        if (assignmentMethod === "Weighted") {
        const totalAssigned = Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0)

        if (totalAssigned === 0) {
            showToast("Please assign at least one participant to judges", "error")
            return
        }

        if (totalAssigned < selectedTopN) {
            showToast(
            `Warning: Only ${totalAssigned} out of ${selectedTopN} participants are assigned to judges. Some participants will not have judges assigned.`,
            "error",
            )
            return
        }

        if (totalAssigned > selectedTopN) {
            showToast(
            `Error: Total assigned participants (${totalAssigned}) exceeds the selected number of participants (${selectedTopN}). Please reduce the assignments.`,
            "error",
            )
            return
        }
        }

        setLoading(true)
        try {
        // Step 1: Fetch top N participants from leaderboard
        const leaderboardQuery = query(
        collection(db, "competitions", competitionId, "leaderboard"),
        orderBy("totalScore", "desc"),
        limit(selectedTopN)
        )
        const leaderboardSnapshot = await getDocs(leaderboardQuery)
        const participants = leaderboardSnapshot.docs.map((doc) => doc.id)

        if (!participants || participants.length === 0) {
            throw new Error("No participants found")
        }

        // Step 2: Get available judges based on assignment method
        let availableJudges: string[] = []

        if (assignmentMethod === "Round-Robin") {
            // Use all judges for round-robin
            availableJudges = judges.map((j) => j.id)
        } else if (assignmentMethod === "Weighted") {
            // Use only judges with assigned capacity > 0
            availableJudges = Object.entries(judgeAssignments)
            .filter(([_, capacity]) => capacity > 0)
            .map(([judgeId, _]) => judgeId)
        }

        if (availableJudges.length === 0) {
            throw new Error("No judges available for assignment")
        }

        // Step 3: Distribute participants
        const assignments: { [key: string]: string[] } = {}
        if (assignmentMethod === "Round-Robin") {
            // Distribute participants evenly among all judges
            participants.forEach((pid, index) => {
            const judgeId = availableJudges[index % availableJudges.length]
            if (!assignments[judgeId]) assignments[judgeId] = []
            assignments[judgeId].push(pid)
            })
        } else if (assignmentMethod === "Weighted") {
            let remainingParticipants = [...participants]

            // Distribute participants based on each judge's capacity
            for (const judgeId of availableJudges) {
            const capacity = judgeAssignments[judgeId] || 0

            if (capacity > 0 && remainingParticipants.length > 0) {
                // Assign up to the capacity or remaining participants, whichever is smaller
                const assignCount = Math.min(capacity, remainingParticipants.length)
                assignments[judgeId] = remainingParticipants.slice(0, assignCount)
                remainingParticipants = remainingParticipants.slice(assignCount)
            }
            }
        }

        // Step 4: Save to Firestore
        const batch = writeBatch(db)
        Object.entries(assignments).forEach(([judgeId, pids]) => {
            const ref = doc(db, "competitions", competitionId, "judges", judgeId)
            batch.set(
            ref,
            {
                participants: pids,
                assignedCount: pids.length,
            },
            { merge: true },
            )
        })

        await batch.commit()

        const assignedCount = Object.values(assignments).reduce((sum, pids) => sum + pids.length, 0)
        showToast(`🎉 ${assignedCount} participants distributed successfully!`, "success")

        // Update existing assignments state
        const newAssignments: { [key: string]: number } = {}
        Object.entries(assignments).forEach(([judgeId, pids]) => {
            newAssignments[judgeId] = pids.length
        })
        setExistingAssignments(newAssignments)

        // // Reset form
        // setSelectedTopN(0)
        // setAssignmentMethod(null)
        // setSelectedJudges([])
        // setJudgeCapacities([])
        // setJudgeAssignments({})
        } catch (err) {
        console.error("Distribution error:", err)
        showToast(`Failed to distribute participants: ${err instanceof Error ? err.message : "Unknown error"}`, "error")
        } finally {
        setLoading(false)
        }
    }

    const showToast = (message: string, type: "success" | "error" | "info") => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 5000)
    }


    const filteredJudges = judges.filter(
        (j) =>
        j.name.toLowerCase().includes(judgeSearch.toLowerCase()) ||
        j.email.toLowerCase().includes(judgeSearch.toLowerCase()),
    )

    // Check if distribute button should be enabled
    const canDistribute = () => {
        if (selectedTopN === 0 || !assignmentMethod) return false
        if (assignmentMethod === "Weighted") {
        const totalAssigned = Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0)
        return totalAssigned > 0
        }
        return true
    }

    const getStatusColor = (status: string) => {
        switch (status) {
        case "available":
            return "bg-emerald-50 text-emerald-800 border-emerald-200"
        case "busy":
            return "bg-amber-50 text-amber-800 border-amber-200"
        case "offline":
            return "bg-gray-100 text-gray-600 border-gray-200"
        default:
            return "bg-gray-100 text-gray-600 border-gray-200"
        }
    }

    const getStatusDot = (status: string) => {
        switch (status) {
        case "available":
            return "bg-emerald-500"
        case "busy":
            return "bg-amber-500"
        case "offline":
            return "bg-red-500"
        default:
            return "bg-gray-400"
        }
    }

    if (fetchingData) {
        return (
        <div className="min-h-screen bg-gradient-to-r from-slate-100 to-slate-150 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
                <Loader className="animate-spin w-12 h-12 text-gray-700" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-gray-300 rounded-full animate-pulse"></div>
            </div>
            <p className="text-gray-800 font-semibold mt-4 text-lg">Loading participants and judges...</p>
            <p className="text-gray-600 font-medium mt-1">Setting up your distribution workspace</p>
            </div>
        </div>
        )
    }

    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-4">
        <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
                <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm transition-all duration-300 ${
                    currentStep >= step
                    ? "bg-gray-900 border-gray-900 text-white shadow-lg"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
                >
                {currentStep > step ? <Check className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                <ChevronRight
                    className={`w-5 h-5 mx-2 transition-colors duration-300 ${
                    currentStep > step ? "text-gray-900" : "text-gray-300"
                    }`}
                />
                )}
            </div>
            ))}
        </div>
        </div>
    )

    const NavBar = () => (
        <header className="w-full bg-gradient-to-r from-slate-100 to-slate-200 shadow-sm border-b border-gray-700 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-gray-700 to-gray-600">
                <Shuffle className="w-5 h-5 text-white" />
            </div>

            <div>
                <h2 className="font-bold text-black">Distribution Center</h2>
                <p className="text-xs text-gray-700">Participant Assignment System</p>
            </div>
        </div>
        <Button
            onClick={() => router.push(`/admin/dashboard?competitionId=${competitionId}`)}
            className="bg-gray-700 text-white hover:bg-gray-600 rounded-lg px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
        >
            <Settings className="w-4 h-4 mr-2" />
            Back to Admin
        </Button>
        </header>
    )

    return (
        <div className="min-h-screen bg-gradient-to-r from-slate-100 to-slate-150">
        <NavBar />

        {/* Toast Notification */}
        {toast && (
            <div
            className={`fixed top-4 right-4 z-50 max-w-sm p-4 rounded-xl shadow-xl border backdrop-blur-sm transition-all duration-300 ${
                toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : toast.type === "error"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
            >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                {toast.type === "success" && <CheckCircle2 className="w-5 h-5" />}
                {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
                {toast.type === "info" && <Info className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                <span className="text-sm font-medium leading-relaxed">{toast.message}</span>
                </div>
                <button
                onClick={() => setToast(null)}
                className="flex-shrink-0 h-6 w-6 hover:bg-white/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                <X className="w-4 h-4" />
                </button>
            </div>
            </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-150 border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center">
                <div className="inline-flex items-center gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-600 shadow-lg">
                        <Target className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Participant Distribution</h1>
                        <p className="text-gray-700 font-medium">Intelligent Assignment System</p>
                    </div>
                </div>

                <p className="text-lg font-medium text-gray-700 max-w-3xl mx-auto leading-relaxed mb-8">
                Distribute top-performing participants to qualified judges using advanced assignment algorithms and
                capacity management
                </p>

                <div className="bg-white backdrop-blur-sm rounded-xl p-4 shadow-sm w-full max-w-md mx-auto">
                    <StepIndicator />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
                <div className="bg-white shadow-sm rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                        <Users className="w-5 h-5 text-gray-700" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Pool</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{totalParticipants}</div>
                    <div className="text-sm text-gray-600">Registered Participants</div>
                </div>
                <div className="bg-white shadow-sm rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                        <Award className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Available</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{judges.length}</div>
                    <div className="text-sm text-gray-600">Active Judges</div>
                </div>
                <div className="bg-white shadow-sm rounded-xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-amber-50">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Assigned</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Object.values(existingAssignments).reduce((sum, val) => sum + val, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Current Assignments</div>
                </div>
                </div>
            </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
            
            {/* Step 1: Number of Participants */}
            <Card className="bg-white shadow-sm rounded-xl transition-all duration-200 overflow-hidden">
                <div className="bg-white p-6 border-b border-gray-700">
                    <CardTitle className="flex items-center gap-3 text-black text-xl">
                    <div className="p-2 rounded-lg bg-gray-700">
                        <Hash className="w-5 h-5 text-white" />
                    </div>
                    Step 1: Select Top Participants
                    </CardTitle>
                    <CardDescription className="text-gray-700 leading-relaxed mt-2 text-base">
                    Choose how many top-ranked participants should be distributed to judges for evaluation.
                    </CardDescription>
                </div>

                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                    <div className="relative">
                        <input
                        type="number"
                        min="1"
                        max={totalParticipants}
                        value={selectedTopN || ""}
                        onChange={(e) => setSelectedTopN(Number.parseInt(e.target.value) || 0)}
                        placeholder="Enter number (e.g., 20)"
                        className="w-full h-16 px-6 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-2xl font-bold focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all duration-200"
                        />
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                        / {totalParticipants}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {[10, 20, 50].map((n) => (
                        <Button
                            key={n}
                            onClick={() => setSelectedTopN(n)}
                            className={`h-12 px-6 rounded-lg font-semibold transition-all duration-200 ${
                            selectedTopN === n
                                ? "bg-gray-900 text-white hover:bg-gray-800"
                                : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                            disabled={n > totalParticipants}
                        >
                            {n}
                        </Button>
                        ))}
                    </div>
                    </div>

                    <div>
                    <Button
                        onClick={handleSaveConfig}
                        disabled={selectedTopN === 0}
                        className="w-full h-12 px-6 rounded-lg font-semibold bg-gradient-to-r from-gray-700 to-gray-600  text-white hover:bg-emerald-500 transition-all duration-200 disabled:opacity-40"
                    >
                        Save Configuration
                    </Button>
                    </div>

                    {selectedTopN > 0 && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
                        <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">
                            Selected: Top {selectedTopN} participants (ranks #1 - #{selectedTopN})
                        </span>
                        </div>
                    </div>
                    )}

                    {/* Confirmation Dialog */}
                    {showConfirmDialog && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                            Overwrite saved configuration?
                        </h3>
                        <p className="text-gray-700">
                            You already saved <strong>{savedConfig?.selectedTopN}</strong> participants.
                            Do you really want to change it to <strong>{selectedTopN}</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                            onClick={() => setShowConfirmDialog(false)}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                            Cancel
                            </Button>
                            <Button
                            onClick={async () => {
                                const auth = getAuth();
                                await saveConfigToFirestore(auth.currentUser!.uid);
                                setShowConfirmDialog(false);
                            }}
                            className="bg-red-600 text-white hover:bg-red-500"
                            >
                            Yes, overwrite
                            </Button>
                        </div>
                        </div>
                    </div>
                    )}
                </CardContent>
                </Card>


            {/* Step 2: Assignment Strategy */}
            {selectedTopN > 0 && (
            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="bg-white p-6 border-b border-gray-700">
                <CardTitle className="flex items-center gap-3 text-black text-xl">
                    <div className="p-2 rounded-lg bg-gray-700">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    Step 2: Assignment Strategy
                </CardTitle>
                <CardDescription className="text-gray-700 leading-relaxed mt-2 text-base">
                    Choose the distribution method that best fits your evaluation requirements
                </CardDescription>
                </div>
                <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Round-Robin Option */}
                    <label className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all duration-200">
                    <input
                        type="radio"
                        name="assignmentMethod"
                        value="Round-Robin"
                        checked={assignmentMethod === "Round-Robin"}
                        onChange={(e) => setAssignmentMethod(e.target.value as AssignmentMethod)}
                        className="w-5 h-5 accent-gray-900 mt-1"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                        <div className="text-lg font-bold text-gray-900">Round-Robin Distribution</div>
                        <div className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border bg-blue-50 border-blue-200 text-blue-800">
                            BALANCED
                        </div>
                        </div>
                        <div className="text-base text-gray-700 leading-relaxed mb-3">
                        Automatically distributes participants evenly across all available judges. Ensures fair workload
                        distribution with no manual configuration required.
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Quick setup • Equal distribution • No bias</span>
                        </div>
                    </div>
                    </label>

                    {/* Weighted Option */}
                    <label className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all duration-200">
                    <input
                        type="radio"
                        name="assignmentMethod"
                        value="Weighted"
                        checked={assignmentMethod === "Weighted"}
                        onChange={(e) => setAssignmentMethod(e.target.value as AssignmentMethod)}
                        className="w-5 h-5 accent-gray-900 mt-1"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                        <div className="text-lg font-bold text-gray-900">Weighted Distribution</div>
                        <div className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border bg-emerald-50 border-emerald-200 text-emerald-800">
                            CUSTOM
                        </div>
                        </div>
                        <div className="text-base text-gray-700 leading-relaxed mb-3">
                        Distribute participants based on each judge's individual capacity and availability. Perfect for
                        scenarios with varying judge workloads and expertise levels.
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Target className="w-4 h-4" />
                        <span>Flexible capacity • Custom allocation • Optimized matching</span>
                        </div>
                    </div>
                    </label>

                    {/* Automatic Option (Disabled) */}
                    <div className="relative">
                    <label className="flex items-start gap-4 p-6 bg-gray-100 rounded-xl border border-gray-200 cursor-not-allowed opacity-60">
                        <input
                        type="radio"
                        name="assignmentMethod"
                        value="Automatic"
                        disabled
                        className="w-5 h-5 accent-gray-400 mt-1"
                        />
                        <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="text-lg font-bold text-gray-500">AI-Powered Distribution</div>
                            <div className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border bg-gray-200 border-gray-300 text-gray-600">
                            COMING SOON
                            </div>
                        </div>
                        <div className="text-base text-gray-500 leading-relaxed mb-3">
                            Advanced machine learning algorithms analyze judge expertise, availability, and historical
                            performance to create optimal assignments automatically.
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Star className="w-4 h-4" />
                            <span>ML-powered • Smart matching • Performance optimization</span>
                        </div>
                        </div>
                    </label>
                    </div>
                </div>
                </CardContent>
            </Card>
            )}

            {/* Step 3: Judge Configuration */}
            {assignmentMethod === "Weighted" && (
            <Card className="bg-white shadow-sm rounded-xl hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="bg-white p-6 border-b border-gray-700">
                <CardTitle className="flex items-center gap-3 text-black text-xl">
                    <div className="p-2 rounded-lg bg-gray-700">
                        <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    Step 3: Configure Judge Assignments
                </CardTitle>
                <CardDescription className="text-gray-700 leading-relaxed mt-2 text-base">
                    Set the number of participants each judge should evaluate based on their capacity and expertise
                </CardDescription>
                </div>
                <CardContent className="p-6">
                <div className="space-y-6">
                    {/* Search */}
                    <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search judges by name, email, or institution..."
                        value={judgeSearch}
                        onChange={(e) => setJudgeSearch(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:border-gray-900 focus:outline-none focus:ring-gray-900/20 transition-all duration-200"
                    />
                    </div>

                    {/* Judge List */}
                    <div className="space-y-4">
                    {filteredJudges.map((judge) => (
                        <div
                        key={judge.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                        >
                        {/* Judge Avatar & Status */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center font-bold text-gray-700 text-sm">
                            {judge.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusDot(judge.status || "available")}`}
                            ></div>
                        </div>

                        {/* Judge Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                            <div className="font-bold text-gray-900">{judge.name}</div>
                            
                            </div>
                            <div className="text-sm text-gray-600">{judge.email}</div>
                            {judge.institution && <div className="text-xs text-gray-500">{judge.institution}</div>}
                            {existingAssignments[judge.id] && existingAssignments[judge.id] > 0 && (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                                Currently assigned: {existingAssignments[judge.id]} participants
                            </div>
                            )}
                        </div>

                        {/* Assignment Input */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Participants:</span>
                            <input
                            type="number"
                            min="0"
                            max={selectedTopN}
                            value={judgeAssignments[judge.id] || 0}
                            onChange={(e) => {
                                const value = Math.max(0, Number.parseInt(e.target.value) || 0)
                                setJudgeAssignments((prev) => ({ ...prev, [judge.id]: value }))
                            }}
                            className="w-16 p-2 bg-white border border-gray-200 rounded text-center text-gray-900 text-sm focus:border-gray-900 focus:outline-none"
                            />
                        </div>
                        </div>
                    ))}
                    </div>

                    {/* Total Display */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                        <div className="text-2xl font-bold text-gray-700">{selectedTopN}</div>
                        <div className="text-sm text-gray-600">To Assign</div>
                        </div>
                        <div>
                        <div
                            className={`text-2xl font-bold ${
                            Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0) > selectedTopN
                                ? "text-red-600"
                                : "text-emerald-600"
                            }`}
                        >
                            {Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Assigned</div>
                        </div>
                        <div>
                        <div className="text-2xl font-bold text-amber-600">
                            {selectedTopN - Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Remaining</div>
                        </div>
                    </div>
                    {Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0) > selectedTopN && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-center">
                        <AlertCircle className="w-5 h-5 inline mr-2" />
                        <span className="font-medium">Total assignments exceed selected participants</span>
                        </div>
                    )}
                    </div>
                </div>
                </CardContent>
            </Card>
            )}

            {/* Action Button */}
            <div className="flex justify-center">
            <Button
                onClick={handleDistributeParticipants}
                disabled={loading || !canDistribute()}
                className="bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 rounded-lg px-8 py-4 text-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
            >
                {loading ? (
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Distributing Participants...</span>
                </div>
                ) : (
                <div className="flex items-center gap-3">
                    <Shuffle className="w-5 h-5" />
                    <span>Distribute Participants</span>
                    <ArrowRight className="w-5 h-5" />
                </div>
                )}
            </Button>
            </div>

            {/* Preview Section */}
            {canDistribute() && (
            <Card className="bg-white shadow-sm rounded-xl overflow-hidden">
                <div className="bg-white text-black p-6 border-b border-gray-700">
                <CardTitle className="flex items-center gap-3 text-black text-xl">
                    <div className="p-2 rounded-lg bg-gray-700">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    Distribution Preview
                </CardTitle>
                <p className="text-gray-700 mt-2">Review your distribution settings before proceeding</p>
                </div>
                <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-gray-700 mb-1">{selectedTopN}</div>
                    <div className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Participants</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">
                        {assignmentMethod === "Weighted"
                        ? Object.values(judgeAssignments).filter((val) => val > 0).length
                        : judges.length}
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Active Judges</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-200">
                    <div className="text-lg font-bold text-amber-600 mb-1">{assignmentMethod}</div>
                    <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Method</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                        {assignmentMethod === "Weighted"
                        ? Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0)
                        : selectedTopN}
                    </div>
                    <div className="text-xs font-semibold text-red-700 uppercase tracking-wide">Total Assignments</div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-700 leading-relaxed">
                    <strong className="text-gray-900">Ready to distribute:</strong> The top {selectedTopN} participants
                    will be assigned to judges using the <strong>{assignmentMethod}</strong> method.
                    {assignmentMethod === "Round-Robin" &&
                        " All available judges will receive participants automatically with balanced distribution."}
                    {assignmentMethod === "Weighted" &&
                        ` ${Object.values(judgeAssignments).filter((val) => val > 0).length} selected judges will receive participants based on their individual capacity settings.`}
                    </div>
                </div>
                </CardContent>
            </Card>
            )}
        </div>
        </div>
    )
}
