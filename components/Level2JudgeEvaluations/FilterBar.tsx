"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FilterState, BatchInfo } from "@/types/level2JudgeEvaluations"

interface FilterBarProps {
  filterState: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
  batches: BatchInfo[]
  judges: Record<string, string>
  participants: Record<string, string>
}

export default function FilterBar({
  filterState,
  onFilterChange,
  batches,
  judges,
  participants,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const handleReset = () => {
    onFilterChange({
      searchQuery: "",
      selectedBatch: "all",
      selectedJudge: "all",
      selectedParticipant: "all",
    })
  }

  const hasActiveFilters =
    filterState.searchQuery ||
    (filterState.selectedBatch && filterState.selectedBatch !== "all") ||
    (filterState.selectedJudge && filterState.selectedJudge !== "all") ||
    (filterState.selectedParticipant && filterState.selectedParticipant !== "all")

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200 space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search batches, judges, participants..."
            value={filterState.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="pl-10 pr-10 h-11 border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {filterState.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="h-11 px-4 gap-2 border-slate-300"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-11 px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
          {/* Batch Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Batch</label>
            <Select
              value={filterState.selectedBatch || "all"}
              onValueChange={(value) => onFilterChange({ selectedBatch: value })}
            >
              <SelectTrigger className="h-10 border-slate-300">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.batchId} value={batch.batchId}>
                    {batch.batchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Judge Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Judge</label>
            <Select
              value={filterState.selectedJudge || "all"}
              onValueChange={(value) => onFilterChange({ selectedJudge: value })}
            >
              <SelectTrigger className="h-10 border-slate-300">
                <SelectValue placeholder="All Judges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Judges</SelectItem>
                {Object.entries(judges).map(([judgeId, judgeName]) => (
                  <SelectItem key={judgeId} value={judgeId}>
                    {judgeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Participant Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Participant</label>
            <Select
              value={filterState.selectedParticipant || "all"}
              onValueChange={(value) => onFilterChange({ selectedParticipant: value })}
            >
              <SelectTrigger className="h-10 border-slate-300">
                <SelectValue placeholder="All Participants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Participants</SelectItem>
                {Object.entries(participants).map(([participantId, participantName]) => (
                  <SelectItem key={participantId} value={participantId}>
                    {participantName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
