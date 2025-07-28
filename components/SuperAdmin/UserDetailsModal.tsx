// =============================
// components/SuperAdmin/UserDetailsModal.tsx
// =============================

import React from "react"
import { X, CheckCircle2, XCircle, User as UserIcon, Mail, Shield, Calendar, Clock } from "lucide-react"
import { User } from "./types"

interface UserDetailsModalProps {
  user: User
  onClose: () => void
  formatDate: (d?: string) => string
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose, formatDate }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-lg max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <UserIcon className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
        </div>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 overflow-y-auto">
        {/* Profile Section */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {user.displayName || 'Unnamed User'}
            </h4>
            <p className="text-sm text-gray-600">{user.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                user.role === 'superadmin' 
                  ? 'bg-purple-100 text-purple-700'
                  : user.role === 'admin'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
              </span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-4">
          {/* Display Name */}
          <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
            <UserIcon className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Display Name
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.displayName || 'Not set'}
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
            <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email Address
              </label>
              <p className="text-sm text-gray-900 mt-1">{user.email}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
            <Shield className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Role
              </label>
              <p className="text-sm text-gray-900 mt-1 capitalize">
                {user.role || 'User'}
              </p>
            </div>
          </div>

          {/* Email Status */}
          <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
            <div className={`w-4 h-4 mt-0.5 ${user.emailVerified ? 'text-green-500' : 'text-red-500'}`}>
              {user.emailVerified ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email Status
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-medium ${
                  user.emailVerified 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>

          {/* Join Date */}
          <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Member Since
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          {/* Last Sign In */}
          <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Last Sign In
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {formatDate(user.lastSignIn)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            User ID: <span className="font-mono">{user.uid}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)