"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, Grid3X3, List } from "lucide-react"

interface SearchAndFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterStatus: "all" | "active" | "ended" | "upcoming"
  setFilterStatus: (status: "all" | "active" | "ended" | "upcoming") => void
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
}

export const SearchAndFilters = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  viewMode,
  setViewMode,
}: SearchAndFiltersProps) => {
  return (
    <div className="py-3 sm:py-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search competitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 text-sm h-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-full sm:w-40 border-gray-200 text-sm h-10">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg p-1 w-full sm:w-auto sm:self-end">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 flex-1 sm:flex-none sm:w-8 sm:p-0"
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="ml-2 sm:hidden">Grid</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 flex-1 sm:flex-none sm:w-8 sm:p-0"
          >
            <List className="w-4 h-4" />
            <span className="ml-2 sm:hidden">List</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
