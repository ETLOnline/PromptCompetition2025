// =============================
// components/SuperAdmin/SearchSection.tsx
// =============================

import React from "react"
import { Search, Users, Plus, X } from "lucide-react"
import { User } from "./types"
import { UserCard } from "./UserCard"

interface SearchSectionProps {
  searchQuery: string
  onSearchQueryChange: (v: string) => void
  performExactSearch: () => void
  clearSearch: () => void
  loading: boolean
  hasSearched: boolean
  results: User[]
  onShowCreate: () => void
  onViewDetails: (u: User) => void
  getActions: (u: User) => { label: string; action: () => void; color: string }[]
  onDelete: (uid: string, email: string) => void
  formatDate: (d?: string) => string
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  onSearchQueryChange,
  performExactSearch,
  clearSearch,
  loading,
  hasSearched,
  results,
  onShowCreate,
  onViewDetails,
  getActions,
  onDelete,
  formatDate
}) => (
  <div className="bg-[#121244] rounded-lg p-4 border border-white/10">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg text-[#56ffbc] font-semibold flex items-center gap-2">
        <Search className="w-4 h-4" /> Search Users by Email
      </h2>
      <button onClick={onShowCreate} className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded text-xs flex items-center gap-1">
        <Plus className="w-4 h-4" />Create
      </button>
    </div>
    <div className="flex gap-2 mb-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
        <input
          className="pl-8 pr-10 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white w-full border border-white/10 focus:border-[#56ffbc] focus:outline-none"
          placeholder="Enter exact email address..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && performExactSearch()}
        />
        {searchQuery && <button onClick={clearSearch} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>}
      </div>
      <button onClick={performExactSearch} disabled={loading || !searchQuery.trim()} className="bg-[#56ffbc] text-[#07073a] font-semibold px-4 py-2 text-sm rounded-lg hover:bg-[#3cf0a3] transition-colors disabled:opacity-50">
        {loading ? 'Searching...' : 'Search'}
      </button>
    </div>
    {hasSearched ? (
      results.length ? (
        results.map(u => <UserCard key={u.uid} user={u} formatDate={formatDate} getActions={getActions} onViewDetails={onViewDetails} onDelete={onDelete} />)
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No user found with this email address</p>
        </div>
      )
    ) : (
      <div className="text-center py-6 text-gray-500">
        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Enter an email address to search for a specific user</p>
      </div>
    )}
  </div>
)
