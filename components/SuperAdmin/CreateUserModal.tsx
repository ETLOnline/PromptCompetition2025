// components/SuperAdmin/CreateUserModal.tsx

import React from "react"
import { X } from "lucide-react"
import { CreateUserForm, Role } from "./types"
import { ROLE_CONFIG } from "./constants"

interface CreateUserModalProps {
  form: CreateUserForm
  onChange: (form: CreateUserForm) => void
  onCancel: () => void
  onCreate: () => void
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  form,
  onChange,
  onCancel,
  onCreate,
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-[#121244] rounded-lg p-5 border border-white/10 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg text-[#56ffbc] font-semibold">Create New User</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <select
          value={form.role}
          onChange={(e) =>
            onChange({ 
              ...form, 
              role: e.target.value as Role  // ← cast here
            })
          }
          className="w-full px-3 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
        >
          {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.label}
            </option>
          ))}
        </select>

        <input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
        />

        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={form.password}
          onChange={(e) => onChange({ ...form, password: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
        />

        <input
          type="text"
          placeholder="Display Name (optional)"
          value={form.displayName}
          onChange={(e) => onChange({ ...form, displayName: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
        />
      </div>

      <div className="flex gap-2 mt-5">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-600 text-white py-2 text-sm rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onCreate}
          className="flex-1 bg-green-600 text-white py-2 text-sm rounded-lg hover:bg-green-700 transition-colors"
        >
          Create User
        </button>
      </div>
    </div>
  </div>
)
