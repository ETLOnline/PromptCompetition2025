// components/SuperAdmin/PromoteUsersModal.tsx

import React from "react"
import { Search, Users, X, CheckCircle2 } from "lucide-react"
import { User, Role } from "./types"
import { ROLE_CONFIG } from "./constants"

interface PromoteUsersModalProps {
  role: Role                     // ← now Role, not string
  users: User[]
  paginated: User[]
  hasMore: boolean
  selected: Set<string>
  onToggleSelect: (uid: string) => void
  onSearch: (value: string) => void
  searchQuery: string
  onLoadMore: () => void
  onCancel: () => void
  onPromote: () => void
}

export const PromoteUsersModal: React.FC<PromoteUsersModalProps> = ({
  role,
  users,
  paginated,
  hasMore,
  selected,
  onToggleSelect,
  onSearch,
  searchQuery,
  onLoadMore,
  onCancel,
  onPromote,
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-[#121244] rounded-lg p-5 border border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-[#56ffbc] font-semibold">
          Promote Users to {ROLE_CONFIG[role].label}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10 pr-10 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white w-full border border-white/10 focus:border-[#56ffbc] focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => onSearch("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto mb-4 scrollbar-hide">
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {paginated.map((u) => (
          <div
            key={u.uid}
            onClick={() => onToggleSelect(u.uid)}
            className={`p-3 rounded-lg border mb-2 cursor-pointer ${
              selected.has(u.uid)
                ? "bg-[#56ffbc]/10 border-[#56ffbc]"
                : "bg-[#1c1c3a] border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selected.has(u.uid) ? "bg-[#56ffbc] border-[#56ffbc]" : "border-gray-400"
                  }`}
                >
                  {selected.has(u.uid) && <CheckCircle2 className="w-3 h-3 text-[#07073a]" />}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{u.displayName || u.email}</p>
                  <p className="text-gray-400 text-xs">{u.email}</p>
                </div>
              </div>
              <span
                className={`${ROLE_CONFIG[u.role].bgColor} ${ROLE_CONFIG[u.role].color} border ${ROLE_CONFIG[u.role].borderColor} px-2 py-1 rounded-full text-xs`}
              >
                {ROLE_CONFIG[u.role].label}
              </span>
            </div>
          </div>
        ))}

        {hasMore && (
          <button
            onClick={onLoadMore}
            className="w-full p-3 rounded-lg border border-white/10 bg-[#1c1c3a] hover:border-white/20 transition-all text-gray-400 hover:text-white text-sm"
          >
            Load More
          </button>
        )}

        {!users.length && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No users available</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <p className="text-gray-400 text-sm">{selected.size} selected</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onPromote}
            disabled={!selected.size}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Promote
          </button>
        </div>
      </div>
    </div>
  </div>
)
