// =============================
// components/SuperAdmin/UserCard.tsx
// =============================

import React from "react"
import { CheckCircle2, XCircle, Eye, MoreVertical } from "lucide-react"
import { ROLE_CONFIG } from "./constants"
import { User } from "./types"

interface UserCardProps {
  user: User
  formatDate: (d?: string) => string
  getActions: (u: User) => { label: string; action: () => void; color: string }[]
  onViewDetails: (u: User) => void
  onDelete: (uid: string, email: string) => void
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  formatDate,
  getActions,
  onViewDetails,
  onDelete
}) => {
  const cfg = ROLE_CONFIG[user.role]
  const actions = getActions(user)

  return (
    <div className="bg-[#1c1c3a] rounded-lg border border-white/10 hover:border-white/20 transition-all p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
            <span className="text-white text-sm font-medium truncate">
              {user.displayName || user.email}
            </span>
            {user.emailVerified && <CheckCircle2 className="w-3 h-3 text-green-400" />}
            <span
              className={`${cfg.bgColor} ${cfg.color} border ${cfg.borderColor} px-2 py-0.5 rounded-full text-xs font-medium`}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-gray-400 text-xs mb-1 truncate">{user.email}</p>
          <p className="text-gray-500 text-xs">Joined {formatDate(user.createdAt)}</p>
        </div>

        <div className="flex items-center gap-1 ml-3">
          <button
            onClick={() => onViewDetails(user)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <div className="relative group">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-[#121244] border border-white/10 rounded-lg shadow-lg py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {actions.map((a, i) => (
                <button
                  key={i}
                  onClick={a.action}
                  className={`w-full text-left px-3 py-1.5 text-xs ${a.color} hover:bg-white/10 transition-colors`}
                >
                  {a.label}
                </button>
              ))}
              <button
                onClick={() => onDelete(user.uid, user.email)}
                className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors border-t border-white/10 mt-1"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
