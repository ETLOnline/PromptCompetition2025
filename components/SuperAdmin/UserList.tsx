// components/SuperAdmin/UserList.tsx

import React from "react"
import { Search, Users, X } from "lucide-react"
import { User, Role } from "./types"
import { UserCard } from "./UserCard"
import { Pagination } from "./Pagination"
import { ROLE_CONFIG } from "./constants"

interface UserListProps {
  selectedRole: Role
  roleCount: number
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onShowPromote: (role: Role) => void
  users: User[]
  paginated: User[]
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  startIndex: number
  endIndex: number
  getActions: (user: User) => { label: string; action: () => void; color: string }[]
  onViewDetails: (user: User) => void
  onDelete: (uid: string, email: string) => void
  formatDate: (date?: string) => string
}

export const UserList: React.FC<UserListProps> = ({
  selectedRole,
  roleCount,
  searchQuery,
  onSearchQueryChange,
  onShowPromote,
  users,
  paginated,
  totalPages,
  currentPage,
  onPageChange,
  startIndex,
  endIndex,
  getActions,
  onViewDetails,
  onDelete,
  formatDate,
}) => (
  <div className="bg-[#121244] rounded-lg border border-white/10">
    <div className="p-4 border-b border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          {ROLE_CONFIG[selectedRole].pluralLabel}
          <span className="text-gray-400 text-xs">({roleCount})</span>
        </h3>
        <button
          onClick={() => onShowPromote(selectedRole)}
          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded text-xs flex items-center gap-1"
        >
          <Users className="w-4 h-4" />
          Promote
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
        <input
          type="text"
          placeholder={`Filter ${ROLE_CONFIG[selectedRole].pluralLabel.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="pl-8 pr-8 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white w-full border border-white/10 focus:border-[#56ffbc] focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchQueryChange("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>

    <div className="space-y-2 p-4">
      {paginated.map((user) => (
        <UserCard
          key={user.uid}
          user={user}
          formatDate={formatDate}
          getActions={getActions}
          onViewDetails={onViewDetails}
          onDelete={onDelete}
        />
      ))}

      {!users.length && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {searchQuery
              ? `No ${ROLE_CONFIG[selectedRole].pluralLabel.toLowerCase()} match your search`
              : `No ${ROLE_CONFIG[selectedRole].pluralLabel.toLowerCase()} found`}
          </p>
        </div>
      )}
    </div>

    <Pagination
      totalPages={totalPages}
      currentPage={currentPage}
      onPageChange={onPageChange}
      startIndex={startIndex}
      endIndex={endIndex}
      totalItems={users.length}
    />
  </div>
)
