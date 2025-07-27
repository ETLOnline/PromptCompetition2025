'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Trophy, 
    Users, 
    Eye, 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    Target,
    Filter,
    ArrowUpDown
} from 'lucide-react';

interface ParticipantAssignment {
    id: string;
    participantId: string;
    totalChallenges: number;
    reviewedChallenges: number;
    status: 'pending' | 'in-progress' | 'completed';
    lastReviewedAt?: Date;
}

type SortOption = 'progress' | 'status';
type FilterOption = 'all' | 'pending' | 'in-progress' | 'completed';

export default function JudgeDashboard() {
    const [assignments, setAssignments] = useState<ParticipantAssignment[]>([]);
    const [filteredAssignments, setFilteredAssignments] = useState<ParticipantAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('progress');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const router = useRouter();

    // Mock judge ID - in real app, get from auth context
    const judgeId = 'current-judge-id';

    useEffect(() => {
        const fetchAssignments = async () => {
        try {
            setLoading(true);
            setError(null);

            // In a real app, you'd fetch from a judge_assignments collection
            // For now, we'll create mock data based on the participants
            const participantsRef = collection(db, process.env.NEXT_PUBLIC_LEADERBOARD_DATABASE || 'leaderboard');
            const q = query(participantsRef, orderBy('rank', 'asc'));
            const querySnapshot = await getDocs(q);

            const mockAssignments: ParticipantAssignment[] = [];
            
            querySnapshot.forEach((doc, index) => {
                const data = doc.data();
                const reviewedCount = Math.floor(Math.random() * 6); // 0-5 reviewed
                const totalCount = 5; // Assuming 5 total challenges
                
                let status: 'pending' | 'in-progress' | 'completed' = 'pending';
                if (reviewedCount === totalCount) status = 'completed';
                else if (reviewedCount > 0) status = 'in-progress';

                mockAssignments.push({
                    id: `assignment-${doc.id}`,
                    participantId: doc.id,
                    totalChallenges: totalCount,
                    reviewedChallenges: reviewedCount,
                    status,
                    lastReviewedAt: reviewedCount > 0 ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000) : undefined
                });
            });

            setAssignments(mockAssignments);
        } catch (err) {
            console.error('Error fetching assignments:', err);
            setError('Failed to load participant assignments. Please try again.');
        } finally {
            setLoading(false);
        }
        };

        fetchAssignments();
    }, []);

    useEffect(() => {
        let filtered = [...assignments];

        // Apply filter
        if (filterBy !== 'all') {
        filtered = filtered.filter(assignment => assignment.status === filterBy);
        }

        // Apply sort
        filtered.sort((a, b) => {
        switch (sortBy) {
            case 'progress':
            return (b.reviewedChallenges / b.totalChallenges) - (a.reviewedChallenges / a.totalChallenges);
            case 'status':
            const statusOrder = { 'pending': 0, 'in-progress': 1, 'completed': 2 };
            return statusOrder[a.status] - statusOrder[b.status];
            default:
            return 0;
        }
        });

        setFilteredAssignments(filtered);
    }, [assignments, sortBy, filterBy]);

    const handleReviewSubmissions = (participantId: string) => {
        router.push(`/judge/${participantId}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
        case 'pending':
            return (
            <div className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 text-xs font-medium border border-gray-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Pending
            </div>
            );
        case 'in-progress':
            return (
            <div className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-medium border border-yellow-500/30 flex items-center gap-1">
                <Target className="w-3 h-3" />
                In Progress
            </div>
            );
        case 'completed':
            return (
            <div className="px-3 py-1 rounded-full bg-[#56ffbc]/20 text-[#56ffbc] text-xs font-medium border border-[#56ffbc]/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Completed
            </div>
            );
        default:
            return null;
        }
    };

    const getProgressPercentage = (reviewed: number, total: number) => {
        return Math.round((reviewed / total) * 100);
    };

    const stats = {
        total: assignments.length,
        pending: assignments.filter(a => a.status === 'pending').length,
        inProgress: assignments.filter(a => a.status === 'in-progress').length,
        completed: assignments.filter(a => a.status === 'completed').length
    };

    return (
        <div className="min-h-screen bg-[#07073a] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Animated Header */}
            <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#0c0c4f] to-[#10103d] border border-[#56ffbc]/20">
                <Trophy className="w-8 h-8 text-[#56ffbc]" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-[#56ffbc] bg-clip-text text-transparent">
                Evaluation Panel
                </h1>
            </div>

            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Review and evaluate assigned participants' challenge submissions
            </p>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{assignments.length} Assigned Participants</span>
                </div>
            </div>
            </div>

            {/* Loading State */}
            {loading && (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                <Loader2 className="w-8 h-8 text-[#56ffbc] animate-spin mx-auto mb-4" />
                <p className="text-gray-300">Loading assignments...</p>
                </div>
            </div>
            )}

            {/* Error State */}
            {error && (
            <div className="flex items-center justify-center py-16">
                <Card className="max-w-md w-full bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-500/20">
                <CardContent className="pt-6">
                    <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-300 mb-2">Error Loading Data</h3>
                    <p className="text-gray-300 mb-4">{error}</p>
                    <Button 
                        onClick={() => window.location.reload()}
                        className="bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/80 hover:from-[#56ffbc]/90 hover:to-[#56ffbc] text-black font-medium transition-all duration-300"
                    >
                        Try Again
                    </Button>
                    </div>
                </CardContent>
                </Card>
            </div>
            )}

            {/* Stats Cards */}
            {!loading && !error && assignments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-r from-[#0c0c4f] to-[#10103d] border border-[#56ffbc]/20">
                <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-[#56ffbc] mb-2">{stats.total}</div>
                    <div className="text-sm text-gray-300">Total Assigned</div>
                </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-[#0c0c4f] to-[#10103d] border border-gray-500/20">
                <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-gray-300 mb-2">{stats.pending}</div>
                    <div className="text-sm text-gray-300">Pending</div>
                </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-[#0c0c4f] to-[#10103d] border border-yellow-500/20">
                <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.inProgress}</div>
                    <div className="text-sm text-gray-300">In Progress</div>
                </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-[#0c0c4f] to-[#10103d] border border-[#56ffbc]/20">
                <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-[#56ffbc] mb-2">{stats.completed}</div>
                    <div className="text-sm text-gray-300">Completed</div>
                </CardContent>
                </Card>
            </div>
            )}

            {/* Controls */}
            {!loading && !error && assignments.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                    className="bg-[#0c0c4f] border border-[#56ffbc]/20 rounded-lg px-3 py-2 text-sm text-white focus:border-[#56ffbc]/40 focus:outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                </div>

                <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-[#0c0c4f] border border-[#56ffbc]/20 rounded-lg px-3 py-2 text-sm text-white focus:border-[#56ffbc]/40 focus:outline-none"
                >
                    <option value="progress">Sort by Progress</option>
                    <option value="status">Sort by Status</option>
                    <option value="name">Sort by Name</option>
                    <option value="assigned">Sort by Assigned Date</option>
                </select>
                </div>
            </div>
            )}

            {/* Assignments List */}
            {!loading && !error && filteredAssignments.length > 0 && (
            <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                const progressPercentage = getProgressPercentage(assignment.reviewedChallenges, assignment.totalChallenges);
                
                return (
                    <Card 
                    key={assignment.id}
                    className="bg-gradient-to-r from-[#0c0c4f] to-[#10103d] border border-[#56ffbc]/20 hover:border-[#56ffbc]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#56ffbc]/10 group"
                    >
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                        
                        {/* Left side - Participant Info and Status */}
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/70 flex items-center justify-center text-black font-bold text-lg">
                            
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-bold text-white group-hover:text-[#56ffbc] transition-colors duration-300">
                                        ID: {assignment.participantId.slice(0, 8)}
                                    </h3>
                                    {getStatusBadge(assignment.status)}
                                </div>
                            </div>

                        </div>

                        {/* Middle - Progress */}
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                            <div className="text-sm text-gray-400 mb-1">Progress</div>
                            <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/70 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                                </div>
                                <span className="text-sm font-medium text-[#56ffbc]">
                                {assignment.reviewedChallenges}/{assignment.totalChallenges}
                                </span>
                            </div>
                            </div>

                            <div className="text-center">
                            <div className="text-sm text-gray-400 mb-1">Completion</div>
                            <div className="text-xl font-bold text-[#56ffbc]">
                                {progressPercentage}%
                            </div>
                            </div>
                        </div>

                        {/* Right side - Action Button */}
                        <div className="flex-shrink-0 ml-6">
                            <Button
                            onClick={() => handleReviewSubmissions(assignment.participantId)}
                            className="bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/80 hover:from-[#56ffbc]/90 hover:to-[#56ffbc] text-black font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#56ffbc]/20 group px-6"
                            >
                            <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                            Review Submissions
                            </Button>
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                );
                })}
            </div>
            )}

            {/* Empty State */}
            {!loading && !error && assignments.length === 0 && (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#0c0c4f] to-[#10103d] border border-[#56ffbc]/20 mb-4">
                <Users className="w-8 h-8 text-[#56ffbc]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Participants Assigned</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                You don't have any participants assigned for evaluation yet. Check back later or contact an administrator.
                </p>
            </div>
            )}

            {/* No Results from Filter */}
            {!loading && !error && assignments.length > 0 && filteredAssignments.length === 0 && (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#0c0c4f] to-[#10103d] border border-[#56ffbc]/20 mb-4">
                <Filter className="w-8 h-8 text-[#56ffbc]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Results Found</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                No participants match your current filter criteria. Try adjusting your filters.
                </p>
                <Button
                onClick={() => {
                    setFilterBy('all');
                    setSortBy('progress');
                }}
                className="mt-4 bg-gradient-to-r from-[#56ffbc] to-[#56ffbc]/80 hover:from-[#56ffbc]/90 hover:to-[#56ffbc] text-black font-medium transition-all duration-300"
                >
                Clear Filters
                </Button>
            </div>
            )}
        </div>
        </div>
    );
}