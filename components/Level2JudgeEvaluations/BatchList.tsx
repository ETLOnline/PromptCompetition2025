"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FolderKanban, ChevronRight, Users, FileCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BatchInfo, FilterState } from "@/types/level2JudgeEvaluations"

interface BatchListProps {
  batches: BatchInfo[]
  selectedBatch: string
  onBatchSelect: (batchId: string) => void
  filterState: FilterState
}

export default function BatchList({ batches, selectedBatch, onBatchSelect, filterState }: BatchListProps) {
  const [filteredBatches, setFilteredBatches] = useState<BatchInfo[]>(batches)

  useEffect(() => {
    if (!filterState.searchQuery) {
      setFilteredBatches(batches)
      return
    }

    const query = filterState.searchQuery.toLowerCase()
    const filtered = batches.filter(batch =>
      batch.batchName.toLowerCase().includes(query) ||
      batch.batchId.toLowerCase().includes(query)
    )
    setFilteredBatches(filtered)
  }, [filterState.searchQuery, batches])

  return (
    <Card className="h-full flex flex-col shadow-sm bg-white rounded-xl border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 shadow-sm">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Batches</h2>
            <p className="text-xs text-gray-600">Select a batch to view evaluations</p>
          </div>
          <Badge className="bg-purple-50 text-purple-800 border-purple-200 font-bold text-xs px-2 py-1">
            {filteredBatches.length}
          </Badge>
        </div>
      </div>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {filteredBatches.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">No batches found</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {filteredBatches.map((batch) => {
                const isSelected = selectedBatch === batch.batchId

                return (
                  <button
                    key={batch.batchId}
                    onClick={() => onBatchSelect(batch.batchId)}
                    className={cn(
                      "group w-full p-4 rounded-lg transition-all duration-200 border-2 hover:shadow-md",
                      "hover:scale-[1.02] active:scale-[0.98] focus:ring-2 focus:ring-purple-600/20 focus:outline-none",
                      isSelected
                        ? "bg-purple-50 border-purple-200 shadow-md"
                        : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn(
                          "p-2 rounded-lg transition-all duration-200",
                          isSelected ? "bg-purple-200" : "bg-slate-100 group-hover:bg-slate-200"
                        )}>
                          <FolderKanban className={cn(
                            "w-5 h-5",
                            isSelected ? "text-purple-700" : "text-slate-600"
                          )} />
                        </div>
                        <div className="text-left">
                          <h3 className={cn(
                            "font-bold text-sm",
                            isSelected ? "text-purple-900" : "text-gray-900"
                          )}>
                            {batch.batchName}
                          </h3>
                          <p className="text-xs text-gray-500">ID: {batch.batchId}</p>
                        </div>
                      </div>
                      <ChevronRight className={cn(
                        "w-5 h-5 transition-transform",
                        isSelected ? "text-purple-600 transform rotate-90" : "text-gray-400"
                      )} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-white/50 rounded-lg p-2 text-center">
                        <Users className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                        <p className="text-xs font-bold text-gray-900">{batch.judgeCount}</p>
                        <p className="text-[10px] text-gray-500">Judges</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2 text-center">
                        <Users className="w-4 h-4 mx-auto mb-1 text-green-600" />
                        <p className="text-xs font-bold text-gray-900">{batch.participantCount}</p>
                        <p className="text-[10px] text-gray-500">Participants</p>
                      </div>
                      <div className="bg-white/50 rounded-lg p-2 text-center">
                        <FileCheck className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                        <p className="text-xs font-bold text-gray-900">{batch.evaluationCount}</p>
                        <p className="text-[10px] text-gray-500">Evaluations</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
