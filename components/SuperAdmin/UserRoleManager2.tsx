"use client"

import React, { useEffect, useState, useMemo } from "react"
import {
  Search,
  Users,
  Plus,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  Shield,
  Scale,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

// --- Types ------------------------------------------------------------------

export interface User {
  uid: string
  email: string
  displayName: string
  role: string
  createdAt?: string
  lastSignIn?: string
  emailVerified?: boolean
  disabled?: boolean
}

export interface Stats {
  total: number
  superadmins: number
  admins: number
  judges: number
  users: number
  disabled: number
  active: number
}

export interface CreateUserForm {
  email: string
  password: string
  displayName: string
  role: string
}

// --- Constants --------------------------------------------------------------

export const ROLE_CONFIG = {
  superadmin: {
    label: "Super Admin",
    pluralLabel: "Super Admins",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  },
  admin: {
    label: "Admin",
    pluralLabel: "Admins",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  judge: {
    label: "Judge",
    pluralLabel: "Judges",
    icon: Scale,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  },
  user: {
    label: "User",
    pluralLabel: "Users",
    icon: Users,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20"
  }
}

const ITEMS_PER_PAGE = 10

// --- Helper Components ------------------------------------------------------

// Stats card in the dashboard
interface StatsCardProps {
  title: string
  count: number
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  role: string
  selectedRole: string
  onSelectRole: (role: string) => void
}
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  count,
  icon: Icon,
  color,
  bgColor,
  role,
  selectedRole,
  onSelectRole
}) => (
  <button
    onClick={() => onSelectRole(role)}
    className={`${bgColor} rounded-lg border p-4 w-full text-left hover:border-white/30 transition-all ${
      selectedRole === role ? "border-[#56ffbc]" : "border-white/10"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-xs font-medium">{title}</p>
        <p className="text-xl font-bold text-white mt-1">{count}</p>
      </div>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </button>
)

// A single user card in the list
interface UserCardProps {
  user: User
  formatDate: (d?: string) => string
  getRoleActions: (u: User) => { label: string; action: () => void; color: string }[]
  onViewDetails: (u: User) => void
  onDelete: (uid: string, email: string) => void
}
const UserCard: React.FC<UserCardProps> = ({
  user,
  formatDate,
  getRoleActions,
  onViewDetails,
  onDelete
}) => {
  const cfg = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.user
  const actions = getRoleActions(user)

  return (
    <div className="bg-[#1c1c3a] rounded-lg border border-white/10 hover:border-white/20 transition-all p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <cfg.icon className={`w-3 h-3 ${cfg.color} flex-shrink-0`} />
            <span className="text-white text-sm font-medium truncate">
              {user.displayName || user.email}
            </span>
            {user.emailVerified && <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bgColor} ${cfg.color} border ${cfg.borderColor}`}
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
            title="View Details"
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

// Pagination footer
interface PaginationProps {
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  startIndex: number
  endIndex: number
  totalItems: number
}
const Pagination: React.FC<PaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
  startIndex,
  endIndex,
  totalItems
}) => {
  if (totalPages <= 1) return null

  const pagesToShow = Math.min(5, totalPages)
  const pages = Array.from({ length: pagesToShow }, (_, i) => {
    let num: number
    if (totalPages <= 5) {
      num = i + 1
    } else if (currentPage <= 3) {
      num = i + 1
    } else if (currentPage >= totalPages - 2) {
      num = totalPages - 4 + i
    } else {
      num = currentPage - 2 + i
    }
    return num
  })

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
      <div className="text-xs text-gray-400">
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} users
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((num) => (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className={`px-2 py-1 text-xs rounded ${
                currentPage === num
                  ? "bg-[#56ffbc] text-[#07073a] font-medium"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// The "All Users" search section
interface SearchSectionProps {
  searchQuery: string
  onSearchQueryChange: (val: string) => void
  performExactSearch: () => void
  clearSearch: () => void
  loadingExactSearch: boolean
  hasPerformedExactSearch: boolean
  exactSearchResults: User[]
  onShowCreateUser: () => void
  onViewDetails: (u: User) => void
  getRoleActions: (u: User) => { label: string; action: () => void; color: string }[]
  onDelete: (uid: string, email: string) => void
  formatDate: (d?: string) => string
}
const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  onSearchQueryChange,
  performExactSearch,
  clearSearch,
  loadingExactSearch,
  hasPerformedExactSearch,
  exactSearchResults,
  onShowCreateUser,
  onViewDetails,
  getRoleActions,
  onDelete,
  formatDate
}) => (
  <div className="bg-[#121244] rounded-lg p-4 border border-white/10">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg text-[#56ffbc] font-semibold flex items-center gap-2">
        <Search className="w-4 h-4" /> Search Users by Email
      </h2>
      <button
        onClick={onShowCreateUser}
        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded transition-colors text-xs flex items-center gap-1"
      >
        <Plus className="w-4 h-4" /> Create
      </button>
    </div>

    <div className="flex gap-2 mb-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
        <input
          type="text"
          placeholder="Enter exact email address..."
          className="pl-8 pr-10 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white w-full border border-white/10 focus:border-[#56ffbc] focus:outline-none"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && performExactSearch()}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <button
        onClick={performExactSearch}
        disabled={loadingExactSearch || !searchQuery.trim()}
        className="bg-[#56ffbc] text-[#07073a] font-semibold px-4 py-2 text-sm rounded-lg hover:bg-[#3cf0a3] transition-colors disabled:opacity-50"
      >
        {loadingExactSearch ? "Searching..." : "Search"}
      </button>
    </div>

    {hasPerformedExactSearch ? (
      exactSearchResults.length ? (
        exactSearchResults.map((u) => (
          <UserCard
            key={u.uid}
            user={u}
            formatDate={formatDate}
            getRoleActions={getRoleActions}
            onViewDetails={onViewDetails}
            onDelete={onDelete}
          />
        ))
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

// The role‑specific user list
interface UserListProps {
  selectedRole: string
  roleConfig: typeof ROLE_CONFIG
  displayUsers: User[]
  searchQuery: string
  onSearchQueryChange: (val: string) => void
  paginatedUsers: User[]
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  startIndex: number
  endIndex: number
  onShowPromoteModal: (role: string) => void
  getRoleActions: (u: User) => { label: string; action: () => void; color: string }[]
  onViewDetails: (u: User) => void
  onDelete: (uid: string, email: string) => void
  formatDate: (d?: string) => string
}
const UserList: React.FC<UserListProps> = ({
  selectedRole,
  roleConfig,
  displayUsers,
  searchQuery,
  onSearchQueryChange,
  paginatedUsers,
  totalPages,
  currentPage,
  onPageChange,
  startIndex,
  endIndex,
  onShowPromoteModal,
  getRoleActions,
  onViewDetails,
  onDelete,
  formatDate
}) => (
  <div className="bg-[#121244] rounded-lg border border-white/10">
    <div className="p-4 border-b border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          {roleConfig[selectedRole as keyof typeof roleConfig]?.pluralLabel || "Users"}
          <span className="text-gray-400 text-xs">({displayUsers.length})</span>
        </h3>
        <button
          onClick={() => onShowPromoteModal(selectedRole)}
          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors text-xs flex items-center gap-1"
        >
          <Users className="w-4 h-4" /> Promote
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
        <input
          type="text"
          placeholder={`Filter ${roleConfig[selectedRole as keyof typeof roleConfig]?.pluralLabel.toLowerCase()}…`}
          className="pl-8 pr-8 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white w-full border border-white/10 focus:border-[#56ffbc] focus:outline-none"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
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
      {paginatedUsers.map((u) => (
        <UserCard
          key={u.uid}
          user={u}
          formatDate={formatDate}
          getRoleActions={getRoleActions}
          onViewDetails={onViewDetails}
          onDelete={onDelete}
        />
      ))}

      {!displayUsers.length && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {searchQuery
              ? `No ${roleConfig[selectedRole as keyof typeof roleConfig]?.pluralLabel.toLowerCase()} match your search`
              : `No ${roleConfig[selectedRole as keyof typeof roleConfig]?.pluralLabel.toLowerCase()} found`}
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
      totalItems={displayUsers.length}
    />
  </div>
)

// --- Main Component ---------------------------------------------------------

export default function UserRoleManager() {
  // --- State ---
  const [stats, setStats] = useState<Stats | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedRole, setSelectedRole] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState({ stats: true, users: true, exactSearch: false })

  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showExistingUsers, setShowExistingUsers] = useState(false)
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    email: "",
    password: "",
    displayName: "",
    role: "user"
  })
  const [selectedExistingUsers, setSelectedExistingUsers] = useState<Set<string>>(new Set())
  const [roleToAssign, setRoleToAssign] = useState("")

  const [promoteSearchQuery, setPromoteSearchQuery] = useState("")
  const [promoteCurrentPage, setPromoteCurrentPage] = useState(1)

  const [exactSearchResults, setExactSearchResults] = useState<User[]>([])
  const [hasPerformedExactSearch, setHasPerformedExactSearch] = useState(false)

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning"
    message: string
  } | null>(null)
  const [showUserDetails, setShowUserDetails] = useState<User | null>(null)

  // --- Effects ---
  useEffect(() => {
    fetchStats()
    fetchAllUsers()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    setSearchQuery("")
    setExactSearchResults([])
    setHasPerformedExactSearch(false)
  }, [selectedRole])

  // --- Derived data & helpers ---
  const filteredUsers = useMemo(() => {
    let filtered = allUsers
    if (selectedRole !== "all") {
      filtered = filtered.filter((u) => u.role === selectedRole)
    }
    if (searchQuery.trim() && selectedRole !== "all") {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.displayName && u.displayName.toLowerCase().includes(q))
      )
    }
    return filtered
  }, [allUsers, selectedRole, searchQuery])

  const displayUsers =
    selectedRole === "all" && hasPerformedExactSearch ? exactSearchResults : filteredUsers
  const totalPages = Math.ceil(displayUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsers = displayUsers.slice(startIndex, endIndex)

  const promoteUsers = useMemo(() => {
    let u = allUsers.filter((u) => u.role !== roleToAssign)
    if (promoteSearchQuery.trim()) {
      const q = promoteSearchQuery.toLowerCase()
      u = u.filter(
        (x) =>
          x.email.toLowerCase().includes(q) ||
          (x.displayName && x.displayName.toLowerCase().includes(q))
      )
    }
    return u
  }, [allUsers, roleToAssign, promoteSearchQuery])
  const promoteStart = (promoteCurrentPage - 1) * ITEMS_PER_PAGE
  const promoteEnd = promoteStart + ITEMS_PER_PAGE
  const paginatedPromoteUsers = promoteUsers.slice(promoteStart, promoteEnd)
  const hasMorePromoteUsers = promoteUsers.length > promoteEnd

  const showNotification = (type: "success" | "error" | "warning", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        })
      : "Never"

  const getRoleActions = (u: User) => {
    const actions: { label: string; action: () => void; color: string }[] = []
    if (u.role !== "admin") actions.push({ label: "Make Admin", action: () => updateRole(u.uid, "admin"), color: "text-blue-400 hover:text-blue-300" })
    if (u.role !== "judge") actions.push({ label: "Make Judge", action: () => updateRole(u.uid, "judge"), color: "text-green-400 hover:text-green-300" })
    if (u.role !== "superadmin") actions.push({ label: "Make Super Admin", action: () => updateRole(u.uid, "superadmin"), color: "text-purple-400 hover:text-purple-300" })
    if (u.role !== "user") actions.push({ label: "Remove Role", action: () => updateRole(u.uid, "user"), color: "text-gray-400 hover:text-gray-300" })
    return actions
  }

  // --- API calls ---
  async function fetchStats() {
    try {
      setLoading((p) => ({ ...p, stats: true }))
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) setStats(await res.json())
    } catch {
      console.error("Error fetching stats")
    } finally {
      setLoading((p) => ({ ...p, stats: false }))
    }
  }

  async function fetchAllUsers() {
    try {
      setLoading((p) => ({ ...p, users: true }))
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/users?limit=1000", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.users || [])
      } else {
        showNotification("error", "Failed to load users")
      }
    } catch {
      showNotification("error", "Failed to load users")
    } finally {
      setLoading((p) => ({ ...p, users: false }))
    }
  }

  async function performExactSearch() {
    if (!searchQuery.trim()) {
      setExactSearchResults([])
      setHasPerformedExactSearch(false)
      return
    }
    try {
      setLoading((p) => ({ ...p, exactSearch: true }))
      const token = await getIdToken()
      const res = await fetch(
        `http://localhost:8080/superadmin/user-by-email?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const u = await res.json()
        setExactSearchResults([u])
        showNotification("success", "User found")
      } else {
        setExactSearchResults([])
        showNotification("warning", "User not found")
      }
      setHasPerformedExactSearch(true)
      setCurrentPage(1)
    } catch {
      setExactSearchResults([])
      setHasPerformedExactSearch(true)
      showNotification("error", "Search failed")
    } finally {
      setLoading((p) => ({ ...p, exactSearch: false }))
    }
  }

  function clearSearch() {
    setSearchQuery("")
    setExactSearchResults([])
    setHasPerformedExactSearch(false)
    setCurrentPage(1)
  }

  async function updateRole(uid: string, newRole: string) {
    try {
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, role: newRole })
      })
      const data = await res.json()
      if (res.ok) {
        showNotification("success", "Role updated successfully")
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", data.error)
      }
    } catch {
      showNotification("error", "Failed to update role")
    }
  }

  async function deleteUser(uid: string, email: string) {
    if (!confirm(`Delete user: ${email}?\n\nThis action cannot be undone.`)) return
    try {
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid })
      })
      const data = await res.json()
      if (res.ok) {
        showNotification("success", "User deleted successfully")
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", data.error)
      }
    } catch {
      showNotification("error", "Failed to delete user")
    }
  }

  async function createUser() {
    if (!createUserForm.email || !createUserForm.password) {
      showNotification("warning", "Email and password are required")
      return
    }
    try {
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(createUserForm)
      })
      const data = await res.json()
      if (res.ok) {
        showNotification(
          "success",
          `${ROLE_CONFIG[createUserForm.role as keyof typeof ROLE_CONFIG].label} created successfully`
        )
        setCreateUserForm({ email: "", password: "", displayName: "", role: "user" })
        setShowCreateUser(false)
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", data.error)
      }
    } catch {
      showNotification("error", "Failed to create user")
    }
  }

  async function assignRoleToExistingUsers() {
    if (selectedExistingUsers.size === 0) {
      showNotification("warning", "Please select at least one user")
      return
    }
    try {
      const token = await getIdToken()
      const results = await Promise.all(
        Array.from(selectedExistingUsers).map((uid) =>
          fetch("http://localhost:8080/superadmin/assign-role", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ uid, role: roleToAssign })
          })
        )
      )
      if (results.every((r) => r.ok)) {
        showNotification("success", `Roles updated for ${selectedExistingUsers.size} user(s)`)
        setSelectedExistingUsers(new Set())
        setShowExistingUsers(false)
        setPromoteSearchQuery("")
        setPromoteCurrentPage(1)
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification("error", "Some role updates failed")
      }
    } catch {
      showNotification("error", "Failed to update roles")
    }
  }

  // --- Render ---
  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg border text-sm ${
            notification.type === "success"
              ? "bg-green-900 border-green-500 text-green-100"
              : notification.type === "error"
              ? "bg-red-900 border-red-500 text-red-100"
              : "bg-yellow-900 border-yellow-500 text-yellow-100"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" && <CheckCircle2 className="w-4 h-4" />}
            {notification.type === "error" && <XCircle className="w-4 h-4" />}
            {notification.type === "warning" && <AlertTriangle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            title="Total Users"
            count={stats.total}
            icon={Users}
            color="text-gray-400"
            bgColor="bg-gray-500/10"
            role="all"
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
          />
          <StatsCard
            title="Super Admins"
            count={stats.superadmins}
            icon={Crown}
            color="text-purple-400"
            bgColor="bg-purple-500/10"
            role="superadmin"
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
          />
          <StatsCard
            title="Admins"
            count={stats.admins}
            icon={Shield}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
            role="admin"
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
          />
          <StatsCard
            title="Judges"
            count={stats.judges}
            icon={Scale}
            color="text-green-400"
            bgColor="bg-green-500/10"
            role="judge"
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
          />
        </div>
      )}

      {/* Main Content */}
      {selectedRole === "all" ? (
        <SearchSection
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          performExactSearch={performExactSearch}
          clearSearch={clearSearch}
          loadingExactSearch={loading.exactSearch}
          hasPerformedExactSearch={hasPerformedExactSearch}
          exactSearchResults={exactSearchResults}
          onShowCreateUser={() => setShowCreateUser(true)}
          onViewDetails={setShowUserDetails}
          getRoleActions={getRoleActions}
          onDelete={deleteUser}
          formatDate={formatDate}
        />
      ) : (
        <UserList
          selectedRole={selectedRole}
          roleConfig={ROLE_CONFIG}
          displayUsers={displayUsers}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          paginatedUsers={paginatedUsers}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onShowPromoteModal={(role) => {
            setRoleToAssign(role)
            setShowExistingUsers(true)
          }}
          getRoleActions={getRoleActions}
          onViewDetails={setShowUserDetails}
          onDelete={deleteUser}
          formatDate={formatDate}
        />
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#121244] rounded-lg p-5 border border-white/10 w-full max-w-md">
            <h3 className="text-lg text-[#56ffbc] font-semibold mb-4">Create New User</h3>
            <div className="space-y-3">
              <select
                value={createUserForm.role}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
              >
                <option value="user">User</option>
                <option value="judge">Judge</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, email: e.target.value }))}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm((f) => ({ ...f, password: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Display Name (optional)"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white border border-white/10 focus:border-[#56ffbc] focus:outline-none"
                value={createUserForm.displayName}
                onChange={(e) =>
                  setCreateUserForm((f) => ({ ...f, displayName: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowCreateUser(false)}
                className="flex-1 bg-gray-600 text-white py-2 text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                className="flex-1 bg-green-600 text-white py-2 text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Existing Users Modal */}
      {showExistingUsers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#121244] rounded-lg p-5 border border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <h3 className="text-lg text-[#56ffbc] font-semibold mb-4">
              Promote Users to {ROLE_CONFIG[roleToAssign as keyof typeof ROLE_CONFIG]?.label}
            </h3>

            {/* Search in modal */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users to promote..."
                  className="pl-10 pr-10 py-2 text-sm rounded-lg bg-[#1c1c3a] text-white w-full border border-white/10 focus:border-[#56ffbc] focus:outline-none"
                  value={promoteSearchQuery}
                  onChange={(e) => {
                    setPromoteSearchQuery(e.target.value)
                    setPromoteCurrentPage(1)
                  }}
                />
                {promoteSearchQuery && (
                  <button
                    onClick={() => {
                      setPromoteSearchQuery("")
                      setPromoteCurrentPage(1)
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* User list */}
            <div
              className="flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {paginatedPromoteUsers.map((u) => (
                <div
                  key={u.uid}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedExistingUsers.has(u.uid)
                      ? "bg-[#56ffbc]/10 border-[#56ffbc]"
                      : "bg-[#1c1c3a] border-white/10 hover:border-white/20"
                  }`}
                  onClick={() => {
                    const s = new Set(selectedExistingUsers)
                    s.has(u.uid) ? s.delete(u.uid) : s.add(u.uid)
                    setSelectedExistingUsers(s)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedExistingUsers.has(u.uid)
                            ? "bg-[#56ffbc] border-[#56ffbc]"
                            : "border-gray-400"
                        }`}
                      >
                        {selectedExistingUsers.has(u.uid) && (
                          <CheckCircle2 className="w-3 h-3 text-[#07073a]" />
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {u.displayName || u.email}
                        </p>
                        <p className="text-gray-400 text-xs">{u.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG].bgColor
                      } ${
                        ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG].color
                      } border ${
                        ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG].borderColor
                      }`}
                    >
                      {ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG].label}
                    </span>
                  </div>
                </div>
              ))}

              {hasMorePromoteUsers && (
                <button
                  onClick={() => setPromoteCurrentPage((p) => p + 1)}
                  className="w-full p-3 rounded-lg border border-white/10 bg-[#1c1c3a] hover:border-white/20 transition-all text-gray-400 hover:text-white text-sm"
                >
                  Load More ({promoteUsers.length - promoteEnd} remaining)
                </button>
              )}

              {!promoteUsers.length && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No users available for promotion</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <p className="text-gray-400 text-sm">
                {selectedExistingUsers.size} user(s) selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowExistingUsers(false)
                    setSelectedExistingUsers(new Set())
                    setPromoteSearchQuery("")
                    setPromoteCurrentPage(1)
                  }}
                  className="bg-gray-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={assignRoleToExistingUsers}
                  disabled={!selectedExistingUsers.size}
                  className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Promote Users
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#121244] rounded-lg p-5 border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-[#56ffbc] font-semibold">User Details</h3>
              <button
                onClick={() => setShowUserDetails(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs">Display Name</label>
                <p className="text-white text-sm">
                  {showUserDetails.displayName || "Not set"}
                </p>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Email</label>
                <p className="text-white text-sm">{showUserDetails.email}</p>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Role</label>
                <p className="text-white text-sm capitalize">{showUserDetails.role}</p>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Status</label>
                <div className="flex items-center gap-2">
                  {showUserDetails.emailVerified ? (
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  ) : (
                    <XCircle className="w-3 h-3 text-red-400" />
                  )}
                  <span className="text-white text-sm">
                    {showUserDetails.emailVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Joined</label>
                <p className="text-white text-sm">{formatDate(showUserDetails.createdAt)}</p>
              </div>
              <div>
                <label className="text-gray-400 text-xs">Last Sign In</label>
                <p className="text-white text-sm">
                  {formatDate(showUserDetails.lastSignIn)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Firebase helper --------------------------------------------------------

async function getIdToken(): Promise<string> {
  const { getAuth } = await import("firebase/auth")
  const user = getAuth().currentUser
  if (!user) throw new Error("No user signed in")
  return await user.getIdToken()
}
