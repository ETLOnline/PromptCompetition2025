'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, Settings, Shuffle, ChevronDown, Trophy, Search, X, CheckCircle2, AlertCircle, Hash, Info } from 'lucide-react';
import { writeBatch, doc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getIdTokenResult } from 'firebase/auth';
import { getIdToken } from "@/lib/firebaseAuth";


interface Judge {
    id: string;
    name: string;
    email: string;
    institution?: string;
}

interface JudgeCapacity {
    judgeId: string;
    capacity: number;
}

type AssignmentMethod = 'Round-Robin' | 'Weighted' | 'Automatic';

export default function ParticipantDistribution() {
    const router = useRouter();
    const [totalParticipants, setTotalParticipants] = useState<number>(0);
    const [judges, setJudges] = useState<Judge[]>([]);
    const [selectedTopN, setSelectedTopN] = useState<number>(0);
    const [selectedJudges, setSelectedJudges] = useState<string[]>([]);
    const [assignmentMethod, setAssignmentMethod] = useState<AssignmentMethod | null>(null);
    const [judgeCapacities, setJudgeCapacities] = useState<JudgeCapacity[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [judgeAssignments, setJudgeAssignments] = useState<{ [key: string]: number }>({});
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [judgeSearch, setJudgeSearch] = useState('');
    const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

    // Auth and data fetching
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const idTokenResult = await getIdTokenResult(user, true);
                    const role = idTokenResult.claims.role;
                    
                    if (role !== "superadmin") {
                        router.push('/');
                        return;
                    }
                    
                    setCurrentUser(user);
                    await fetchData();
                } catch (error) {
                    console.error('Error getting user role:', error);
                    router.push('/login');
                }
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const fetchData = async () => {
        setFetchingData(true);

        try {
            // 1. Get total count of participants from leaderboard
            const leaderboardSnapshot = await getDocs(collection(db, 'leaderboard'));
            setTotalParticipants(leaderboardSnapshot.size);

            // 2. Get judges from backend API using proper role-based filtering
            const token = await getIdToken();
            const url = `http://localhost:8080/superadmin/users?role=judge`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                throw new Error(`Failed to fetch judges: ${res.status}`);
            }

            const data = await res.json();
            const judgeUsers = data.users || [];

            // 3. Transform API judge data for frontend state
            const judgesData: Judge[] = judgeUsers.map((user: any) => ({
                id: user.uid,
                name: user.displayName || user.email.split('@')[0] || 'Unknown Judge',
                email: user.email,
            }));

            setJudges(judgesData);

        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Failed to load data from database', 'error');
        } finally {
            setFetchingData(false);
        }
    };

    // Auto-populate judge capacities when judges are selected for weighted method
    useEffect(() => {
        if (assignmentMethod === 'Weighted') {
            const newCapacities = selectedJudges.map(judgeId => ({
                judgeId,
                capacity: judgeCapacities.find(jc => jc.judgeId === judgeId)?.capacity || 1
            }));
            setJudgeCapacities(newCapacities);
        }
    }, [selectedJudges, assignmentMethod, judgeCapacities]);

    const handleJudgeToggle = (judgeId: string) => {
        setSelectedJudges(prev => 
            prev.includes(judgeId) 
                ? prev.filter(id => id !== judgeId)
                : [...prev, judgeId]
        );
    };

    const handleCapacityChange = (judgeId: string, capacity: number) => {
        setJudgeCapacities(prev => 
            prev.map(jc => jc.judgeId === judgeId ? { ...jc, capacity } : jc)
        );
    };

    const handleDistributeParticipants = async () => {
        if (selectedTopN === 0 || !assignmentMethod) {
            showToast('Please complete all required fields', 'error');
            return;
        }

        if (assignmentMethod === 'Weighted') {
            const totalAssigned = Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0);
            if (totalAssigned === 0) {
                showToast('Please assign at least one participant to judges', 'error');
                return;
            }
        }

        setLoading(true);

        try {
            // Step 1: Fetch top N participants from leaderboard
            const leaderboardQuery = query(
                collection(db, 'leaderboard'),
                orderBy('totalScore', 'desc'),
                limit(selectedTopN)
            );
            const leaderboardSnapshot = await getDocs(leaderboardQuery);
            const participants = leaderboardSnapshot.docs.map(doc => doc.id);

            if (!participants || participants.length === 0) {
                throw new Error('No participants found');
            }

            // Step 2: Get available judges based on assignment method
            let availableJudges: string[] = [];
            
            if (assignmentMethod === 'Round-Robin') {
                // Use all judges for round-robin
                availableJudges = judges.map(j => j.id);
            } else if (assignmentMethod === 'Weighted') {
                // Use only judges with assigned capacity > 0
                availableJudges = Object.entries(judgeAssignments)
                    .filter(([_, capacity]) => capacity > 0)
                    .map(([judgeId, _]) => judgeId);
            }

            if (availableJudges.length === 0) {
                throw new Error('No judges available for assignment');
            }

            // Step 3: Distribute participants
            const assignments: { [key: string]: string[] } = {};

            if (assignmentMethod === 'Round-Robin') {
                // Distribute participants evenly among all judges
                participants.forEach((pid, index) => {
                    const judgeId = availableJudges[index % availableJudges.length];
                    if (!assignments[judgeId]) assignments[judgeId] = [];
                    assignments[judgeId].push(pid);
                });
            } else if (assignmentMethod === 'Weighted') {
                let remainingParticipants = [...participants];
                
                // Distribute participants based on each judge's capacity
                for (const judgeId of availableJudges) {
                    const capacity = judgeAssignments[judgeId] || 0;
                    
                    if (capacity > 0 && remainingParticipants.length > 0) {
                        // Assign up to the capacity or remaining participants, whichever is smaller
                        const assignCount = Math.min(capacity, remainingParticipants.length);
                        assignments[judgeId] = remainingParticipants.slice(0, assignCount);
                        remainingParticipants = remainingParticipants.slice(assignCount);
                    }
                }

                // Provide feedback if not all participants were assigned
                if (remainingParticipants.length > 0) {
                    showToast(
                        `Warning: ${remainingParticipants.length} participants were not assigned due to insufficient judge capacity`,
                        'info'
                    );
                }
            }

            // Step 4: Save to Firestore
            const batch = writeBatch(db);
            Object.entries(assignments).forEach(([judgeId, pids]) => {
                const ref = doc(db, 'judges', judgeId);
                batch.set(ref, {
                    participants: pids,
                    assignedCount: pids.length
                }, { merge: true });
            });
            await batch.commit();

            const assignedCount = Object.values(assignments).reduce((sum, pids) => sum + pids.length, 0);
            showToast(`${assignedCount} participants distributed successfully!`, 'success');

            // Reset form
            setSelectedTopN(0);
            setAssignmentMethod(null);
            setSelectedJudges([]);
            setJudgeCapacities([]);
            setJudgeAssignments({});
        } catch (err) {
            console.error('Distribution error:', err);
            showToast(`Failed to distribute participants: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const selectAllJudges = () => {
        setSelectedJudges(judges.map(j => j.id));
    };

    const filteredJudges = judges.filter(j => 
        j.name.toLowerCase().includes(judgeSearch.toLowerCase()) ||
        j.email.toLowerCase().includes(judgeSearch.toLowerCase())
    );

    // Check if distribute button should be enabled
    const canDistribute = () => {
        if (selectedTopN === 0 || !assignmentMethod) return false;
        if (assignmentMethod === 'Weighted') {
            const totalAssigned = Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0);
            return totalAssigned > 0;
        }
        return true;
    };

    if (fetchingData) {
        return (
            <div className="min-h-screen bg-[#07073a] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#56ffbc]/20 border-t-[#56ffbc] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#56ffbc]">Loading participants and judges...</p>
                </div>
            </div>
        );
    }

    const NavBar = () => (
        <header className="w-full bg-[#0d0d2b] text-white px-6 py-4 shadow-md flex items-center justify-between sticky top-0 z-50">
            <div />
            <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 bg-[#56ffbc] text-[#07073a] hover:bg-[#48e6a3] font-medium px-4 py-1.5 rounded-lg shadow transition-all"
            >
                <Settings className="w-4 h-4" />
                <span>Back to Admin</span>
            </button>
        </header>
    );

    return (
        <div className="min-h-screen bg-[#07073a] text-white">
            <NavBar />  

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                    toast.type === 'success' ? 'bg-green-900/80 border-green-500/50 text-green-100' :
                    toast.type === 'error' ? 'bg-red-900/80 border-red-500/50 text-red-100' :
                    'bg-blue-900/80 border-blue-500/50 text-blue-100'
                }`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                        {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                        {toast.type === 'info' && <Info className="w-5 h-5" />}
                        <span>{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c4f] to-[#07073a]" />
                <div className="relative px-6 py-12">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-[#56ffbc]/20 to-[#56ffbc]/5 border border-[#56ffbc]/30">
                                <Shuffle className="w-8 h-8 text-[#56ffbc]" />
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-[#56ffbc] bg-clip-text text-transparent">
                                Participant Distribution
                            </h1>
                        </div>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                            Assign top-performing participants to judges using intelligent distribution strategies
                        </p>
                        
                        {/* Quick Stats */}
                        <div className="flex justify-center gap-8 mt-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-[#56ffbc]">{totalParticipants}</div>
                                <div className="text-sm text-gray-400">Total Participants</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-[#56ffbc]">{judges.length}</div>
                                <div className="text-sm text-gray-400">Available Judges</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Step 1: Number of Participants */}
                <Card className="mb-8 bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border-[#56ffbc]/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-[#56ffbc]">
                            <Hash className="w-5 h-5" />
                            Step 1: Number of Top Participants
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                            How many top-ranked participants should be distributed to judges?
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <input
                                    type="number"
                                    min="1"
                                    max={totalParticipants}
                                    value={selectedTopN || ''}
                                    onChange={(e) => setSelectedTopN(parseInt(e.target.value) || 0)}
                                    placeholder="Enter number (e.g., 10)"
                                    className="w-full p-4 bg-[#07073a] border border-[#56ffbc]/30 rounded-lg text-white text-xl font-bold focus:border-[#56ffbc]/50 focus:outline-none"
                                />
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                    / {totalParticipants}
                                </div>
                            </div>
                            
                            {/* Quick select buttons */}
                            <div className="flex gap-2">
                                {[10, 20, 50].map(n => (
                                    <Button
                                        key={n}
                                        onClick={() => setSelectedTopN(n)}
                                        variant={selectedTopN === n ? "default" : "outline"}
                                        size="sm"
                                        className={selectedTopN === n 
                                            ? "bg-[#56ffbc] text-black hover:bg-[#56ffbc]/90" 
                                            : "border-[#56ffbc]/30 text-[#56ffbc] hover:bg-[#56ffbc]/10"
                                        }
                                        disabled={n > totalParticipants}
                                    >
                                        {n}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        
                        {selectedTopN > 0 && (
                            <div className="mt-4 p-3 bg-[#56ffbc]/10 rounded-lg border border-[#56ffbc]/20">
                                <div className="text-sm text-gray-300">
                                    ✅ Selected: Top {selectedTopN} participants (ranks #1 - #{selectedTopN})
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Assignment Strategy (only show if step 1 is complete) */}
                {selectedTopN > 0 && (
                    <Card className="mb-8 bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border-[#56ffbc]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-[#56ffbc]">
                                <Settings className="w-5 h-5" />
                                Step 2: Assignment Strategy
                            </CardTitle>
                            <CardDescription className="text-gray-300">
                                Choose how participants should be distributed among judges
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Round-Robin Option */}
                                <label className="flex items-start gap-4 p-4 bg-[#07073a] rounded-lg border border-transparent hover:border-[#56ffbc]/30 cursor-pointer transition-all">
                                    <input
                                        type="radio"
                                        name="assignmentMethod"
                                        value="Round-Robin"
                                        checked={assignmentMethod === 'Round-Robin'}
                                        onChange={(e) => setAssignmentMethod(e.target.value as AssignmentMethod)}
                                        className="w-5 h-5 accent-[#56ffbc] mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-white mb-1">Round-Robin (Balanced Assignment)</div>
                                        <div className="text-sm text-gray-300">
                                            Automatically distributes participants evenly across all available judges. 
                                            Simple and fair - no manual judge selection required.
                                        </div>
                                    </div>
                                </label>

                                {/* Weighted Option */}
                                <label className="flex items-start gap-4 p-4 bg-[#07073a] rounded-lg border border-transparent hover:border-[#56ffbc]/30 cursor-pointer transition-all">
                                    <input
                                        type="radio"
                                        name="assignmentMethod"
                                        value="Weighted"
                                        checked={assignmentMethod === 'Weighted'}
                                        onChange={(e) => setAssignmentMethod(e.target.value as AssignmentMethod)}
                                        className="w-5 h-5 accent-[#56ffbc] mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-white mb-1">Weighted (Based on Judge Capacity)</div>
                                        <div className="text-sm text-gray-300">
                                            Distribute participants based on each judge's individual capacity. 
                                            Allows you to specify how many participants each judge can handle.
                                        </div>
                                    </div>
                                </label>

                                {/* Automatic Option (Disabled) */}
                                <div className="relative">
                                    <label className="flex items-start gap-4 p-4 bg-[#07073a]/50 rounded-lg border border-gray-600/30 cursor-not-allowed opacity-60">
                                        <input
                                            type="radio"
                                            name="assignmentMethod"
                                            value="Automatic"
                                            disabled
                                            className="w-5 h-5 accent-gray-500 mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-400 mb-1">Automatic Load-Balanced Distribution</div>
                                            <div className="text-sm text-gray-500">
                                                AI-powered distribution based on judge availability and workload. Coming soon!
                                            </div>
                                        </div>
                                    </label>
                                    <div className="absolute top-2 right-2 bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded">
                                        Coming Soon
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Judge Configuration (only show for Weighted method) */}
                {assignmentMethod === 'Weighted' && (
                    <Card className="mb-8 bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border-[#56ffbc]/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-[#56ffbc]">
                                <UserCheck className="w-5 h-5" />
                                Step 3: Configure Judge Assignments
                            </CardTitle>
                            <CardDescription className="text-gray-300">
                                Assign number of participants to each judge
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Search */}
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search judges..."
                                        value={judgeSearch}
                                        onChange={(e) => setJudgeSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-[#07073a] border border-[#56ffbc]/30 rounded-lg text-white placeholder-gray-400 focus:border-[#56ffbc]/50 focus:outline-none"
                                    />
                                </div>

                                {/* Judge List with Assignment Inputs */}
                                <div className="space-y-3">
                                    {filteredJudges.map(judge => (
                                        <div key={judge.id} className="flex items-center gap-3 p-3 bg-[#07073a] rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium text-[#56ffbc]">{judge.name}</div>
                                                <div className="text-xs text-gray-400">{judge.email}</div>
                                                {judge.institution && (
                                                    <div className="text-xs text-gray-500">{judge.institution}</div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-300">Participants:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={selectedTopN}
                                                    value={judgeAssignments[judge.id] || 0}
                                                    onChange={(e) => {
                                                        const value = Math.max(0, parseInt(e.target.value) || 0);
                                                        setJudgeAssignments(prev => ({ ...prev, [judge.id]: value }));
                                                    }}
                                                    className="w-16 p-2 bg-[#0c0c4f] border border-[#56ffbc]/30 rounded text-center text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Assigned Display */}
                                <div className="mt-4 p-3 bg-[#07073a]/50 rounded-lg border border-[#56ffbc]/20">
                                    <div className="text-sm text-gray-300">
                                        <div className="flex justify-between items-center">
                                            <span>Total participants to assign:</span>
                                            <span className="font-bold text-[#56ffbc]">{selectedTopN}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Total assigned:</span>
                                            <span className={`font-bold ${
                                                Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0) > selectedTopN 
                                                    ? 'text-red-400' 
                                                    : 'text-[#56ffbc]'
                                            }`}>
                                                {Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0)}
                                            </span>
                                        </div>
                                        {Object.values(judgeAssignments).reduce((sum, val) => sum + val, 0) > selectedTopN && (
                                            <div className="text-red-400 text-xs mt-1">
                                                ⚠️ Exceeds selected participants
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <Button
                        onClick={handleDistributeParticipants}
                        disabled={loading || !canDistribute()}
                        className="flex-1 bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/80 hover:from-[#56ffbc]/90 hover:to-[#56ffbc]/70 text-black font-semibold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                Distributing Participants...
                            </div>
                        ) : (
                            <>
                                <Shuffle className="w-5 h-5 mr-2" />
                                Distribute Participants
                            </>
                        )}
                    </Button>
                </div>

                {/* Preview Section */}
                {canDistribute() && (
                    <Card className="mt-8 bg-gradient-to-br from-[#0c0c4f] to-[#07073a] border-[#56ffbc]/20">
                        <CardHeader>
                            <CardTitle className="text-[#56ffbc] flex items-center gap-2">
                                <Trophy className="w-5 h-5" />
                                Distribution Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[#56ffbc]/10 rounded-lg p-4 border border-[#56ffbc]/20 text-center">
                                    <div className="text-2xl font-bold text-[#56ffbc]">{selectedTopN}</div>
                                    <div className="text-sm text-gray-400">Participants to Distribute</div>
                                </div>
                                <div className="bg-[#56ffbc]/10 rounded-lg p-4 border border-[#56ffbc]/20 text-center">
                                    <div className="text-2xl font-bold text-[#56ffbc]">
                                        {assignmentMethod === 'Weighted' 
                                            ? Object.values(judgeAssignments).filter(val => val > 0).length
                                            : judges.length}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {assignmentMethod === 'Weighted' ? 'Active Judges' : 'All Judges'}
                                    </div>
                                </div>
                                <div className="bg-[#56ffbc]/10 rounded-lg p-4 border border-[#56ffbc]/20 text-center">
                                    <div className="text-2xl font-bold text-[#56ffbc]">{assignmentMethod}</div>
                                    <div className="text-sm text-gray-400">Distribution Method</div>
                                </div>
                            </div>
                            
                            <div className="mt-4 p-4 bg-[#07073a] rounded-lg border border-[#56ffbc]/20">
                                <div className="text-sm text-gray-300">
                                    <strong className="text-[#56ffbc]">Ready to distribute:</strong> The top {selectedTopN} participants 
                                    will be assigned to judges using the {assignmentMethod} method.
                                    {assignmentMethod === 'Round-Robin' && ' All available judges will receive participants automatically.'}
                                    {assignmentMethod === 'Weighted' && ` ${Object.values(judgeAssignments).filter(val => val > 0).length} selected judges will receive participants based on their capacity settings.`}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}