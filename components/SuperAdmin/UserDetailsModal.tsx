// =============================
// components/SuperAdmin/UserDetailsModal.tsx
// =============================

import React from "react"
import { X, CheckCircle2, XCircle } from "lucide-react"
import { User } from "./types"

interface UserDetailsModalProps {
  user: User
  onClose: () => void
  formatDate: (d?: string) => string
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose, formatDate }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-[#121244] rounded-lg p-5 border border-white/10 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-[#56ffbc] font-semibold">User Details</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-3">
        <div><label className="text-gray-400 text-xs">Display Name</label><p className="text-white text-sm">{user.displayName||'Not set'}</p></div>
        <div><label className="text-gray-400 text-xs">Email</label><p className="text-white text-sm">{user.email}</p></div>
        <div><label className="text-gray-400 text-xs">Role</label><p className="text-white text-sm capitalize">{user.role}</p></div>
        <div><label className="text-gray-400 text-xs">Status</label><div className="flex items-center gap-2">{user.emailVerified?<CheckCircle2 className="w-3 h-3 text-green-400"/>:<XCircle className="w-3 h-3 text-red-400"/>}<span className="text-white text-sm">{user.emailVerified?'Verified':'Unverified'}</span></div></div>
        <div><label className="text-gray-400 text-xs">Joined</label><p className="text-white text-sm">{formatDate(user.createdAt)}</p></div>
        <div><label className="text-gray-400 text-xs">Last Sign In</label><p className="text-white text-sm">{formatDate(user.lastSignIn)}</p></div>
      </div>
    </div>
  </div>
)