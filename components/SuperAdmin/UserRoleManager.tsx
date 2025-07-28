"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"
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
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Filter
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

interface NotificationState {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

// --- Constants --------------------------------------------------------------

export const ROLE_CONFIG = {
  superadmin: {
    label: "Super Admin",
    pluralLabel: "Super Admins",
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  },
  admin: {
    label: "Admin",
    pluralLabel: "Admins",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  judge: {
    label: "Judge",
    pluralLabel: "Judges",
    icon: Scale,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  user: {
    label: "Contestant",
    pluralLabel: "Contestants",
    icon: Users,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200"
  }
}

const ITEMS_PER_PAGE = 10

// --- Helper Components ------------------------------------------------------

// Modern Stats Card
interface StatsCardProps {
  title: string
  count: number
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  borderColor: string
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
  borderColor,
  role,
  selectedRole,
  onSelectRole
}) => (
  <button
    onClick={() => onSelectRole(role)}
    className={`w-full text-left bg-white border rounded-lg p-6 hover:shadow-md transition-all shadow-sm ${
      selectedRole === role ? `${borderColor} ring-2 ring-blue-100` : "border-gray-200"
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
      </div>
      <div className={`p-2 rounded-lg ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </button>
)

// Modern User Card
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
    <div className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900">
                {user.displayName || user.email}
              </h3>
              {user.emailVerified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${cfg.bgColor} ${cfg.color} border ${cfg.borderColor}`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-xs text-gray-400">
              Joined {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(user)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <div className="relative group">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {actions.map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${action.color}`}
                >
                  {action.label}
                </button>
              ))}
              <button
                onClick={() => onDelete(user.uid, user.email)}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
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

// Modern Pagination
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
    <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} users
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-1">
            {pages.map((num) => (
              <button
                key={num}
                onClick={() => onPageChange(num)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors shadow-sm ${
                  currentPage === num
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main Component ---------------------------------------------------------

export default function UserRoleManager() {
  // --- State ---
  const [stats, setStats] = useState<Stats | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedRole, setSelectedRole] = useState("superadmin")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState({ stats: true, users: true, exactSearch: false, action: false })

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

  const [userToDelete, setUserToDelete] = useState<{ uid: string; email: string } | null>(null)
  const [notifications, setNotifications] = useState<NotificationState[]>([])
  const [showUserDetails, setShowUserDetails] = useState<User | null>(null)

  // --- Effects ---
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedRole, searchQuery])

  // --- Helper functions ---
  const loadInitialData = useCallback(async () => {
    await Promise.allSettled([fetchStats(), fetchAllUsers()])
  }, [])

  // Real-time search filter
  const filteredUsers = useMemo(() => {
    let filtered = allUsers
    
    if (selectedRole !== "all") {
      filtered = filtered.filter((u) => u.role === selectedRole)
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(query) ||
          (u.displayName && u.displayName.toLowerCase().includes(query)) ||
          u.uid.toLowerCase().includes(query)
      )
    }
    
    return filtered.sort((a, b) => {
      const roleOrder = { superadmin: 0, admin: 1, judge: 2, user: 3 }
      const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 4
      const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 4
      
      if (aOrder !== bOrder) return aOrder - bOrder
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }, [allUsers, selectedRole, searchQuery])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

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

  const showNotification = useCallback((type: NotificationState['type'], title: string, message: string) => {
    const id = Date.now().toString()
    const notification: NotificationState = { id, type, title, message }
    
    setNotifications(prev => [...prev, notification])
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

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
    if (u.role !== "admin") actions.push({ label: "Make Admin", action: () => updateRole(u.uid, "admin"), color: "text-blue-600 hover:text-blue-700" })
    if (u.role !== "judge") actions.push({ label: "Make Judge", action: () => updateRole(u.uid, "judge"), color: "text-green-600 hover:text-green-700" })
    if (u.role !== "superadmin") actions.push({ label: "Make Super Admin", action: () => updateRole(u.uid, "superadmin"), color: "text-purple-600 hover:text-purple-700" })
    if (u.role !== "user") actions.push({ label: "Remove Role", action: () => updateRole(u.uid, "user"), color: "text-gray-600 hover:text-gray-700" })
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
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      showNotification('error', 'Data Loading Error', 'Failed to load user statistics')
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
        showNotification('error', 'Data Loading Error', 'Failed to load users')
      }
    } catch (error) {
      showNotification('error', 'Data Loading Error', 'Failed to load users')
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
        showNotification('success', 'Search Complete', 'User found')
      } else {
        setExactSearchResults([])
        showNotification('warning', 'No Results', 'User not found')
      }
      setHasPerformedExactSearch(true)
      setCurrentPage(1)
    } catch (error) {
      setExactSearchResults([])
      setHasPerformedExactSearch(true)
      showNotification('error', 'Search Failed', 'An error occurred while searching')
    } finally {
      setLoading((p) => ({ ...p, exactSearch: false }))
    }
  }

  async function updateRole(uid: string, newRole: string) {
    try {
      setLoading((p) => ({ ...p, action: true }))
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/assign-role", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, role: newRole })
      })
      const data = await res.json()
      if (res.ok) {
        showNotification('success', 'Role Updated', 'User role updated successfully')
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification('error', 'Update Failed', data.error || 'Failed to update role')
      }
    } catch (error) {
      showNotification('error', 'Update Failed', 'Failed to update role')
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  async function deleteUser(uid: string, email: string) {
    try {
      setLoading((p) => ({ ...p, action: true }))
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/delete-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid })
      })
      const data = await res.json()
      if (res.ok) {
        showNotification('success', 'User Deleted', 'User deleted successfully')
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification('error', 'Delete Failed', data.error || 'Failed to delete user')
      }
    } catch (error) {
      showNotification('error', 'Delete Failed', 'Failed to delete user')
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  async function createUser() {
    if (!createUserForm.email || !createUserForm.password || !createUserForm.displayName) {
      showNotification('warning', 'Validation Error', 'Please fill in all required fields')
      return
    }
    try {
      setLoading((p) => ({ ...p, action: true }))
      const token = await getIdToken()
      const res = await fetch("http://localhost:8080/superadmin/create-judge", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(createUserForm)
      })
      const data = await res.json()
      if (res.ok) {
        showNotification('success', 'User Created', `${createUserForm.displayName} has been successfully created`)
        setCreateUserForm({ email: "", password: "", displayName: "", role: "user" })
        setShowCreateUser(false)
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification('error', 'Creation Failed', data.error || 'Failed to create user')
      }
    } catch (error) {
      showNotification('error', 'Creation Failed', 'Failed to create user')
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  async function assignRoleToExistingUsers() {
    if (selectedExistingUsers.size === 0) {
      showNotification('warning', 'Selection Required', 'Please select at least one user')
      return
    }
    try {
      setLoading((p) => ({ ...p, action: true }))
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
        showNotification('success', 'Roles Updated', `Roles updated for ${selectedExistingUsers.size} user(s)`)
        setSelectedExistingUsers(new Set())
        setShowExistingUsers(false)
        setPromoteSearchQuery("")
        setPromoteCurrentPage(1)
        fetchAllUsers()
        fetchStats()
      } else {
        showNotification('error', 'Update Failed', 'Some role updates failed')
      }
    } catch (error) {
      showNotification('error', 'Update Failed', 'Failed to update roles')
    } finally {
      setLoading((p) => ({ ...p, action: false }))
    }
  }

  // Render notification
  const renderNotification = (notification: NotificationState) => {
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: AlertCircle
    }
    
    const colors = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    }

    const Icon = icons[notification.type]

    return (
      <div
        key={notification.id}
        className={`flex items-start gap-3 p-4 rounded-lg border ${colors[notification.type]} shadow-sm`}
        role="alert"
      >
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
        <button
          onClick={() => removeNotification(notification.id)}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {notifications.map(renderNotification)}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  User & Role Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage user accounts and permissions across your organization
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadInitialData}
                disabled={loading.stats || loading.users}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                aria-label="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${(loading.stats || loading.users) ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => setShowCreateUser(true)}
                className="bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition px-4 py-2"
              >
                Add User
              </button>

            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {loading.stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => (
              <StatsCard
                key={roleKey}
                title={config.pluralLabel}
                count={(stats as any)[roleKey + "s"] || 0}
                icon={config.icon}
                color={config.color}
                bgColor={config.bgColor}
                borderColor={config.borderColor}
                role={roleKey}
                selectedRole={selectedRole}
                onSelectRole={setSelectedRole}
              />
            ))}
          </div>
        ) : null}

        {/* Filters and Search */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              Filter by role:
            </div>
            
            <div className="flex flex-wrap gap-2">
              
              {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
                const count = allUsers.filter(u => u.role === roleKey).length
                return (
                  <button
                    key={roleKey}
                    onClick={() => setSelectedRole(roleKey)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedRole === roleKey
                        ? `${config.bgColor} ${config.borderColor} ${config.color} ring-2 ring-blue-100`
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {config.label} ({count})
                  </button>
                )
              })}
            </div>
            
            <div className="lg:ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 w-full lg:w-80 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="Search by email, name, or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Users ({filteredUsers.length})
              </h2>
              {selectedRole !== "all" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Filtered by: {ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG]?.label}
                  </span>
                  <button
                    onClick={() => {
                      setRoleToAssign(selectedRole)
                      setShowExistingUsers(true)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Promote Users
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loading.users ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 'Try adjusting your search criteria' : 'No users match the selected filters'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div>
                {paginatedUsers.map((user) => (
                  <UserCard
                    key={user.uid}
                    user={user}
                    formatDate={formatDate}
                    getRoleActions={getRoleActions}
                    onViewDetails={setShowUserDetails}
                    onDelete={(uid, email) => setUserToDelete({ uid, email })}
                  />
                ))}
              </div>
            )}
          </div>

          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={filteredUsers.length}
          />
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
                <button
                  onClick={() => setShowCreateUser(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="judge">Judge</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={createUserForm.displayName}
                  onChange={(e) =>
                    setCreateUserForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowCreateUser(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading.action}
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                disabled={loading.action}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.action ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Existing Users Modal */}
      {showExistingUsers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Promote Users to {ROLE_CONFIG[roleToAssign as keyof typeof ROLE_CONFIG]?.label}
                </h3>
                <button
                  onClick={() => {
                    setShowExistingUsers(false)
                    setSelectedExistingUsers(new Set())
                    setPromoteSearchQuery("")
                    setPromoteCurrentPage(1)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search in modal */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users to promote..."
                  className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {paginatedPromoteUsers.map((u) => (
                <div
                  key={u.uid}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedExistingUsers.has(u.uid)
                      ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    const s = new Set(selectedExistingUsers)
                    s.has(u.uid) ? s.delete(u.uid) : s.add(u.uid)
                    setSelectedExistingUsers(s)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedExistingUsers.has(u.uid)
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedExistingUsers.has(u.uid) && (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {u.displayName || u.email}
                        </p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG]?.bgColor || 'bg-gray-50'
                      } ${
                        ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG]?.color || 'text-gray-600'
                      } border ${
                        ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG]?.borderColor || 'border-gray-200'
                      }`}
                    >
                      {ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG]?.label || u.role}
                    </span>
                  </div>
                </div>
              ))}

              {hasMorePromoteUsers && (
                <button
                  onClick={() => setPromoteCurrentPage((p) => p + 1)}
                  className="w-full p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all text-gray-600 hover:text-gray-700"
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

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedExistingUsers.size} user(s) selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowExistingUsers(false)
                      setSelectedExistingUsers(new Set())
                      setPromoteSearchQuery("")
                      setPromoteCurrentPage(1)
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading.action}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={assignRoleToExistingUsers}
                    disabled={!selectedExistingUsers.size || loading.action}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading.action ? 'Promoting...' : 'Promote Users'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Delete Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to delete <strong>{userToDelete.email}</strong>?
              </p>
              <p className="text-xs text-red-500 mt-1">This action cannot be undone.</p>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteUser(userToDelete.uid, userToDelete.email)
                  setUserToDelete(null)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {showUserDetails.displayName || showUserDetails.email}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.bgColor || 'bg-gray-50'
                  } ${
                    ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.color || 'text-gray-600'
                  } border ${
                    ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.borderColor || 'border-gray-200'
                  }`}>
                    {ROLE_CONFIG[showUserDetails.role as keyof typeof ROLE_CONFIG]?.label || showUserDetails.role}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Display Name
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {showUserDetails.displayName || "Not set"}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Email Address
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{showUserDetails.email}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    User ID
                  </label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{showUserDetails.uid}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Email Status
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {showUserDetails.emailVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm text-gray-900">
                      {showUserDetails.emailVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Account Status
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {showUserDetails.disabled ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-sm text-gray-900">
                      {showUserDetails.disabled ? "Disabled" : "Active"}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Member Since
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(showUserDetails.createdAt)}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Last Sign In
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(showUserDetails.lastSignIn)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowUserDetails(null)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
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